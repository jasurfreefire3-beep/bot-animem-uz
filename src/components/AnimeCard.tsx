import React from 'react';
import { Anime } from '../types';

interface AnimeCardProps {
  anime: Anime;
  onClick: () => void;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col cursor-pointer transition-all duration-300 transform active:scale-95 select-none"
    >
      {/* Card Poster Container */}
      <div className="relative aspect-[3/4.2] w-full overflow-hidden rounded-xl bg-[#140b24] border border-purple-500/20 shadow-md backdrop-blur-md transition-all duration-300 group-hover:border-purple-500/50 group-hover:shadow-lg group-hover:shadow-purple-500/15">
        
        {/* Sphere glow */}
        <div className="absolute -z-10 h-36 w-36 rounded-full bg-purple-400/20 blur-2xl" />

        <img
          src={anime.poster_url}
          alt={anime.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* SUB Badge */}
        {(anime.sub_available || anime.metadata?.is_sub) && (
          <div className="absolute top-1 right-1 z-10">
            <div className="relative overflow-hidden rounded bg-white px-1.5 sm:px-2 pt-[2px] pb-[1px] text-[8px] sm:text-[9px] font-extrabold tracking-wider text-purple-600 shadow-md shadow-purple-950/50 uppercase">
              <span className="relative z-10">SUB</span>
            </div>
          </div>
        )}
      </div>

      {/* Title & Metadata */}
      <div className="flex flex-col gap-0.5 px-0.5 mt-1.5">
        <span className="line-clamp-1 break-all font-sans text-xs font-bold text-white transition-colors duration-200 group-hover:text-purple-300">
          {anime.title}
        </span>
        <span className="line-clamp-1 break-all font-sans text-[10px] sm:text-[11px] font-medium text-purple-300/60">
          {anime.type}
        </span>
      </div>
    </div>
  );
};

