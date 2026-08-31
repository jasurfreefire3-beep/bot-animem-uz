import React from 'react';
import { Send, Instagram } from 'lucide-react';

interface FooterProps {
  onOpenPass: () => void;
  onOpenBotInfo: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPass, onOpenBotInfo }) => {
  return (
    <footer className="mt-16 border-t border-purple-950/50 bg-[#090514] text-purple-200/80 pt-12 pb-8 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 3-Column Section (Exact Desktop Layout matching screenshot) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 pb-12">
          
          {/* Column 1: Brand & Description */}
          <div className="flex flex-col items-start text-left">
            <div className="flex items-center gap-2 mb-3">
              {/* Cute Mascot Icon */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 shadow-md shadow-purple-500/20 shrink-0">
                  <div className="w-full h-full bg-[#0d071a] rounded-[10px] flex items-center justify-center overflow-hidden">
                    <img
                      src="https://api.animem.uz/api/images/1788192062296_ypg1z1j"
                      alt="Animem Uz Bot"
                      className="w-full h-full object-contain p-0.5"
                    />
                  </div>
                </div>
                <span className="font-['Gasoek_One',sans-serif] text-2xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-300">
                  Animem Uz Bot
                </span>
              </div>
            </div>

            <p className="text-xs lg:text-sm text-purple-300/70 leading-relaxed max-w-sm">
              O'zbekistondagi eng sifatli va zamonaviy anime platformasi. Biz bilan sevimli animelaringizni o'zbek tilida, yuqori sifatda tomosha qiling.
            </p>
          </div>

          {/* Column 2: Navigatsiya */}
          <div className="flex flex-col items-start text-left md:pl-8 lg:pl-16">
            <h4 className="text-xs font-black uppercase tracking-wider text-white font-['Outfit'] mb-3.5">
              NAVIGATSIYA
            </h4>
            <ul className="flex flex-col space-y-2.5 text-xs lg:text-sm text-purple-300/80">
              <li>
                <a href="#" className="hover:text-white transition-colors duration-200">
                  Asosiy
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenPass}
                  className="hover:text-white transition-colors duration-200 text-left"
                >
                  Animem Pass
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenBotInfo}
                  className="hover:text-white transition-colors duration-200 text-left"
                >
                  Reklama
                </button>
              </li>

            </ul>
          </div>

          {/* Column 3: Bizga Qo'shiling */}
          <div className="flex flex-col items-start text-left">
            <h4 className="text-xs font-black uppercase tracking-wider text-white font-['Outfit'] mb-3.5">
              BIZGA QO'SHILING
            </h4>

            {/* Social Icon Buttons */}
            <div className="flex flex-col gap-2.5">
              <a
                href="https://t.me/animemuz_bot_org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#140b24] hover:bg-purple-900/60 border border-purple-800/40 text-purple-300 hover:text-white transition-all shadow-md group"
              >
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.25.38-.51 1.08-.78 4.23-1.84 7.05-3.05 8.46-3.63 4.03-1.68 4.87-1.97 5.41-1.98.12 0 .39.03.56.17.15.12.19.28.21.4-.01.06.01.24-.03.49z"/>
                  </svg>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white">Telegram Bot</span>
                  <span className="text-[10px] text-purple-300/70">@animemuz_bot_org</span>
                </div>
              </a>

              <a
                href="https://instagram.com/animem_uz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#140b24] hover:bg-purple-900/60 border border-purple-800/40 text-purple-300 hover:text-white transition-all shadow-md group"
              >
                <div className="w-7 h-7 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                  <Instagram className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white">Instagram</span>
                  <span className="text-[10px] text-purple-300/70">@animem_uz</span>
                </div>
              </a>
            </div>

            <p className="text-xs text-purple-300/70 leading-relaxed max-w-xs">
              Hamjamiyatimizga qo'shiling va yangiliklardan birinchi bo'lib xabardor bo'ling.
            </p>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Status Pill */}
        <div className="pt-6 border-t border-purple-950/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-purple-400/70 font-medium">
            © 2026 <strong className="text-white font-semibold">Animem.uz</strong> — Barcha huquqlar himoyalangan
          </p>

          {/* Glowing Green Status Pill matching screenshot */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0d1e1c]/80 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wide">BIZDAN UZOQLASHMANG</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

