import { inject, describe, it, expect, beforeEach, afterAll } from 'vitest';
import { connect } from './helpers/db.js';

const uri = inject('integrationDbUri');
const db = uri ? connect(uri) : null;

describe.skipIf(!uri)('RLS · public.waitlist (migration 0001 — AD-3)', () => {
  beforeEach(() => db.reset());
  afterAll(() => db.end());

  it('anon peut rejoindre la liste (INSERT autorisé)', async () => {
    await db.asRole('anon', (c) =>
      c.query(`insert into public.waitlist (tool_id, email) values ('ui-builder', 'a@b.co')`)
    );
    const { rows } = await db.sql('select count(*)::int as n from public.waitlist');
    expect(rows[0].n).toBe(1);
  });

  it('anon ne peut lire AUCUN email (aucune policy SELECT)', async () => {
    await db.sql(
      `insert into public.waitlist (tool_id, email) values ('ui-builder', 'secret@b.co')`
    );
    const { rows } = await db.asRole('anon', (c) => c.query('select * from public.waitlist'));
    expect(rows).toEqual([]);
  });

  it('authenticated ne peut PAS lire les emails bruts non plus (AD-3)', async () => {
    await db.sql(
      `insert into public.waitlist (tool_id, email) values ('ui-builder', 'secret@b.co')`
    );
    const { rows } = await db.asRole('authenticated', (c) =>
      c.query('select email from public.waitlist')
    );
    expect(rows).toEqual([]);
  });

  it('rejette un doublon (tool_id, email) — contrainte 23505 conservée sous RLS', async () => {
    await db.asRole('anon', (c) =>
      c.query(`insert into public.waitlist (tool_id, email) values ('ui-builder', 'dup@b.co')`)
    );
    await expect(
      db.asRole('anon', (c) =>
        c.query(`insert into public.waitlist (tool_id, email) values ('ui-builder', 'dup@b.co')`)
      )
    ).rejects.toMatchObject({ code: '23505' });
  });
});
