import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Trash2, LogOut, Loader2, ShieldAlert, ShieldCheck, Lock, Clock } from 'lucide-react';
import type { Anime } from '../types';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockoutRemainingMs, setLockoutRemainingMs] = useState<number>(0);

  // Dashboard state
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [isEditing, setIsEditing] = useState<Anime | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Anime>>({});

  useEffect(() => {
    // Check lock status on load
    fetch('/api/admin/status')
      .then(res => res.json())
      .then(data => {
        if (data.isLocked && data.remainingMs > 0) {
          setLockoutRemainingMs(data.remainingMs);
          setError(data.message || 'Tizim bloklangan. 30 daqiqadan so\'ng qayta urinib ko\'ring.');
        } else if (typeof data.remainingAttempts === 'number') {
          setRemainingAttempts(data.remainingAttempts);
        }
      })
      .catch(() => {});

    if (token) {
      fetch('/api/admin/verify', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (res.ok) {
          setIsAuthenticated(true);
          fetchAnimes();
        } else {
          localStorage.removeItem('admin_token');
          setToken(null);
        }
      }).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  // Real-time Countdown timer for lockout
  useEffect(() => {
    if (lockoutRemainingMs <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemainingMs(prev => {
        if (prev <= 1000) {
          clearInterval(interval);
          setError('');
          setRemainingAttempts(5);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemainingMs]);

  const formatLockoutTimer = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchAnimes = async () => {
    try {
      const res = await fetch('/api/animes');
      const data = await res.json();
      setAnimes(data.animes || []);
    } catch (e) {
      console.error('Failed to fetch animes', e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemainingMs > 0) return;
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('admin_token', data.token);
        setToken(data.token);
        setIsAuthenticated(true);
        fetchAnimes();
      } else {
        setError(data.error || 'Noto\'g\'ri parol');
        if (data.isLocked && data.remainingMs) {
          setLockoutRemainingMs(data.remainingMs);
        }
        if (typeof data.remainingAttempts === 'number') {
          setRemainingAttempts(data.remainingAttempts);
        }
      }
    } catch (e) {
      setError('Tizim xatosi');
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setIsAuthenticated(false);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/animes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAnimes(animes.filter(a => a.id !== id));
        setDeletingId(null);
      } else {
        const err = await res.json();
        alert(`Xatolik: ${err.error}`);
      }
    } catch (e) {
      alert("Xatolik yuz berdi");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Process form data specific for our Anime structure
    const payload = {
        ...formData,
        genres: typeof formData.genres === 'string' ? (formData.genres as string).split(',').map(s => s.trim()) : formData.genres,
        episodes: formData.episodes || `${formData.total_episodes || 12} / ${formData.total_episodes || 12}`
    };

    try {
      if (isEditing) {
        const res = await fetch(`/api/animes/${isEditing.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setIsEditing(null);
          await fetchAnimes();
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err.error || 'Xatolik yuz berdi');
        }
      } else {
        // Prepare new anime defaults
        payload.slug = (payload.title || 'anime').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);
        
        const res = await fetch('/api/animes', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setIsAdding(false);
          await fetchAnimes();
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err.error || 'Xatolik yuz berdi');
        }
      }
    } catch (e: any) {
      alert("Xatolik yuz berdi: " + (e.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#141414] flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  if (!isAuthenticated) {
    const isLocked = lockoutRemainingMs > 0;

    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center p-4">
        <div className="bg-[#1f1f1f] border border-white/5 p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
          {/* Top Security Glow */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${isLocked ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-r from-purple-500 to-indigo-500'}`} />

          <div className="flex items-center justify-center mb-6">
            {isLocked ? (
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 animate-bounce">
                <ShieldAlert className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Lock className="w-8 h-8" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">Boshqaruv Paneli</h1>
          <p className="text-gray-400 text-xs text-center mb-6">
            Xavfsiz tizim • 5 marta noto'g'ri urinishdan so'ng 30 daqiqaga bloklanadi
          </p>

          {isLocked ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-red-400 font-semibold">
                <Clock className="w-5 h-5 animate-spin" />
                <span>Kirish vaqtincha bloklandi</span>
              </div>
              <p className="text-gray-300 text-sm">
                5 marta xato parol kiritilgani sababli kirish cheklandi.
              </p>
              <div className="py-3 px-4 bg-[#141414] rounded-lg border border-red-500/30 text-2xl font-mono font-bold text-red-400 tracking-wider">
                ⏳ {formatLockoutTimer(lockoutRemainingMs)}
              </div>
              <p className="text-xs text-gray-500">
                Qayta urinish uchun taymer tugashini kuting.
              </p>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-400">Admin Paroli</label>
                  {remainingAttempts !== null && remainingAttempts < 5 && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${remainingAttempts <= 2 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {remainingAttempts} ta urinish qoldi
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm"
                  placeholder="Parolni kiriting..."
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-medium text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Tekshirilmoqda...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Tizimga kirish</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#1f1f1f] p-4 md:p-6 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Boshqaruv Paneli</h1>
              <p className="text-gray-400 text-sm">Animelarni qo'shish va tahrirlash</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setFormData({});
                setIsAdding(true);
              }}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Yangi qo'shish</span>
            </button>
            <button
              onClick={handleLogout}
              className="bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <LogOut className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="bg-[#1f1f1f] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#141414] text-gray-400 font-medium">
                <tr>
                  <th className="px-6 py-4">Anime</th>
                  <th className="px-6 py-4">Kategoriya</th>
                  <th className="px-6 py-4">Yil</th>
                  <th className="px-6 py-4">Qismlar</th>
                  <th className="px-6 py-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {animes.map(anime => (
                  <tr key={anime.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={anime.poster_url || anime.banner_url} alt={anime.title} className="w-10 h-14 object-cover rounded-md bg-[#141414]" />
                        <div>
                          <p className="font-medium">{anime.title}</p>
                          {anime.original_title && <p className="text-xs text-gray-500">{anime.original_title}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-white/10 text-gray-300 px-2.5 py-1 rounded-full text-xs font-medium capitalize">
                        {anime.category?.replace('_', ' ') || 'Noma\'lum'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{anime.year}</td>
                    <td className="px-6 py-4 text-gray-400">{anime.total_episodes || 12}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setFormData({
                                ...anime,
                                genres: Array.isArray(anime.genres) ? anime.genres.join(', ') : anime.genres
                            });
                            setIsEditing(anime);
                          }}
                          className="p-2 bg-white/5 hover:bg-white/10 text-blue-400 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(anime.id)}
                          className="p-2 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1f1f1f] rounded-2xl w-full max-w-md border border-white/5 p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Animeni o'chirish</h2>
              <p className="text-gray-400">Rostdan ham bu animeni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(isAdding || isEditing) && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1f1f1f] rounded-2xl w-full max-w-2xl border border-white/5 my-8">
            <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#1f1f1f] rounded-t-2xl z-10">
              <h2 className="text-xl font-bold">{isEditing ? 'Animeni tahrirlash' : 'Yangi anime qo\'shish'}</h2>
              <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="text-gray-400 hover:text-white">
                O'chirish (Bekor qilish)
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nomi</label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-[#141414] border border-white/10 rounded-lg px-4 py-2.5 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Asl nomi (Opsional)</label>
                  <input
                    type="text"
                    value={formData.original_title || ''}
                    onChange={e => setFormData({...formData, original_title: e.target.value})}
                    className="w-full bg-[#141414] border border-white/10 rounded-lg px-4 py-2.5 focus:border-primary focus:outline-none"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-400">Poster (Rasm)</label>
                    <label className="text-xs text-purple-400 hover:text-purple-300 cursor-pointer flex items-center gap-1 font-semibold">
                      📁 Qurilmadan yuklash
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = async (ev) => {
                            const base64Data = ev.target?.result as string;
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
                                setFormData({
                                  ...formData,
                                  poster_url: resData.url,
                                  banner_url: resData.url,
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  poster_url: base64Data,
                                  banner_url: base64Data,
                                });
                              }
                            } catch {
                              setFormData({
                                ...formData,
                                poster_url: base64Data,
                                banner_url: base64Data,
                              });
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="https://bot.animem.uz/api/image/... yoki qurilmadan yuklang"
                    value={formData.poster_url || ''}
                    onChange={e => setFormData({...formData, poster_url: e.target.value, banner_url: formData.banner_url || e.target.value})}
                    className="w-full bg-[#141414] border border-white/10 rounded-lg px-4 py-2.5 focus:border-primary focus:outline-none"
                  />
                  {formData.poster_url && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={formData.poster_url} alt="Preview" className="w-12 h-16 object-cover rounded border border-white/10" />
                      <span className="text-[11px] text-green-400">✓ Rasm tanlandi</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Kategoriya</label>
                  <select
                    value={formData.category || 'yangi'}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-[#141414] border border-white/10 rounded-lg px-4 py-2.5 focus:border-primary focus:outline-none text-white"
                  >
                    <option value="yangi">Yangi Animelar</option>
                    <option value="songgi">So'nggi Yangilanishlar</option>
                    <option value="birinchilardan">Birinchilardan Bo'ling</option>
                    <option value="bugungi_top">Bugungi Top</option>
                    <option value="oylik_top">Oylik Top</option>
                    <option value="filmlar">Filmlar</option>
                    <option value="tasodifiy">Tasodifiy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Janrlar (vergul bilan)</label>
                  <input
                    type="text"
                    required
                    value={formData.genres || ''}
                    onChange={e => setFormData({...formData, genres: e.target.value})}
                    className="w-full bg-[#141414] border border-white/10 rounded-lg px-4 py-2.5 focus:border-primary focus:outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Qismlar soni</label>
                    <input
                      type="number"
                      required
                      value={formData.total_episodes || ''}
                      onChange={e => setFormData({...formData, total_episodes: parseInt(e.target.value), current_episode: parseInt(e.target.value)})}
                      className="w-full bg-[#141414] border border-white/10 rounded-lg px-4 py-2.5 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Yil</label>
                    <input
                      type="number"
                      required
                      value={formData.year || ''}
                      onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
                      className="w-full bg-[#141414] border border-white/10 rounded-lg px-4 py-2.5 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Tavsif (Syujet)</label>
                <textarea
                  rows={4}
                  value={formData.description || ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-[#141414] border border-white/10 rounded-lg px-4 py-2.5 focus:border-primary focus:outline-none resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => { setIsAdding(false); setIsEditing(null); }}
                  className="px-6 py-2.5 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-purple-900/30"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saqlanmoqda...</span>
                    </>
                  ) : (
                    <span>Saqlash</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
