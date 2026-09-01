import React, { useState } from 'react';
import {
  X,
  Play,
  Send,
  Sparkles,
  Star,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Share2,
  Copy,
  ExternalLink,
  Code2,
  ChevronDown,
  ChevronUp,
  Database,
  GitBranch,
  Camera,
  Lock,
} from 'lucide-react';
import { Anime } from '../types';
import { usePass } from '../context/PassContext';

interface AnimeDetailModalProps {
  anime: Anime | null;
  onClose: () => void;
  onOpenPass: () => void;
  onOpenTelegramModal: (anime: Anime) => void;
  onOpenChronology?: () => void;
  onOpenRecommendations?: () => void;
  onOpenImageSearch?: () => void;
}

export const AnimeDetailModal: React.FC<AnimeDetailModalProps> = ({
  anime,
  onClose,
  onOpenPass,
  onOpenTelegramModal,
  onOpenChronology,
  onOpenRecommendations,
  onOpenImageSearch,
}) => {
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const { hasPass, requestFeature } = usePass();

  if (!anime) return null;

  const botUsername = 'AnimemUzBot';
  const startCode = anime.telegram_code || `anime_${anime.id}`;
  const telegramDirectLink = `tg://resolve?domain=${botUsername}&start=${startCode}`;
  const telegramWebLink = `https://t.me/${botUsername}?start=${startCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(telegramWebLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWatchClick = () => {
    // Increment view count in background API
    fetch(`/api/animes/${anime.id}`);
    onOpenTelegramModal(anime);
  };

  const handleChronologyClick = () => {
    if (requestFeature('chronology') && onOpenChronology) {
      onClose();
      onOpenChronology();
    }
  };

  const handleRecommendationsClick = () => {
    if (requestFeature('recommendations') && onOpenRecommendations) {
      onClose();
      onOpenRecommendations();
    }
  };

  const handleImageSearchClick = () => {
    if (requestFeature('image_search') && onOpenImageSearch) {
      onClose();
      onOpenImageSearch();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-start justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0e0a1a] border border-purple-900/50 rounded-3xl overflow-hidden shadow-2xl my-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          id="modal-close-btn"
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-[#17102b]/80 hover:bg-purple-900 text-purple-200 hover:text-white border border-purple-800/40 transition-colors shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Section with Blur Backdrop */}
        <div className="relative min-h-[380px] sm:min-h-[440px] flex flex-col items-center justify-center p-6 text-center overflow-hidden border-b border-purple-900/40">
          {/* Blurred background image */}
          <div
            className="absolute inset-0 bg-cover bg-center filter blur-xl scale-110 opacity-35"
            style={{ backgroundImage: `url(${anime.banner_url || anime.poster_url})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a1a] via-[#0e0a1a]/80 to-transparent" />

          {/* Foreground Poster and Titles */}
          <div className="relative z-10 flex flex-col items-center max-w-2xl">
            {/* Title */}
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-['Outfit'] mb-1">
              {anime.title}
            </h1>

            {/* Subtitles: Original & Russian */}
            <p className="text-xs sm:text-sm text-purple-300/80 font-medium mb-5">
              {anime.original_title} {anime.russian_title ? `• ${anime.russian_title}` : ''}
            </p>

            {/* Poster Thumbnail */}
            <div className="relative w-36 sm:w-44 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-purple-500/40 mb-6 group">
              <img
                src={anime.poster_url}
                alt={anime.title}
                className="w-full h-full object-cover"
              />
              {anime.sub_available && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-cyan-500 text-[10px] font-black text-white shadow uppercase">
                  SUB
                </span>
              )}
            </div>

            {/* Main CTA: TOMOSHA QILISH */}
            <button
              id="anime-watch-main-btn"
              onClick={handleWatchClick}
              className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-600 hover:from-purple-600 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base tracking-wider uppercase shadow-xl shadow-purple-950/80 border border-purple-400/30 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <Send className="w-5 h-5" />
              <span>TOMOSHA QILISH (BOTDA)</span>
            </button>

            {/* Notice about Telegram Bot */}
            <p className="text-[11px] text-purple-300/70 mt-2 flex items-center gap-1">
              <span>🚀 Ushbu animeni ko'rish uchun Telegram botga yo'naltiriladi</span>
            </p>

            {/* 4 Stat Boxes (matching Screenshot 3) */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-lg mt-6 bg-[#160f2b]/80 backdrop-blur-md p-3 rounded-2xl border border-purple-900/40">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-purple-300/60 uppercase">EPIZODLAR</span>
                <span className="text-xs sm:text-sm font-extrabold text-white mt-0.5">{Array.isArray(anime.episodes) ? `${anime.current_episode || 12} / ${anime.total_episodes || 12}` : anime.episodes}</span>
              </div>
              <div className="flex flex-col items-center border-l border-purple-900/40">
                <span className="text-[10px] font-bold text-purple-300/60 uppercase">YIL</span>
                <span className="text-xs sm:text-sm font-extrabold text-white mt-0.5">{anime.year}</span>
              </div>
              <div className="flex flex-col items-center border-l border-purple-900/40">
                <span className="text-[10px] font-bold text-purple-300/60 uppercase">TIP</span>
                <span className="text-xs sm:text-sm font-extrabold text-white mt-0.5 truncate max-w-full px-1">{anime.type}</span>
              </div>
              <div className="flex flex-col items-center border-l border-purple-900/40">
                <span className="text-[10px] font-bold text-purple-300/60 uppercase">KO'RISHLAR</span>
                <span className="text-xs sm:text-sm font-extrabold text-white mt-0.5">
                  {anime.views_count > 1000 ? `${(anime.views_count / 1000).toFixed(1)}k` : anime.views_count}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-8 space-y-6">
          {/* Mini Gold Pass Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-[#6e4910] via-[#855e16] to-[#593907] border border-amber-500/40 text-amber-100">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider font-['Outfit']">Animem Pass</span>
                  {hasPass && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 text-[9px] font-black uppercase">
                      ✓ Faol
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-amber-200/90 font-medium">
                  {hasPass
                    ? 'Barcha VIP imkoniyatlar siz uchun ochiq!'
                    : 'Barcha premium imkoniyatlar bir joyda! Hoziroq tanishib chiqing.'}
                </p>
              </div>
            </div>
            <button
              onClick={onOpenPass}
              className="px-3 py-1.5 rounded-lg bg-[#382307] text-amber-200 text-xs font-bold border border-amber-400/40 shrink-0 hover:bg-[#482e09] cursor-pointer"
            >
              {hasPass ? 'Status' : 'Batafsil'}
            </button>
          </div>

          {/* 3 VIP Features Grid inside Modal */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#130a24] border border-purple-900/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                VIP Qulayliklar & Imkoniyatlar
              </span>
              <span className="text-[10px] text-purple-300/70">
                {hasPass ? '🟢 Ochiq' : '🔴 Qulflangan'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* 1. Xronologiya */}
              <button
                onClick={handleChronologyClick}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  hasPass
                    ? 'bg-amber-950/20 hover:bg-amber-900/30 border-amber-500/40 text-amber-200'
                    : 'bg-red-950/30 hover:bg-red-900/50 border-red-500/40 text-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <GitBranch className={`w-4 h-4 ${hasPass ? 'text-amber-400' : 'text-red-400'}`} />
                  <span className="text-xs font-bold text-white">Xronologiya</span>
                </div>
                {hasPass ? (
                  <span className="text-[10px] font-black text-amber-400">OCHIQ</span>
                ) : (
                  <Lock className="w-3.5 h-3.5 text-red-500" />
                )}
              </button>

              {/* 2. Tavsiyalar */}
              <button
                onClick={handleRecommendationsClick}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  hasPass
                    ? 'bg-amber-950/20 hover:bg-amber-900/30 border-amber-500/40 text-amber-200'
                    : 'bg-red-950/30 hover:bg-red-900/50 border-red-500/40 text-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${hasPass ? 'text-amber-400' : 'text-red-400'}`} />
                  <span className="text-xs font-bold text-white">AI Tavsiyalar</span>
                </div>
                {hasPass ? (
                  <span className="text-[10px] font-black text-amber-400">OCHIQ</span>
                ) : (
                  <Lock className="w-3.5 h-3.5 text-red-500" />
                )}
              </button>

              {/* 3. Rasmli qidiruv */}
              <button
                onClick={handleImageSearchClick}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  hasPass
                    ? 'bg-amber-950/20 hover:bg-amber-900/30 border-amber-500/40 text-amber-200'
                    : 'bg-red-950/30 hover:bg-red-900/50 border-red-500/40 text-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Camera className={`w-4 h-4 ${hasPass ? 'text-amber-400' : 'text-red-400'}`} />
                  <span className="text-xs font-bold text-white">Rasmli qidiruv</span>
                </div>
                {hasPass ? (
                  <span className="text-[10px] font-black text-amber-400">OCHIQ</span>
                ) : (
                  <Lock className="w-3.5 h-3.5 text-red-500" />
                )}
              </button>
            </div>
          </div>

          {/* QO'SHIMCHA MA'LUMOTLAR Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
              <h3 className="text-xs font-black tracking-wider uppercase text-white font-['Outfit']">
                QO'SHIMCHA MA'LUMOTLAR
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Status */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {anime.status}
              </span>

              {/* Rating */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#160f2b] border border-purple-900/50 text-amber-300 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {anime.rating} / 10 (MAL)
              </span>

              {/* Duration */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#160f2b] border border-purple-900/50 text-purple-200 font-medium">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                {anime.duration || '23 daq.'}
              </span>

              {/* Age Rating */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#160f2b] border border-purple-900/50 text-rose-300 font-medium">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                {anime.age_rating || '13 yoshdan kattalar uchun (PG-13)'}
              </span>
            </div>
          </div>

          {/* JANRLAR Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
              <h3 className="text-xs font-black tracking-wider uppercase text-white font-['Outfit']">
                JANRLAR
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {anime.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1.5 rounded-xl bg-[#1a1233] hover:bg-purple-900/50 text-purple-200 text-xs font-semibold border border-purple-800/40 transition-colors"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>

          {/* TAVSIF (Description) Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
              <h3 className="text-xs font-black tracking-wider uppercase text-white font-['Outfit']">
                TAVSIF
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-[#140e26] border border-purple-900/40 text-xs sm:text-sm text-purple-200/90 leading-relaxed">
              <p className={isDescExpanded ? '' : 'line-clamp-3'}>
                {anime.description}
              </p>

              <button
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="mt-3 flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 tracking-wider uppercase"
              >
                <span>{isDescExpanded ? "Qisqartirish" : "TO'LIQ O'QISH"}</span>
                {isDescExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* PostgreSQL JSON Schema Inspector toggle (fulfills user request: anime malumotlar shu datada json formada saqlansi) */}
          <div className="pt-2 border-t border-purple-950">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>PostgreSQL JSONB formadagi to'liq ma'lumotlarni ko'rish</span>
              {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showRawJson && (
              <div className="mt-3 p-4 rounded-xl bg-[#090611] border border-purple-950 text-xs font-mono text-purple-300 overflow-x-auto">
                <pre>{JSON.stringify(anime, null, 2)}</pre>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
