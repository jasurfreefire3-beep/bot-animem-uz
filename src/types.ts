/**
 * Animem.uz Types Definition
 * Version: 1.0.2
 */
export interface Anime {
  id: number;
  slug: string;
  title: string;
  original_title: string;
  russian_title?: string;
  description: string;
  poster_url: string;
  banner_url?: string;
  type: 'TV serial' | 'Film' | 'OVA (Maxsus)' | 'ONA' | 'Speshl';
  episodes: string;
  current_episode: number;
  total_episodes: number;
  year: number;
  views_count: number;
  rating: number;
  status: 'Tugallangan' | 'Davom etmoqda' | 'Tez kunda';
  duration: string;
  age_rating: string;
  genres: string[];
  sub_available?: boolean;
  dub_available?: boolean;
  category: 'yangi' | 'songgi' | 'birinchilardan' | 'bugungi_top' | 'oylik_top' | 'filmlar' | 'tasodifiy' | 'mashhur';
  telegram_code: string;
  telegram_bot_url?: string;
  start_url?: string;
  telegram_url?: string;
  episode_files?: Record<number, { file_id: string; caption?: string; uploaded_at?: string }>;
  telegram?: {
    botUsername: string;
    startParameter: string;
    webUrl: string;
    appUrl: string;
    qrCodeUrl: string;
    shareText: string;
  };
  created_at?: string;
  update_time?: string;
  season?: string;
  voice_studio?: string;
  metadata?: Record<string, any>;
}

export interface CategorySection {
  id: string;
  title: string;
  subtitle?: string;
  type: 'carousel' | 'grid' | 'updates';
  items: Anime[];
}

export interface DBStatus {
  connected: boolean;
  source: 'postgresql' | 'fallback_cache';
  host?: string;
  port?: number | string;
  user?: string;
  database?: string;
  totalAnimes: number;
  message: string;
  lastChecked: string;
  sqlSchema?: string;
}
