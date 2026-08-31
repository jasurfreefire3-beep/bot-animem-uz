import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { PassBanner } from './components/PassBanner';
import { RecentUpdatesSection } from './components/RecentUpdatesSection';
import { SectionGrid } from './components/SectionGrid';
import { AnimeDetailPage } from './components/AnimeDetailPage';
import { TelegramBotModal } from './components/TelegramBotModal';
import { PassModal } from './components/PassModal';
import { PassRequiredModal } from './components/PassRequiredModal';
import { SearchModal } from './components/SearchModal';
import { AddAnimeModal } from './components/AddAnimeModal';
import { DatabaseManagerModal } from './components/DatabaseManagerModal';
import { Footer } from './components/Footer';
import AdminPage from './pages/AdminPage';
import { Anime, CategorySection, DBStatus } from './types';
import {
  Flame,
  Film,
  Tv,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [sections, setSections] = useState<CategorySection[]>([]);
  const [allAnimes, setAllAnimes] = useState<Anime[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [telegramModalAnime, setTelegramModalAnime] = useState<Anime | null>(null);
  const [isPassOpen, setIsPassOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDbManagerOpen, setIsDbManagerOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<DBStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Check URL pathname for /admin or /anime/:idOrSlug
  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname === '/admin') {
      setIsAdminRoute(true);
      return;
    }

    const animeMatch = pathname.match(/^\/anime\/([^\/\?#]+)/);
    if (animeMatch) {
      const idOrSlug = animeMatch[1];
      fetch(`/api/animes/${idOrSlug}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.id) {
            setSelectedAnime(data);
          }
        })
        .catch((err) => console.error('Error loading anime from URL:', err));
    }

    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (currentPath === '/admin') {
        setIsAdminRoute(true);
        setSelectedAnime(null);
      } else if (currentPath.startsWith('/anime/')) {
        const match = currentPath.match(/^\/anime\/([^\/\?#]+)/);
        if (match) {
          const targetId = match[1];
          fetch(`/api/animes/${targetId}`)
            .then((r) => r.json())
            .then((d) => {
              if (d && d.id) setSelectedAnime(d);
            })
            .catch(() => {});
        }
      } else {
        setIsAdminRoute(false);
        setSelectedAnime(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectAnime = (anime: Anime | null) => {
    setSelectedAnime(anime);
    if (anime) {
      const newUrl = `/anime/${anime.id}`;
      if (window.location.pathname !== newUrl) {
        window.history.pushState({ animeId: anime.id }, '', newUrl);
      }
    } else {
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
      }
    }
  };

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [secRes, allRes, statusRes] = await Promise.all([
        fetch('/api/sections'),
        fetch('/api/animes'),
        fetch('/api/db-status')
      ]);

      const secData = await secRes.json();
      const allData = await allRes.json();
      const statusData = await statusRes.json();

      if (secData.sections) setSections(secData.sections);
      if (allData.animes) setAllAnimes(allData.animes);
      setDbStatus(statusData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdminRoute) {
      fetchData();
    }
  }, [isAdminRoute]);

  // Filtered animes when searching or selecting quick filter
  const filteredAnimes = useMemo(() => {
    let list = [...allAnimes];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.original_title.toLowerCase().includes(q) ||
          (a.russian_title && a.russian_title.toLowerCase().includes(q)) ||
          a.genres.some((g) => g.toLowerCase().includes(q))
      );
    }

    if (activeFilter === 'film') {
      list = list.filter((a) => a.type === 'Film');
    } else if (activeFilter === 'serial') {
      list = list.filter((a) => a.type === 'TV serial');
    } else if (activeFilter === 'top') {
      list = list.filter((a) => a.rating >= 8.5);
    } else if (activeFilter === 'dub') {
      list = list.filter((a) => a.dub_available);
    }

    return list;
  }, [allAnimes, searchQuery, activeFilter]);

  const handleAnimeAdded = (newAnime: Anime) => {
    setAllAnimes((prev) => [newAnime, ...prev]);
    fetchData();
  };

  const handleAnimeUpdated = (updatedAnime: Anime) => {
    setAllAnimes((prev) => prev.map((a) => (a.id === updatedAnime.id ? updatedAnime : a)));
    fetchData();
  };

  const handleAnimeDeleted = (id: number) => {
    setAllAnimes((prev) => prev.filter((a) => a.id !== id));
    fetchData();
  };

  if (isAdminRoute) {
    return <AdminPage />;
  }

  return (
    <div className="min-h-screen bg-[#0a0614] text-[#e2e0ea] flex flex-col selection:bg-purple-600 selection:text-white">
      
      {/* Top Sticky Navbar with Animem Uz Bot logo & search */}
      <Navbar
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onOpenAnime={handleSelectAnime}
        onOpenSearchModal={() => setIsSearchModalOpen(true)}
        onOpenPass={() => setIsPassOpen(true)}
        onGoHome={() => {
          handleSelectAnime(null);
          setSearchQuery('');
          setActiveFilter('all');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-20 sm:pt-24">
        {selectedAnime ? (
          /* Dedicated Anime Page View matching user screenshot */
          <AnimeDetailPage
            anime={selectedAnime}
            onBack={() => handleSelectAnime(null)}
            onOpenPass={() => setIsPassOpen(true)}
            onOpenTelegramModal={(anime) => setTelegramModalAnime(anime)}
          />
        ) : (
          <>
            {/* Hero Banner with stylized Animem Uz Bot visual */}
            <HeroBanner
              searchQuery={searchQuery}
              onSearch={setSearchQuery}
              onOpenSearchModal={() => setIsSearchModalOpen(true)}
              onExploreClick={() => {
                const el = document.getElementById('anime-sections');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Quick Filter Badges (Scrollable horizontally on mobile) */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 my-3 sm:my-4 scrollbar-none">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeFilter === 'all'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                    : 'bg-[#150f26] text-purple-300/80 hover:text-white border border-purple-900/40'
                }`}
              >
                Barchasi
              </button>
              <button
                onClick={() => setActiveFilter('serial')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeFilter === 'serial'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                    : 'bg-[#150f26] text-purple-300/80 hover:text-white border border-purple-900/40'
                }`}
              >
                <Tv className="w-3 h-3" />
                TV Seriallar
              </button>
              <button
                onClick={() => setActiveFilter('film')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeFilter === 'film'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                    : 'bg-[#150f26] text-purple-300/80 hover:text-white border border-purple-900/40'
                }`}
              >
                <Film className="w-3 h-3" />
                Filmlar
              </button>
              <button
                onClick={() => setActiveFilter('top')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeFilter === 'top'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                    : 'bg-[#150f26] text-purple-300/80 hover:text-white border border-purple-900/40'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-400" />
                Top Reyting
              </button>
              <button
                onClick={() => setActiveFilter('dub')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeFilter === 'dub'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                    : 'bg-[#150f26] text-purple-300/80 hover:text-white border border-purple-900/40'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                O'zbekcha Dublyaj
              </button>
            </div>

            {/* Content View: Sections matching screenshot exactly */}
            {searchQuery.trim() || activeFilter !== 'all' ? (
              <div className="my-5 sm:my-7">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm sm:text-base font-black tracking-wider uppercase text-white font-['Outfit']">
                    {searchQuery.trim() ? `Qidiruv: "${searchQuery}"` : `Filtrlangan animelar`}
                    <span className="ml-2 text-xs text-purple-400 font-normal">({filteredAnimes.length} ta topildi)</span>
                  </h2>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3.5">
                  {filteredAnimes.map((anime) => (
                    <div key={anime.id}>
                      <SectionGrid
                        title=""
                        items={[anime]}
                        onOpenAnime={handleSelectAnime}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div id="anime-sections">
                {/* Section 1: YANGI ANIMELAR (4 cards horizontal on mobile) */}
                {sections.find((s) => s.id === 'yangi') && (
                  <SectionGrid
                    title="YANGI ANIMELAR"
                    items={sections.find((s) => s.id === 'yangi')!.items}
                    onOpenAnime={handleSelectAnime}
                  />
                )}

                {/* Kawaii Pass Gold Banner */}
                <PassBanner onOpenPass={() => setIsPassOpen(true)} />

                {/* Section 2: SO'NGGI YANGILANISHLAR (2 cards side by side on mobile) */}
                {sections.find((s) => s.id === 'songgi') && (
                  <RecentUpdatesSection
                    animes={sections.find((s) => s.id === 'songgi')!.items}
                    onOpenAnime={handleSelectAnime}
                  />
                )}

                {/* Section 3: BIRINCHILARDAN BO'LING (4 cards horizontal on mobile) */}
                {sections.find((s) => s.id === 'birinchilardan') && (
                  <SectionGrid
                    title="BIRINCHILARDAN BO'LING"
                    items={sections.find((s) => s.id === 'birinchilardan')!.items}
                    onOpenAnime={handleSelectAnime}
                  />
                )}

                {/* Section 4: BUGUNGI TOP (4 cards horizontal on mobile) */}
                {sections.find((s) => s.id === 'bugungi_top') && (
                  <SectionGrid
                    title="BUGUNGI TOP"
                    items={sections.find((s) => s.id === 'bugungi_top')!.items}
                    onOpenAnime={handleSelectAnime}
                  />
                )}

                {/* Section 5: OYLIK TOP (4 cards horizontal on mobile) */}
                {sections.find((s) => s.id === 'oylik_top') && (
                  <SectionGrid
                    title="OYLIK TOP"
                    items={sections.find((s) => s.id === 'oylik_top')!.items}
                    onOpenAnime={handleSelectAnime}
                  />
                )}

                {/* Section 6: FILMLAR (4 cards horizontal on mobile) */}
                {sections.find((s) => s.id === 'filmlar') && (
                  <SectionGrid
                    title="FILMLAR"
                    items={sections.find((s) => s.id === 'filmlar')!.items}
                    onOpenAnime={handleSelectAnime}
                  />
                )}

                {/* Section 7: TASODIFIY (4 cards horizontal on mobile) */}
                {sections.find((s) => s.id === 'tasodifiy') && (
                  <SectionGrid
                    title="TASODIFIY"
                    items={sections.find((s) => s.id === 'tasodifiy')!.items}
                    onOpenAnime={handleSelectAnime}
                  />
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Telegram Bot Direct Watch & Redirect Modal */}
      <TelegramBotModal
        anime={telegramModalAnime}
        onClose={() => setTelegramModalAnime(null)}
      />

      {/* Pass VIP Modal */}
      <PassModal
        isOpen={isPassOpen}
        onClose={() => setIsPassOpen(false)}
      />

      {/* Pass Required Warning Modal (Pop up in center if locked feature clicked) */}
      <PassRequiredModal
        onOpenPassModal={() => setIsPassOpen(true)}
      />

      {/* Full-Screen QIDIRUV Search Modal matching screenshot */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectAnime={handleSelectAnime}
        allAnimes={allAnimes}
      />

      {/* Add Anime Modal for Postgres CRUD & Admin Management */}
      <AddAnimeModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdded={handleAnimeAdded}
        onUpdated={handleAnimeUpdated}
        onDeleted={handleAnimeDeleted}
        allAnimes={allAnimes}
      />

      {/* PostgreSQL Database Manager Modal */}
      <DatabaseManagerModal
        isOpen={isDbManagerOpen}
        onClose={() => setIsDbManagerOpen(false)}
        dbStatus={dbStatus}
        onRefresh={fetchData}
      />

      {/* Footer matching screenshot */}
      <Footer
        onOpenPass={() => setIsPassOpen(true)}
        onOpenBotInfo={() => {
          if (allAnimes.length > 0) setTelegramModalAnime(allAnimes[0]);
        }}
      />
    </div>
  );
}
