import fs from 'fs';
let content = fs.readFileSync('server/bot.ts', 'utf-8');
content = content.replace(
  `  await telegramApiCall('answerInlineQuery', {`,
  `  const res = await telegramApiCall('answerInlineQuery', {\n`
);
content = content.replace(
  `    button: {\n      text: \`🟢 \${Math.floor(Math.random() * 40) + 10} kishi online • ✨ \${animes.length} ta anime mavjud\`,\n      start_parameter: 'search'\n    },\n  });\n}`,
  `    button: {\n      text: \`🟢 \${Math.floor(Math.random() * 40) + 10} kishi online • ✨ \${animes.length} ta anime mavjud\`,\n      start_parameter: 'search'\n    },\n  });\n  console.log("Inline query response:", res);\n}`
);
fs.writeFileSync('server/bot.ts', content);
