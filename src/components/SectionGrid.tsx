import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Anime } from '../types';
import { AnimeCard } from './AnimeCard';

interface SectionGridProps {
  title: string;
  items: Anime[];
  onOpenAnime: (anime: Anime) => void;
}

export const SectionGrid: React.FC<SectionGridProps> = ({ title, items, onOpenAnime }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!items || items.length === 0) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="my-5 sm:my-7 select-none">
      {/* Section Header with Kawaii style vertical gradient capsule */}
      {title && (
        <div className="flex my-2 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 shadow-[0_0_12px_rgba(168,85,247,0.8)] lg:h-6" />
            <h2 className="text-white text-base font-sans font-bold uppercase lg:text-lg tracking-wide">
              {title}
            </h2>
          </div>

          {/* Navigation Arrows for large displays */}
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
      )}

      {/* Horizontal Carousel with Mask effect matching Kawaii.uz swiper */}
      <div
        ref={scrollRef}
        className="flex items-start gap-3 overflow-x-auto pb-2 scrollbar-none scroll-smooth snap-x"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {items.map((anime) => (
          <div
            key={`${title}-${anime.id}`}
            className="w-28 sm:w-36 md:w-44 lg:w-48 shrink-0 snap-start"
          >
            <AnimeCard
              anime={anime}
              onClick={() => onOpenAnime(anime)}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

