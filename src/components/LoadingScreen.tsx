import React, { useEffect, useState } from 'react';
import { Sparkles, Film, Tv, Radio } from 'lucide-react';

interface LoadingScreenProps {
  isLoading: boolean;
  onFinish?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading, onFinish }) => {
  const [shouldRender, setShouldRender] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(15);
  const [statusIdx, setStatusIdx] = useState(0);

  const statuses = [
    'Anime olamiga ulanmoqda...',
    "HD sifatdagi seriallar yuklanmoqda...",
    "PostgreSQL ma'lumotlar bazasi ulandi ✨",
    "Xush kelibsiz!",
  ];

  useEffect(() => {
    // Progress interval
    const progInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 90) {
          return prev + Math.floor(Math.random() * 12) + 5;
        }
        return prev;
      });
    }, 150);

    // Status message switcher
    const textInterval = setInterval(() => {
      setStatusIdx((prev) => (prev < statuses.length - 1 ? prev + 1 : prev));
    }, 450);

    return () => {
      clearInterval(progInterval);
      clearInterval(textInterval);
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      setStatusIdx(statuses.length - 1);
      const timer = setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
          setShouldRender(false);
          if (onFinish) onFinish();
        }, 600);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [isLoading, onFinish]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#07040e] overflow-hidden transition-all duration-700 select-none ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Dynamic Background Ambient Auras */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/3 w-[350px] h-[350px] bg-sky-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-pink-500/15 rounded-full blur-[110px] pointer-events-none" />

      {/* Decorative subtle grid background */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 text-center">
        
        {/* Animated Brand Emblem / Torii Gate & Mascot Core */}
        <div className="relative mb-6">
          {/* Glowing rotating ring */}
          <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-sky-400 opacity-60 blur-md animate-spin" style={{ animationDuration: '4s' }} />
          
          {/* Outer Ring Border */}
          <div className="relative w-24 h-24 rounded-2xl p-[2px] bg-gradient-to-b from-purple-400 via-purple-600 to-pink-500 shadow-[0_0_35px_rgba(168,85,247,0.5)] flex items-center justify-center">
            <div className="w-full h-full rounded-[14px] bg-[#0c071a] flex items-center justify-center overflow-hidden border border-purple-500/40 p-1">
              <img
                src="https://pub-a106e00b56aa4c98ade06693352e0672.r2.dev/watermarked_img_14938170737257306972.jpg"
                alt="Animem Uz Bot Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>

          {/* Floating animated sparkles badge */}
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-1.5 rounded-full shadow-lg border border-purple-300/40 animate-bounce" style={{ animationDuration: '2s' }}>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title and Japanese Subtitle */}
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-pink-200 drop-shadow-[0_2px_15px_rgba(168,85,247,0.6)]">
            ANIMEM<span className="text-purple-400">.UZ</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-semibold text-purple-300/80 tracking-widest uppercase font-mono">
              アニメの世界 • ANIME PLATFORMASI
            </span>
          </div>
        </div>

        {/* Progress Bar with glowing aura */}
        <div className="w-full bg-[#180f2d] p-1 rounded-full border border-purple-800/40 shadow-inner mb-3">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-sky-400 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(236,72,153,0.8)]"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Status text with smooth transition */}
        <div className="flex items-center justify-between w-full px-1">
          <p className="text-xs text-purple-300/90 font-medium tracking-wide transition-all duration-200">
            {statuses[statusIdx]}
          </p>
          <span className="text-xs font-mono font-bold text-pink-400">
            {Math.min(progress, 100)}%
          </span>
        </div>

        {/* Bottom Feature Badges */}
        <div className="mt-8 flex items-center justify-center gap-4 text-purple-400/60 text-[11px]">
          <div className="flex items-center gap-1">
            <Film className="w-3 h-3 text-purple-400" />
            <span>Full HD</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-pink-400" />
            <span>O'zbekcha Dublyaj</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Tv className="w-3 h-3 text-sky-400" />
            <span>Bot Integratsiya</span>
          </div>
        </div>

      </div>
    </div>
  );
};
