import React from 'react';

interface PassBannerProps {
  onOpenPass: () => void;
}

export const PassBanner: React.FC<PassBannerProps> = ({ onOpenPass }) => {
  return (
    <button
      onClick={onOpenPass}
      className="block w-full text-start my-4 sm:my-6 select-none group"
      type="button"
    >
      <div className="relative flex items-center justify-between overflow-hidden p-3.5 sm:p-4 gap-4 w-full h-20 sm:h-22 bg-[#251806]/40 border border-amber-500/30 rounded-2xl transition-all duration-300 hover:border-amber-400/60 hover:bg-[#332007]/50 shadow-lg shadow-amber-950/30 cursor-pointer">
        {/* Glow effect */}
        <div className="absolute left-0 -top-10 h-52 w-52 rounded-full bg-amber-500/20 blur-3xl transition-all duration-300 group-hover:left-32 group-hover:top-0" />
        
        {/* Left Icon + Text */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="shrink-0 text-amber-400">
            <svg className="h-8 w-8 sm:h-10 sm:w-10 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 9.5V6.75A2.755 2.755 0 0 0 19.25 4H4.75A2.755 2.755 0 0 0 2 6.75V9.5a2.5 2.5 0 0 1 0 5v2.75A2.755 2.755 0 0 0 4.75 20h14.5A2.755 2.755 0 0 0 22 17.25V14.5a2.5 2.5 0 0 1 0-5Zm-6 9h-1.5v-2H16v2Zm0-3.5h-1.5v-2H16v2Zm0-3.5h-1.5v-2H16v2ZM16 8h-1.5V6H16v2Z" />
            </svg>
          </div>
          <div>
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-lg sm:text-xl lg:text-2xl bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
              Animem Pass
            </h2>
            <p className="text-[10px] sm:text-xs font-medium text-white/90 line-clamp-1">
              Barcha premium imkoniyatlar bir joyda! Hoziroq tanishib chiqing.
            </p>
          </div>
        </div>

        {/* Right "Batafsil" Button */}
        <div className="relative z-10 shrink-0 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold text-xs sm:text-sm group-hover:bg-amber-500/40 transition-colors">
          Batafsil
        </div>
      </div>
    </button>
  );
};

