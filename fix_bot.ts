import fs from 'fs';

let content = fs.readFileSync('server/bot.ts', 'utf-8');

// replace , style: '...', bg_color: '...'
content = content.replace(/, style: '[^']+', bg_color: '[^']+'/g, '');
content = content.replace(/style: '[^']+',\n\s*bg_color: '[^']+',?/g, '');
// replace single style: '...'
content = content.replace(/,\s*style: '[^']+'/g, '');
content = content.replace(/,\s*bg_color: '[^']+'/g, '');

fs.writeFileSync('server/bot.ts', content);
