import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccueilTab from './AccueilTab.jsx';
import { useNotifications } from '../../../hooks/useNotifications.js';

const courses = [
  { id: 'c1', title: 'Introduction', module_name: 'MODULE 1' },
  { id: 'c2', title: 'Avancé', module_name: 'MODULE 2' },
];

vi.mock('../../../services/supabase.js', () => ({
  getCourses: vi.fn(async () => courses),
}));

// Frontière volontaire (comme ai.test.js mockant services/supabase.js) : useNotifications()
// a déjà sa propre suite (useNotifications.test.js) — ici on teste comment AccueilTab
// *consomme* le hook, pas le hook lui-même.
vi.mock('../../../hooks/useNotifications.js', () => ({
  useNotifications: vi.fn(),
}));

const baseNotifState = {
  authResolved: true,
  authenticated: false,
  notifications: [],
  unreadCount: 0,
};

describe('AccueilTab', () => {
  beforeEach(() => {
    localStorage.clear();
    useNotifications.mockReturnValue(baseNotifState);
  });

  it('affiche la progression et propose de reprendre le premier cours non terminé', async () => {
    render(<AccueilTab active onNavigate={vi.fn()} />);

    expect(await screen.findByText(/0/)).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /Reprendre.*Introduction/ })
    ).toBeInTheDocument();
  });

  it('le clic sur "Reprendre" navigue vers l’onglet Cours', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<AccueilTab active onNavigate={onNavigate} />);

    await user.click(await screen.findByRole('button', { name: /Reprendre/ }));
    expect(onNavigate).toHaveBeenCalledWith('modules');
  });

  it('invite à se connecter quand la session est anonyme', async () => {
    render(<AccueilTab active onNavigate={vi.fn()} />);
    expect(await screen.findByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
  });

  it('liste les notifications récentes et le nombre de non-lues quand connecté', async () => {
    useNotifications.mockReturnValue({
      authResolved: true,
      authenticated: true,
      notifications: [
        { id: 'n1', title: 'Nouveau cours', read: false, created_at: '2026-09-15T00:00:00Z' },
      ],
      unreadCount: 1,
    });

    render(<AccueilTab active onNavigate={vi.fn()} />);
    expect(await screen.findByText('Nouveau cours')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /1 non lue/ })).toBeInTheDocument();
  });

  it('liste les outils "live" du catalogue partagé', async () => {
    render(<AccueilTab active onNavigate={vi.fn()} />);
    expect(await screen.findByText('UI Builder')).toBeInTheDocument();
  });

  /**
   * Régression : les 5 onglets du Workspace restent montés en permanence
   * (WorkspacePage.jsx, juste masqués) — sans relecture au passage `active`
   * false → true, terminer un cours dans l'onglet Cours pendant qu'Accueil
   * est simplement masqué laisserait le compteur affiché à sa valeur du
   * premier montage (lu une seule fois).
   */
  it('relit la progression localStorage quand `active` repasse à true', async () => {
    const { rerender } = render(<AccueilTab active={false} onNavigate={vi.fn()} />);
    await screen.findByRole('button', { name: /Reprendre.*Introduction/ });

    localStorage.setItem('progress_courses', JSON.stringify({ c1: 100 }));
    // Toujours masqué : la nouvelle progression n'est pas encore prise en compte.
    rerender(<AccueilTab active={false} onNavigate={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Reprendre.*Introduction/ })).toBeInTheDocument();

    // Redevient actif : relecture, le prochain cours non terminé change.
    rerender(<AccueilTab active onNavigate={vi.fn()} />);
    expect(await screen.findByRole('button', { name: /Reprendre.*Avancé/ })).toBeInTheDocument();
  });
});
