const fs = require('fs');
let content = fs.readFileSync('server/bot.ts', 'utf8');

content = content.replace(
  "async function handleMessage(message: any) {\n  const chatId = message.chat?.id;\n  const firstName = message.from?.first_name || '';\n  if (chatId) trackUser(chatId, firstName);\n  const chatId = message.chat.id;",
  "async function handleMessage(message: any) {\n  const chatId = message.chat.id;\n  const firstName = message.from?.first_name || 'Foydalanuvchi';\n  trackUser(chatId, firstName);"
);

content = content.replace(
  "async function handleMessage(message: any) {\n  const chatId = message.chat?.id;\n  const firstName = message.from?.first_name || '';\n  if (chatId) trackUser(chatId, firstName);\n  const chatId = message.chat.id;\n  const text = (message.text || '').trim();\n  const firstName = message.from?.first_name || 'Foydalanuvchi';",
  "async function handleMessage(message: any) {\n  const chatId = message.chat.id;\n  const firstName = message.from?.first_name || 'Foydalanuvchi';\n  trackUser(chatId, firstName);\n  const text = (message.text || '').trim();"
);

fs.writeFileSync('server/bot.ts', content);
