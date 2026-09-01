import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Ticket,
  Star,
  Clock,
  ShieldAlert,
  Lock,
  ChevronDown,
  ChevronUp,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { Anime } from '../types';
import { usePass } from '../context/PassContext';
import { TelegramIcon } from './icons/TelegramIcon';

interface AnimeDetailPageProps {
  anime: Anime;
  onBack: () => void;
  onOpenPass: () => void;
  onOpenTelegramModal: (anime: Anime) => void;
  onOpenChronology: () => void;
  onOpenRecommendations: () => void;
  onOpenImageSearch: () => void;
}

export const AnimeDetailPage: React.FC<AnimeDetailPageProps> = ({
  anime,
  onBack,
  onOpenPass,
  onOpenTelegramModal,
  onOpenChronology,
  onOpenRecommendations,
  onOpenImageSearch,
}) => {
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const { hasPass, requestFeature } = usePass();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Dynamic SEO Title & Meta Description matching user's Google snippet screenshot
    const seoTitle = `${anime.title} - O'zbek tilida ko'rish`;
    document.title = seoTitle;

    const episodesDisplayStr = `${anime.current_episode || anime.total_episodes || 1} / ${anime.total_episodes || 1}`;
    const altTitle = [anime.title, anime.original_title, anime.russian_title].filter(Boolean).join(' • ');
    const metaDescription = `${anime.title}. ${altTitle}. Anime poster. Tomosha qilish. Epizodlar ${episodesDisplayStr}. Yil ${anime.year || 2024}. Tip ${anime.type || 'TV serial'}. Ko'rishlar ${anime.views_count || 1484}. Animem Pass. Barcha premium imkoniyatlar ...`;

    let descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.setAttribute('content', metaDescription);
    }

    // Dynamic JSON-LD script for rich snippets
    const scriptId = 'anime-jsonld-schema';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": anime.type === 'Film' ? "Movie" : "TVSeries",
      "name": anime.title,
      "alternateName": [anime.title, anime.original_title, anime.russian_title].filter(Boolean),
      "description": metaDescription,
      "image": anime.poster_url,
      "url": `https://bot.animem.uz/anime/${anime.id}`,
      "genre": anime.genres || ["Anime"],
      "datePublished": String(anime.year || 2024),
      "numberOfEpisodes": anime.total_episodes || 12,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": Number(anime.rating || 8.2).toFixed(1),
        "bestRating": "10",
        "worstRating": "1",
        "ratingCount": anime.views_count && anime.views_count > 500 ? anime.views_count * 150 + 54000 : 984838
      }
    });

    // Increment view count in background
    fetch(`/api/animes/${anime.id}`).catch(() => {});

    return () => {
      document.title = "Animem Uz Bot — O'zbekistondagi eng yirik anime platformasi";
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [anime]);

  const handleWatchClick = () => {
    onOpenTelegramModal(anime);
  };

  const handleChronologyClick = () => {
    if (requestFeature('chronology')) {
      onOpenChronology();
    }
  };

  const handleImageSearchClick = () => {
    if (requestFeature('image_search')) {
      onOpenImageSearch();
    }
  };

  const handleRecommendationsClick = () => {
    if (requestFeature('recommendations')) {
      onOpenRecommendations();
    }
  };

  const handleEpisodeClick = (epNum: number) => {
    if (epNum > (anime.current_episode || 0)) {
      alert("Bu epizod hali qo'yilmagan");
      return;
    }
    setSelectedEpisode(epNum);
  };

  const episodesDisplay =
    anime.episodes ||
    `${anime.current_episode || anime.total_episodes || 1} / ${
      anime.total_episodes || 1
    }`;

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 select-none animate-in fade-in duration-300">
      
      {/* Back button */}
      <div className="mb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#140b25] hover:bg-purple-900/50 border border-purple-900/40 text-purple-200 hover:text-white text-xs font-bold transition-all shadow cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Bosh sahifaga qaytish</span>
        </button>
      </div>

      {/* Main Top Hero Section matching Screenshot */}
      <div className="relative rounded-3xl overflow-hidden bg-[#100722] border border-purple-900/40 shadow-2xl p-6 sm:p-10 text-center flex flex-col items-center justify-center min-h-[460px] sm:min-h-[520px] mb-6 sm:mb-8">
        
        {/* Background Blurred Banner Image */}
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-xl scale-110 opacity-30 pointer-events-none"
          style={{ backgroundImage: `url(${anime.banner_url || anime.poster_url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0518]/60 via-[#100722]/80 to-[#100722] pointer-events-none" />

        {/* Foreground Content */}
        <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
          
          {/* Main Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight font-sans drop-shadow-md mb-2">
            {anime.title}
          </h1>

          {/* Subtitles: Original & Russian */}
          <p className="text-xs sm:text-sm text-purple-300/80 font-medium mb-6">
            {anime.original_title}{' '}
            {anime.russian_title && (
              <>
                <span className="text-purple-500 font-bold mx-1.5">•</span>
                <span>{anime.russian_title}</span>
              </>
            )}
          </p>

          {/* Poster Image */}
          <div className="relative w-44 sm:w-52 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-purple-500/30 mb-4 group">
            <img
              src={anime.poster_url}
              alt={anime.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {anime.sub_available && (
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-cyan-500 text-[10px] font-black text-white shadow uppercase">
                SUB
              </span>
            )}
          </div>

          {/* "TOMOSHA QILISH" Button */}
          <button
            onClick={handleWatchClick}
            className="w-44 sm:w-52 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:via-indigo-500 hover:to-pink-500 text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase shadow-lg shadow-purple-600/40 border border-purple-300/30 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mb-6"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>TOMOSHA QILISH</span>
          </button>

          {/* Stats Bar Pill with 4 Columns */}
          <div className="w-full max-w-lg bg-[#201538]/80 backdrop-blur-md border border-purple-800/40 rounded-2xl px-3 sm:px-6 py-3 grid grid-cols-4 gap-2 text-center shadow-lg">
            
            {/* Column 1: EPIZODLAR */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] sm:text-[10px] font-bold text-purple-300/60 uppercase tracking-wider">
                EPIZODLAR
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-white mt-0.5">
                {episodesDisplay}
              </span>
            </div>

            {/* Column 2: YIL */}
            <div className="flex flex-col items-center border-l border-purple-800/40">
              <span className="text-[9px] sm:text-[10px] font-bold text-purple-300/60 uppercase tracking-wider">
                YIL
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-white mt-0.5">
                {anime.year || 2024}
              </span>
            </div>

            {/* Column 3: TIP */}
            <div className="flex flex-col items-center border-l border-purple-800/40">
              <span className="text-[9px] sm:text-[10px] font-bold text-purple-300/60 uppercase tracking-wider">
                TIP
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-white mt-0.5 truncate max-w-full px-1">
                {anime.type || 'TV serial'}
              </span>
            </div>

            {/* Column 4: KO'RISHLAR */}
            <div className="flex flex-col items-center border-l border-purple-800/40">
              <span className="text-[9px] sm:text-[10px] font-bold text-purple-300/60 uppercase tracking-wider">
                KO'RISHLAR
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-white mt-0.5">
                {anime.views_count > 1000
                  ? `${(anime.views_count / 1000).toFixed(1)}k`
                  : anime.views_count || 2}
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* Gold Animem Pass Banner matching Screenshot */}
      <div className="mb-6 flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#5a3b09] via-[#754f0f] to-[#452b05] border border-amber-500/40 text-amber-100 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
            <Ticket className="w-5 h-5 fill-amber-400 text-amber-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black uppercase tracking-wider font-sans text-amber-200">
                Animem Pass
              </span>
              {hasPass && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                  ✓ Faol
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-amber-100/80 font-medium line-clamp-1">
              {hasPass
                ? 'Barcha premium imkoniyatlar (Tezkor yuklash, Maxsus kontent) siz uchun ochiq!'
                : 'Barcha premium imkoniyatlar bir joyda! Hoziroq tanishib chiqing.'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenPass}
          className="px-4 py-2 rounded-xl bg-[#2e1d05] hover:bg-[#3f2707] text-amber-200 hover:text-amber-100 text-xs font-extrabold border border-amber-500/40 shrink-0 transition-colors shadow cursor-pointer active:scale-95"
        >
          {hasPass ? 'Status' : 'Batafsil'}
        </button>
      </div>

      {/* Section 1: QO'SHIMCHA MA'LUMOTLAR */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-3.5">
          <div className="w-1.5 h-4 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
          <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-white font-sans">
            QO'SHIMCHA MA'LUMOTLAR
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Status Pill */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#092419]/90 border border-emerald-500/30 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {anime.status || 'Tugallangan'}
          </span>

          {/* Rating Pill */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#140b25] border border-purple-900/50 text-amber-300 font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {anime.rating || 7.8} / ? (MAL)
          </span>

          {/* Duration Pill */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#140b25] border border-purple-900/50 text-purple-200 font-medium">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            {anime.duration || '14 daq.'}
          </span>

          {/* Age Rating Pill */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#140b25] border border-purple-900/50 text-rose-300 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            {anime.age_rating || '13 yoshdan kattalar uchun (PG-13)'}
          </span>
        </div>
      </div>

      {/* Section 2: JANRLAR */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-3.5">
          <div className="w-1.5 h-4 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
          <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-white font-sans">
            JANRLAR
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {anime.genres && anime.genres.length > 0 ? (
            anime.genres.map((genre) => (
              <span
                key={genre}
                className="px-3.5 py-1.5 rounded-xl bg-[#170e2b] hover:bg-purple-900/50 text-purple-200 text-xs font-semibold border border-purple-900/40 transition-colors"
              >
                {genre}
              </span>
            ))
          ) : (
            <span className="px-3.5 py-1.5 rounded-xl bg-[#170e2b] text-purple-200 text-xs font-semibold border border-purple-900/40">
              Anime
            </span>
          )}
        </div>
      </div>

      {/* Section: EPIZODLAR */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-white font-sans">
              EPIZODLAR
            </h3>
          </div>
          <span className="text-[10px] sm:text-xs text-purple-400 font-bold">
            {anime.current_episode} / {anime.total_episodes} qismlar
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {Array.from({ length: anime.total_episodes || 12 }).map((_, idx) => {
            const epNum = idx + 1;
            const isAvailable = epNum <= (anime.current_episode || 0);
            const isSelected = selectedEpisode === epNum;

            return (
              <button
                key={epNum}
                onClick={() => handleEpisodeClick(epNum)}
                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                    : 'bg-[#150f26] text-purple-300/70 border-purple-900/30 hover:border-purple-600/50 hover:text-white'
                } ${!isAvailable && 'opacity-60'}`}
              >
                {epNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 3: PREMIUM FEATURES */}
      <div className="mb-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-4 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-white font-sans">
              XRONOLOGIYA
            </h3>
          </div>
          <button 
            onClick={handleChronologyClick}
            className="flex items-center gap-2 p-3 sm:p-4 rounded-xl bg-purple-900/10 border border-purple-500/20 text-purple-200 hover:bg-purple-900/20 transition-all text-left group"
          >
            <span className="text-[11px] sm:text-xs flex-1">Ushbu animening xronologiyasi.</span>
            {!hasPass && <Lock className="w-3.5 h-3.5 text-yellow-500 group-hover:scale-110 transition-transform" />}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-4 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-white font-sans">
              RASM ORQALI QIDIRUV
            </h3>
          </div>
          <button 
            onClick={handleImageSearchClick}
            className="flex items-center gap-2 p-3 sm:p-4 rounded-xl bg-purple-900/10 border border-purple-500/20 text-purple-200 hover:bg-purple-900/20 transition-all text-left group"
          >
            <span className="text-[11px] sm:text-xs flex-1">Skrinshot orqali qidirish.</span>
            {!hasPass && <Lock className="w-3.5 h-3.5 text-yellow-500 group-hover:scale-110 transition-transform" />}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-4 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-white font-sans">
              TAVSIYALAR
            </h3>
          </div>
          <button 
            onClick={handleRecommendationsClick}
            className="flex items-center gap-2 p-3 sm:p-4 rounded-xl bg-purple-900/10 border border-purple-500/20 text-purple-200 hover:bg-purple-900/20 transition-all text-left group"
          >
            <span className="text-[11px] sm:text-xs flex-1">O'xshash animelar.</span>
            {!hasPass && <Lock className="w-3.5 h-3.5 text-yellow-500 group-hover:scale-110 transition-transform" />}
          </button>
        </div>
      </div>

          {/* Section 4: TAVSIF */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3.5">
          <div className="w-1.5 h-4 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
          <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-white font-sans">
            TAVSIF
          </h3>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#120822]/90 border border-purple-900/40 text-xs sm:text-sm text-purple-200/90 leading-relaxed shadow-md">
          <p className={isDescExpanded ? '' : 'line-clamp-4'}>
            {anime.description ||
              "Ushbu anime haqida ma'lumotlar Animem Uz platformasida yangilanmoqda. Qismlarni Telegram botimiz orqali to'liq tomosha qilishingiz mumkin."}
          </p>

          <button
            onClick={() => setIsDescExpanded(!isDescExpanded)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-black text-purple-400 hover:text-purple-300 tracking-wider uppercase cursor-pointer"
          >
            <span>{isDescExpanded ? "Qisqartirish" : "TO'LIQ O'QISH"}</span>
            {isDescExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

    </div>
  );
};
