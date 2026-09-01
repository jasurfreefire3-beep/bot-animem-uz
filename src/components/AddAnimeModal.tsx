import React, { useState, useMemo, useRef } from 'react';
import { 
  X, 
  Plus, 
  Database, 
  Check, 
  Trash2, 
  Edit3, 
  Search, 
  Film, 
  Tv, 
  Sparkles,
  AlertTriangle,
  RefreshCw,
  UploadCloud,
  Image as ImageIcon,
  HardDrive,
  CheckCircle2,
  Link as LinkIcon
} from 'lucide-react';
import { Anime } from '../types';

interface AddAnimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (anime: Anime) => void;
  onDeleted?: (id: number) => void;
  onUpdated?: (anime: Anime) => void;
  allAnimes?: Anime[];
}

export const AddAnimeModal: React.FC<AddAnimeModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdded,
  onDeleted,
  onUpdated,
  allAnimes = []
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'edit'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAnime, setEditingAnime] = useState<Anime | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [russianTitle, setRussianTitle] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [imageSizeKB, setImageSizeKB] = useState<number | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<'TV serial' | 'Film' | 'OVA (Maxsus)'>('TV serial');
  const [episodes, setEpisodes] = useState('12 / 12');
  const [year, setYear] = useState('2024');
  const [rating, setRating] = useState('8.5');
  const [genres, setGenres] = useState('Jangari, Sarguzasht, Fantaziya');
  const [category, setCategory] = useState<'yangi' | 'songgi' | 'filmlar' | 'tasodifiy'>('yangi');
  const [telegramCode, setTelegramCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const [uploadStatusText, setUploadStatusText] = useState('');

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Iltimos, faqat rasm fayllarini yuklang (PNG, JPG, WEBP)');
      return;
    }

    setIsProcessingImage(true);
    setUploadStatusText("Rasm tayyorlanmoqda va PostgreSQL bazasiga yuklanmoqda...");
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        try {
          const res = await fetch('/api/upload/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: base64Data,
              filename: file.name,
              mimeType: file.type || 'image/jpeg',
            }),
          });

          const resData = await res.json();
          if (res.ok && resData.url) {
            setPosterUrl(resData.url);
            setImageSizeKB(resData.size_kb || Math.round(file.size / 1024));
            setSuccessMsg(`Rasm PostgreSQL bazasida saqlandi: ${resData.filename}`);
            setTimeout(() => setSuccessMsg(''), 4000);
          } else {
            // Fallback to local base64 if server upload had an issue
            setPosterUrl(base64Data);
            setImageSizeKB(Math.round(file.size / 1024));
          }
        } catch (uploadErr: any) {
          console.warn('Image upload error, fallback to data url:', uploadErr);
          setPosterUrl(base64Data);
          setImageSizeKB(Math.round(file.size / 1024));
        } finally {
          setIsProcessingImage(false);
          setUploadStatusText('');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsProcessingImage(false);
      setUploadStatusText('');
      setError("Rasmni yuklashda xatolik yuz berdi: " + (err.message || ''));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const resetForm = () => {
    setTitle('');
    setOriginalTitle('');
    setRussianTitle('');
    setDescription('');
    setPosterUrl('');
    setImageSizeKB(null);
    setImageMode('upload');
    setType('TV serial');
    setEpisodes('12 / 12');
    setYear('2024');
    setRating('8.5');
    setGenres('Jangari, Sarguzasht, Fantaziya');
    setCategory('yangi');
    setTelegramCode('');
    setEditingAnime(null);
    setError('');
  };

  const handleStartEdit = (anime: Anime) => {
    setEditingAnime(anime);
    setTitle(anime.title);
    setOriginalTitle(anime.original_title || '');
    setRussianTitle(anime.russian_title || '');
    setDescription(anime.description || '');
    setPosterUrl(anime.poster_url || '');
    if (anime.poster_url?.startsWith('data:')) {
      const sizeInKB = Math.round((anime.poster_url.length * 3) / 4 / 1024);
      setImageSizeKB(sizeInKB);
      setImageMode('upload');
    } else {
      setImageMode('url');
      setImageSizeKB(null);
    }
    setType((anime.type as any) || 'TV serial');
    setEpisodes(anime.episodes || `${anime.current_episode || 1} / ${anime.total_episodes || 12}`);
    setYear(String(anime.year || 2024));
    setRating(String(anime.rating || 8.5));
    setGenres(anime.genres ? anime.genres.join(', ') : '');
    setCategory((anime.category as any) || 'yangi');
    setTelegramCode(anime.telegram_code || '');
    setActiveTab('edit');
  };

  const handleDelete = async (anime: Anime) => {
    if (!window.confirm(`Haqiqatdan ham "${anime.title}" animeni PostgreSQL bazasidan butunlay o'chirmoqchimisiz?`)) {
      return;
    }

    setDeletingId(anime.id);
    setError('');
    try {
      const res = await fetch(`/api/animes/${anime.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`"${anime.title}" muvaffaqiyatli o'chirildi!`);
        setTimeout(() => setSuccessMsg(''), 3000);
        if (onDeleted) onDeleted(anime.id);
      } else {
        setError(data.error || "O'chirishda xatolik yuz berdi");
      }
    } catch (err: any) {
      setError(err.message || "O'chirishda xatolik");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Iltimos, anime nomini kiriting');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const epMatch = episodes.match(/(\d+)\s*\/\s*(\d+)/);
    const currEp = epMatch ? parseInt(epMatch[1], 10) : 12;
    const totEp = epMatch ? parseInt(epMatch[2], 10) : 12;

    const payload = {
      ...(editingAnime ? editingAnime : {}),
      title,
      original_title: originalTitle || title,
      russian_title: russianTitle || '',
      description: description || "Ushbu ajoyib animeni o'zbek tilida tomosha qiling.",
      poster_url: posterUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
      type,
      episodes,
      current_episode: currEp,
      total_episodes: totEp,
      year: parseInt(year, 10) || 2024,
      rating: parseFloat(rating) || 8.0,
      views_count: editingAnime?.views_count || 100,
      status: 'Tugallangan',
      duration: type === 'Film' ? '110 daq.' : '24 daq.',
      age_rating: '13+',
      genres: genres.split(',').map(g => g.trim()).filter(Boolean),
      category,
      sub_available: true,
      dub_available: true,
      telegram_code: telegramCode || `anime_${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      metadata: {
        updated_via: 'Admin Panel',
        source: 'PostgreSQL DB'
      }
    };

    try {
      if (editingAnime) {
        const res = await fetch(`/api/animes/${editingAnime.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const updated = await res.json();
        setSuccessMsg(`"${updated.title}" muvaffaqiyatli tahrirlandi!`);
        if (onUpdated) onUpdated(updated);
      } else {
        const res = await fetch('/api/animes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const created = await res.json();
        setSuccessMsg(`"${created.title}" PostgreSQL bazaga qo'shildi!`);
        onAdded(created);
      }

      setTimeout(() => setSuccessMsg(''), 3000);
      resetForm();
      setActiveTab('list');
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return allAnimes;
    const q = searchQuery.toLowerCase();
    return allAnimes.filter(a => 
      a.title.toLowerCase().includes(q) ||
      a.original_title.toLowerCase().includes(q)
    );
  }, [allAnimes, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-[#110a21] border border-purple-800/60 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-purple-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-['Outfit']">Admin Panel (PostgreSQL Animelar Boshqaruvi)</h2>
              <p className="text-xs text-purple-300/70">Animelarni qo'shish, tahrirlash va o'chirish</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-purple-950/60 hover:bg-purple-900 flex items-center justify-center text-purple-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-purple-900/40 px-5 pt-3 gap-3 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'list'
                ? 'border-purple-400 text-white'
                : 'border-transparent text-purple-400/60 hover:text-purple-300'
            }`}
          >
            <span>Barcha Animelar ({allAnimes.length}) & O'chirish</span>
          </button>
          
          <button
            onClick={() => {
              resetForm();
              setActiveTab('add');
            }}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'border-purple-400 text-white'
                : 'border-transparent text-purple-400/60 hover:text-purple-300'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Yangi Anime Qo'shish</span>
          </button>

          {editingAnime && (
            <button
              onClick={() => setActiveTab('edit')}
              className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'edit'
                  ? 'border-purple-400 text-white'
                  : 'border-transparent text-purple-400/60 hover:text-purple-300'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Tahrirlash: {editingAnime.title.slice(0, 15)}...</span>
            </button>
          )}
        </div>

        {/* Messages */}
        {successMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: ALL ANIMES LIST WITH SEARCH & DELETE */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Bazadan anime qidirish..."
                  className="w-full pl-9 pr-4 py-2 bg-[#170f2b] rounded-xl border border-purple-800/40 text-xs text-white placeholder-purple-400/40 outline-none focus:border-purple-500"
                />
              </div>

              {/* Animes Table / Cards */}
              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                {filteredList.length === 0 ? (
                  <div className="text-center py-8 text-xs text-purple-400/60">
                    Anime topilmadi
                  </div>
                ) : (
                  filteredList.map((anime) => (
                    <div
                      key={anime.id}
                      className="p-2.5 rounded-xl bg-[#170f2b]/80 hover:bg-[#1f1338] border border-purple-900/40 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={anime.poster_url}
                          alt={anime.title}
                          className="w-10 h-14 object-cover rounded-lg shrink-0 border border-purple-900/50"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{anime.title}</h4>
                          <p className="text-[11px] text-purple-300/60 truncate">{anime.original_title || anime.slug}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 font-mono">
                              ID: {anime.id}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/40 text-indigo-300">
                              {anime.type}
                            </span>
                            <span className="text-[10px] text-amber-400">★ {anime.rating}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleStartEdit(anime)}
                          className="p-2 rounded-lg bg-purple-900/40 hover:bg-purple-800 text-purple-200 hover:text-white transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDelete(anime)}
                          disabled={deletingId === anime.id}
                          className="p-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-rose-100 transition-colors border border-rose-500/20"
                          title="PostgreSQL Bazadan O'chirish"
                        >
                          <Trash2 className={`w-4 h-4 ${deletingId === anime.id ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2 & 3: ADD OR EDIT FORM */}
          {(activeTab === 'add' || activeTab === 'edit') && (
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/30 text-purple-300">
                {activeTab === 'edit' ? (
                  <span>✏️ <strong>"{editingAnime?.title}"</strong> animeni tahrirlamoqdasiz. Saqlash tugmasini bosganingizda PostgreSQL bazasidagi ma'lumotlar to'g'ridan-to'g'ri yangilanadi.</span>
                ) : (
                  <span>➕ Yangi anime qo'shilganda u to'g'ridan-to'g'ri PostgreSQL bazasidagi <code className="text-purple-200 font-mono">animes</code> jadvaliga yoziladi.</span>
                )}
              </div>

              <div>
                <label className="block text-purple-300 mb-1">Anime nomi (O'zbekcha) *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masalan: Qasoskorlar maktabi"
                  className="w-full px-3 py-2 bg-[#180f2e] rounded-xl border border-purple-800/40 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-purple-300 mb-1">Original nomi (Yaponcha/Inglizcha)</label>
                  <input
                    type="text"
                    value={originalTitle}
                    onChange={(e) => setOriginalTitle(e.target.value)}
                    placeholder="Tokyo Revengers"
                    className="w-full px-3 py-2 bg-[#180f2e] rounded-xl border border-purple-800/40 text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-purple-300 mb-1">Telegram Start Kodi</label>
                  <input
                    type="text"
                    value={telegramCode}
                    onChange={(e) => setTelegramCode(e.target.value)}
                    placeholder="anime_tokyo_rev"
                    className="w-full px-3 py-2 bg-[#180f2e] rounded-xl border border-purple-800/40 text-white outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-purple-300 mb-1">Turi</label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#180f2e] rounded-xl border border-purple-800/40 text-white outline-none focus:border-purple-500"
                  >
                    <option value="TV serial">TV serial</option>
                    <option value="Film">Film</option>
                    <option value="OVA (Maxsus)">OVA (Maxsus)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-purple-300 mb-1">Epizodlar</label>
                  <input
                    type="text"
                    value={episodes}
                    onChange={(e) => setEpisodes(e.target.value)}
                    placeholder="12 / 12"
                    className="w-full px-3 py-2 bg-[#180f2e] rounded-xl border border-purple-800/40 text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-purple-300 mb-1">Kategoriya</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#180f2e] rounded-xl border border-purple-800/40 text-white outline-none focus:border-purple-500"
                  >
                    <option value="yangi">Yangi</option>
                    <option value="songgi">So'nggi</option>
                    <option value="filmlar">Filmlar</option>
                    <option value="tasodifiy">Tasodifiy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-purple-300 mb-1">Chiqarilgan Yil</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2024"
                    className="w-full px-3 py-2 bg-[#180f2e] rounded-xl border border-purple-800/40 text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-purple-300 mb-1">Reyting (1.0 - 10.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    placeholder="8.5"
                    className="w-full px-3 py-2 bg-[#180f2e] rounded-xl border border-purple-800/40 text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-purple-300 mb-1">Janrlar (vergul bilan ajrating)</label>
                <input
                  type="text"
                  value={genres}
                  onChange={(e) => setGenres(e.target.value)}
                  placeholder="Ekshn, Sarguzasht, Fantaziya"
                  className="w-full px-3 py-2 bg-[#180f2e] rounded-xl border border-purple-800/40 text-white outline-none focus:border-purple-500"
                />
              </div>

              {/* Poster Image Section: Upload from Device or URL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-purple-300 font-semibold text-xs">
                    Anime Posteri (Rasm) *
                  </label>
                  <div className="flex items-center gap-1 bg-[#180f2e] p-1 rounded-lg border border-purple-800/40 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setImageMode('upload')}
                      className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                        imageMode === 'upload'
                          ? 'bg-purple-600 text-white font-bold'
                          : 'text-purple-300/70 hover:text-white'
                      }`}
                    >
                      <UploadCloud className="w-3 h-3" />
                      <span>Qurilmadan yuklash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('url')}
                      className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                        imageMode === 'url'
                          ? 'bg-purple-600 text-white font-bold'
                          : 'text-purple-300/70 hover:text-white'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>URL havola</span>
                    </button>
                  </div>
                </div>

                {imageMode === 'upload' ? (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp, image/gif"
                      onChange={handleFileInput}
                      className="hidden"
                    />

                    {posterUrl ? (
                      <div className="relative p-3 rounded-2xl bg-[#180f2e] border border-purple-800/50 flex items-center gap-4">
                        <img
                          src={posterUrl}
                          alt="Poster Preview"
                          className="w-16 h-22 object-cover rounded-xl border border-purple-500/40 shadow-md shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs mb-1">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>Rasm muvaffaqiyatli tanlandi!</span>
                          </div>
                          <p className="text-[11px] text-purple-300/80">
                            {imageSizeKB ? `Hajmi: ~${imageSizeKB} KB` : 'Base64 Formati'}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-indigo-300/90 mt-1 font-mono">
                            <HardDrive className="w-3 h-3 text-indigo-400" />
                            <span>PostgreSQL JSONB ichida saqlanadi (server diskida emas)</span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-2 py-1 rounded bg-purple-900/60 hover:bg-purple-800 text-[10px] text-purple-200 font-bold"
                            >
                              Boshqa rasm tanlash
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPosterUrl('');
                                setImageSizeKB(null);
                              }}
                              className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-[10px] text-rose-300 font-bold"
                            >
                              O'chirish
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                          isDragging
                            ? 'border-purple-400 bg-purple-950/40'
                            : 'border-purple-800/60 bg-[#160d2b]/80 hover:bg-[#1b1036] hover:border-purple-600'
                        }`}
                      >
                        {isProcessingImage ? (
                          <div className="flex flex-col items-center gap-2">
                            <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
                            <span className="text-xs text-purple-300">Rasm qayta ishlanmoqda...</span>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-purple-900/40 flex items-center justify-center text-purple-300 mb-2">
                              <UploadCloud className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-bold text-white mb-0.5">
                              Kompyuter yoki telefondan rasm tanlang
                            </p>
                            <p className="text-[11px] text-purple-300/60 mb-2">
                              yoki rasmni bu yerga tashlang (PNG, JPG, WEBP)
                            </p>
                            <span className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] shadow-sm">
                              Qurilmadan fayl tanlash
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-purple-400/80 mt-2.5">
                              <Database className="w-3 h-3 text-indigo-400" />
                              <span>Rasm to'g'ridan-to'g'ri PostgreSQL bazasida saqlanadi</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={posterUrl}
                      onChange={(e) => setPosterUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... yoki rasm havolasi"
                      className="w-full px-3 py-2 bg-[#180f2e] rounded-xl border border-purple-800/40 text-white outline-none focus:border-purple-500"
                    />
                    <p className="text-[10px] text-purple-400/60 mt-1">
                      Internetdagi rasm havolasini kiriting
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-purple-300 mb-1">Tavsif</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Anime syujeti haqida qisqacha ma'lumot..."
                  className="w-full px-3 py-2 bg-[#180f2e] rounded-xl border border-purple-800/40 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab('list');
                  }}
                  className="py-2.5 px-4 rounded-xl bg-purple-950/60 hover:bg-purple-900 text-purple-300 font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg shadow-purple-950 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : activeTab === 'edit' ? (
                    <Edit3 className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>
                    {isSubmitting
                      ? "Saqlanmoqda..."
                      : activeTab === 'edit'
                      ? "PostgreSQL Bazada Yangilash"
                      : "PostgreSQL Bazaga Qo'shish"}
                  </span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
