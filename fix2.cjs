const fs = require('fs');
let content = fs.readFileSync('server/bot.ts', 'utf8');

content = content.replace(
  /async function handleCallbackQuery\(callbackQuery: any\) \{\n  const chatId = callbackQuery\.message\?\.chat\?\.id \|\| callbackQuery\.from\?\.id;\n  const firstName = callbackQuery\.from\?\.first_name \|\| '';\n  if \(chatId\) trackUser\(chatId, firstName\);\n  const data = callbackQuery\.data;\n  const message = callbackQuery\.message;\n  const from = callbackQuery\.from;\n  const chatId = message\?\.chat\?\.id \|\| from\?\.id;/,
  "async function handleCallbackQuery(callbackQuery: any) {\n  const data = callbackQuery.data;\n  const message = callbackQuery.message;\n  const from = callbackQuery.from;\n  const chatId = message?.chat?.id || from?.id;\n  const firstName = from?.first_name || '';\n  if (chatId) trackUser(chatId, firstName);"
);

fs.writeFileSync('server/bot.ts', content);
