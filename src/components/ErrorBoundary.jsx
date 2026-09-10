import { Component } from 'react';
import { logger, serializeError } from '../lib/logger.js';

/**
 * Filet de sécurité : une exception dans le rendu d'un sous-arbre React casse
 * *tout* l'écran (page blanche) si personne ne la rattrape. Ici on la logge
 * (structuré → observabilité) et on affiche un écran de repli utilisable.
 *
 * Volontairement une classe : les error boundaries n'ont pas d'équivalent hooks.
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logger.error('react:error-boundary', {
      ...serializeError(error),
      componentStack: info?.componentStack,
      boundary: this.props.name || 'root',
    });
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        className="min-h-screen bg-surface text-on-surface flex flex-col items-center justify-center gap-4 p-6 text-center font-body-md"
      >
        <h1 className="font-headline-lg text-headline-lg-mobile">Une erreur est survenue</h1>
        <p className="text-on-surface-variant max-w-md">
          L&apos;écran n&apos;a pas pu s&apos;afficher correctement. L&apos;incident a été
          enregistré.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          className="min-h-[44px] bg-primary text-on-primary font-cta-pill text-cta-pill px-6 py-3 rounded-full hover:bg-primary-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Recharger la page
        </button>
      </div>
    );
  }
}
