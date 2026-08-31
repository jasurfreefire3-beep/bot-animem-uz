const fs = require('fs');
let content = fs.readFileSync('server/bot.ts', 'utf8');

// Replace the constant START_CAPTION with a function
const startCaptionRegex = /const START_CAPTION = `<b>.*?<\/b>.*?180\+ foydalanuvchida.*?`;/s;

const dynamicStartCaption = `
async function getStartCaption() {
  const animes = await getAllAnimes();
  const mostViewed = animes.sort((a, b) => (b.views_count || 0) - (a.views_count || 0))[0]?.title || 'Mavjud emas';
  
  let onlineCount = getOnlineCount();
  if (onlineCount === 0) onlineCount = 1; // At least the current user!
  
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
<blockquote>\${passCount > 0 ? \`\${passCount} ta foydalanuvchida \` : \`Hech kimda hozircha \`}🎫 <b>Animem Pass</b> obunasi mavjud. Siz ham hoziroq xarid qiling ! ❞</blockquote>\`;
}
`;

content = content.replace(startCaptionRegex, dynamicStartCaption.trim());

// Update uses of START_CAPTION
content = content.replace(
  "const captionHtml = START_CAPTION;",
  "const captionHtml = await getStartCaption();"
);

// We also need to fix `caption: START_CAPTION` inside `getMainKeyboard` ? No, wait. 
// Let's check where START_CAPTION is used.
