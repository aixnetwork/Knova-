
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Course } from '../types';
import { CheckCircle, Loader2, Image as ImageIcon, Zap, BookOpen, PenTool, Star, Edit, MoreVertical, Sparkles, Trash2, Award } from 'lucide-react';
import { generateConceptImage } from '../services/geminiService';

interface CourseCardProps {
  course: Course;
  onClick: () => void;
  onUpdateThumbnail?: (url: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Deterministic gradient generator based on string hash
const getGradient = (str?: string | null) => {
    if (!str) return 'bg-gradient-to-br from-blue-500 to-indigo-600'; // Safe fallback
    
    const gradients = [
        'bg-gradient-to-br from-blue-500 to-indigo-600',
        'bg-gradient-to-br from-emerald-400 to-teal-600',
        'bg-gradient-to-br from-orange-400 to-red-600',
        'bg-gradient-to-br from-purple-500 to-pink-600',
        'bg-gradient-to-br from-indigo-400 to-cyan-600',
        'bg-gradient-to-br from-rose-400 to-orange-500',
        'bg-gradient-to-br from-teal-400 to-blue-500',
        'bg-gradient-to-br from-violet-500 to-purple-500'
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
};

export const CourseCard: React.FC<CourseCardProps> = React.memo(({ course, onClick, onUpdateThumbnail, onEdit, onDelete }) => {
  if (!course) return null;
  const modules = course.modules || [];
  const completedCount = modules.filter(m => m.isCompleted).length;
  // Safe check for id existence
  const isUserCreated = course.id ? course.id.startsWith('course-') : false;
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Memoize the gradient so it doesn't change on re-renders
  const placeholderGradient = useMemo(() => getGradient(course.title || course.id), [course.title, course.id]);

  // Ref to track if generation was attempted for this specific course ID
  const generationAttemptedRef = useRef<string | null>(null);

  // Lazy Load Observer
  useEffect(() => {
      if (!cardRef.current) return;
      
      const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
              setIsVisible(true);
              observer.disconnect();
          }
      }, { threshold: 0.1, rootMargin: '50px' });

      observer.observe(cardRef.current);

      return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const generateThumbnail = async () => {
      // Only generate if visible, no URL, no generation in progress, callback exists, and no error
      if (!isVisible || course.thumbnailUrl || isGenerating || !onUpdateThumbnail || !course.title || hasError || !course.id) {
          return;
      }
        
      // Prevent double-firing
      if (generationAttemptedRef.current === course.id) return;
      generationAttemptedRef.current = course.id;

      // Stagger requests slightly to prevent initial congestion
      const delay = Math.random() * 3000;
      await new Promise(r => setTimeout(r, delay));
      if(!isMounted) return;

      setIsGenerating(true);
      
      // Safety timeout
      const timeoutId = setTimeout(() => {
          if(isMounted) {
              setIsGenerating(false);
              setHasError(true);
          }
      }, 60000); // Reduced to 60s

      try {
        // Optimized prompt for faster/cleaner generation
        const prompt = `Minimalist vector art course cover for "${course.title}". Topic: ${course.topic || 'General'}. Clean, bold colors, simple geometric shapes, high quality, flat design.`;
        
        const url = await generateConceptImage(prompt);
        
        if (url && isMounted) {
          onUpdateThumbnail(url);
        } else {
            if (isMounted) setHasError(true);
        }
      } catch (error) {
        console.error("Failed to generate course thumbnail", error);
        if (isMounted) setHasError(true);
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) setIsGenerating(false);
      }
    };

    generateThumbnail();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.thumbnailUrl, course.title, course.topic, onUpdateThumbnail, course.id, isVisible]);

