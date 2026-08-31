import fetch from 'node-fetch';
import { getAllAnimes } from './server/db.js';

function formatViews(views: number = 0): string {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return `${views || 0}`;
}

const BANNER_URL = 'https://api.animem.uz/api/images/1788139109860_8n3qu8t';

async function telegramApiCall(method: string, payload: any) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data;
  } catch (error: any) {
    return { ok: false, error };
  }
}

async function run() {
    const animes = await getAllAnimes();
    const query = '';
    const filtered = animes;

  const results = filtered.slice(0, 2).map((anime) => {
    const formattedViewsCount = formatViews(anime.views_count);
    const episodesText = anime.total_episodes || anime.current_episode || 12;
    const yearText = anime.year || 2024;
    const genresText = (anime.genres || ['Anime']).slice(0, 4).join(' • ');
    const inlineTitle = `📕 ${anime.title}${anime.original_title ? ` / ${anime.original_title}` : ''}`;
    const inlineDescription = `⭐ ${anime.rating || '8.0'} ( ${formattedViewsCount} ) • 📺 ${episodesText} • 📅 ${yearText}\n${genresText}`; // format from screenshot
    return {
      type: 'article',
      id: `anime_${anime.id}`,
      title: inlineTitle,
      description: inlineDescription,
      thumbnail_url: anime.poster_url || BANNER_URL,
      thumbnail_width: 80,
      thumbnail_height: 110,
      input_message_content: {
        message_text: `🎬 <b>${anime.title}</b> (${yearText})\n${anime.original_title ? `<i>${anime.original_title}</i>\n` : ''}⭐ <b>Reyting:</b> ${anime.rating || 8.5}/10 (👁️ ${formattedViewsCount} ko'rish)\n📺 <b>Qismlar:</b> ${episodesText} qism\n🎭 <b>Janr:</b> ${genresText}\n\n📝 <b>Tavsif:</b>\n${anime.description ? anime.description.slice(0, 240) + '...' : "O'zbek tilida yuqori sifatda."}`,
        parse_mode: 'HTML',
      },
      reply_markup: {
        inline_keyboard: [
          [
            { text: '▶️ Tomosha qilish', callback_data: `anime_detail_${anime.id}` },
            { text: '🌐 Saytda ochish', url: `https://animem.uz/anime/${anime.id}` },
          ],
        ],
      },
    };
  });

  const payload = {
    inline_query_id: '1234567890', // dummy
    results,
    cache_time: 5,
    is_personal: false,
    button: {
      text: `🟢 26 kishi online • ✨ ${animes.length} ta anime mavjud`,
      start_parameter: 'search'
    },
  };

  const res = await telegramApiCall('answerInlineQuery', payload);
  console.log("RESPONSE:", res);
}
run();
