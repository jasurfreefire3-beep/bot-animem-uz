import fs from 'fs';
let content = fs.readFileSync('server/bot.ts', 'utf-8');
content = content.replace(
  `console.error(\`Telegram API Error [\${method}]:\`, error?.message || error);`,
  `console.error(\`Telegram API Error [\${method}]:\`, error?.message || error);\n    fs.appendFileSync('bot_error.log', new Date().toISOString() + ' ERROR [' + method + '] ' + JSON.stringify(error) + '\\n');`
);
content = content.replace(
  `const data = await res.json();\n    return data;`,
  `const data = await res.json();\n    if (!data.ok) fs.appendFileSync('bot_error.log', new Date().toISOString() + ' API_ERROR [' + method + '] ' + JSON.stringify(data) + '\\n');\n    return data;`
);
fs.writeFileSync('server/bot.ts', content);
