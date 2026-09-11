import { describe, it, expect } from 'vitest';
import { relativeTime } from './relativeTime.js';

const NOW = new Date('2026-09-11T12:00:00Z').getTime();

describe('relativeTime', () => {
  it('renvoie "à l’instant" sous la minute', () => {
    const iso = new Date(NOW - 30_000).toISOString();
    expect(relativeTime(iso, NOW)).toBe("à l'instant");
  });

  it('formate en minutes sous l’heure', () => {
    const iso = new Date(NOW - 5 * 60_000).toISOString();
    expect(relativeTime(iso, NOW)).toMatch(/5 minutes/);
  });

  it('formate en heures sous le jour', () => {
    const iso = new Date(NOW - 3 * 3_600_000).toISOString();
    expect(relativeTime(iso, NOW)).toMatch(/3 heures/);
  });

  it('formate en jours sous le mois', () => {
    const iso = new Date(NOW - 2 * 86_400_000).toISOString();
    expect(relativeTime(iso, NOW)).toMatch(/2 jours|avant-hier/);
  });

  it('formate en mois au-delà', () => {
    const iso = new Date(NOW - 45 * 86_400_000).toISOString();
    expect(relativeTime(iso, NOW)).toMatch(/mois/);
  });

  it('gère un instant futur', () => {
    const iso = new Date(NOW + 2 * 3_600_000).toISOString();
    expect(relativeTime(iso, NOW)).toMatch(/dans 2 heures/);
  });

  it('renvoie une chaîne vide pour un timestamp invalide', () => {
    expect(relativeTime('pas-une-date', NOW)).toBe('');
  });
});
