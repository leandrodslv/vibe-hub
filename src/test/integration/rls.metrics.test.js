import { inject, describe, it, expect, beforeEach, afterAll } from 'vitest';
import { connect } from './helpers/db.js';

const uri = inject('integrationDbUri');
const db = uri ? connect(uri) : null;

describe.skipIf(!uri)('RLS · public.metrics (migration 0002 — V10)', () => {
  beforeEach(() => db.sql('truncate public.metrics restart identity'));
  afterAll(() => db.end());

  it('anon ne peut ni lire ni écrire (aucune policy — seul service_role via la fonction)', async () => {
    await db.sql(
      `insert into public.metrics (kind, metric, value, rating) values ('web-vital', 'LCP', 1200, 'good')`
    );

    const read = await db.asRole('anon', (c) => c.query('select * from public.metrics'));
    expect(read.rows).toEqual([]);

    await expect(
      db.asRole('anon', (c) =>
        c.query(`insert into public.metrics (kind, metric) values ('web-vital', 'LCP')`)
      )
    ).rejects.toThrow(/row-level security|permission denied/i);
  });

  it('get_metrics_summary : agrégats corrects pour authenticated, refusé pour anon', async () => {
    await db.sql(`
      insert into public.metrics (kind, metric, value, rating) values
        ('web-vital', 'LCP', 1000, 'good'),
        ('web-vital', 'LCP', 3000, 'poor'),
        ('web-vital', 'LCP', 5000, 'poor'),
        ('web-vital', 'CLS', 0.05, 'good')
    `);

    const { rows } = await db.asRole('authenticated', (c) =>
      c.query(`select * from public.get_metrics_summary(24) where metric = 'LCP'`)
    );
    expect(rows[0].samples).toBe('3');
    expect(Number(rows[0].poor_pct)).toBeCloseTo(66.7, 0);

    await expect(
      db.asRole('anon', (c) => c.query('select * from public.get_metrics_summary(24)'))
    ).rejects.toThrow(/permission denied/i);
  });
});
