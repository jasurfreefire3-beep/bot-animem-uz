import fs from 'fs';

const lines = fs.readFileSync('server/bot.ts', 'utf-8').split('\n');
const start = lines.findIndex(l => l.includes('async function handleInlineQuery'));
const end = lines.findIndex((l, i) => i > start && l.startsWith('}'));

console.log(lines.slice(start, end + 1).join('\n'));
