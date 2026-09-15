import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModulesTab from './ModulesTab.jsx';

/**
 * Régression — story 2.3 (epic-2, sprint-status) : la progression de cours
 * vivait en `useState` pur, jamais écrite en `localStorage` (`progress_*`,
 * AD-6), donc perdue au moindre refresh (pas seulement à la fermeture du
 * navigateur).
 *
 * Invariant : une complétion de cours survit à un remontage du composant
 * (équivalent d'un refresh de page) via `localStorage['progress_courses']`.
 */

const course = {
  id: 'c1',
  title: 'Introduction',
  module_name: 'MODULE 1',
  description: 'Une intro.',
  duration: '12:45',
  image_url: null,
  video_url: null,
  content: 'Contenu du cours.',
};

vi.mock('../../../services/supabase.js', () => ({
  getCourses: vi.fn(async () => [course]),
  recordCourseCompletion: vi.fn(async () => {}),
}));

describe('ModulesTab — persistance de la progression (story 2.3, AD-6)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('écrit la complétion dans progress_courses et la restaure après un remontage', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ModulesTab />);

    const card = await screen.findByRole('button', { name: /Introduction/ });
    await user.click(card);

    await user.click(await screen.findByRole('button', { name: 'Mode Lecture' }));
    await user.click(await screen.findByRole('button', { name: 'Terminer le module' }));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('progress_courses'));
      expect(stored).toEqual({ c1: 100 });
    });

    // Un remontage simule un refresh : le composant relit progress_courses au
    // lieu de réinitialiser chaque cours à 0 (c'était le bug).
    unmount();
    render(<ModulesTab />);

    expect(await screen.findByRole('button', { name: /100% complété/i })).toBeInTheDocument();
  });
});
