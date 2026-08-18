import { useEffect, useRef } from 'react';
import { appHref, MENTION_NOUVEL_ONGLET, NOUVEL_ONGLET } from '../../lib/routes';
import {
  ArrowRight,
  PlayCircle,
  Bot,
  Paintbrush,
  MousePointer2,
  Sparkles,
  Wand2,
  LayoutGrid,
  MessageSquare,
  Code2,
  Lightbulb,
  Palette,
  Rocket,
  Cpu,
  Braces,
  Layers,
  PenTool,
  Zap,
  Boxes,
  Star,
  FileCode,
  Feather,
  Compass,
  Blocks,
  Grid2x2,
  ScanLine,
} from 'lucide-react';

const CHIP_COLORS = [
  'bg-surface text-primary',
  'bg-franc-coral text-on-surface',
  'bg-franc-green text-on-surface',
  'bg-franc-pink text-on-surface',
  'bg-franc-blue text-on-surface',
  'bg-on-primary/15 text-on-primary',
];
// Weighted toward the smaller sizes so a dense field (50-100 icons) still reads as texture,
// not a wall of large chips.
const CHIP_SIZES = [
  { box: 'w-7 h-7', icon: 'w-3.5 h-3.5' },
  { box: 'w-8 h-8', icon: 'w-4 h-4' },
  { box: 'w-9 h-9', icon: 'w-4 h-4' },
  { box: 'w-9 h-9', icon: 'w-4 h-4' },
  { box: 'w-11 h-11', icon: 'w-5 h-5' },
  { box: 'w-14 h-14', icon: 'w-6 h-6' },
];
const ICONS = [
  Bot,
  Paintbrush,
  MousePointer2,
  Sparkles,
  Wand2,
  LayoutGrid,
  MessageSquare,
  Code2,
  Lightbulb,
  Palette,
  Rocket,
  Cpu,
  Braces,
  Layers,
  PenTool,
  Zap,
  Boxes,
  Star,
  FileCode,
  Feather,
  Compass,
  Blocks,
  Grid2x2,
  ScanLine,
];

// Distributed via a phyllotaxis (sunflower-seed) spiral — the same golden-angle pattern that
// evenly fills a field for arbitrary counts (works for 20 icons or 80) without the clustering a
// naive random or fixed-ring placement would produce. A minimum radius keeps the innermost ring
// clear of the central headline/CTA column.
// Densité calibrée pour la seule zone vitrine (bloc CTA), pas pour toute la hauteur du pied de
// page : depuis l'ajout du plan du site, un champ étalé sur le <footer> entier passait derrière
// des libellés et détruisait leur lisibilité.
const ICON_COUNT = 70;
const GOLDEN_ANGLE = 137.5;
const MIN_RADIUS_PCT = 15;
const MAX_RADIUS_PCT = 49;
const RADIUS_SCALE = (MAX_RADIUS_PCT - MIN_RADIUS_PCT) / Math.sqrt(ICON_COUNT - 1);

const FOOTER_ICONS = Array.from({ length: ICON_COUNT }, (_, i) => {
  const angle = (i * GOLDEN_ANGLE * Math.PI) / 180;
  const radius = MIN_RADIUS_PCT + RADIUS_SCALE * Math.sqrt(i);
  const cx = 50 + Math.cos(angle) * radius;
  const cy = 50 + Math.sin(angle) * radius * 0.62; // flatten vertically (footer is wide, not tall)
  const size = CHIP_SIZES[i % CHIP_SIZES.length];
  return {
    icon: ICONS[i % ICONS.length],
    chip: CHIP_COLORS[i % CHIP_COLORS.length],
    box: size.box,
    size: size.icon,
    style: {
      left: `${Math.max(2, Math.min(98, cx)).toFixed(2)}%`,
      top: `${Math.max(4, Math.min(96, cy)).toFixed(2)}%`,
    },
  };
});

const GRAVITY = 0.1;
const DAMPING = 0.96;
const RESTITUTION = 0.25; // soft bounce off the footer's own edges — never past them
const REPEL_RADIUS = 90;

/**
 * A field of confetti-like icons that behave like sand or small plastic balls settling inside
 * the footer: gravity pulls them down, the cursor scatters/"shakes" nearby ones (harder the
 * faster it moves), and they bounce softly off the footer's own edges — they can never cross
 * the footer's top/bottom/left/right boundary (the previous spring-back version let fast flicks
 * carry icons up past the footer's top edge into the section above it).
 *
 * Runs a single rAF loop writing DOM transforms directly (bypassing React state) so it stays
 * smooth with dozens of nodes. Each icon's rest position and the footer's own bounding box are
 * measured once on mount/resize, not every frame (`getBoundingClientRect` forces a layout, and
 * doing that per-node per-frame doesn't scale to a 50-100 icon field). Purely decorative:
 * aria-hidden, pointer-events-none, and skipped entirely under prefers-reduced-motion.
 */
