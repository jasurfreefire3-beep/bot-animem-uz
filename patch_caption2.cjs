const fs = require('fs');
let content = fs.readFileSync('server/bot.ts', 'utf8');

const regex = /const START_CAPTION = `[\s\S]*?180\+ foydalanuvchida 🎫 <b>Animem Pass<\/b> obunasi mavjud\. Siz ham hoziroq xarid qiling ! ❞<\/blockquote>`;/;

const dynamicFunc = `async function getStartCaption() {
  const animes = await getAllAnimes();
  const mostViewed = animes.sort((a, b) => (b.views_count || 0) - (a.views_count || 0))[0]?.title || 'Mavjud emas';
  
  let onlineCount = getOnlineCount();
  if (onlineCount === 0) onlineCount = 1;
  
  let passCount = 0;
  try {
    const db = require('./db.js');
    if (db.getTotalActivePasses) {
      passCount = await db.getTotalActivePasses();
    }
  } catch(e) {}
  
  return \`<b>( ˶ˆ꒳ˆ˵ ) Animem ga hush kelibsiz ✨</b>

<blockquote>📺 \${onlineCount} ta foydalanuvchi anime tomosha qilmoqda ❞</blockquote>
<blockquote>👁️ Eng ko'p tomosha qilinayotgan anime - <b>\${mostViewed}</b> ❞</blockquote>
<blockquote>\${passCount > 0 ? passCount + ' foydalanuvchida' : 'Hech kimda hozircha'} 🎫 <b>Animem Pass</b> obunasi mavjud. Siz ham hoziroq xarid qiling ! ❞</blockquote>\`;
}`;

content = content.replace(regex, dynamicFunc);
content = content.replace("const captionHtml = START_CAPTION;", "const captionHtml = await getStartCaption();");
content = content.replace("caption: START_CAPTION,", "caption: await getStartCaption(),");
content = content.replace("caption: START_CAPTION,", "caption: await getStartCaption(),");

fs.writeFileSync('server/bot.ts', content);
