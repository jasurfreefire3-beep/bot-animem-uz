import fs from 'fs';
let content = fs.readFileSync('server/bot.ts', 'utf-8');
content = content.replace(
  `for (const update of data.result) {`,
  `for (const update of data.result) {\n            fs.appendFileSync('bot_updates.log', new Date().toISOString() + ' UPDATE: ' + JSON.stringify(update) + '\\n');`
);
fs.writeFileSync('server/bot.ts', content);
