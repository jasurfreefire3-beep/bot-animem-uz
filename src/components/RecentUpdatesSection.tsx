import React, { useRef } from 'react';
import { Clock, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Anime } from '../types';

interface RecentUpdatesSectionProps {
  animes: Anime[];
  onOpenAnime: (anime: Anime) => void;
}

export const RecentUpdatesSection: React.FC<RecentUpdatesSectionProps> = ({
  animes,
  onOpenAnime,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!animes || animes.length === 0) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="my-5 sm:my-7 select-none">
      {/* Section Header */}
      <div className="flex my-2 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 shadow-[0_0_12px_rgba(168,85,247,0.8)] lg:h-6" />
          <h2 className="text-white text-base font-sans font-bold uppercase lg:text-lg tracking-wide">
            So'nggi yangilanishlar
          </h2>
        </div>

        {/* Next / Prev Controls */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => handleScroll('left')}
            className="p-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/80 text-purple-300 hover:text-white border border-purple-800/40 transition-colors"
            title="Oldingi"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="p-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/80 text-purple-300 hover:text-white border border-purple-800/40 transition-colors"
            title="Keyingi"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Landscape Cards matching Kawaii */}
      <div
        ref={scrollRef}
        className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none scroll-smooth snap-x"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {animes.map((item) => (
          <div
            key={item.id}
            onClick={() => onOpenAnime(item)}
            className="group relative cursor-pointer select-none transition-all duration-300 active:scale-97 shrink-0 w-64 sm:w-72 lg:w-80 snap-start"
          >
            <div className="flex h-24 sm:h-28 w-full items-center gap-2.5 rounded-xl border border-purple-500/20 bg-[#120a22]/60 p-1.5 shadow-md backdrop-blur-xl transition-all duration-300 hover:border-purple-500/50 hover:bg-[#180d2e] hover:shadow-lg hover:shadow-purple-500/10 overflow-hidden">
              {/* Sphere glow */}
              <div className="absolute -z-10 h-36 w-36 rounded-full bg-purple-400/15 blur-2xl" />

              {/* Poster thumbnail */}
              <div className="relative h-full w-16 sm:w-20 shrink-0 overflow-hidden rounded-lg border border-purple-500/20 bg-[#150c26]">
                <img
                  src={item.poster_url}
                  alt={item.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Details */}
              <div className="flex h-full w-full flex-col justify-between py-0.5 pr-1 min-w-0">
                <span className="line-clamp-2 text-start font-sans text-xs font-bold leading-snug text-white transition-colors duration-200 group-hover:text-purple-300">
                  {item.title}
                </span>

                <div className="flex flex-col gap-1">
                  {/* + 1 epizod green badge */}
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Play className="h-3 w-3 shrink-0 fill-current drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                    <span className="font-sans text-[11px] font-extrabold tracking-wide">
                      + 1 epizod
                    </span>
                  </div>

                  {/* Time info */}
                  <div className="flex items-center gap-1.5 text-purple-300/60">
                    <Clock className="h-3 w-3 shrink-0 opacity-80" />
                    <span className="font-sans text-[10px] font-medium leading-none">
                      {item.update_time || '2 kun avval'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

