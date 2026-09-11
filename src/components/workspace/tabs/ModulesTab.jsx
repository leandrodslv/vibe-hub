import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { Bot, PenTool, Wand2, Search, Plus, ChevronRight, X } from 'lucide-react';
import { getCourses, recordCourseCompletion } from '../../../services/supabase';
import CourseCard from '../modules/CourseCard';
import CourseDetail from '../modules/CourseDetail';

const ACCENTS = [
  {
    icon: Bot,
    chipBg: 'bg-primary-container',
    chipText: 'text-on-primary-container',
    barBg: 'bg-primary',
  },
  {
    icon: PenTool,
    chipBg: 'bg-tertiary-container',
    chipText: 'text-on-tertiary-container',
    barBg: 'bg-tertiary',
  },
  {
    icon: Wand2,
    chipBg: 'bg-secondary-container',
    chipText: 'text-on-secondary-container',
    barBg: 'bg-secondary-container',
  },
];

const STATUS_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'new', label: 'À commencer' },
  { id: 'inprogress', label: 'En cours' },
  { id: 'done', label: 'Terminé' },
];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

export default function ModulesTab() {
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState({}); // { [id]: number }
  const [activeCourse, setActiveCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('Tous');
  const deferredCatalogSearch = useDeferredValue(catalogSearch);

  useEffect(() => {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Délai dépassé en contactant Supabase.')), 10000)
    );

    Promise.race([getCourses(), timeout])
      .then((data) => {
        setCourses(data);
        // Initialise la progression à 0 pour chaque cours
        const initial = {};
        data.forEach((c) => {
          initial[c.id] = 0;
        });
        setProgress(initial);
      })
      .catch((err) => {
        // Loggé pour pouvoir diagnostiquer via la console (projet Supabase en pause,
        // clé/anon invalide, RLS, etc.) plutôt que de rester bloqué sur le spinner sans indice.
        console.error('getCourses() a échoué :', err);
        setError('Impossible de charger les cours.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleMarkComplete = (courseId) => {
    setProgress((prev) => ({ ...prev, [courseId]: 100 }));
    setActiveCourse((prev) => (prev?.id === courseId ? { ...prev, progress: 100 } : prev));
    // Best-effort, jamais bloquant pour l'UI : sans compte ou sans backend, la
    // progression reste locale comme avant (Story 9.6b, AD-6).
    recordCourseCompletion(courseId).catch((err) => {
      console.error('recordCourseCompletion() a échoué :', err);
    });
  };

  const enriched = (course) => ({ ...course, progress: progress[course.id] ?? 0 });

  const visibleCourses = useMemo(() => {
    return courses.map(enriched).filter((c) => {
      return (
        statusFilter === 'all' ||
        (statusFilter === 'new' && c.progress === 0) ||
        (statusFilter === 'inprogress' && c.progress > 0 && c.progress < 100) ||
        (statusFilter === 'done' && c.progress === 100)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, progress, statusFilter]);

  const allCourses = useMemo(
    () => courses.map(enriched),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [courses, progress]
  );

  const catalogCategories = useMemo(() => {
    const names = new Set(courses.map((c) => c.module_name).filter(Boolean));
    return ['Tous', ...names];
  }, [courses]);

  const filteredCatalog = useMemo(() => {
    const q = deferredCatalogSearch.trim().toLowerCase();
    return allCourses.filter((c) => {
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.module_name || '').toLowerCase().includes(q);
      const matchesCategory = catalogCategory === 'Tous' || c.module_name === catalogCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allCourses, deferredCatalogSearch, catalogCategory]);

  const hasActiveCatalogFilters = catalogSearch !== '' || catalogCategory !== 'Tous';

  const resetCatalogFilters = () => {
    setCatalogSearch('');
    setCatalogCategory('Tous');
  };

  const closeCatalog = () => {
    setCatalogOpen(false);
    resetCatalogFilters();
  };

  const resetFilters = () => setStatusFilter('all');

  const hasActiveFilters = statusFilter !== 'all';

  // La grille principale tient sur une seule page (3 colonnes x 2 rangees, sans scroll).
  // On borne donc le nombre de cartes au nombre de cellules disponibles : la carte mise en
  // avant en occupe 2, la tuile « Nouveau Cours » 1. Le reste du catalogue reste accessible
  // via cette tuile, rien n'est perdu.
  const gridCourses = useMemo(() => {
    const isFeatured = !hasActiveFilters;
    return visibleCourses.slice(0, isFeatured ? 4 : 5);
  }, [visibleCourses, hasActiveFilters]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div
          className="w-8 h-8 border-2 border-surface-variant border-t-primary rounded-full animate-spin"
          role="status"
          aria-label="Chargement des cours"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
        <p className="font-headline-lg-mobile text-on-surface mb-1">Erreur de chargement</p>
        <p className="text-on-surface-variant font-body-md text-body-md">{error}</p>
      </div>
    );
  }

  if (activeCourse) {
    return (
      <div className="w-full h-full overflow-y-auto scrollbar-hide bg-surface pb-12 pr-2">
        <CourseDetail
          course={enriched(activeCourse)}
          onBack={() => setActiveCourse(null)}
          onMarkComplete={handleMarkComplete}
        />
      </div>
    );
  }

  if (catalogOpen) {
    return (
      <div className="w-full h-full flex flex-col bg-surface animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* En-tête fixe : ne défile pas avec la grille */}
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={closeCatalog}
            className={`flex items-center text-sm font-semibold text-on-surface-variant hover:text-primary w-fit bg-surface-container-lowest px-4 py-2 rounded-lg border border-surface-variant shadow-sm transition-all hover:shadow-md mb-6 ${FOCUS_RING}`}
          >
            <ChevronRight className="w-4 h-4 mr-1 rotate-180" aria-hidden="true" /> Retour aux cours
          </button>

          <div className="mb-5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-5">
              <div>
                <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
                  Catalogue complet
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Tous les cours disponibles.
                </p>
              </div>

              {/* Recherche */}
              <div className="relative w-full md:w-72 flex-shrink-0">
                <Search
                  className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  placeholder="Rechercher un cours..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  aria-label="Rechercher un cours dans le catalogue"
                  className={`w-full bg-surface-container-lowest border border-surface-variant rounded-xl pl-10 pr-9 py-2.5 text-[13px] outline-none focus:border-primary transition-all placeholder:text-on-surface-variant text-on-surface ${FOCUS_RING}`}
                />
                {catalogSearch && (
                  <button
                    type="button"
                    onClick={() => setCatalogSearch('')}
                    aria-label="Effacer la recherche"
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors rounded ${FOCUS_RING}`}
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {/* Filtre par module */}
            <div
              className="flex items-center gap-1 overflow-x-auto scrollbar-hide border-b border-surface-variant"
              role="group"
              aria-label="Filtrer par module"
            >
              {catalogCategories.map((cat) => {
                const count =
                  cat === 'Tous'
                    ? courses.length
                    : courses.filter((c) => c.module_name === cat).length;
                const isActive = catalogCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCatalogCategory(cat)}
                    aria-pressed={isActive}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-all duration-200 whitespace-nowrap ${FOCUS_RING} ${
                      isActive
                        ? 'border-primary text-on-surface'
                        : 'border-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {cat}
                    <span
                      className={`text-[10px] font-bold min-w-[16px] h-4 px-1 rounded flex items-center justify-center ${
                        isActive
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Contenu défilant : le catalogue est censé accueillir tous les cours, donc
            contrairement à la grille principale il garde son scroll (invisible). */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide pb-12 pr-2">
          {filteredCatalog.length === 0 ? (
            <div className="bg-surface-container-low border border-surface-variant rounded-3xl p-12 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-on-surface-variant" aria-hidden="true" />
              </div>
              <p className="font-headline-lg-mobile text-on-surface mb-2">Aucun cours trouvé</p>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-4">
                Essayez un autre mot-clé ou module.
              </p>
              {hasActiveCatalogFilters && (
                <button
                  type="button"
                  onClick={resetCatalogFilters}
                  className={`text-sm text-on-surface font-semibold underline underline-offset-2 rounded ${FOCUS_RING}`}
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-stack-gap md:gap-grid-gutter">
              {filteredCatalog.map((course, index) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onClick={(c) => setActiveCourse(c)}
                  variant="standard"
                  accent={ACCENTS[index % ACCENTS.length]}
                  cardBg={
                    index % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container-low'
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-surface animate-in fade-in duration-500">
      {/* En-tête fixe : ne défile pas avec la grille */}
      <div className="flex-shrink-0 mb-4">
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-3">
          Cours
        </h2>

        {/* Filtre par statut */}
        <div
          className="flex items-center gap-1 overflow-x-auto scrollbar-hide border-b border-surface-variant"
          role="group"
          aria-label="Filtrer par statut"
        >
          {STATUS_FILTERS.map(({ id, label }) => {
            const count =
              id === 'all'
                ? allCourses.length
                : allCourses.filter((c) =>
                    id === 'new'
                      ? c.progress === 0
                      : id === 'inprogress'
                        ? c.progress > 0 && c.progress < 100
                        : c.progress === 100
                  ).length;
            const isActive = statusFilter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setStatusFilter(id)}
                aria-pressed={isActive}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-all duration-200 whitespace-nowrap ${FOCUS_RING} ${
                  isActive
                    ? 'border-primary text-on-surface'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {label}
                <span
                  className={`text-[10px] font-bold min-w-[16px] h-4 px-1 rounded flex items-center justify-center ${
                    isActive
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenu (ne défile pas : min-h-0 force le flex item à respecter overflow-hidden
          au lieu de grandir avec son contenu, comme le ferait le min-height:auto par défaut) */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide lg:overflow-hidden pr-2">
        {visibleCourses.length === 0 ? (
          <div className="bg-surface-container-low border border-surface-variant rounded-3xl p-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-on-surface-variant" aria-hidden="true" />
            </div>
            <p className="font-headline-lg-mobile text-on-surface mb-2">Aucun cours trouvé</p>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-4">
              {hasActiveFilters
                ? 'Essayez un autre statut.'
                : 'Revenez bientôt, de nouveaux contenus arrivent.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className={`text-sm text-on-surface font-semibold underline underline-offset-2 rounded ${FOCUS_RING}`}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          /* Sur grand écran la grille occupe exactement la hauteur restante (2 rangées
             de taille égale) : les cartes se compriment au lieu de déborder, donc plus
             aucun scroll. En dessous de `lg` on retombe sur un empilement scrollable. */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2 lg:h-full lg:min-h-0 gap-stack-gap md:gap-grid-gutter">
            {gridCourses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={(c) => setActiveCourse(c)}
                variant={index === 0 && !hasActiveFilters ? 'featured' : 'standard'}
                accent={ACCENTS[index % ACCENTS.length]}
                cardBg={
                  index % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container-low'
                }
              />
            ))}

            <button
              type="button"
              onClick={() => setCatalogOpen(true)}
              className={`bg-surface-variant rounded-3xl p-6 flex flex-col items-center justify-center text-center border-2 border-dashed border-outline-variant hover:bg-surface-container transition-colors min-h-[200px] lg:min-h-0 ${FOCUS_RING}`}
            >
              <div className="w-14 h-14 bg-surface-container-lowest rounded-full flex items-center justify-center mb-3 chunky-shadow">
                <Plus className="w-7 h-7 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-1">
                Nouveau Cours
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-[200px]">
                Découvrez le catalogue complet de formations.
              </p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
