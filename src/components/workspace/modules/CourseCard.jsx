import { Clock, Sparkles } from 'lucide-react';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

export default function CourseCard({ course, onClick, variant = 'standard', accent, cardBg }) {
  const image = course.image_url || course.image || '';
  const duration = course.duration || course.time || '';
  const description = course.description || course.desc || '';
  const progressValue = course.progress ?? 0;
  const isNew = progressValue === 0;
  const Icon = accent?.icon || Sparkles;

  const label = `${course.title}${duration ? `, ${duration}` : ''}, ${progressValue}% complété`;

  if (variant === 'featured') {
    return (
      <button
        type="button"
        onClick={() => onClick(course)}
        aria-label={label}
        className={`col-span-1 lg:col-span-2 text-left bg-surface-container-lowest rounded-3xl p-5 md:p-6 flex flex-col justify-between chunky-shadow-coral relative overflow-hidden group border-2 border-transparent hover:border-secondary-container transition-all duration-300 ${FOCUS_RING}`}
      >
        <div
          className="absolute -right-10 -top-10 w-48 h-48 bg-secondary-container/20 rounded-full blur-2xl group-hover:bg-secondary-container/30 transition-colors"
          aria-hidden="true"
        />
        {isNew && (
          <div className="absolute right-4 top-4">
            <span className="inline-flex items-center justify-center px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full font-label-caps text-label-caps tracking-widest">
              NOUVEAU
            </span>
          </div>
        )}
        {image && (
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:opacity-15 transition-opacity duration-500"
          />
        )}
        <div className="relative z-10 w-full md:w-2/3 min-h-0 mb-4">
          <div className="w-11 h-11 bg-secondary-container rounded-lg flex items-center justify-center mb-4">
            <Icon className="w-5 h-5 text-on-secondary-container" aria-hidden="true" />
          </div>
          <h3 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 leading-tight">
            {course.title}
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">
            {description}
          </p>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full mt-auto">
          <div className="flex items-center gap-4">
            {duration && (
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Clock className="w-4 h-4" aria-hidden="true" />
                <span className="font-label-caps text-label-caps">{duration}</span>
              </div>
            )}
            <div className="w-1 h-1 bg-outline rounded-full" aria-hidden="true" />
            <span className="font-label-caps text-label-caps text-on-surface-variant">
              {progressValue}% COMPLÉTÉ
            </span>
          </div>
          <div className="w-full md:w-48 h-2 bg-surface-variant rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary-container rounded-full transition-all duration-1000"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick(course)}
      aria-label={label}
      className={`text-left ${cardBg} rounded-3xl p-5 flex flex-col justify-between chunky-shadow relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 border border-surface-variant ${FOCUS_RING}`}
    >
      <div className="relative z-10 min-h-0 mb-4">
        <div
          className={`w-10 h-10 ${accent.chipBg} rounded-lg flex items-center justify-center mb-3`}
        >
          <Icon className={`w-5 h-5 ${accent.chipText}`} aria-hidden="true" />
        </div>
        <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">
          {course.title}
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">
          {description}
        </p>
      </div>
      <div className="relative z-10 flex flex-col gap-3 mt-auto">
        <div className="flex justify-between text-on-surface-variant">
          {duration && <span className="font-label-caps text-label-caps">{duration}</span>}
          <span className="font-label-caps text-label-caps">{progressValue}% COMPLÉTÉ</span>
        </div>
        <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
          <div
            className={`h-full ${accent.barBg} rounded-full transition-all duration-1000`}
            style={{ width: `${progressValue}%` }}
          />
        </div>
      </div>
    </button>
  );
}
