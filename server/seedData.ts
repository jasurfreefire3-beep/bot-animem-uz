export interface AnimeItem {
  id: number;
  slug: string;
  title: string;
  original_title: string;
  russian_title?: string;
  description: string;
  poster_url: string;
  banner_url?: string;
  type: 'TV serial' | 'Film' | 'OVA (Maxsus)';
  episodes: string;
  current_episode: number;
  total_episodes: number;
  year: number;
  views_count: number;
  rating: number;
  status: string;
  duration: string;
  age_rating: string;
  genres: string[];
  sub_available: boolean;
  dub_available: boolean;
  category: 'yangi' | 'songgi' | 'birinchilardan' | 'bugungi_top' | 'oylik_top' | 'filmlar' | 'tasodifiy';
  telegram_code: string;
  update_time?: string;
  metadata?: Record<string, any>;
}

export const initialAnimes: AnimeItem[] = [];
