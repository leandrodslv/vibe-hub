// @ts-check
import {
  LayoutTemplate,
  ShieldCheck,
  PenTool,
  Palette,
  Eye,
  Mic,
  TrendingUp,
  BarChart3,
  Shapes,
} from 'lucide-react';

// Catalogue partagé Outils tab (OutilsTab.jsx) + dashboard demande admin
// (AdminPage.jsx, Epic 6 story 6.2) : une seule source de vérité pour
// id/name/icon/status, pour ne pas laisser les deux vues diverger.
export const TOOLS = [
  {
    id: 'ui-builder',
    name: 'UI Builder',
    description:
      'Concevez des interfaces utilisateur complexes avec notre constructeur visuel intuitif. Génération de code en temps réel incluse.',
    icon: LayoutTemplate,
    status: 'live',
  },
  {
    id: 'code-auditor',
    name: 'Code Auditor',
    description:
      "Analyse statique et recommandations d'optimisation basées sur l'IA pour vos projets.",
    icon: ShieldCheck,
    status: 'coming',
  },
  {
    id: 'content-writer',
    name: 'Content Writer',
    description:
      'Générateur de copie UX et de contenu marketing intégré directement dans votre workflow.',
    icon: PenTool,
    status: 'coming',
  },
  {
    id: 'color-studio',
    name: 'Color Studio',
    description:
      'Création et gestion de systèmes de couleurs accessibles avec prévisualisation en direct.',
    icon: Palette,
    status: 'coming',
  },
  {
    id: 'vision-lens',
    name: 'Vision Lens',
    description:
      "Testeur d'accessibilité visuelle simulant différents types de daltonisme sur vos maquettes.",
    icon: Eye,
    status: 'coming',
  },
  {
    id: 'voice-studio',
    name: 'Voice Studio',
    description: 'Synthèse et clonage de voix pour vos prototypes, démos et vidéos.',
    icon: Mic,
    status: 'coming',
  },
  {
    id: 'seo-analyzer',
    name: 'SEO Analyzer',
    description: "Audit SEO automatisé et suggestions d'optimisation on-page en temps réel.",
    icon: TrendingUp,
    status: 'coming',
  },
  {
    id: 'data-viz',
    name: 'Data Viz',
    description: 'Générez des graphiques et tableaux de bord à partir de vos données brutes.',
    icon: BarChart3,
    status: 'coming',
  },
  {
    id: 'icon-forge',
    name: 'Icon Forge',
    description: "Générateur d'icônes cohérentes pour vos design systems et interfaces.",
    icon: Shapes,
    status: 'coming',
  },
];
