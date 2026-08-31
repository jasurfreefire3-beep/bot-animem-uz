const fs = require('fs');
let content = fs.readFileSync('server/bot.ts', 'utf8');

content = content.replace(
  "function formatViewsForSearch(views: number = 0, animeId: number = 0): string {\n  if (views >= 1000000) return `\${(views / 1000000).toFixed(1)}M`;\n  if (views >= 1000) return `\${(views / 1000).toFixed(1)}K`;\n  return `\${views}`;\n}\n",
  ""
);

content = content.replace(
  "async function handleMessage(message: any) {\n  const chatId = message.chat.id;\n  const firstName = message.from?.first_name || 'Foydalanuvchi';\n  trackUser(chatId, firstName);\n  const text = (message.text || '').trim();\n  const firstName = message.from?.first_name || 'Foydalanuvchi';",
  "async function handleMessage(message: any) {\n  const chatId = message.chat.id;\n  const firstName = message.from?.first_name || 'Foydalanuvchi';\n  trackUser(chatId, firstName);\n  const text = (message.text || '').trim();"
);

fs.writeFileSync('server/bot.ts', content);
