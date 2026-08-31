const fs = require('fs');
let content = fs.readFileSync('server/bot.ts', 'utf8');

const regex = /async function handlePlayEpisode\([\s\S]*?\}\s*\}\s*(?=function formatViewsForSearch)/;

const newFunc = `async function handlePlayEpisode(chatId: number | string, anime: any, ep: string | number, page = 1, messageId?: number) {
  const passExp = await getUserPassDb(chatId);
  const hasPass = passExp > Date.now();
  const totalEpisodes = anime.total_episodes || anime.current_episode || 12;

  // Check if real video file_id exists for this episode from the private channel
  const epData = (anime.episode_files && anime.episode_files[ep]) || null;
  const fileId = epData?.file_id || null;

  if (hasPass) {
    // VIP USER: Sends downloadable video file message one-by-one!
    const vipText = \`💎 <b>Animem Pass VIP • \${escapeHtml(anime.title)} — \${ep}-qism</b>\n\n<blockquote>📺 Epizod: <b>\${ep} / \${totalEpisodes}</b>\n⚡ Sifat: <b>1080p Full HD (Maksimal)</b>\n🎙️ Ovoz: <b>Animem Professional Dublaj</b>\n📥 Holati: <b>Yuklab olish uchun tayyor ✅</b> ❞</blockquote>\n\n<i>✨ Siz VIP foydalanuvchisiz! Har bir epizodni bitta-bittalab to'g'ridan-to'g'ri yuklab olishingiz va saqlashingiz mumkin.</i>\`;

    const vipButtons: any[][] = [];
    if (Number(ep) < totalEpisodes) {
      vipButtons.push([
        { text: \`▶️ Keyingi qism (\${Number(ep) + 1}-qism)\`, callback_data: \`play_\${anime.id}_\${Number(ep) + 1}_\${page}\`, style: 'success' },
      ]);
    }
    vipButtons.push([
      { text: '📋 Qismlar ro\\'yxati', callback_data: \`watch_anime_\${anime.id}_\${page}\`, style: 'primary' },
      { text: '🏠 Asosiy menyu', callback_data: 'btn_main_menu', style: 'primary' },
    ]);

    if (fileId) {
      // Send real video file directly from private channel!
      await telegramApiCall('sendVideo', {
        chat_id: chatId,
        video: fileId,
        caption: vipText,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: vipButtons },
      });
    } else {
      // Send high-quality video message for download
      await telegramApiCall('sendPhoto', {
        chat_id: chatId,
        photo: anime.poster_url || BANNER_URL,
        caption: vipText,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: vipButtons },
      });
    }
  } else {
    // FREE USER: Watches one-by-one in player, cannot download, previous gets replaced
    const freeText = \`▶️ <b>\${escapeHtml(anime.title)} — \${ep}-qism ijro etilmoqda 🎬</b>\n\n<blockquote>📺 Epizod: <b>\${ep} / \${totalEpisodes}</b>\n🎙️ Ovoz: <b>AnimemUz Dublaj (HD)</b>\n🛡️ Rejim: <b>Oddiy tomosha (Faqat bitta-bittalab)</b> ❞</blockquote>\n\n<i>⚠️ Sizda Animem Pass obunasi yo'qligi sababli videoni fayl sifatida yuklab ololmaysiz va avvalgi epizod o'chiriladi. Barcha epizodlarni to'g'ridan-to'g'ri Telegramda bitta-bittalab yuklab olish uchun Animem Pass xarid qiling!</i>\`;

    const freeButtons: any[][] = [];
    if (Number(ep) < totalEpisodes) {
      freeButtons.push([
        { text: \`▶️ Keyingi qism (\${Number(ep) + 1}-qism)\`, callback_data: \`play_\${anime.id}_\${Number(ep) + 1}_\${page}\`, style: 'success' },
      ]);
    }
    freeButtons.push(
      [
        { text: '🎫 Animem Pass olish (Yuklab olish uchun)', callback_data: 'btn_pass', style: 'success' },
      ],
      [
        { text: '◀️ Qismlar ro\\'yxatiga qaytish', callback_data: \`watch_anime_\${anime.id}_\${page}\`, style: 'primary' },
        { text: '🏠 Bosh menyu', callback_data: 'btn_main_menu', style: 'primary' },
      ]
    );

    // Delete previous message so only 1 episode remains for free users
    if (messageId) {
      await telegramApiCall('deleteMessage', { chat_id: chatId, message_id: messageId });
    }

    if (fileId) {
      await telegramApiCall('sendVideo', {
        chat_id: chatId,
        video: fileId,
        caption: freeText,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: freeButtons },
        protect_content: true,
      });
    } else {
      await telegramApiCall('sendPhoto', {
        chat_id: chatId,
        photo: anime.poster_url || BANNER_URL,
        caption: freeText,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: freeButtons },
        protect_content: true,
      });
    }
  }
}
`;

content = content.replace(regex, newFunc);
fs.writeFileSync('server/bot.ts', content);
