import React from 'react';
import { Lock, Sparkles, X, ShieldAlert, ArrowRight, Check } from 'lucide-react';
import { usePass } from '../context/PassContext';

export const PassRequiredModal: React.FC = () => {
  const {
    isPassRequiredModalOpen,
    lockedFeatureName,
    closePassRequiredModal,
    openPassModal,
    activatePass,
  } = usePass();

  if (!isPassRequiredModalOpen) return null;

  const featureLabels: Record<string, { title: string; desc: string; iconText: string }> = {
    chronology: {
      title: 'Anime Xronologiyasi va Ko\'rish Tartibi',
      desc: 'Barcha anime franshizalarining qismlar, filmlar va fasllar ketma-ketligini to\'liq xronologik tartibda ko\'rish.',
      iconText: '⏳ Xronologiya',
    },
    recommendations: {
      title: 'Shaxsiy Aqlli AI Tavsiyalar',
      desc: 'Sizning didingiz, sevimli janrlaringiz va kayfiyatingizga moslashtirilgan sun\'iy intellekt tavsiyalari.',
      iconText: '✨ Tavsiyalar',
    },
    image_search: {
      title: 'Rasm orqali qidirish (Anime Scanner)',
      desc: 'Anime kadrini rasm yoki skrinshot ko\'rinishida yuklab, anime nomi, qismi va vaqtini bir soniyada topish.',
      iconText: '📷 Rasm orqali qidiruv',
    },
  };

  const currentFeature = featureLabels[lockedFeatureName] || {
    title: lockedFeatureName || 'Premium Imkoniyat',
    desc: 'Ushbu eksklyuziv funksiyadan to\'liq foydalanish uchun Animem Pass obunasini faollashtiring.',
    iconText: '🔒 VIP Funksiya',
  };

  return (
    <div className="fixed inset-0 z-[300] overflow-y-auto bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-md bg-[#130816] border-2 border-red-500/60 rounded-3xl overflow-hidden shadow-2xl shadow-red-950/80 text-center p-6 sm:p-8">
        
        {/* Ambient Red/Purple Light */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-red-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Close Button */}
        <button
          onClick={closePassRequiredModal}
          className="absolute top-4 right-4 p-2 rounded-full bg-red-950/50 hover:bg-red-900/70 border border-red-800/50 text-red-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lock Icon Glowing Red */}
        <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 blur-md opacity-70 animate-pulse" />
          <div className="relative w-full h-full rounded-3xl bg-[#1f0914] border border-red-500/70 flex items-center justify-center text-red-400 shadow-inner">
            <Lock className="w-10 h-10 text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
          </div>
        </div>

        {/* Feature badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider mb-3">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span>{currentFeature.iconText}</span>
        </div>

        {/* Central Bold Notice */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2 font-['Outfit',sans-serif]">
          Avval <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">Animem Pass</span> sotib oling!
        </h2>

        <p className="text-xs sm:text-sm text-gray-300/90 leading-relaxed mb-6 font-medium">
          <span className="text-red-400 font-semibold">{currentFeature.title}</span> dan foydalanish uchun Animem Pass obunasini faollashtirishingiz kerak.
        </p>

        {/* Benefits mini box */}
        <div className="p-3.5 rounded-2xl bg-[#220c19]/80 border border-red-900/40 text-left text-xs space-y-2 mb-6">
          <div className="flex items-center gap-2 text-gray-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Premium animelarni cheklovsiz ko'rish</span>
          </div>
          <div className="flex items-center gap-2 text-gray-200">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Reklamasiz va cheklovlarsiz tomosha</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            onClick={openPassModal}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm tracking-wide uppercase shadow-lg shadow-amber-500/25 border border-yellow-200/50 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>Animem Pass sotib olish</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Demo Test Activation */}
          <button
            onClick={() => activatePass('1m')}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 text-purple-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            ⚡ Test qilish: Passni darhol faollashtirish (VIP)
          </button>
        </div>

      </div>
    </div>
  );
};
