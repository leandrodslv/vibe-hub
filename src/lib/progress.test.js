import { describe, it, expect, beforeEach } from 'vitest';
import { PROGRESS_LS_KEY, getPersistedCourseProgress } from './progress.js';

describe('getPersistedCourseProgress', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renvoie {} quand rien n’est persisté', () => {
    expect(getPersistedCourseProgress()).toEqual({});
  });

  it('renvoie la progression persistée', () => {
    localStorage.setItem(PROGRESS_LS_KEY, JSON.stringify({ c1: 100, c2: 40 }));
    expect(getPersistedCourseProgress()).toEqual({ c1: 100, c2: 40 });
  });

  it('retombe sur {} si le JSON stocké est invalide', () => {
    localStorage.setItem(PROGRESS_LS_KEY, '{not json');
    expect(getPersistedCourseProgress()).toEqual({});
  });
});
