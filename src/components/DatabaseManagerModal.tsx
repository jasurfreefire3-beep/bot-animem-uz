import React, { useState } from 'react';
import {
  X,
  Database,
  Check,
  Copy,
  RefreshCw,
  Server,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  Code,
  Download,
  ExternalLink,
  Terminal
} from 'lucide-react';
import { DBStatus } from '../types';

interface DatabaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbStatus: DBStatus | null;
  onRefresh: () => void;
}

export const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({
  isOpen,
  onClose,
  dbStatus,
  onRefresh,
}) => {
  const [host, setHost] = useState(dbStatus?.host || 'psql.fr-roub1.bengt.wasmernet.com');
  const [port, setPort] = useState(String(dbStatus?.port || '20184'));
  const [database, setDatabase] = useState(dbStatus?.database || 'Animembot');
  const [user, setUser] = useState(dbStatus?.user || 'user_db8f7558');
  const [password, setPassword] = useState('pw_6RUM4wvuayjkvEyDWjfQeXT18r5J0V0r');
  const [isLoading, setIsLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'adminer' | 'status' | 'setup' | 'sql'>('adminer');

  if (!isOpen) return null;

  const handleTestAndSeed = async () => {
    setIsLoading(true);
    setResultMsg(null);
    try {
      const res = await fetch('/api/db-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port: Number(port) || 20184,
          database,
          user,
          password
        })
      });
      const data = await res.json();
      if (data.success) {
        setResultMsg({
          type: 'success',
          text: `Muvaffaqiyatli! PostgreSQL bazasida 'animes' jadvali yaratildi va ${data.count} ta anime JSONB formatda yuklandi.`
        });
        onRefresh();
      } else {
        setResultMsg({
          type: 'error',
          text: data.error || 'Ulanishda xatolik yuz berdi. Wasmer Adminer orqali SQL-so\'rovni bajaring.'
        });
      }
    } catch (err: any) {
      setResultMsg({
        type: 'error',
        text: err.message || 'Tarmoq xatoligi'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sqlCode = dbStatus?.sqlSchema || '';

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleDownloadSql = () => {
    window.open('/api/download-sql', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-[#110a21] border border-purple-800/60 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-purple-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-['Outfit']">PostgreSQL Jadvallarini Yaratish</h2>
              <p className="text-xs text-purple-300/70">Wasmer DB Explorer (Adminer) yoki to'g'ridan-to'g'ri DDL orqali</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-purple-950 text-purple-300 hover:text-white border border-purple-800/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-purple-900/40 px-5 sm:px-6 pt-3 gap-3 sm:gap-4 text-xs font-bold overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('adminer')}
            className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'adminer'
                ? 'border-purple-400 text-white'
                : 'border-transparent text-purple-400/60 hover:text-purple-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Wasmer Adminer Qo'llanma (1 daqiqada)</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-purple-400 text-white'
                : 'border-transparent text-purple-400/60 hover:text-purple-300'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>To'liq SQL Kod (26 ta Anime)</span>
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'setup'
                ? 'border-purple-400 text-white'
                : 'border-transparent text-purple-400/60 hover:text-purple-300'
            }`}
          >
            Avtomatik Ulanish
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'status'
                ? 'border-purple-400 text-white'
                : 'border-transparent text-purple-400/60 hover:text-purple-300'
            }`}
          >
            Baza Holati
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {resultMsg && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                resultMsg.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}
            >
              {resultMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span>{resultMsg.text}</span>
            </div>
          )}

          {/* TAB 1: Wasmer Adminer Quick Instruction (Matches screenshot) */}
          {activeTab === 'adminer' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#160d2c] border border-purple-800/40 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-600 text-white text-xs">!</span>
                  Wasmer DB Explorer (Adminer) oynasida jadvallarni ochish:
                </h3>

                <div className="space-y-2 text-purple-200/90 pl-1">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-purple-900 border border-purple-700/60 flex items-center justify-center text-[11px] font-bold shrink-0 text-purple-300">1</span>
                    <p>
                      Siz ochgan Wasmer Adminer oynasida chapdagi <strong className="text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">«SQL-запрос»</strong> (yoki <strong>«Импорт»</strong>) tugmasini bosing.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-purple-900 border border-purple-700/60 flex items-center justify-center text-[11px] font-bold shrink-0 text-purple-300">2</span>
                    <p>
                      Quyidagi <strong className="text-white">«SQL Kodidan Nusxa Olish»</strong> tugmasini bosing (barcha <code className="text-purple-200 font-mono">animes</code> jadvali va 26 ta anime kodi avtomatik nusxalanadi).
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-purple-900 border border-purple-700/60 flex items-center justify-center text-[11px] font-bold shrink-0 text-purple-300">3</span>
                    <p>
                      Adminer-dagi maydonga <kbd className="bg-black/60 px-1.5 py-0.5 rounded text-white font-mono">Ctrl + V</kbd> qilib qo'ying va pastdagi <strong className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">«Выполнить»</strong> tugmasini bosing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleCopySql}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {copiedSql ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? "SQL Nusxalandi! (Ctrl+V qiling)" : "1. SQL Kodini Nusxalash"}</span>
                </button>

                <button
                  onClick={handleDownloadSql}
                  className="py-3 px-4 rounded-xl bg-[#1b1133] hover:bg-[#251747] border border-purple-700/50 text-purple-200 hover:text-white font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span>kawaii_anime_dump.sql Yuklab olish</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[#0e071c] border border-purple-900/40 text-[11px] text-purple-400 flex items-center justify-between">
                <span>Adminer Manzili:</span>
                <span className="font-mono text-purple-300 text-[10px]">appdb-0vhlix5f58dl.adminer.wasmer.app</span>
              </div>
            </div>
          )}

          {/* TAB 2: Full SQL Code Viewer */}
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-300/80">To'liq PostgreSQL SQL DDL & Seeder (26 ta Anime):</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadSql}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-900/60 text-purple-200 hover:text-white text-xs font-bold border border-purple-700/50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.sql Yuklash</span>
                  </button>
                  <button
                    onClick={handleCopySql}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Nusxalandi' : 'Nusxa olish'}</span>
                  </button>
                </div>
              </div>

              <pre className="p-3.5 rounded-2xl bg-[#090514] border border-purple-900/50 text-[11px] font-mono text-purple-200 overflow-x-auto max-h-72">
                {sqlCode}
              </pre>
            </div>
          )}

          {/* TAB 3: Direct Automatic DB connection */}
          {activeTab === 'setup' && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-purple-300 mb-1 font-semibold">PostgreSQL Host</label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="w-full px-3 py-2 bg-[#180f2e] rounded-xl border border-purple-800/40 text-white font-mono outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-purple-300 mb-1 font-semibold">Port</label>
                  <input
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full px-3 py-2 bg-[#180f2e] rounded-xl border border-purple-800/40 text-white font-mono outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-purple-300 mb-1 font-semibold">Database (Baza nomi)</label>
                  <input
                    type="text"
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                    className="w-full px-3 py-2 bg-[#180f2e] rounded-xl border border-purple-800/40 text-white font-mono outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-purple-300 mb-1 font-semibold">Foydalanuvchi (User)</label>
                  <input
                    type="text"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    className="w-full px-3 py-2 bg-[#180f2e] rounded-xl border border-purple-800/40 text-white font-mono outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-purple-300 mb-1 font-semibold">Parol (Password)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#180f2e] rounded-xl border border-purple-800/40 text-white font-mono outline-none focus:border-purple-500"
                />
              </div>

              <button
                onClick={handleTestAndSeed}
                disabled={isLoading}
                className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Database className="w-4 h-4" />
                <span>{isLoading ? "Jadvallar ochilmoqda..." : "Ulanish & Barcha 26 ta Animeni Yuklash"}</span>
              </button>
            </div>
          )}

          {/* TAB 4: Status */}
          {activeTab === 'status' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#170f2b] border border-purple-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-purple-300/80">Ulanish holati:</span>
                  <span className="flex items-center gap-1.5 font-bold">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        dbStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    <span className={dbStatus?.connected ? 'text-emerald-400' : 'text-amber-400'}>
                      {dbStatus?.connected ? 'Ulangan (PostgreSQL Faol)' : 'Lokal Kesh Faol (26 ta Anime)'}
                    </span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-purple-300/80">Host:</span>
                  <span className="font-mono text-purple-200">{dbStatus?.host || host}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-purple-300/80">Baza nomi (Database):</span>
                  <span className="font-mono text-purple-200">{dbStatus?.database || database}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-purple-300/80">Foydalanuvchi (User):</span>
                  <span className="font-mono text-purple-200">{dbStatus?.user || user}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-purple-300/80">Animelar soni:</span>
                  <span className="font-bold text-white">26 ta to'liq anime (JSONB)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800/30 text-purple-300/80">
                💡 Barcha animelar PostgreSQL bazasidagi <code className="text-purple-200 font-mono">animes</code> jadvalida <strong>JSONB</strong> ustuni orqali saqlanadi va to'liq Telegram bot integratsiyasini qo'llab-quvvatlaydi.
              </div>

              <button
                onClick={handleTestAndSeed}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg shadow-purple-950 flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? "Ulanmoqda..." : "Jadvallarni ochish va Ma'lumotlarni yozish"}</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

