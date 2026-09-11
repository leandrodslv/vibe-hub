import { inject, describe, it, expect, beforeEach, afterAll } from 'vitest';
import { connect } from './helpers/db.js';

const uri = inject('integrationDbUri');
const db = uri ? connect(uri) : null;

const seed = () =>
  db.sql(`
    insert into public.waitlist (tool_id, email) values
      ('ui-builder',  'a@b.co'),
      ('ui-builder',  'c@b.co'),
      ('ui-builder',  'd@b.co'),
      ('design-lint', 'e@b.co')
  `);

describe.skipIf(!uri)('RPC · get_waitlist_counts() (migration 0001 — AD-4)', () => {
  beforeEach(async () => {
    await db.reset();
    await seed();
  });
  afterAll(() => db.end());

  it('authenticated obtient un décompte par outil, jamais un email', async () => {
    const { rows, fields } = await db.asRole('authenticated', (c) =>
      c.query('select * from public.get_waitlist_counts() order by tool_id')
    );
    expect(rows).toEqual([
      { tool_id: 'design-lint', signups: 1 },
      { tool_id: 'ui-builder', signups: 3 },
    ]);
    // La forme du retour ne contient QUE { tool_id, signups } — pas d'email.
    expect(fields.map((f) => f.name).sort()).toEqual(['signups', 'tool_id']);
  });

  it('anon ne peut pas exécuter la RPC (execute révoqué)', async () => {
    await expect(
      db.asRole('anon', (c) => c.query('select * from public.get_waitlist_counts()'))
    ).rejects.toThrow(/permission denied/i);
  });

  it('la RPC est SECURITY DEFINER : elle agrège malgré RLS sur waitlist', async () => {
    // authenticated ne voit aucune ligne brute (test rls.waitlist) mais la RPC,
    // elle, renvoie bien un total > 0 → c'est le `security definer` qui opère.
    const { rows } = await db.asRole('authenticated', (c) =>
      c.query(`select signups from public.get_waitlist_counts() where tool_id = 'ui-builder'`)
    );
    expect(rows[0].signups).toBe(3);
  });
});
