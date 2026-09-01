import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Play,
  Bot,
  Sparkles,
  Smartphone,
  Globe
} from 'lucide-react';
import { Anime } from '../types';
import { TelegramIcon } from './icons/TelegramIcon';

interface TelegramBotModalProps {
  anime: Anime | null;
  onClose: () => void;
}

export const TelegramBotModal: React.FC<TelegramBotModalProps> = ({ anime, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'simulator' | 'qr'>('link');

  if (!anime) return null;

  const botUsername = anime.telegram?.botUsername || 'Animem_uz_bot';
  const startCode = anime.telegram_code || anime.telegram?.startParameter || `anime_${anime.id}`;
  const webLink = anime.start_url || anime.telegram_bot_url || anime.telegram?.webUrl || `https://t.me/${botUsername}?start=${startCode}`;
  const appLink = anime.telegram?.appUrl || `tg://resolve?domain=${botUsername}&start=${startCode}`;
  const qrCodeUrl = anime.telegram?.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(webLink)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenTelegram = () => {
    // Attempt app deep link first, or fallback to web
    window.location.href = webLink;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-[#110a21] border border-purple-800/60 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-purple-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-900/30">
              <TelegramIcon className="w-5 h-5 ml-0.5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-['Outfit']">Telegram Bot orqali tomosha qilish</h2>
              <p className="text-xs text-purple-300/70">@{botUsername}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-purple-950 text-purple-300 hover:text-white border border-purple-800/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Anime summary */}
        <div className="p-4 bg-[#180f2e] border-b border-purple-900/30 flex items-center gap-3.5">
          <img
            src={anime.poster_url}
            alt={anime.title}
            className="w-12 h-16 object-cover rounded-xl shrink-0 border border-purple-700/40"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-white truncate">{anime.title}</h3>
            <p className="text-xs text-purple-300/70">{anime.type} • {Array.isArray(anime.episodes) ? `${anime.current_episode || 12} / ${anime.total_episodes || 12}` : anime.episodes}</p>
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-purple-900/80 text-purple-200 font-mono">
              /start {startCode}
            </span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-purple-900/40 px-6 pt-3 gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('link')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'link'
                ? 'border-purple-400 text-white'
                : 'border-transparent text-purple-400/60 hover:text-purple-300'
            }`}
          >
            To'g'ridan-to'g'ri o'tish
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'simulator'
                ? 'border-purple-400 text-white'
                : 'border-transparent text-purple-400/60 hover:text-purple-300'
            }`}
          >
            Bot qanday ishlaydi?
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'qr'
                ? 'border-purple-400 text-white'
                : 'border-transparent text-purple-400/60 hover:text-purple-300'
            }`}
          >
            QR Kod (Telefonda)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#0a0614] border border-purple-900/50 text-center">
                <p className="text-xs text-purple-200/80 mb-3">
                  Ushbu animeni to'liq HD formatda, subtitr va o'zbekcha ovozda tomosha qilish uchun bizning rasmiy Telegram botimizga kiring:
                </p>

                {/* Primary Action Button */}
                <a
                  href={webLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-sky-950/50 flex items-center justify-center gap-2 transition-all transform active:scale-95"
                >
                  <TelegramIcon className="w-4 h-4" />
                  <span>Telegramda ochish (@{botUsername})</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
                </a>
              </div>

              {/* Copy Deep Link Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-purple-300/70">To'g'ridan-to'g'ri havola (Deep link):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webLink}
                    className="flex-1 bg-[#180f2e] text-xs text-purple-200 px-3 py-2.5 rounded-xl border border-purple-900/50 font-mono outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="p-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 hover:text-white border border-purple-700/50 flex items-center gap-1 text-xs font-bold transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Nusxalandi' : 'Nusxa olish'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'simulator' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-[#090514] border border-purple-900/50 space-y-3 text-xs">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-purple-700 text-white px-3 py-1.5 rounded-2xl rounded-tr-sm max-w-[80%] font-mono text-[11px]">
                    /start {startCode}
                  </div>
                </div>

                {/* Bot message */}
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-[#1b1233] text-purple-100 p-3 rounded-2xl rounded-tl-sm border border-purple-800/40 space-y-2 flex-1">
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>🎬 {anime.title}</span>
                      <span className="text-[10px] text-amber-400">★ {anime.rating}</span>
                    </div>
                    <p className="text-[11px] text-purple-200/80 line-clamp-2">{anime.description}</p>
                    <div className="pt-2 border-t border-purple-900/40 flex flex-wrap gap-1.5">
                      <a
                        href={webLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold flex items-center gap-1"
                      >
                        <Play className="w-2.5 h-2.5 fill-white" /> 1-qismni ko'rish (1080p)
                      </a>
                      <a
                        href={webLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded bg-[#2a1d4a] hover:bg-purple-800 text-purple-200 text-[10px] font-bold"
                      >
                        Barcha qismlar ({Array.isArray(anime.episodes) ? `${anime.current_episode || 12} / ${anime.total_episodes || 12}` : anime.episodes})
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-center text-purple-300/60">
                Bot orqali anime qismlarini yuklab olishingiz yoki to'g'ridan-to'g'ri Telegram pleyerida tomosha qilishingiz mumkin.
              </p>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="flex flex-col items-center justify-center p-4 text-center space-y-3">
              <div className="p-3 bg-white rounded-2xl shadow-xl">
                <img
                  src={qrCodeUrl}
                  alt="Telegram Bot QR Code"
                  className="w-44 h-44 object-contain"
                />
              </div>
              <p className="text-xs text-purple-200">
                Telefon kamerangiz orqali ushbu QR kodni skanerlang va darhol Telegram botda tomosha qiling.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
