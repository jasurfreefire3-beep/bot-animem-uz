import fs from 'fs';
let content = fs.readFileSync('server/bot.ts', 'utf-8');
content = content.replace(
  `async function handleInlineQuery(inlineQuery: any) {`,
  `async function handleInlineQuery(inlineQuery: any) {\n  fs.appendFileSync('bot_updates.log', new Date().toISOString() + ' INLINE_QUERY: ' + JSON.stringify(inlineQuery) + '\\n');`
);
fs.writeFileSync('server/bot.ts', content);
