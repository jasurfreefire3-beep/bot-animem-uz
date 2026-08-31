const fs = require('fs');
let content = fs.readFileSync('server/bot.ts', 'utf8');

// In handlePlayEpisode, change VIP callbacks:
content = content.replace(
  "callback_data: \`play_\${anime.id}_\${Number(ep) + 1}_\${page}\`",
  "callback_data: \`vip_play_\${anime.id}_\${Number(ep) + 1}_\${page}\`"
);

content = content.replace(
  "callback_data: \`watch_anime_\${anime.id}_\${page}\`, style: 'primary' },\n      { text: '🏠 Asosiy menyu'",
  "callback_data: \`vip_watch_\${anime.id}_\${page}\`, style: 'primary' },\n      { text: '🏠 Asosiy menyu'"
);

// In the main callback handler (around line 651), add vip_watch and vip_play:
const addHandlers = `
  } else if (data.startsWith('vip_watch_')) {
    // Format: vip_watch_\${animeId}_\${page}
    const parts = data.replace('vip_watch_', '').split('_');
    const animeId = parts[0];
    const page = parseInt(parts[1] || '1', 10);
    const anime = await getAnimeByIdOrSlug(animeId);
    if (anime) {
      if (messageId) {
        await telegramApiCall('editMessageReplyMarkup', { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } });
      }
      await sendWatchEpisodesGrid(chatId, anime, page); // no messageId -> sends new message!
    }
  } else if (data.startsWith('vip_play_')) {
    // Format: vip_play_\${animeId}_\${ep}_\${page}
    const parts = data.replace('vip_play_', '').split('_');
    const animeId = parts[0];
    const ep = parts[1] || '1';
    const page = parseInt(parts[2] || '1', 10);
    const anime = await getAnimeByIdOrSlug(animeId);
    if (anime) {
      if (messageId) {
        await telegramApiCall('editMessageReplyMarkup', { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } });
      }
      await handlePlayEpisode(chatId, anime, ep, page); // no messageId -> sends new message!
    }
`;

content = content.replace(
  "} else if (data.startsWith('watch_anime_')) {",
  addHandlers.trim() + "\n  } else if (data.startsWith('watch_anime_')) {"
);

fs.writeFileSync('server/bot.ts', content);
