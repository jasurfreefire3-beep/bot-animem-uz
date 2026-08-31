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
            <div className="flex items-center gap-2.5 mb-3">
              <a
                href="https://t.me/AnimemUzBot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-[#140b24] hover:bg-purple-900/60 border border-purple-800/40 flex items-center justify-center text-purple-300 hover:text-white transition-all shadow-md active:scale-95"
                title="Telegram"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-[#140b24] hover:bg-purple-900/60 border border-purple-800/40 flex items-center justify-center text-purple-300 hover:text-white transition-all shadow-md active:scale-95"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
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

