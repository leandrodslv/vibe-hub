import { inject, describe, it, expect, beforeEach, afterAll } from 'vitest';
import { connect } from './helpers/db.js';

// URI fourni par globalSetup ; null si Docker est absent → suite ignorée.
const uri = inject('integrationDbUri');
const db = uri ? connect(uri) : null;

const seedCourses = () =>
  db.sql(`
    insert into public.courses (module_name, title, published, order_index) values
      ('MODULE 1', 'Cours publié', true,  1),
      ('MODULE 1', 'Autre publié', true,  2),
      ('MODULE 2', 'Brouillon',    false, 3)
  `);

describe.skipIf(!uri)('RLS · public.courses (migration 0001)', () => {
  beforeEach(async () => {
    await db.reset();
    await seedCourses();
  });
  afterAll(() => db.end());

  it('anon ne lit que les cours publiés', async () => {
    const { rows } = await db.asRole('anon', (c) =>
      c.query('select title from public.courses order by order_index')
    );
    expect(rows.map((r) => r.title)).toEqual(['Cours publié', 'Autre publié']);
  });

  it('anon ne peut pas insérer un cours (aucune policy INSERT)', async () => {
    await expect(
      db.asRole('anon', (c) =>
        c.query(
          `insert into public.courses (module_name, title, published, order_index)
           values ('X', 'Pirate', true, 99)`
        )
      )
    ).rejects.toThrow(/row-level security|permission denied/i);
  });

  it('anon ne peut pas publier un brouillon (UPDATE refusé)', async () => {
    await db.asRole('anon', (c) =>
      c.query(`update public.courses set published = true where title = 'Brouillon'`)
    );
    const { rows } = await db.sql(`select published from public.courses where title = 'Brouillon'`);
    // UPDATE sans policy => 0 ligne affectée, pas d'erreur : le brouillon reste caché.
    expect(rows[0].published).toBe(false);
  });

  it('authenticated a un accès CRUD complet', async () => {
    await db.asRole('authenticated', async (c) => {
      const all = await c.query('select count(*)::int as n from public.courses');
      expect(all.rows[0].n).toBe(3); // voit aussi le brouillon

      await c.query(
        `insert into public.courses (module_name, title, published, order_index)
         values ('MODULE 3', 'Ajout admin', false, 4)`
      );
      await c.query(`update public.courses set title = 'Renommé' where title = 'Ajout admin'`);
      const after = await c.query(
        `select count(*)::int as n from public.courses where title = 'Renommé'`
      );
      expect(after.rows[0].n).toBe(1);

      await c.query(`delete from public.courses where title = 'Renommé'`);
    });
  });
});
