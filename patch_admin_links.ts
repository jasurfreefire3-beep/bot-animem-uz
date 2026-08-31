import fs from 'fs';
let content = fs.readFileSync('server/bot.ts', 'utf-8');

// Replace t.me/user321admin with t.me/Animem_uz_bot?start=support (or similar bot link)
content = content.replace(/https:\/\/t\.me\/user321admin/g, 'https://t.me/Animem_uz_bot?start=support');

// Replace @user321admin text references with Telegram ID / Bot support
content = content.replace(/@user321admin/g, 'Telegram ID orqali qo\'llab-quvvatlash');

// Update fallback pay_url in createTezcheckInvoice to use bot start parameter
content = content.replace(
  /https:\/\/t\.me\/user321admin\?text=[^"]+/g,
  'https://t.me/Animem_uz_bot?start=pay_' + '${orderId}'
);

fs.writeFileSync('server/bot.ts', content);
console.log('Successfully replaced user321admin references in server/bot.ts');