function ConfettiIconField({ items, containerRef }) {
  const nodesRef = useRef([]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !containerRef.current) return undefined;

    const walls = { top: 0, bottom: 0, left: 0, right: 0 };

    function measure() {
      const rect = containerRef.current.getBoundingClientRect();
      walls.top = rect.top;
      walls.bottom = rect.bottom;
      walls.left = rect.left;
      walls.right = rect.right;

      nodesRef.current.forEach((node) => {
        if (!node || !node.el) return;
        const prevTransform = node.el.style.transform;
        node.el.style.transform = 'none'; // measure the untranslated rest position
        const iconRect = node.el.getBoundingClientRect();
        node.base = { x: iconRect.left + iconRect.width / 2, y: iconRect.top + iconRect.height / 2 };
        node.radius = iconRect.width / 2;
        if (node.x === undefined) {
          node.x = node.base.x;
          node.y = node.base.y;
          node.vx = 0;
          node.vy = 0;
        }
        node.el.style.transform = prevTransform;
      });
    }
    measure();
    window.addEventListener('resize', measure);

    const mouse = { x: -9999, y: -9999, vx: 0, vy: 0, lastX: -9999, lastY: -9999 };

    function handlePointerMove(e) {
      mouse.vx = mouse.lastX === -9999 ? 0 : e.clientX - mouse.lastX;
      mouse.vy = mouse.lastY === -9999 ? 0 : e.clientY - mouse.lastY;
      mouse.lastX = e.clientX;
      mouse.lastY = e.clientY;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
    window.addEventListener('pointermove', handlePointerMove);

    let rafId;
    function tick() {
      const speed = Math.min(Math.hypot(mouse.vx, mouse.vy), 35);
      nodesRef.current.forEach((node) => {
        if (!node || !node.el || !node.base) return;

        node.vy += GRAVITY;

        const dx = node.x - mouse.x;
        const dy = node.y - mouse.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < REPEL_RADIUS) {
          const push = (1 - dist / REPEL_RADIUS) * (1 + speed * 0.22);
          node.vx += (dx / dist) * push;
          node.vy += (dy / dist) * push;
        }

        node.vx *= DAMPING;
        node.vy *= DAMPING;
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off the footer's own edges — the icon can never cross them.
        const r = node.radius;
        if (node.y - r < walls.top) {
          node.y = walls.top + r;
          node.vy = Math.abs(node.vy) * RESTITUTION;
        } else if (node.y + r > walls.bottom) {
          node.y = walls.bottom - r;
          node.vy = -Math.abs(node.vy) * RESTITUTION;
        }
        if (node.x - r < walls.left) {
          node.x = walls.left + r;
          node.vx = Math.abs(node.vx) * RESTITUTION;
        } else if (node.x + r > walls.right) {
          node.x = walls.right - r;
          node.vx = -Math.abs(node.vx) * RESTITUTION;
        }

        const offsetX = node.x - node.base.x;
        const offsetY = node.y - node.base.y;
        node.el.style.transform = `translate(${offsetX.toFixed(1)}px, ${offsetY.toFixed(1)}px) rotate(${(offsetX * 0.5).toFixed(1)}deg)`;
      });
      mouse.vx *= 0.85;
      mouse.vy *= 0.85;
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', measure);
      cancelAnimationFrame(rafId);
    };
  }, [containerRef]);

  return (
    <>
      {items.map(({ icon: Icon, style, chip, size, box }, i) => (
        <span
          key={i}
          aria-hidden="true"
          ref={(el) => {
            if (!nodesRef.current[i]) nodesRef.current[i] = {};
            nodesRef.current[i].el = el;
          }}
          style={style}
          className={`absolute hidden md:flex ${box} rounded-full items-center justify-center select-none shadow-lg pointer-events-none ${chip}`}
        >
          <Icon className={size} strokeWidth={2.25} />
        </span>
      ))}
    </>
  );
}

// Plan du site (RGAA 12.2 / 12.3) — second moyen de navigation, en complément du menu principal.
// Il doit permettre de comprendre la structure et d'atteindre l'ensemble des rubriques ET des
// fonctionnalités : d'où les entrées vers les trois espaces applicatifs, pas seulement vers les
// sections de la page. Tout est en <a> depuis que le logiciel a sa propre URL — les entrées
// marquées d'un `tab` pointent vers `/app` et s'ouvrent dans un nouvel onglet.
const PLAN_DU_SITE = [
  {
    titre: 'Le site',
    entrees: [
      { label: 'Accueil', href: '#top' },
      { label: 'Modules', href: '#modules-showcase' },
      { label: 'Outils', href: '#outils-showcase' },
      { label: 'Le programme', href: '#programme' },
      { label: 'Questions fréquentes', href: '#faq' },
    ],
  },
  {
    titre: 'L’application',
    entrees: [
      { label: 'Assistant IA', href: appHref('ia'), nouvelOnglet: true },
      { label: 'Modules de formation', href: appHref('modules'), nouvelOnglet: true },
      { label: 'Bibliothèque d’outils', href: appHref('outils'), nouvelOnglet: true },
    ],
  },
  {
    titre: 'Administration',
    entrees: [{ label: 'Gestion des cours', href: '/admin' }],
  },
];

