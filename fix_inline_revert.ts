import fs from 'fs';
let content = fs.readFileSync('server/bot.ts', 'utf-8');

content = content.replace(
  /button:\s*\{\s*text:\s*`([^`]+)`,\s*start_parameter:\s*'search'\s*\}/g,
  "switch_pm_text: `$1`,\n    switch_pm_parameter: 'search'"
);

fs.writeFileSync('server/bot.ts', content);
