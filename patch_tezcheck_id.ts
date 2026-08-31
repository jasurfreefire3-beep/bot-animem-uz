import fs from 'fs';
let content = fs.readFileSync('server/bot.ts', 'utf-8');

const oldCreate = `async function createTezcheckInvoice(amount: number) {
  try {
    const apiKey = process.env.TEZCHECK_API_KEY || 'ee77747df48bae33ee5bee58047c3ab093a84a76';
    const res = await fetch('https://tezcheck.uz/create_invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, amount }),
    });`;

const newCreate = `async function createTezcheckInvoice(amount: number, telegramId?: number) {
  try {
    const apiKey = process.env.TEZCHECK_API_KEY || 'ee77747df48bae33ee5bee58047c3ab093a84a76';
    const bodyObj: any = { api_key: apiKey, amount };
    if (telegramId) {
      bodyObj.telegram_id = telegramId;
      bodyObj.user_id = telegramId;
      bodyObj.chat_id = telegramId;
    }
    const res = await fetch('https://tezcheck.uz/create_invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyObj),
    });`;

content = content.replace(oldCreate, newCreate);

// Also pass chatId (telegramId) in createTezcheckInvoice call
content = content.replace(
  `const invoice = await createTezcheckInvoice(amount);`,
  `const invoice = await createTezcheckInvoice(amount, chatId);`
);

fs.writeFileSync('server/bot.ts', content);
console.log('Successfully updated createTezcheckInvoice to pass telegramId');
