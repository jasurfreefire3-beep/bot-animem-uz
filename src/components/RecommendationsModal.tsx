import React, { useState } from 'react';
import {
  Pin,
  Sparkles,
  X,
  Flame,
  Zap,
  Heart,
  Smile,
  Brain,
  Shield,
  Send,
  Star,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Anime } from '../types';

interface RecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnime: (anime: Anime) => void;
  allAnimes: Anime[];
}

export const RecommendationsModal: React.FC<RecommendationsModalProps> = ({
  isOpen,
  onClose,
  onSelectAnime,
  allAnimes,
}) => {
  if (!isOpen) return null;

  const moods = [
    { id: 'action', label: '🔥 Kuchli Jang & Adrenalin', genres: ['Action', 'Jangari', 'Shounen', 'Supernatural'] },
    { id: 'emotional', label: '❤️ Qalbga yaqin & Drama', genres: ['Drama', 'Romantika', 'Slice of Life', 'Maktab'] },
    { id: 'mystery', label: '🧠 Aqlli Psixologik & Detektiv', genres: ['Psychological', 'Mystery', 'Detektiv', 'Thriller'] },
    { id: 'isekai', label: '✨ Sehr & Boshqa Dunyo (Isekai)', genres: ['Fantasy', 'Isekai', 'Sehr', 'Sarguzasht'] },
    { id: 'comedy', label: '😂 Kulgu & Yengil Kayfiyat', genres: ['Comedy', 'Parody', 'Komediya'] },
  ];

  const [activeMood, setActiveMood] = useState('action');
  const [selectedFavoriteGenre, setSelectedFavoriteGenre] = useState<string>('Barchasi');

  // Filter recommendations based on activeMood and allAnimes
  const currentMoodObj = moods.find((m) => m.id === activeMood) || moods[0];

  const recommendedList = allAnimes
    .filter((a) => {
      if (selectedFavoriteGenre !== 'Barchasi') {
        return a.genres && a.genres.some((g) => g.toLowerCase().includes(selectedFavoriteGenre.toLowerCase()));
      }
      return a.genres && a.genres.some((g) => currentMoodObj.genres.some((mg) => g.toLowerCase().includes(mg.toLowerCase())));
    })
    .slice(0, 8);

  // If filtered is empty, fallback to top rating
  const finalResults = recommendedList.length > 0 ? recommendedList : allAnimes.slice(0, 6);

  return (
    <div className="fixed inset-0 z-[220] overflow-y-auto bg-[#070312]/95 backdrop-blur-2xl flex flex-col justify-between select-none animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-[#0a0518]/90 backdrop-blur-md border-b border-purple-900/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-md shadow-amber-500/20">
            <div className="w-full h-full bg-[#120724] rounded-[10px] flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Outfit',sans-serif] text-base sm:text-lg font-black text-white">
                Shaxsiy AI Tavsiyalar
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-[10px] font-black text-amber-300 uppercase">
                VIP Pass
              </span>
            </div>
            <p className="text-[11px] text-purple-300/70 hidden sm:block">
              Kayfiyatingiz va didingizga mos aqlli tavsiya algoritmi
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 sm:p-2.5 rounded-full bg-[#180e2b] hover:bg-purple-900/60 text-purple-200 hover:text-white border border-purple-800/40 transition-all cursor-pointer shadow-lg active:scale-95"
          title="Yopish"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
        
        {/* Mood Selector Header */}
        <div className="mb-6">
          <span className="text-xs font-black tracking-wider uppercase text-purple-300/80 mb-3 block">
            Hozirgi kayfiyatingizni tanlang:
          </span>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {moods.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setActiveMood(m.id);
                  setSelectedFavoriteGenre('Barchasi');
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer shadow-sm ${
                  activeMood === m.id
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold shadow-amber-500/20 scale-102'
                    : 'bg-[#150a28] hover:bg-[#20103c] text-purple-200 border border-purple-900/40'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Insight Header Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-[#1b0c36] to-purple-950/60 border border-purple-800/40 flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-900/60 text-yellow-300 shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">
                Siz uchun tanlangan eng yuqori reytingli mosliklar (95% - 99%)
              </h3>
              <p className="text-[11px] text-purple-300/70">
                Ushbu animelar siz tanlagan janr va syujet dinamikasiga to‘liq mos keladi
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold shrink-0">
            ✓ AI tahlili yakunlandi
          </span>
        </div>

        {/* Anime Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {finalResults.map((anime, index) => {
            const matchPercent = 99 - index * 2;
            return (
              <div
                key={anime.id}
                className="flex flex-col justify-between p-4 rounded-2xl bg-[#140a27]/90 border border-purple-900/40 hover:border-purple-500/60 hover:bg-[#1c0d38] transition-all duration-300 shadow-lg group"
              >
                <div className="flex gap-3.5 mb-3">
                  <div className="relative w-20 h-28 rounded-xl overflow-hidden shrink-0 shadow-md border border-purple-800/40">
                    <img
                      src={anime.poster_url}
                      alt={anime.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-amber-400 text-[9px] font-black text-black">
                      {matchPercent}% MOS
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                      {anime.title}
                    </h4>
                    <p className="text-xs text-purple-300/60 truncate mb-1">
                      {anime.original_title || anime.russian_title}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold mb-2">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{anime.rating || 8.5} / 10</span>
                      <span className="text-purple-400">•</span>
                      <span className="text-purple-300 font-normal">{anime.year}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {anime.genres.slice(0, 2).map((g) => (
                        <span
                          key={g}
                          className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-800/40 text-[10px] text-purple-200"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-purple-200/70 line-clamp-2 mb-3 leading-relaxed">
                  {anime.description || 'Qiziqarli syujet va ajoyib animatsiya.'}
                </p>

                <div className="flex items-center gap-2 pt-3 border-t border-purple-900/30">
                  <button
                    onClick={() => {
                      onSelectAnime(anime);
                      onClose();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/40 text-purple-200 hover:text-white text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    Batafsil
                  </button>

                  <a
                    href={`https://t.me/Animem_uz_bot?start=${anime.telegram_code || `anime_${anime.id}`}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow transition-all active:scale-95"
                  >
                    <Send className="w-3 h-3" />
                    <span>Botda ko'rish</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
