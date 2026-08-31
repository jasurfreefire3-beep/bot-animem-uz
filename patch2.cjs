const fs = require('fs');
let content = fs.readFileSync('server/bot.ts', 'utf8');

content = content.replace(
  "if (editMediaRes.ok) return;",
  "if (editMediaRes.ok) return;\n      // if it failed, attempt to delete the message to prevent leaving behind the previous video\n      await telegramApiCall('deleteMessage', { chat_id: chatId, message_id: messageId });"
);

fs.writeFileSync('server/bot.ts', content);
