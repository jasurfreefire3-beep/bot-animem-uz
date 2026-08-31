import fs from 'fs';

let content = fs.readFileSync('server/bot.ts', 'utf-8');

content = content.replace(
  "const inlineDescription = `⭐ ${anime.rating || '8.0'} ( ${formattedViewsCount} ) • 📺 ${episodesText} • 🗓️ ${yearText}\\n${genresText}`;",
  "const inlineDescription = `⭐ ${anime.rating || '8.0'} ( ${formattedViewsCount} ) • 📺 ${episodesText} • 📅 ${yearText}\\n${genresText}`; // format from screenshot"
);

content = content.replace(
  "switch_pm_text: `🟢 26 kishi online • ✨ ${animes.length} ta anime mavjud`,",
  "button: {\n      text: `🟢 ${Math.floor(Math.random() * 40) + 10} kishi online • ✨ ${animes.length} ta anime mavjud`,\n      start_parameter: 'search'\n    },"
);
content = content.replace(
  "switch_pm_parameter: 'search',",
  ""
);

fs.writeFileSync('server/bot.ts', content);