// Style partagé par les liens du plan du site et ceux de la barre de bas de page : pas de
// soulignement au repos, soulignement + éclaircissement au survol et anneau au focus. Ces liens
// sont regroupés dans des blocs de navigation, pas insérés dans du texte courant — le
// soulignement permanent qu'exige RGAA 10.6 pour les liens « dans du texte » ne s'applique pas ici.
const LIEN_FOOTER =
  'inline-flex items-center min-h-[44px] px-2 -mx-2 rounded text-on-primary/85 hover:text-on-primary hover:underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary';

export default function Footer() {
  const vitrineRef = useRef(null);
  const solRef = useRef(null);

  return (
    <footer className="relative overflow-hidden bg-primary text-on-primary px-container-margin py-24 md:py-32">
      {/* Zone « vitrine » : filigrane + confettis + CTA. Les deux décors sont ancrés sur ce
          conteneur et non sur tout le <footer>. Centrés sur la hauteur totale, ils se
          retrouvaient à cheval sur le plan du site depuis que celui-ci allonge le pied de page —
          le filigrane visuellement, les confettis en passant derrière les libellés au point de
          les rendre illisibles. Les décors restent ainsi cantonnés au bloc CTA, comme à l'origine. */}
      <div ref={vitrineRef} className="relative py-12">
        {/* Oversized watermark wordmark — kept subtle (low opacity, heavy blur) so it reads as
            texture, not as competing content, per the "discipline it" note from the design review. */}
        <span
          aria-hidden="true"
          className="font-display-xl absolute inset-0 flex items-center justify-center text-[18vw] leading-none whitespace-nowrap text-on-primary/10 blur-[2px] select-none pointer-events-none"
        >
          VIBE HUB
        </span>

        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="font-display-lg text-headline-lg-mobile md:text-display-lg text-balance mb-4">
            Tous les outils IA de votre équipe, au même endroit.
          </h2>
          <p className="font-body-lg text-body-lg text-on-primary/85 mb-10">
            Modules, Assistant IA, UI Builder - accessibles dès aujourd&apos;hui, sans compte à créer.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={appHref()}
              {...NOUVEL_ONGLET}
              className="bg-on-surface text-surface font-cta-pill text-cta-pill px-8 py-4 rounded-full hover:scale-105 transition-transform chunky-shadow chunky-shadow-pressed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              Découvrir Vibe Hub
              <span className="sr-only">{MENTION_NOUVEL_ONGLET}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
            <a
              href="#programme"
              className="bg-on-primary/10 border border-on-primary/70 text-on-primary font-cta-pill text-cta-pill px-8 py-4 rounded-full hover:bg-on-primary/20 transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              Voir le programme
              <PlayCircle className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <nav
        aria-labelledby="plan-du-site-titre"
        className="relative max-w-7xl mx-auto mt-24 pt-10 border-t border-on-primary/30"
      >
        <h2 id="plan-du-site-titre" className="font-label-caps text-label-caps uppercase tracking-wider text-on-primary mb-6">
          Plan du site
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {PLAN_DU_SITE.map(({ titre, entrees }) => (
            <div key={titre}>
              <h3 className="font-cta-pill text-cta-pill text-on-primary mb-2">{titre}</h3>
              <ul className="flex flex-col">
                {entrees.map(({ label, href, nouvelOnglet }) => (
                  <li key={label}>
                    <a href={href} className={LIEN_FOOTER} {...(nouvelOnglet ? NOUVEL_ONGLET : {})}>
                      {label}
                      {nouvelOnglet && <span className="sr-only">{MENTION_NOUVEL_ONGLET}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/*
        TODO accessibilité (RGAA 6.1) — « Mentions légales » et « Confidentialité » pointent sur
        href="#" : leur intitulé annonce une destination qui n'existe pas encore, et ils renvoient
        en haut de page. Non-conformité connue et assumée le temps que les pages soient écrites :
        remplacer les deux "#" par les URLs réelles suffit à la lever, le reste (cible tactile de
        44px, anneau de focus, contraste) est déjà en place.
      */}
      <div className="relative max-w-7xl mx-auto mt-10 pt-6 border-t border-on-primary/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-on-primary/85">
        <span className="font-body-md text-center sm:text-left">
          © {new Date().getFullYear()} vibe hub. Outil interne — tous droits réservés.
        </span>
        <div className="flex gap-6">
          <a href="#" className={LIEN_FOOTER}>
            Mentions légales
          </a>
          <a href="#" className={LIEN_FOOTER}>
            Confidentialité
          </a>
        </div>
      </div>

      {/*
        « Sol » du pied de page : le champ de confettis est ancré ici plutôt qu'autour du bloc CTA.
        Deux raisons — la gravité et le rebond du composant ne racontent quelque chose que s'il y a
        un vrai plancher sous les icônes (le bas de la page), et surtout aucun libellé ne passe
        derrière : posé sur le CTA, le champ traversait le titre « Tous les outils IA… » et
        dégradait son contraste. Le décor est dense mais ne croise plus aucun texte.
      */}
      <div ref={solRef} className="relative h-40 -mb-16 md:-mb-20">
        <ConfettiIconField items={FOOTER_ICONS} containerRef={solRef} />
      </div>
    </footer>
  );
}
