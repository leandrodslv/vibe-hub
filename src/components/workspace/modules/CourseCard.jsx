import { PlayCircle } from 'lucide-react';

export default function CourseCard({ course, onClick }) {
  // Compatibilité champs Supabase (image_url, duration, module_name, description)
  // et anciens champs statiques (image, time, mod, desc)
  const image = course.image_url || course.image || '';
  const duration = course.duration || course.time || '';
  const moduleName = course.module_name || course.mod || '';
  const description = course.description || course.desc || '';
  const progressValue = course.progress ?? 0;

  return (
    <div
      onClick={() => onClick(course)}
      className="bg-white border border-[#EAEAEA] rounded-2xl overflow-hidden hover:border-[#CCCCCC] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-300 cursor-pointer group flex flex-col"
    >
      {/* Thumbnail */}
      <div className="h-44 bg-black flex items-center justify-center relative overflow-hidden flex-shrink-0">
        {image ? (
          <img
            src={image}
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-[#111]" />
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300 z-10" />
        <PlayCircle className="w-12 h-12 text-white/80 group-hover:text-white group-hover:scale-110 transition-all duration-300 z-20 drop-shadow-md" />
        {duration && (
          <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-1 rounded-md z-20">
            {duration}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <span className="text-[10px] font-extrabold text-black uppercase tracking-wider mb-2 block">
          {moduleName}
        </span>
        <h3 className="font-bold text-[17px] leading-tight mb-2 tracking-tight">{course.title}</h3>
        <p className="text-[13px] text-[#666666] mb-6 line-clamp-2 leading-relaxed">{description}</p>

        <div className="mt-auto">
          <div className="w-full h-1 bg-[#F4F4F4] rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-black rounded-full transition-all duration-1000"
              style={{ width: `${progressValue}%` }}
            />
          </div>
          <div className="text-[11px] text-[#999999] font-semibold text-right">
            {progressValue}% complété
          </div>
        </div>
      </div>
    </div>
  );
}
