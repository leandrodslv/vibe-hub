// @ts-check
/**
 * Harnais de tests d'intégration « pour de vrai » — V2 de
 * docs/ai/roadmap-automatisation.md.
 *
 * Idée (Quentin Adam / Testcontainers) : arrêter de tout mocker. On démarre un
 * **vrai Postgres** jetable dans un conteneur, on applique les migrations du
 * repo, et on teste les politiques RLS et la RPC contre ce moteur — pas contre
 * une simulation.
 *
 * Pourquoi Postgres nu et pas la stack Supabase complète : les politiques de
 * `supabase/migrations/0001_rls_policies.sql` sont appliquées par **Postgres**
 * (rôles `anon` / `authenticated`), pas par PostgREST ni GoTrue. Un conteneur
 * `postgres:16` + les rôles Supabase suffit à tout vérifier, en ~3 s au lieu de
 * ~40 s.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import pg from 'pg';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(HERE, '..', '..', '..', '..', 'supabase', 'migrations');

/**
 * Rôles pré-créés par Supabase à la création d'un projet. Les migrations les
 * référencent sans les définir → on doit les recréer avant de les jouer.
 */
const BOOTSTRAP_ROLES = `
  create role anon           nologin noinherit;
  create role authenticated  nologin noinherit;
  create role service_role   nologin noinherit bypassrls;
  create schema if not exists auth;
  grant usage on schema public to anon, authenticated, service_role;
`;

/**
 * Droits DML de table que Supabase accorde par défaut à `anon` / `authenticated`.
 * La sécurité réelle reste portée par RLS — ces GRANT ne font qu'ouvrir la porte
 * que les policies referment ensuite.
 * Joué APRÈS les migrations pour ne pas écraser le `revoke ... from anon` que
 * `0001` applique à `get_waitlist_counts()`.
 */
const DEFAULT_GRANTS = `
  grant select, insert, update, delete on all tables in schema public to anon, authenticated;
  grant usage, select on all sequences in schema public to anon, authenticated;
`;

/** @returns {string[]} chemins des `.sql` de migration, dans l'ordre de nom. */
function migrationFiles() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => join(MIGRATIONS_DIR, f));
}

/**
 * Démarre un conteneur Postgres, crée les rôles Supabase, applique toutes les
 * migrations du repo, puis les GRANT par défaut.
 *
 * @returns {Promise<{ uri: string, stop: () => Promise<void> }>}
 */
export async function startContainer() {
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withUsername('postgres')
    .withPassword('postgres')
    .withDatabase('postgres')
    .start();

  const uri = container.getConnectionUri();
  const admin = new pg.Client({ connectionString: uri });
  await admin.connect();
  try {
    await admin.query(BOOTSTRAP_ROLES);
    for (const file of migrationFiles()) {
      await admin.query(readFileSync(file, 'utf8'));
    }
    await admin.query(DEFAULT_GRANTS);
  } finally {
    await admin.end();
  }

  return {
    uri,
    stop: () => container.stop().then(() => undefined),
  };
}

/**
 * Ouvre un pool sur un conteneur déjà démarré + les helpers de test.
 *
 * @param {string} uri
 */
export function connect(uri) {
  const pool = new pg.Pool({ connectionString: uri, max: 4 });

  return {
    pool,

    /**
     * Requête administrateur (superuser, RLS contournée) — pour semer / nettoyer.
     * @param {string} text
     * @param {unknown[]} [params]
     */
    sql: (text, params) => pool.query(text, params),

    /** Remet les tables applicatives à zéro entre deux tests. */
    reset: () => pool.query('truncate public.courses, public.waitlist restart identity cascade'),

    /**
     * Exécute `fn` avec le rôle Postgres `role` actif (RLS appliquée), puis
     * restaure le rôle. C'est ce que fait PostgREST derrière un JWT `anon` /
     * `authenticated`.
     *
     * @template T
     * @param {'anon' | 'authenticated' | 'service_role'} role
     * @param {(client: import('pg').PoolClient) => Promise<T>} fn
     * @returns {Promise<T>}
     */
    async asRole(role, fn) {
      const client = await pool.connect();
      try {
        await client.query(`set role ${role}`);
        return await fn(client);
      } finally {
        await client.query('reset role').catch(() => {});
        client.release();
      }
    },

    end: () => pool.end(),
  };
}
