import React, { useState } from 'react';
import {
  GitBranch,
  X,
  Play,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  Tv,
  Film,
  Crown,
  Search,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { Anime } from '../types';
import { TelegramIcon } from './icons/TelegramIcon';

interface ChronologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnime: (anime: Anime) => void;
  allAnimes: Anime[];
  initialFranchise?: string;
}

interface FranchiseItem {
  id: string;
  name: string;
  orderNum: number;
  type: 'TV Serial' | 'Film' | 'OVA' | 'Spesial' | 'Prekvel';
  year: number;
  episodes: string;
  description: string;
  status: 'Tugallangan' | 'Davom etmoqda' | 'Tavsiya qilinadi';
  posterUrl?: string;
  isCanon: boolean;
  telegramStartCode?: string;
}

interface Franchise {
  id: string;
  title: string;
  japaneseTitle: string;
  coverImage: string;
  description: string;
  totalParts: number;
  timeline: FranchiseItem[];
}

export const ChronologyModal: React.FC<ChronologyModalProps> = ({
  isOpen,
  onClose,
  onSelectAnime,
  allAnimes,
  initialFranchise,
}) => {
  if (!isOpen) return null;

  const franchises: Franchise[] = [
    {
      id: 'naruto',
      title: 'Naruto & Boruto Franshizasi',
      japaneseTitle: 'NARUTO - ナルト -',
      coverImage: 'https://images.alphacoders.com/131/1311099.jpeg',
      description: 'Yashirin Barg qishlog‘ining afsonaviy ninzasi Naruto Uzumakining Hokage bo‘lish yo‘lidagi barcha fasl, film va davomiy hikoyalari xronologiyasi.',
      totalParts: 6,
      timeline: [
        {
          id: 'naruto_s1',
          name: '1. Naruto (1-mavsum)',
          orderNum: 1,
          type: 'TV Serial',
          year: 2002,
          episodes: '220 ta qism',
          description: 'Naruto akademiyani bitirib, 7-jamoa tarkibida (Sasuke, Sakura, Kakashi) ilk missiyalarini boshlaydi.',
          status: 'Tugallangan',
          posterUrl: 'https://images.alphacoders.com/131/1311099.jpeg',
          isCanon: true,
          telegramStartCode: 'anime_naruto_s1',
        },
        {
          id: 'naruto_movie1',
          name: '2. Naruto Filmlar to‘plami (1-3 filmlar)',
          orderNum: 2,
          type: 'Film',
          year: 2004,
          episodes: '3 ta film',
          description: 'Qor mamlakatidagi qutqaruv, Gelel toshi afsonasi va Yarimoy orolining qo‘zg‘oloni.',
          status: 'Tugallangan',
          isCanon: false,
        },
        {
          id: 'naruto_shippuden',
          name: '3. Naruto Shippuden (Dovulli Yurish)',
          orderNum: 3,
          type: 'TV Serial',
          year: 2007,
          episodes: '500 ta qism',
          description: 'Jiraiya bilan mashg‘ulotlardan so‘ng ulg‘aygan Naruto Akatsuki tashkilotiga qarshi kurashadi va 4-Buyuk Ninja urushi boshlanadi.',
          status: 'Tugallangan',
          posterUrl: 'https://images7.alphacoders.com/712/712959.jpg',
          isCanon: true,
          telegramStartCode: 'anime_naruto_shippuden',
        },
        {
          id: 'naruto_the_last',
          name: '4. The Last: Naruto the Movie',
          orderNum: 4,
          type: 'Film',
          year: 2014,
          episodes: 'Film (112 daqiqa)',
          description: 'Shippudendan keyingi voqealar: Oydan kelgan xavf va Naruto hamda Hinataning haqiqiy muhabbat hikoyasi (Rasmiy Kanon).',
          status: 'Tavsiya qilinadi',
          isCanon: true,
          telegramStartCode: 'anime_naruto_last',
        },
        {
          id: 'boruto_movie',
          name: '5. Boruto: Naruto the Movie',
          orderNum: 5,
          type: 'Film',
          year: 2015,
          episodes: 'Film (95 daqiqa)',
          description: '7-Hokage Narutoning o‘g‘li Borutoning Chunin imtihoni va Otsutsuki klani hujumi.',
          status: 'Tugallangan',
          isCanon: true,
        },
        {
          id: 'boruto_series',
          name: '6. Boruto: Naruto Next Generations & Two Blue Vortex',
          orderNum: 6,
          type: 'TV Serial',
          year: 2017,
          episodes: '293+ ta qism',
          description: 'Yangi avlod ninzalarining zamonaviy texnologiyalar va Karma belgisi sir-asrorlari haqidagi yangi davri.',
          status: 'Davom etmoqda',
          isCanon: true,
          telegramStartCode: 'anime_boruto',
        },
      ],
    },
    {
      id: 'attack_on_titan',
      title: 'Attack on Titan (Titanlar Hujumi)',
      japaneseTitle: 'Shingeki no Kyojin',
      coverImage: 'https://images8.alphacoders.com/134/1345648.jpeg',
      description: 'Insoniyatni o‘rab turgan devorlar, sirli titanlar va Eren Yeagerning ozodlik uchun kurashining to‘liq ketma-ketligi.',
      totalParts: 5,
      timeline: [
        {
          id: 'aot_s1',
          name: '1. Attack on Titan Season 1',
          orderNum: 1,
          type: 'TV Serial',
          year: 2013,
          episodes: '25 ta qism',
          description: 'Mariya devorining qulashi, Eren, Mikasa va Armin razvedka korpusiga qo‘shilishi.',
          status: 'Tugallangan',
          isCanon: true,
        },
        {
          id: 'aot_ova',
          name: '2. No Regrets (Levining o‘tmishi OVA)',
          orderNum: 2,
          type: 'OVA',
          year: 2014,
          episodes: '2 ta qism',
          description: 'Kapitan Levi Ackerman qanday qilib yer ostidan chiqib Erwin Smit bilan uchrashgani.',
          status: 'Tavsiya qilinadi',
          isCanon: true,
        },
        {
          id: 'aot_s2',
          name: '3. Attack on Titan Season 2 & 3',
          orderNum: 3,
          type: 'TV Serial',
          year: 2017,
          episodes: '34 ta qism',
          description: 'Zirhli va Kolossal titanlarning fosh bo‘lishi, Shiganshina janggi va yerto‘la sirlari.',
          status: 'Tugallangan',
          isCanon: true,
        },
        {
          id: 'aot_s4_p1',
          name: '4. The Final Season (Part 1 & 2)',
          orderNum: 4,
          type: 'TV Serial',
          year: 2020,
          episodes: '28 ta qism',
          description: 'Marley davlati bilan urush va Yer tebranishi (Rumbling)ning boshlanishi.',
          status: 'Tugallangan',
          isCanon: true,
        },
        {
          id: 'aot_finale',
          name: '5. The Final Season: The Final Chapters',
          orderNum: 5,
          type: 'Spesial',
          year: 2023,
          episodes: '2 ta katta epizod',
          description: 'Titanlar hujumining epik va hissiyotlarga boy yakuniy kulminatsiyasi.',
          status: 'Tugallangan',
          isCanon: true,
        },
      ],
    },
    {
      id: 'demon_slayer',
      title: 'Demon Slayer (Iblislar Qotili)',
      japaneseTitle: 'Kimetsu no Yaiba',
      coverImage: 'https://images.alphacoders.com/131/1314633.jpeg',
      description: 'Tanjiro Kamadoning singlisi Nezukoni odamga aylantirish va Muzan Kibutsujini yengish xronologiyasi.',
      totalParts: 5,
      timeline: [
        {
          id: 'ds_s1',
          name: '1. Tanjiro Kamado, Unwavering Resolve Arc',
          orderNum: 1,
          type: 'TV Serial',
          year: 2019,
          episodes: '26 ta qism',
          description: 'Tanjironing mashg‘ulotlari, oxirgi tanlov va Natagumo tog‘idagi Ruyga qarshi jang.',
          status: 'Tugallangan',
          isCanon: true,
        },
        {
          id: 'ds_movie',
          name: '2. Mugen Train (Cheksiz Poyezd)',
          orderNum: 2,
          type: 'Film',
          year: 2020,
          episodes: 'Film (117 daqiqa)',
          description: 'Olov Hashirasi Rengoku Kyojuro bilan birgalikda poyezddagi iblisga qarshi epik jang.',
          status: 'Tugallangan',
          isCanon: true,
        },
        {
          id: 'ds_s2',
          name: '3. Entertainment District Arc',
          orderNum: 3,
          type: 'TV Serial',
          year: 2021,
          episodes: '11 ta qism',
          description: 'Ovoz Hashirasi Tengen Uzui bilan Yoshiwara maydonidagi Daki va Gyutaroga qarshi kurash.',
          status: 'Tugallangan',
          isCanon: true,
        },
        {
          id: 'ds_s3',
          name: '4. Swordsmith Village Arc',
          orderNum: 4,
          type: 'TV Serial',
          year: 2023,
          episodes: '11 ta qism',
          description: 'Temirchilar qishlog‘i, Muichiro Tokito va Mitsuri Kanroji ishtirokidagi janglar.',
          status: 'Tugallangan',
          isCanon: true,
        },
        {
          id: 'ds_s4',
          name: '5. Hashira Training & Infinity Castle (Trilogiya)',
          orderNum: 5,
          type: 'TV Serial',
          year: 2024,
          episodes: '8 ta qism + Kelgusi 3 film',
          description: 'Barcha Hashiralarning so‘nggi jangga tayyorgarligi va Cheksiz Qasrga kirish.',
          status: 'Davom etmoqda',
          isCanon: true,
        },
      ],
    },
    {
      id: 'jujutsu_kaisen',
      title: 'Jujutsu Kaisen (Sehrli Jang)',
      japaneseTitle: 'Jujutsu Kaisen',
      coverImage: 'https://images7.alphacoders.com/131/1311099.jpeg',
      description: 'Latsinatlar, Ryomen Sukuna va Gojo Satoruning sehrli dunyosidagi xronologik tomosha qilish tartibi.',
      totalParts: 4,
      timeline: [
        {
          id: 'jjk_0',
          name: '1. Jujutsu Kaisen 0 (Prekvel)',
          orderNum: 1,
          type: 'Film',
          year: 2021,
          episodes: 'Film (105 daqiqa)',
          description: 'Yuta Okkotsu va uning la\'natlangan sevgilisi Rika Orimoto haqidagi boshlang‘ich hikoya.',
          status: 'Tavsiya qilinadi',
          isCanon: true,
        },
        {
          id: 'jjk_s1',
          name: '2. Jujutsu Kaisen Season 1',
          orderNum: 2,
          type: 'TV Serial',
          year: 2020,
          episodes: '24 ta qism',
          description: 'Yuji Itadori Sukunaning barmog‘ini yutishi va Tokio Sehrgarlik Texnikumiga kirishi.',
          status: 'Tugallangan',
          isCanon: true,
        },
        {
          id: 'jjk_s2_hidden',
          name: '3. Season 2: Hidden Inventory / Premature Death',
          orderNum: 3,
          type: 'TV Serial',
          year: 2023,
          episodes: '5 ta qism',
          description: 'Gojo Satoru va Suguru Getoning 2006-yildagi yoshligi va Toji Fushiguro bilan to‘qnashuv.',
          status: 'Tugallangan',
          isCanon: true,
        },
        {
          id: 'jjk_s2_shibuya',
          name: '4. Season 2: Shibuya Incident',
          orderNum: 4,
          type: 'TV Serial',
          year: 2023,
          episodes: '18 ta qism',
          description: '31-oktabr tuni Shibuyada Gojo Satoruning muhrlanishi va misli ko‘rilmagan qonli to‘qnashuv.',
          status: 'Tugallangan',
          isCanon: true,
        },
      ],
    },
    {
      id: 'solo_leveling',
      title: 'Solo Leveling (Yolg‘iz Darajani Ko‘tarish)',
      japaneseTitle: 'Ore dake Level Up na Ken',
      coverImage: 'https://images.alphacoders.com/134/1344445.jpeg',
      description: 'Eng kuchsiz ovchi Sung Jin-wooning Qora Monarxga aylanishi xronologiyasi.',
      totalParts: 2,
      timeline: [
        {
          id: 'sl_s1',
          name: '1. Solo Leveling Season 1',
          orderNum: 1,
          type: 'TV Serial',
          year: 2024,
          episodes: '12 ta qism',
          description: 'Qo‘sh qasr zindonidagi uyg‘onish, tizim topshiriqlari va Igris ustidan g‘alaba.',
          status: 'Tugallangan',
          isCanon: true,
        },
        {
          id: 'sl_s2',
          name: '2. Solo Leveling Season 2: Arise from the Shadow',
          orderNum: 2,
          type: 'TV Serial',
          year: 2025,
          episodes: '13 ta qism',
          description: 'S-darajali ovchi bo‘lish, Jeju orolidagi chumolilar qiroli Beruga qarshi jang.',
          status: 'Davom etmoqda',
          isCanon: true,
        },
      ],
    },
  ];

  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>(
    initialFranchise || franchises[0].id
  );
  const [searchFranchise, setSearchFranchise] = useState('');

  const currentFranchise =
    franchises.find((f) => f.id === selectedFranchiseId) || franchises[0];

  const filteredFranchises = franchises.filter((f) =>
    f.title.toLowerCase().includes(searchFranchise.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[220] overflow-y-auto bg-[#070312]/95 backdrop-blur-2xl flex flex-col justify-between select-none animate-in fade-in duration-200">
      
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-[#0a0518]/90 backdrop-blur-md border-b border-purple-900/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-md shadow-amber-500/20">
            <div className="w-full h-full bg-[#120724] rounded-[10px] flex items-center justify-center text-amber-400">
              <GitBranch className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Outfit',sans-serif] text-base sm:text-lg font-black text-white">
                Anime Xronologiyasi
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-[10px] font-black text-amber-300 uppercase">
                VIP Pass
              </span>
            </div>
            <p className="text-[11px] text-purple-300/70 hidden sm:block">
              To‘g‘ri tartibda tomosha qilish bo‘yicha to‘liq qo‘llanma
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

      {/* Main Body */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
        
        {/* Franchise Selection Tabs / Pills */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-black tracking-wider uppercase text-purple-300/80">
              Franshizalarni tanlang:
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {filteredFranchises.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFranchiseId(f.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm ${
                  selectedFranchiseId === f.id
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold shadow-amber-500/20 scale-102'
                    : 'bg-[#150a28] hover:bg-[#20103c] text-purple-200 border border-purple-900/40'
                }`}
              >
                <span>{f.title.split(' ')[0]}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    selectedFranchiseId === f.id
                      ? 'bg-black/20 text-neutral-900 font-black'
                      : 'bg-purple-950 text-purple-300'
                  }`}
                >
                  {f.totalParts} qism
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Franchise Header Card */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#170a2f] via-[#1c0e39] to-[#120725] border border-purple-800/40 p-5 sm:p-7 mb-8 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                  {currentFranchise.japaneseTitle}
                </span>
                <span className="text-xs text-purple-300/60 font-semibold">• {currentFranchise.totalParts} ta fasl va film</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] mb-2">
                {currentFranchise.title}
              </h2>
              <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl leading-relaxed">
                {currentFranchise.description}
              </p>
            </div>
            
            <div className="shrink-0 flex items-center gap-2">
              <a
                href={`https://t.me/Animem_uz_bot?start=anime_${currentFranchise.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all active:scale-95"
              >
                <TelegramIcon className="w-3.5 h-3.5" />
                <span>Barcha qismlarni botda ochish</span>
              </a>
            </div>
          </div>
        </div>

        {/* Chronological Timeline Tree */}
        <div className="relative pl-6 sm:pl-10 space-y-6 before:absolute before:left-3 sm:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-amber-400 before:via-purple-500 before:to-indigo-600">
          {currentFranchise.timeline.map((item, idx) => {
            const isLast = idx === currentFranchise.timeline.length - 1;
            return (
              <div key={item.id} className="relative group">
                {/* Numbered Timeline Node Dot */}
                <div className="absolute -left-6 sm:-left-10 top-3 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#110724] border-2 border-amber-400 flex items-center justify-center text-amber-300 font-black text-[11px] sm:text-xs shadow-[0_0_12px_rgba(250,204,21,0.5)] group-hover:scale-110 transition-transform">
                  {item.orderNum}
                </div>

                {/* Timeline Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#140a27]/90 border border-purple-900/40 hover:border-purple-500/50 hover:bg-[#1a0d33] transition-all duration-300 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-xs font-black text-white sm:text-base font-['Outfit']">
                        {item.name}
                      </span>
                      {item.isCanon ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase">
                          Kanon
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/30 text-purple-300 text-[10px] font-bold">
                          Qo‘shimcha
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-[#21113d] text-purple-200 font-semibold border border-purple-800/40">
                        {item.year}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-[#21113d] text-amber-300 font-bold border border-purple-800/40">
                        {item.episodes}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed mb-4">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-purple-900/30">
                    <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{item.status}</span>
                    </span>

                    <a
                      href={`https://t.me/Animem_uz_bot?start=${item.telegramStartCode || `anime_${currentFranchise.id}`}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-800 border border-purple-600/40 text-purple-100 text-xs font-extrabold transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Tomosha qilish</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
