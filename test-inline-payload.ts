import { getAllAnimes } from './server/db.js';

function formatViews(views: number = 0): string {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return `${views || 0}`;
}

async function run() {
    const animes = await getAllAnimes();
    const query = 'naruto';
    const filtered = query
      ? animes.filter(
          (a) =>
            a.title?.toLowerCase().includes(query) ||
            a.original_title?.toLowerCase().includes(query) ||
            a.genres?.some((g: string) => g.toLowerCase().includes(query)) ||
            a.description?.toLowerCase().includes(query)
        )
      : animes;

    const results = filtered.slice(0, 20).map((anime) => {
      const formattedViewsCount = formatViews(anime.views_count);
      const episodesText = anime.total_episodes || anime.current_episode || 12;
      const yearText = anime.year || 2024;
      const genresText = (anime.genres || ['Anime']).slice(0, 4).join(' • ');
      
      const inlineTitle = `📕 ${anime.title}${anime.original_title ? ` / ${anime.original_title}` : ''}`;
      const inlineDescription = `⭐ ${anime.rating || '8.0'} ( ${formattedViewsCount} ) • 📺 ${episodesText} • 🗓️ ${yearText}\n${genresText}`;

      return {
        type: 'article',
        id: `anime_${anime.id}`,
        title: inlineTitle,
        description: inlineDescription,
        thumbnail_url: anime.poster_url || 'https://api.animem.uz/api/images/1788139109860_8n3qu8t',
        thumbnail_width: 80,
        thumbnail_height: 110,
        input_message_content: {
          message_text: 'Test',
          parse_mode: 'HTML',
        },
      };
    });
    
    console.log(JSON.stringify(results, null, 2));
}
run();
