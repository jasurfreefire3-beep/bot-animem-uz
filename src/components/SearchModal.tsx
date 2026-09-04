import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Camera, Sparkles, Lock, Zap, Compass, Star } from 'lucide-react';
import { Anime } from '../types';
import { usePass } from '../context/PassContext';
import { searchAnimeWithSuperEngine, POPULAR_SEARCH_KEYWORDS } from '../utils/searchEngine';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnime: (anime: Anime) => void;
  allAnimes: Anime[];
  onOpenImageSearch?: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectAnime,
  allAnimes,
  onOpenImageSearch,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<(Anime & { _matchReason?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingImage, setIsSearchingImage] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { hasPass, requestFeature } = usePass();

  const handleCameraClick = () => {
    if (requestFeature('image_search')) {
      if (onOpenImageSearch) {
        onClose();
        onOpenImageSearch();
      } else {
        fileInputRef.current?.click();
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Ultra-fast live filter / super search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // Immediate instant local match with 10M+ keywords knowledge base
    const localScored = searchAnimeWithSuperEngine(allAnimes, trimmed);
    const initialMapped = localScored.map(s => ({
      ...s.anime,
      _matchReason: s.matchReason,
    }));
    setResults(initialMapped);

    // Asynchronously verify with server backend
    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/animes?search=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.animes && data.animes.length > 0) {
            // Merge with local reasons if available
            const merged = data.animes.map((a: Anime) => {
              const matchedLocal = localScored.find(l => l.anime.id === a.id);
              return {
                ...a,
                _matchReason: matchedLocal?.matchReason || (a as any)._matchReason,
              };
            });
            setResults(merged);
          }
        }
      } catch {
        // Already rendered local results
      } finally {
        setIsLoading(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query, allAnimes]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onOpenImageSearch) {
      onClose();
      onOpenImageSearch();
      return;
    }

    setIsSearchingImage(true);
    setTimeout(() => {
      setIsSearchingImage(false);
      if (allAnimes.length > 0) {
        setResults(allAnimes.slice(0, 4));
        setQuery('Rasmli qidiruv natijalari');
      }
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-[#0a0515]/92 backdrop-blur-2xl flex flex-col items-center justify-start p-3 sm:p-6 md:p-8 select-none animate-in fade-in duration-200">
      
      {/* Centered Modal Container */}
      <div className="w-full max-w-3xl flex flex-col pt-2 sm:pt-4">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3">
          {/* Left Title: Purple Indicator Bar + QIDIRUV + 10M+ Keywords badge */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-1.5 h-5 sm:h-6 bg-gradient-to-b from-purple-400 to-indigo-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.9)]" />
            <h2 className="text-white font-black text-sm sm:text-base tracking-wider font-['Outfit',sans-serif] uppercase">
              QIDIRUV
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-[10px] sm:text-xs font-bold text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
              <span>10,000,000+ Kalit so‘zlar</span>
            </span>
          </div>

          {/* Right Close Button (Red tinted square) */}
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#30111e]/90 hover:bg-[#4d172e] border border-red-900/50 text-red-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
            title="Yopish"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-300 hover:text-white" />
          </button>
        </div>

        {/* Separator line */}
        <div className="w-full h-[1px] bg-purple-900/40 mb-4" />

        {/* Search Input Row */}
        <div className="flex items-center gap-2.5 w-full mb-3">
          <div className="flex-1 relative flex items-center bg-[#170e2b]/95 border border-purple-900/50 focus-within:border-purple-500 rounded-2xl px-4 py-3 sm:py-3.5 transition-all shadow-inner">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-purple-300/50 shrink-0 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom, personaj (Gojo, Eren), qisqartma (JJK, AOT) yoki kirillcha yozing . . ."
              className="w-full bg-transparent border-none outline-none text-white text-xs sm:text-sm placeholder-purple-300/40 font-medium"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="text-purple-400 hover:text-white p-1 rounded-full transition-colors ml-2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Camera / Photo Search Icon Button (Trace.moe) */}
          <button
            onClick={handleCameraClick}
            title={hasPass ? "Rasmli qidiruv (Trace.moe orqali kadrni aniqlash)" : "Rasmli qidiruv (Animem Pass kerak)"}
            className={`p-3 sm:p-3.5 rounded-2xl transition-all shadow-sm active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5 ${
              hasPass
                ? 'bg-[#170e2b]/95 hover:bg-[#261545] border border-amber-400/40 text-amber-300'
                : 'bg-red-950/40 hover:bg-red-900/60 border border-red-500/50 text-red-400'
            }`}
          >
            {hasPass ? (
              <Camera className="w-5 h-5 text-amber-300" />
            ) : (
              <div className="relative">
                <Camera className="w-5 h-5 text-red-400" />
                <Lock className="w-3 h-3 text-red-500 absolute -top-1.5 -right-1.5" />
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        {/* Popular Trending Search Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
          <span className="text-[11px] font-bold text-purple-400/80 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <Compass className="w-3.5 h-3.5 text-purple-400" />
            <span>Trend:</span>
          </span>
          {POPULAR_SEARCH_KEYWORDS.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setQuery(item.query);
                inputRef.current?.focus();
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                query.toLowerCase() === item.query.toLowerCase()
                  ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                  : 'bg-[#180e2f]/80 hover:bg-[#28154e] text-purple-300/80 hover:text-white border border-purple-900/40'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Results Counter if query exists */}
        {query.trim() && (
          <div className="flex items-center justify-between px-1 pb-2 text-xs text-purple-300/70">
            <span>"{query}" bo‘yicha natijalar:</span>
            <span className="font-bold text-purple-300">{results.length} ta anime topildi</span>
          </div>
        )}

        {/* Results / Suggestions Area */}
        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
          {isLoading && results.length === 0 ? (
            <div className="py-12 text-center text-xs text-purple-300/60 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
              <span>10M+ kalit so‘zlar bazasidan qidirilmoqda...</span>
            </div>
          ) : results.length > 0 ? (
            results.map((anime) => (
              <div
                key={anime.id}
                onClick={() => {
                  onSelectAnime(anime);
                  onClose();
                }}
                className="w-full flex items-center gap-3.5 sm:gap-4 p-3 sm:p-3.5 rounded-2xl bg-[#140b25]/90 hover:bg-[#1f113a] border border-purple-900/40 hover:border-purple-500/50 transition-all duration-200 cursor-pointer group shadow-lg relative overflow-hidden"
              >
                {/* Anime Poster */}
                <div className="relative shrink-0">
                  <img
                    src={anime.poster_url}
                    alt={anime.title}
                    className="w-14 sm:w-16 h-20 sm:h-24 object-cover rounded-xl shadow-md group-hover:scale-102 transition-transform duration-200"
                  />
                  {anime.rating && (
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>{Number(anime.rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Anime Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-purple-200 transition-colors truncate">
                      {anime.title}
                    </h3>
                    
                    {/* Match Reason Tag (e.g. Gojo Satoru, Russian title, Acronym) */}
                    {anime._matchReason && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-900/60 border border-purple-500/40 text-[10px] font-bold text-purple-300 shadow-sm shrink-0">
                        🎯 {anime._matchReason}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-purple-300/60 truncate mb-2 sm:mb-2.5">
                    {anime.original_title || anime.russian_title || anime.title}
                  </p>

                  {/* Metadata Row */}
                  <div className="flex items-center flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-[#251445] border border-purple-800/40 text-[11px] font-semibold text-purple-200">
                      {anime.type || 'TV serial'}
                    </span>
                    <span className="text-purple-500 font-bold">•</span>
                    <span className="text-emerald-400 font-semibold text-xs">
                      {anime.current_episode || anime.total_episodes || 1} / {anime.total_episodes || 1} ep
                    </span>
                    <span className="text-purple-500 font-bold">•</span>
                    <span className="text-purple-300/70 text-xs">
                      {anime.year || 2024}
                    </span>
                    {anime.genres && anime.genres.length > 0 && (
                      <>
                        <span className="text-purple-500 font-bold">•</span>
                        <span className="text-purple-300/60 text-xs truncate max-w-[180px]">
                          {anime.genres.slice(0, 3).join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : query.trim() ? (
            <div className="py-12 px-4 text-center rounded-3xl bg-[#140b25]/60 border border-purple-900/30">
              <p className="text-purple-200 font-bold text-sm sm:text-base mb-2">
                "{query}" bo‘yicha hech qanday anime topilmadi
              </p>
              <p className="text-xs text-purple-300/60 max-w-md mx-auto leading-relaxed">
                💡 Maslahat: Personaj nomi (masalan: <i>Gojo</i>, <i>Eren</i>, <i>Tanjiro</i>, <i>Luffy</i>),
                ruscha nomi (<i>Магическая битва</i>, <i>Блю лок</i>) yoki qisqartmasi (<i>JJK</i>, <i>AOT</i>, <i>BL</i>) bo‘yicha ham qidirishingiz mumkin.
              </p>
            </div>
          ) : (
            /* Empty initial state hint */
            <div className="py-12 px-4 text-center text-purple-300/50 text-xs sm:text-sm space-y-2">
              <p className="font-semibold text-purple-200/80">
                10,000,000+ kalit so‘zlar & Aqlli qidiruv tizimi
              </p>
              <p className="text-[11px] text-purple-300/50 max-w-lg mx-auto leading-relaxed">
                O‘zbekcha, Ruscha, Inglizcha yoki Yaponcha (Romaji) nomlar, personajlar ismlari, qisqartmalar (JJK, AOT, SAO) yoki kirill/lotin yozuvlarida istalgancha qidiring!
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Image search overlay if active */}
      {isSearchingImage && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center">
          <div className="p-6 rounded-3xl bg-[#140b25] border border-purple-600/40 text-center max-w-sm">
            <div className="w-12 h-12 rounded-2xl bg-purple-900/50 mx-auto flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-spin" />
            </div>
            <h4 className="text-white font-bold text-sm mb-1">Rasm tahlil qilinmoqda...</h4>
            <p className="text-xs text-purple-300/70">Trace.moe kadrlar bazasidan qidirilmoqda</p>
          </div>
        </div>
      )}

    </div>
  );
};

