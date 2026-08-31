import React from 'react';
import {
  X,
  Zap,
  GitBranch,
  Pin,
  Search,
  Lock,
  Download,
  Settings,
  Layers,
  HeartHandshake,
  Check,
  Crown,
  Flame,
  Moon,
  Heart,
  Send,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { usePass } from '../context/PassContext';

interface PassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PassModal: React.FC<PassModalProps> = ({ isOpen, onClose }) => {
  const { hasPass, passInfo, activatePass, deactivatePass } = usePass();

  if (!isOpen) return null;

  const features = [
    {
      icon: <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400/20 shrink-0" />,
      title: "Premium anime",
      desc: "Platformamizga yangi qo'shilgan PREMIUM anime va epizodlarni 7 kunlik cheklovsiz birinchilardan bo'lib tomosha qiling",
    },
    {
      icon: <Lock className="w-5 h-5 text-yellow-400 shrink-0" />,
      title: "Majburiyatsiz",
      desc: "Homiylarimiz kanallariga a'zo bo'lishingiz shart emas",
    },
    {
      icon: <Download className="w-5 h-5 text-yellow-400 shrink-0" />,
      title: "Yuklab olish",
      desc: "Anime epizodlarini yuklab oling yoki ulashing",
    },
    {
      icon: <Settings className="w-5 h-5 text-yellow-400 shrink-0" />,
      title: "Avto-tuzatish",
      desc: "Muammoli epizodlar avtomatik tuzatish funksiyasidan foydalaning",
    },
    {
      icon: <Layers className="w-5 h-5 text-yellow-400 shrink-0" />,
      title: "Barcha qismlar saqlanadi",
      desc: "Oldingi qismlar o'chib ketmaydi — birdaniga barchasini tomosha qiling",
    },
    {
      icon: <HeartHandshake className="w-5 h-5 text-yellow-400 shrink-0" />,
      title: "Bizni qo'llab-quvvatlang",
      desc: "Animem.uz platformasini qo'llab-quvvatlang",
    },
  ];

  const plans = [
    {
      id: '1m',
      title: '1 oylik',
      sub: 'Animem Pass',
      price: '10.000',
      period: 'oyiga atiga 10.000 so\'m',
      subtitleNote: 'Boshlang\'ich tarif',
      duration: '1 oy davomida',
      icon: <Heart className="w-6 h-6 text-yellow-400 fill-yellow-400" />,
      badge: null,
      savingsPill: null,
      isGold: false,
      telegramCode: 'pass_1m',
    },
    {
      id: '2m',
      title: '2 oylik',
      sub: 'Animem Pass',
      price: '18.000',
      period: 'oyiga 9.000 so\'m',
      subtitleNote: null,
      duration: '2 oy davomida',
      icon: <Flame className="w-6 h-6 text-yellow-400 fill-yellow-400" />,
      badge: { text: '-10% TEJAYSIZ', bg: 'bg-[#ef4444] text-white' },
      savingsPill: '-10% · 2.000 so\'m tejaysiz',
      isGold: false,
      telegramCode: 'pass_2m',
    },
    {
      id: '3m',
      title: '3 oylik',
      sub: 'Animem Pass',
      price: '23.000',
      period: 'oyiga ~7.667 so\'m',
      subtitleNote: null,
      duration: '3 oy davomida',
      icon: <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" />,
      badge: { text: '-17% TEJAYSIZ', bg: 'bg-[#10b981] text-white' },
      savingsPill: '-17% · 7.000 so\'m tejaysiz',
      isGold: false,
      telegramCode: 'pass_3m',
    },
    {
      id: '6m',
      title: '6 oylik',
      sub: 'Animem Pass',
      price: '45.000',
      period: 'oyiga 7.500 so\'m',
      subtitleNote: null,
      duration: '6 oy davomida',
      icon: <Moon className="w-6 h-6 text-yellow-400 fill-yellow-400" />,
      badge: { text: '-25% TEJAYSIZ', bg: 'bg-[#f59e0b] text-black font-extrabold' },
      savingsPill: '-25% · 15.000 so\'m tejaysiz',
      isGold: false,
      telegramCode: 'pass_6m',
    },
    {
      id: '1y',
      title: '1 yillik',
      sub: 'Animem Pass',
      price: '80.000',
      period: 'oyiga ~6.667 so\'m',
      subtitleNote: null,
      duration: '12 oy davomida',
      icon: <Crown className="w-6 h-6 text-neutral-900 fill-neutral-900" />,
      badge: { text: '-33% TEJAYSIZ', bg: 'bg-white text-black font-black' },
      savingsPill: '-33% · 40.000 so\'m tejaysiz',
      isGold: true,
      telegramCode: 'pass_1y',
    },
  ];

  const handleBuy = (telegramCode: string, planId: string) => {
    // Activate pass in app state as well for immediate VIP unlocking
    activatePass(planId);
    window.open(`https://t.me/Animem_uz_bot?start=${telegramCode}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[150] overflow-y-auto bg-[#070312]/95 backdrop-blur-xl flex flex-col justify-between select-none">
      
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 -z-10 h-96 w-[40rem] rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-10 -z-10 h-80 w-80 rounded-full bg-yellow-500/10 blur-[100px] pointer-events-none" />

      {/* Top Bar with Close Button */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-4 bg-[#070312]/80 backdrop-blur-md border-b border-purple-900/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5">
            <div className="w-full h-full bg-[#0d071a] rounded-[10px] flex items-center justify-center text-yellow-400 font-bold text-xs">
              VIP
            </div>
          </div>
          <span className="font-['Gasoek_One',sans-serif] text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200">
            Animem Uz
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2 sm:p-2.5 rounded-full bg-[#180e2b] hover:bg-purple-900/60 text-purple-200 hover:text-white border border-purple-800/40 transition-all cursor-pointer shadow-lg"
          title="Yopish"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Body */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1">
        
        {/* Header Title & Subtitle */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-3">
            <span className="text-[#facc15] drop-shadow-[0_0_20px_rgba(250,204,21,0.3)]">Animem Pass</span>{' '}
            <span className="text-white">obunasi</span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-purple-200/90 font-medium">
            Barcha <span className="text-[#facc15] font-bold">premium</span> funksiyalardan{' '}
            <span className="text-[#facc15] font-bold">cheklovsiz</span> foydalaning.
          </p>
        </div>

        {/* Section 1: Premium Imkoniyatlar */}
        <div className="mb-14 sm:mb-20">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white text-center mb-6 sm:mb-8 font-sans tracking-wide">
            Premium imkoniyatlar
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl bg-[#120822]/80 border border-purple-900/30 hover:border-purple-500/40 transition-all duration-300 shadow-md backdrop-blur-sm group"
              >
                <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-800/40 text-yellow-400 group-hover:scale-110 transition-transform">
                  {feat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white mb-1 group-hover:text-yellow-300 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-purple-200/70 leading-relaxed font-normal">
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Obuna tariflarini tanlang */}
        <div className="mb-12">
          {/* Active Pass Banner if currently subscribed */}
          {hasPass && (
            <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-[#0d2a1b] to-emerald-950/80 border-2 border-emerald-500/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-white">
                      Animem Pass Obunasi Faol
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase">
                      VIP Status
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/80">
                    Amal qilish muddati: <strong className="text-white">{passInfo?.expiresAt || 'Cheksiz'}</strong> ({passInfo?.planTitle || 'Premium Pass'})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={deactivatePass}
                  className="px-3 py-1.5 rounded-xl bg-red-950/50 hover:bg-red-900/70 border border-red-800/40 text-red-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Passni o‘chirish (Sinov)
                </button>
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white mb-2 font-sans tracking-wide">
              Obuna tariflarini tanlang
            </h2>
            <p className="text-xs sm:text-sm font-medium text-purple-200/80">
              Muddat qancha uzoq bo'lsa —{' '}
              <span className="text-emerald-400 font-extrabold">tejovingiz shuncha katta!</span>
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-2xl p-4 sm:p-5 transition-all duration-300 ${
                  plan.isGold
                    ? 'bg-gradient-to-b from-[#fde047] via-[#facc15] to-[#eab308] text-black shadow-2xl shadow-yellow-500/25 transform sm:-translate-y-1 sm:hover:-translate-y-2'
                    : 'bg-[#130926]/90 border border-purple-900/40 hover:border-purple-500/50 hover:bg-[#190d33] text-white shadow-lg'
                }`}
              >
                {/* Top Badge (if any) */}
                {plan.badge && (
                  <div className="absolute -top-3 right-3 z-10">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase shadow-md ${plan.badge.bg}`}
                    >
                      {plan.badge.text}
                    </span>
                  </div>
                )}

                {/* Card Header & Price */}
                <div>
                  {/* Icon */}
                  <div className="flex items-center justify-center mb-2">
                    <div
                      className={`p-2.5 rounded-2xl ${
                        plan.isGold ? 'bg-black/10' : 'bg-purple-950/70 border border-purple-800/40'
                      }`}
                    >
                      {plan.icon}
                    </div>
                  </div>

                  {/* Plan Name */}
                  <div className="text-center mb-3">
                    <h3 className={`text-base font-extrabold ${plan.isGold ? 'text-black' : 'text-white'}`}>
                      {plan.title}
                    </h3>
                    <p className={`text-[11px] font-medium ${plan.isGold ? 'text-neutral-800' : 'text-purple-300/70'}`}>
                      {plan.sub}
                    </p>
                  </div>

                  {/* Price Big */}
                  <div className="text-center mb-2">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className={`text-2xl sm:text-3xl font-black font-['Outfit',sans-serif] ${plan.isGold ? 'text-black' : 'text-white'}`}>
                        {plan.price}
                      </span>
                      <span className={`text-xs font-bold ${plan.isGold ? 'text-neutral-800' : 'text-purple-300/80'}`}>
                        so'm
                      </span>
                    </div>
                    <p className={`text-[10px] sm:text-[11px] font-medium mt-0.5 ${plan.isGold ? 'text-neutral-800' : 'text-purple-300/60'}`}>
                      {plan.period}
                    </p>
                  </div>

                  {/* Note / Savings pill */}
                  <div className="text-center min-h-[26px] mb-4">
                    {plan.subtitleNote && (
                      <span className={`text-[10px] italic font-semibold ${plan.isGold ? 'text-neutral-800' : 'text-purple-400'}`}>
                        {plan.subtitleNote}
                      </span>
                    )}
                    {plan.savingsPill && (
                      <span
                        className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                          plan.isGold
                            ? 'bg-black text-[#facc15]'
                            : 'bg-purple-950/80 border border-purple-800/50 text-purple-200'
                        }`}
                      >
                        {plan.savingsPill}
                      </span>
                    )}
                  </div>

                  {/* Features checklist */}
                  <div className="space-y-1.5 pt-3 border-t border-purple-900/30 text-xs mb-5">
                    <div className={`flex items-center gap-1.5 ${plan.isGold ? 'text-neutral-900' : 'text-purple-200'}`}>
                      <Check className={`w-3.5 h-3.5 shrink-0 ${plan.isGold ? 'text-black' : 'text-emerald-400'}`} />
                      <span className="text-[11px] font-medium">Barcha premium funksiyalar</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${plan.isGold ? 'text-neutral-900' : 'text-purple-200'}`}>
                      <Check className={`w-3.5 h-3.5 shrink-0 ${plan.isGold ? 'text-black' : 'text-emerald-400'}`} />
                      <span className="text-[11px] font-medium">{plan.duration}</span>
                    </div>
                  </div>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={() => handleBuy(plan.telegramCode, plan.id)}
                  className={`w-full py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                    plan.isGold
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 text-neutral-950 font-black shadow-amber-500/30'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30 border border-purple-400/30'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Xarid qilish</span>
                </button>
              </div>
            ))}
          </div>

          {/* Bottom Note */}
          <div className="mt-8 text-center">
            <p className="text-[11px] sm:text-xs text-purple-300/60 max-w-xl mx-auto leading-relaxed">
              Barcha tariflar telegram botimizda bir martalik to'lov orqali faollashtiriladi.<br className="hidden sm:inline" />
              Muddat tugagach, obunani yangilashingiz mumkin.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};