  return (
    <div 
      ref={cardRef}
      onClick={onClick}
      className={`bg-white rounded-xl border ${course.isFeatured ? 'border-amber-400 shadow-md ring-1 ring-amber-100' : 'border-slate-200 shadow-sm'} hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between h-full relative overflow-hidden`}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 items-start pointer-events-none">
          {course.isFeatured && (
              <div className="bg-amber-400 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 uppercase tracking-wide">
                  <Zap size={10} fill="currentColor" /> Bestseller
              </div>
          )}
          {isUserCreated && (
              <div className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 uppercase tracking-wide">
                  <PenTool size={10} /> Created by You
              </div>
          )}
          {course.isDefault && (
              <div className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 uppercase tracking-wide">
                  <Award size={10} /> Assigned
              </div>
          )}
      </div>

      {/* Actions: Edit & Delete */}
      {(onEdit || onDelete) && (
          <div className="absolute top-3 right-3 z-30 flex gap-2">
              {onEdit && (
                  <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                    className="p-2 bg-white/90 hover:bg-white text-slate-600 hover:text-indigo-600 rounded-full shadow-sm border border-slate-200 transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
                    title="Edit Course"
                  >
                      <Edit size={14} />
                  </button>
              )}
              {onDelete && (
                  <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="p-2 bg-white/90 hover:bg-white text-slate-600 hover:text-red-600 rounded-full shadow-sm border border-slate-200 transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 delay-75"
                    title="Delete Course"
                  >
                      <Trash2 size={14} />
                  </button>
              )}
          </div>
      )}

      <div className="p-4 pb-0 flex-1">
        <div className={`mb-4 rounded-lg overflow-hidden h-40 w-full relative group-hover:shadow-sm transition-all border border-slate-100 ${!course.thumbnailUrl ? placeholderGradient : 'bg-slate-100'}`}>
           {course.thumbnailUrl ? (
               <img 
                 src={course.thumbnailUrl} 
                 alt="Thumbnail" 
                 loading="lazy"
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
               />
           ) : (
               <div className="w-full h-full flex flex-col items-center justify-center relative">
                   {/* Gradient Pattern Overlay */}
                   <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                   
                   {/* Course Initials or Icon */}
                   <div className="relative z-10 text-white opacity-80 mix-blend-overlay">
                       <BookOpen size={48} />
                   </div>

                   {/* Subtle Loading State */}
                   {isGenerating && (
                       <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/30 backdrop-blur px-2 py-1 rounded-full text-[10px] text-white font-medium border border-white/10 animate-pulse">
                           <Sparkles size={10} className="text-amber-300" />
                           <span>AI Designing...</span>
                       </div>
                   )}
               </div>
           )}
           
           {/* Preview Overlay */}
           <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-[2px] p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center text-left z-10 pointer-events-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-1">
                    <BookOpen size={10} /> Course Preview
                </span>
                {modules[0] ? (
                    <>
                        <h4 className="font-bold text-white text-sm line-clamp-2 mb-1 leading-snug">{modules[0].title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{modules[0].description}</p>
                    </>
                ) : (
                    <p className="text-xs text-slate-500 italic">No modules available yet.</p>
                )}
           </div>
           
           {course.progress === 100 && (
             <div className="absolute bottom-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow-sm z-20">
               <CheckCircle size={14} />
             </div>
           )}
        </div>

        <div className="mb-1">
            <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                {course.title || 'Untitled Course'}
            </h3>
        </div>
        
        {course.authorName && (
            <div className="text-xs text-slate-500 mb-2 truncate">
                By {course.authorName}
            </div>
        )}
        
        <p className="text-xs text-slate-500 mb-3 line-clamp-2 min-h-[2.5em] leading-relaxed">
            {course.description || 'No description provided.'}
        </p>
        
        {/* Rating Row */}
        {!isUserCreated && (course.rating || course.reviewCount) ? (
            <div className="flex items-center gap-1 mb-2">
                <span className="font-bold text-amber-500 text-sm">{course.rating || 4.5}</span>
                <div className="flex text-amber-400">
                    {[1,2,3,4,5].map(i => (
                        <Star key={i} size={10} fill={i <= Math.round(course.rating || 4.5) ? "currentColor" : "none"} />
                    ))}
                </div>
                <span className="text-xs text-slate-400">({(course.reviewCount || 10).toLocaleString()})</span>
            </div>
        ) : null}
      </div>

      <div className="p-4 pt-2 mt-auto border-t border-slate-100">
        {course.progress > 0 ? (
            <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>{Math.round(course.progress)}% Complete</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${course.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                        style={{ width: `${course.progress}%` }}
                    />
                </div>
            </div>
        ) : (
            <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 text-lg">
                    {course.price && course.price > 0 ? `$${course.price}` : 'Free'}
                </div>
                {course.price && course.price > 0 && (
                    <span className="text-xs text-slate-400 line-through">${(course.price * 1.2).toFixed(2)}</span>
                )}
            </div>
        )}
      </div>
    </div>
  );
});