import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Lock,
  Crown,
  Ticket,
} from 'lucide-react';
import { Anime } from '../types';
import { usePass } from '../context/PassContext';

interface NavbarProps {
  onSearch: (query: string) => void;
  searchQuery: string;
  onOpenAnime: (anime: Anime) => void;
  onOpenSearchModal?: () => void;
  onGoHome?: () => void;
  onOpenPass?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSearch,
  searchQuery,
  onOpenAnime,
  onOpenSearchModal,
  onGoHome,
  onOpenPass,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickResults, setQuickResults] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { hasPass, requestFeature } = usePass();

  useEffect(() => {
    if (!searchQuery.trim()) {
      setQuickResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/animes?search=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setQuickResults(data.animes || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] border-b border-purple-500/20 bg-[#090514]/85 backdrop-blur-xl transition-all duration-300 px-3 py-2 sm:px-6 sm:py-3 select-none">
      <div className="absolute top-0 left-1/2 -z-10 h-48 w-[28rem] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Animem Uz Bot Logo */}
        <button
          onClick={(e) => {
            e.preventDefault();
            if (onGoHome) onGoHome();
          }}
          className="flex items-center gap-2 group shrink-0 text-left bg-transparent border-none p-0 cursor-pointer"
        >
          <div className="flex items-center gap-2 cursor-pointer transition-transform duration-300 active:scale-95">
            {/* Animem Mascot Icon */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 shadow-md shadow-purple-500/20 shrink-0">
              <div className="w-full h-full bg-[#0d071a] rounded-[10px] flex items-center justify-center overflow-hidden">
                <img
                  src="https://api.animem.uz/api/images/1788192062296_ypg1z1j"
                  alt="Animem Uz Bot"
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
            </div>

            <span className="font-['Gasoek_One',sans-serif] text-lg sm:text-2xl lg:text-3xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-purple-300">
              Animem Uz Bot
            </span>
          </div>
        </button>

        {/* Right Area: Search & Pass Banner */}
        <div className="flex items-center gap-2">
          {/* Search Trigger */}
          <button
            onClick={onOpenSearchModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#171226]/90 hover:bg-[#1f1636] text-purple-200 border border-purple-900/40 hover:border-purple-600/50 text-xs font-medium transition-all cursor-pointer"
          >
            <Search className="w-4 h-4 text-purple-300/70" />
            <span className="hidden lg:inline text-purple-300/50">Qidiruv . . .</span>
          </button>
        </div>

      </div>

    </header>
  );
};


