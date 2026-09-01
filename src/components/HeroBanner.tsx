import React from 'react';
import { Search } from 'lucide-react';

interface HeroBannerProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  onExploreClick: () => void;
  onOpenSearchModal?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  searchQuery,
  onSearch,
  onOpenSearchModal,
}) => {
  const mascotUrl = "https://pub-a106e00b56aa4c98ade06693352e0672.r2.dev/download%20(1).png";

  return (
    <div className="relative flex w-full h-72 sm:h-80 lg:h-96 justify-between items-end select-none overflow-hidden rounded-3xl border border-purple-500/20 bg-[#120a22]/70 backdrop-blur-xl shadow-2xl shadow-purple-950/50 my-4 sm:my-6">
      
      {/* Background Banner texture */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl">
        <div className="relative h-full w-full">
          <img
            alt="Banner background"
            draggable={false}
            className="w-full h-full object-cover opacity-30 transition-transform duration-700 hover:scale-105"
            src="https://bot.kawaii.uz/_next/static/media/banner.049t1s~7q66ik.webp"
            onError={(e: any) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0718] via-[#120a22]/80 to-transparent" />
        </div>
      </div>

      <div className="relative z-10 flex h-full w-full items-end justify-between p-4 sm:p-6 lg:p-10">
        
        {/* Left Side: Typography and Search */}
        <div className="flex flex-col w-48 sm:w-64 lg:w-96 justify-end gap-2 sm:gap-3 lg:gap-5 pb-1">
          <div className="flex flex-col gap-1 sm:gap-2">
            <div className="flex items-center gap-3">
              <h1 className="font-['Gasoek_One',sans-serif] text-4xl sm:text-5xl lg:text-[76px] lg:leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-300 drop-shadow-[0_0_25px_rgba(168,85,247,0.35)]">
                Animem Uz Bot
              </h1>
            </div>
            <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[9px] sm:text-xs lg:text-sm font-extrabold break-words tracking-widest text-white uppercase">
              O'zbekistondagi eng yirik Anime platformasi
            </p>
          </div>

          {/* Search box styled like Kawaii */}
          <div className="flex items-center w-full">
            <div
              onClick={onOpenSearchModal}
              className="group relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-xl border border-white/20 bg-white/10 px-3 py-2 lg:px-5 lg:py-3.5 backdrop-blur-md transition-all duration-300 hover:border-purple-400/50 hover:bg-white/15 hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer"
            >
              <div className="flex items-center gap-2.5 w-full cursor-pointer">
                <Search className="h-4 w-4 lg:h-5 lg:w-5 text-white shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <input
                  type="text"
                  id="hero-search-input"
                  readOnly
                  value={searchQuery}
                  onClick={onOpenSearchModal}
                  placeholder="Qidiruv . . ."
                  className="bg-transparent border-none outline-none font-sans text-xs lg:text-sm text-white placeholder-purple-200/50 w-full cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Girl Mascot standing on banner bottom */}
        <div className="absolute bottom-0 right-1 sm:right-4 lg:right-8 z-0 h-[88%] sm:h-[92%] lg:h-[96%] w-44 sm:w-64 lg:w-[380px] pointer-events-none drop-shadow-[0_10px_25px_rgba(0,0,0,0.7)] flex items-end justify-end">
          <img
            alt="Kawaii anime mascot"
            draggable={false}
            src={mascotUrl}
            className="w-full h-full object-contain object-right-bottom transition-transform duration-500 hover:scale-102"
            onError={(e: any) => {
              // Fallback to announce board if custom image url fails
              e.target.onerror = null;
              e.target.src = "https://bot.kawaii.uz/_next/static/media/announce-board.0zjfp_m63~4~s.webp";
            }}
          />
        </div>

      </div>

      {/* Bottom glowing line */}
      <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
    </div>
  );
};

