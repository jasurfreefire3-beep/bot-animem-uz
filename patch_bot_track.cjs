const fs = require('fs');
let content = fs.readFileSync('server/bot.ts', 'utf8');

// Inside admin_stats callback, get the real stats
const adminStatsCode = `
  } else if (data === 'admin_stats') {
    const animes = await getAllAnimes();
    const totalViews = animes.reduce((acc, a) => acc + (a.views_count || 0), 0);
    const mostViewed = animes.sort((a, b) => (b.views_count || 0) - (a.views_count || 0))[0]?.title || 'Mavjud emas';
    
    // Real tracking values
    const onlineNow = getOnlineCount();
    let passCount = 0;
    try {
      const db = require('./db');
      if (db.getDatabaseStatus().connected) {
        const pool = require('./db').getPool();
        const res = await pool.query("SELECT COUNT(*) as c FROM users WHERE pass_expires_at > NOW()");
        passCount = parseInt(res.rows[0].c, 10) || 0;
      }
    } catch(e) {}
    if (!passCount) passCount = getPassCount();

    await editOrSendMessage(chatId, messageId, \`📊 <b>Sayt va Bot Statistikasi</b>

• Jami animelar: <b>\${animes.length} ta</b>
• Jami ko'rishlar soni: <b>\${totalViews.toLocaleString()} marta</b>
• Eng ko'p ko'rilgan: <b>\${mostViewed}</b>
• 🟢 Hozir Online (Botda): <b>\${onlineNow} ta foydalanuvchi</b>
• 🎫 Animem Pass egalari: <b>\${passCount} kishi</b>
• Telegram Bot: <b>@Animem_uz_bot 🟢 Online</b>\`, {
      inline_keyboard: [
        [{ text: '◀️ Admin menyusi', callback_data: 'admin_menu' }],
      ],
    });
`;

content = content.replace(/\} else if \(data === 'admin_stats'\) \{[\s\S]*?\}\);/, adminStatsCode.trim());

// We must also hook `trackUser` inside `handleCallbackQuery` and `handleMessage`
content = content.replace(
  "async function handleMessage(message: any) {",
  "async function handleMessage(message: any) {\n  const chatId = message.chat?.id;\n  const firstName = message.from?.first_name || '';\n  if (chatId) trackUser(chatId, firstName);"
);

content = content.replace(
  "async function handleCallbackQuery(callbackQuery: any) {",
  "async function handleCallbackQuery(callbackQuery: any) {\n  const chatId = callbackQuery.message?.chat?.id || callbackQuery.from?.id;\n  const firstName = callbackQuery.from?.first_name || '';\n  if (chatId) trackUser(chatId, firstName);"
);

// Also hook play button to track what they watch
content = content.replace(
  "await handlePlayEpisode(chatId, anime, ep, page); // no messageId -> sends new message!",
  "trackUser(chatId, '', anime.id);\n      await handlePlayEpisode(chatId, anime, ep, page);"
);
content = content.replace(
  "await handlePlayEpisode(chatId, anime, ep, page, messageId);",
  "trackUser(chatId, '', anime.id);\n      await handlePlayEpisode(chatId, anime, ep, page, messageId);"
);
content = content.replace(
  "await sendWatchEpisodesGrid(chatId, anime, page); // no messageId -> sends new message!",
  "trackUser(chatId, '', anime.id);\n      await sendWatchEpisodesGrid(chatId, anime, page);"
);
content = content.replace(
  "await sendWatchEpisodesGrid(chatId, anime, page, messageId);",
  "trackUser(chatId, '', anime.id);\n      await sendWatchEpisodesGrid(chatId, anime, page, messageId);"
);

// Also fix `formatViewsForSearch` to remove fakes
content = content.replace(
  /function formatViewsForSearch\([\s\S]*?return seeds\[animeId\] || '750K';\n\}/,
  `function formatViewsForSearch(views: number = 0, animeId: number = 0): string {
  if (views >= 1000000) return \`\${(views / 1000000).toFixed(1)}M\`;
  if (views >= 1000) return \`\${(views / 1000).toFixed(1)}K\`;
  return \`\${views}\`;
}`
);

fs.writeFileSync('server/bot.ts', content);
