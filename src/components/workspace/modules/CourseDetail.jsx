import { useState } from 'react';
import { isAllowedVideoUrl, isSafeHttpUrl, matchesHost } from '../../../lib/validation';
import {
  ChevronRight,
  PlayCircle,
  PauseCircle,
  FileText,
  BookOpen,
  Download,
  Figma,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

export default function CourseDetail({ course, onBack, onMarkComplete }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [learningMode, setLearningMode] = useState('video');
  const [readingStep, setReadingStep] = useState(1);

  const handleFinishModule = () => {
    onMarkComplete(course.id);
    setReadingStep(3);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <button
            onClick={() => {
              onBack();
              setLearningMode('video');
              setReadingStep(1);
              setIsPlaying(false);
            }}
            className={`flex items-center text-sm font-semibold text-on-surface-variant hover:text-primary w-fit bg-surface-container-lowest px-4 py-2 rounded-lg border border-surface-variant shadow-sm transition-all hover:shadow-md ${FOCUS_RING}`}
          >
            <ChevronRight className="w-4 h-4 mr-1 rotate-180" aria-hidden="true" /> Retour aux cours
          </button>
        </div>

        {/* Stepper */}
        {learningMode === 'texte' && readingStep < 3 && (
          <div className="flex items-center justify-center gap-2 md:gap-3">
            {[1, 2, 3].map((step) => (
              <span key={step} className="flex items-center gap-2 md:gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-500 shadow-sm ${
                    readingStep >= step
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-lowest border border-surface-variant text-on-surface-variant'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-8 md:w-12 h-1 rounded-full transition-colors duration-500 ${
                      readingStep > step ? 'bg-primary' : 'bg-surface-variant'
                    }`}
                  ></div>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex-1 flex justify-end">
          <div className="flex bg-surface-container p-1 rounded-lg border border-surface-variant w-fit">
            <button
              onClick={() => setLearningMode('video')}
              className={`px-4 py-1.5 text-[13px] font-bold rounded-md transition-all flex items-center gap-2 ${FOCUS_RING} ${
                learningMode === 'video'
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <PlayCircle className="w-4 h-4" aria-hidden="true" /> Vidéo
            </button>
            <button
              onClick={() => {
                setLearningMode('texte');
                setIsPlaying(false);
                setReadingStep(1);
              }}
              className={`px-4 py-1.5 text-[13px] font-bold rounded-md transition-all flex items-center gap-2 ${FOCUS_RING} ${
                learningMode === 'texte'
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <FileText className="w-4 h-4" aria-hidden="true" /> Mode Lecture
            </button>
          </div>
        </div>
      </div>

      {/* Video Player */}
      {learningMode === 'video' && (
        <div className="w-full aspect-video bg-on-surface rounded-3xl overflow-hidden relative flex items-center justify-center shadow-xl border border-surface-variant">
          {course.video_url &&
          (isAllowedVideoUrl(course.video_url) || isSafeHttpUrl(course.video_url)) ? (
            /* ── VRAI LECTEUR VIDÉO ──
               `video_url` vient de l'admin (donnée non fiable). On ne construit un
               `<iframe src>` que pour un hôte explicitement autorisé (AD-5) ; sinon
               on retombe sur un <video> pour un lien http(s) direct, ou le placeholder. */
            (() => {
              const url = course.video_url;
              const embeddable = isAllowedVideoUrl(url);
              // Choix du lecteur d'après le hostname parsé (jamais un substring
              // de l'URL entière — cf. `matchesHost`).
              const isYouTube = embeddable && matchesHost(url, ['youtube.com', 'youtu.be']);
              const isStream =
                embeddable &&
                matchesHost(url, ['sharepoint.com', 'microsoftstream.com', 'stream.office.com']);

              // YouTube embed
              if (isYouTube) {
                let videoId = '';
                if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split('?')[0];
                else videoId = new URL(url).searchParams.get('v');
                return (
                  // nosemgrep: iframe-without-sandbox -- hôte sur liste blanche
                  // (isAllowedVideoUrl) ; YouTube nécessite allow-same-origin +
                  // allow-scripts pour son player. Contenu de confiance, pas du code généré.
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                    title={course.title}
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                );
              }

              // SharePoint / Stream embed.
              // Hôte SharePoint/Stream sur liste blanche (isAllowedVideoUrl). Le player
              // Stream casse sous sandbox sans allow-same-origin ; embed d'entreprise de
              // confiance, jamais du code généré.
              if (isStream) {
                const embedUrl = url.includes('embed')
                  ? url
                  : url.replace('/video/', '/video/embed/');
                // nosemgrep: iframe-without-sandbox
                return (
                  <iframe // nosemgrep: iframe-without-sandbox
                    src={embedUrl}
                    title={course.title}
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                    style={{ border: 'none' }}
                  />
                );
              }

              // Lien direct (.mp4 ou autre)
              return (
                <video
                  src={url}
                  controls
                  controlsList="nodownload"
                  className="absolute inset-0 w-full h-full object-contain bg-on-surface"
                  poster={course.image_url || undefined}
                >
                  Votre navigateur ne supporte pas la lecture vidéo.
                </video>
              );
            })()
          ) : (
            /* ── PLACEHOLDER (pas de vidéo) ── */
            <>
              <div
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute inset-0 cursor-pointer z-10"
              >
                <div
                  className={`absolute inset-0 transition-colors duration-500 ${
                    isPlaying ? 'bg-transparent' : 'bg-black/40 hover:bg-black/20'
                  }`}
                ></div>

                {!isPlaying ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayCircle className="w-20 h-20 text-white/80 hover:text-white hover:scale-110 transition-all duration-300 drop-shadow-lg" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                    <PauseCircle className="w-20 h-20 text-white/80 hover:text-white hover:scale-110 transition-all duration-300 drop-shadow-lg" />
                  </div>
                )}
              </div>

              <img
                src={
                  course.image_url ||
                  'https://images.unsplash.com/photo-1618761714954-0b8cd0026356?auto=format&fit=crop&q=80&w=1200'
                }
                alt="Video cover"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                  isPlaying ? 'opacity-100' : 'opacity-60'
                }`}
              />

              {isPlaying && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-md">
                  <div className="w-2 h-2 rounded-full bg-error animate-pulse"></div>
                  <span className="text-white text-xs font-bold uppercase">Lecture</span>
                </div>
              )}

              <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/20 z-20">
                <div
                  className="h-full bg-primary-fixed-dim transition-all duration-1000"
                  style={{ width: isPlaying ? '100%' : `${course.progress}%` }}
                ></div>
              </div>

              <div
                className={`absolute top-4 left-4 z-20 transition-opacity duration-300 ${
                  isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
                }`}
              >
                <span className="bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-md">
                  {course.module_name || course.mod}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Reading Mode */}
      {learningMode === 'texte' && (
        <div className="bg-surface-container-lowest border border-surface-variant rounded-3xl p-10 shadow-sm animate-in fade-in duration-300">
          {readingStep < 3 && (
            <div className="mb-10">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block mb-4">
                Transcription & Notes de cours
              </span>
              <h1 className="font-display-lg text-[36px] text-on-surface">{course.title}</h1>
            </div>
          )}

          <div className="prose prose-lg max-w-none text-on-surface-variant leading-relaxed">
            {readingStep === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <p className="text-xl text-on-surface-variant font-medium mb-8">{course.desc}</p>
                <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mt-6 mb-4">
                  1. Comprendre le "Latent Space"
                </h3>
                <p className="mb-6">
                  Avant de pouvoir écrire des prompts efficaces, il est crucial de comprendre
                  comment l'IA "voit" le design. Imaginez un espace mathématique infini (le latent
                  space) où chaque point représente une composante visuelle : une couleur, un
                  arrondi, une typographie.
                </p>
                <div className="bg-surface-container border-l-4 border-primary p-6 rounded-r-xl my-6">
                  <strong className="text-on-surface block mb-2">💡 À retenir</strong>
                  L'IA ne copie pas, elle prédit statistiquement le pixel suivant en fonction de
                  votre requête textuelle.
                </div>
              </div>
            )}

            {readingStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-4">
                  2. De la théorie à la pratique visuelle
                </h3>
                <p className="mb-6">
                  La théorie est utile, mais le design est avant tout visuel. Observez comment un
                  simple prompt se transforme en wireframe fonctionnel.
                </p>
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-6 border border-surface-variant shadow-sm">
                  <img
                    src="https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&q=80&w=1200"
                    alt="Wireframe design example"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mt-8 mb-4">
                  Anatomie d'un prompt UI parfait
                </h3>
                <ul className="list-disc pl-6 space-y-3 mb-8">
                  <li>
                    <strong className="text-on-surface">Le Sujet :</strong> "Une page de connexion
                    SaaS"
                  </li>
                  <li>
                    <strong className="text-on-surface">Le Style Visuel :</strong> "Minimaliste,
                    style Apple, flat design"
                  </li>
                  <li>
                    <strong className="text-on-surface">Le Format :</strong> "UI shot, high
                    resolution"
                  </li>
                </ul>
              </div>
            )}

            {readingStep === 3 && (
              <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 bg-tertiary-fixed text-tertiary rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <CheckCircle className="w-10 h-10" aria-hidden="true" />
                </div>
                <h2 className="font-display-lg text-[36px] text-on-surface mb-4">
                  Module Terminé !
                </h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mx-auto mb-10">
                  Félicitations, vous avez validé la partie théorique de ce module. Vous avez acquis
                  de nouvelles compétences aujourd'hui !
                </p>
                <button
                  onClick={() => {
                    onBack();
                    setLearningMode('video');
                    setReadingStep(1);
                  }}
                  className={`bg-on-surface text-surface font-cta-pill text-cta-pill px-8 py-3.5 rounded-full hover:scale-105 transition-transform chunky-shadow chunky-shadow-pressed ${FOCUS_RING}`}
                >
                  Retour à mes cours
                </button>
              </div>
            )}
          </div>

          {readingStep < 3 && (
            <div className="flex items-center justify-between mt-6 pt-8 border-t border-surface-variant">
              <button
                onClick={() => setReadingStep(Math.max(1, readingStep - 1))}
                disabled={readingStep === 1}
                className={`px-6 py-2.5 rounded-lg font-semibold text-[14px] transition-colors ${FOCUS_RING} ${
                  readingStep === 1
                    ? 'opacity-0 cursor-default'
                    : 'bg-surface-container text-on-surface hover:bg-surface-variant'
                }`}
              >
                Précédent
              </button>
              <button
                onClick={() => {
                  if (readingStep === 2) handleFinishModule();
                  else setReadingStep(readingStep + 1);
                }}
                className={`px-6 py-2.5 bg-primary text-on-primary rounded-lg font-semibold text-[14px] hover:opacity-90 transition-all flex items-center gap-2 group ${FOCUS_RING}`}
              >
                {readingStep === 2 ? 'Terminer le module' : 'Étape suivante'}
                {readingStep !== 2 && (
                  <ArrowRight
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info & Resources */}
      {(learningMode === 'video' || (learningMode === 'texte' && readingStep < 3)) && (
        <div className="bg-surface-container-lowest border border-surface-variant rounded-3xl p-8 shadow-sm">
          {learningMode === 'video' && (
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
              <div>
                <h2 className="font-display-lg text-[32px] text-on-surface mb-3">{course.title}</h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-2xl">
                  {course.desc}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="block text-2xl font-bold text-on-surface mb-1">{course.time}</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant">
                  Durée totale
                </span>
              </div>
            </div>
          )}

          <div
            className={`flex flex-wrap gap-4 ${learningMode === 'video' ? 'border-t border-surface-variant pt-6 mt-2' : ''}`}
          >
            {learningMode === 'video' && (
              <>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${FOCUS_RING} ${
                    isPlaying
                      ? 'bg-surface-container-lowest border border-surface-variant text-on-surface hover:bg-surface-container'
                      : 'bg-primary text-on-primary hover:opacity-90'
                  }`}
                >
                  {isPlaying ? (
                    <PauseCircle className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <PlayCircle className="w-4 h-4" aria-hidden="true" />
                  )}
                  {isPlaying ? 'Mettre en pause' : 'Continuer la lecture'}
                </button>
                {course.progress < 100 && (
                  <button
                    onClick={() => onMarkComplete(course.id)}
                    className={`px-6 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 bg-surface-container text-on-surface hover:bg-surface-variant ${FOCUS_RING}`}
                  >
                    <CheckCircle className="w-4 h-4" aria-hidden="true" /> Marquer terminé
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => setShowResources(!showResources)}
              aria-expanded={showResources}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 ${FOCUS_RING} ${
                showResources
                  ? 'bg-surface-variant text-on-surface'
                  : 'bg-surface-container text-on-surface hover:bg-surface-variant'
              }`}
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />{' '}
              {showResources ? 'Masquer les ressources' : 'Ressources du cours'}
            </button>
          </div>

          {showResources && (
            <div className="mt-6 pt-6 border-t border-surface-variant animate-in slide-in-from-top-2 fade-in duration-300">
              <h4 className="font-bold text-[15px] mb-4 text-on-surface">Fichiers à télécharger</h4>
              <div className="flex flex-col gap-3">
                {[
                  {
                    icon: Figma,
                    color: 'text-pink-500',
                    name: 'Figma UI Kit - Modèles IA',
                    meta: 'Fichier .fig • 2.4 MB',
                  },
                  {
                    icon: FileText,
                    color: 'text-blue-500',
                    name: 'Cheat Sheet - Prompts avancés',
                    meta: 'Document PDF • 1.1 MB',
                  },
                ].map(({ icon: Icon, color, name, meta }) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-4 bg-surface-container border border-surface-variant rounded-xl hover:bg-surface-container-low hover:border-outline-variant transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 bg-surface-container-lowest rounded-lg border border-surface-variant flex items-center justify-center ${color} shadow-sm group-hover:scale-105 transition-transform`}
                      >
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="font-semibold text-[14px] text-on-surface">{name}</div>
                        <div className="text-[12px] text-on-surface-variant font-medium mt-0.5">
                          {meta}
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-surface-container-lowest border border-surface-variant flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-on-primary transition-all">
                      <Download
                        className="w-4 h-4 text-on-surface-variant group-hover:text-on-primary transition-colors"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
