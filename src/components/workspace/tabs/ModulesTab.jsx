import { useState, useEffect } from 'react';
import { getCourses } from '../../../services/supabase';
import CourseCard from '../modules/CourseCard';
import CourseDetail from '../modules/CourseDetail';

export default function ModulesTab() {
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState({}); // { [id]: number }
  const [activeCourse, setActiveCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCourses()
      .then(data => {
        setCourses(data);
        // Initialise la progression à 0 pour chaque cours
        const initial = {};
        data.forEach(c => { initial[c.id] = 0; });
        setProgress(initial);
      })
      .catch(() => setError('Impossible de charger les cours.'))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkComplete = (courseId) => {
    setProgress(prev => ({ ...prev, [courseId]: 100 }));
    setActiveCourse(prev => prev?.id === courseId ? { ...prev, progress: 100 } : prev);
  };

  const enriched = (course) => ({ ...course, progress: progress[course.id] ?? 0 });

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#EAEAEA] border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
        <p className="text-black font-semibold mb-1">Erreur de chargement</p>
        <p className="text-[#666] text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto pb-12 pr-2">
      {activeCourse ? (
        <CourseDetail
          course={enriched(activeCourse)}
          onBack={() => setActiveCourse(null)}
          onMarkComplete={handleMarkComplete}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
          {/* Title Block */}
          <div className="col-span-1 md:col-span-2 bg-white border border-[#EAEAEA] rounded-2xl p-8 flex flex-col justify-center shadow-sm">
            <h2 className="text-[32px] font-extrabold mb-2 tracking-tight">Vos Modules</h2>
            <p className="text-[#666666] text-[15px]">Reprenez votre apprentissage là où vous l'avez laissé.</p>
          </div>

          {courses.map(course => (
            <CourseCard
              key={course.id}
              course={enriched(course)}
              onClick={c => setActiveCourse(c)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
