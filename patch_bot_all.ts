import fs from 'fs';
let content = fs.readFileSync('server/bot.ts', 'utf-8');

// 1. Add getUserPassDb, setUserPassDb to imports from './db.js'
content = content.replace(
  `import { getAllAnimes, getAnimeByIdOrSlug, addAnime } from './db.js';`,
  `import { getAllAnimes, getAnimeByIdOrSlug, addAnime, getUserPassDb, setUserPassDb } from './db.js';`
);

// 2. Add Tezcheck API helper functions before handleCallbackQuery
const tezcheckHelpers = `
async function createTezcheckInvoice(amount: number) {
  try {
    const apiKey = process.env.TEZCHECK_API_KEY || 'ee77747df48bae33ee5bee58047c3ab093a84a76';
    const res = await fetch('https://tezcheck.uz/create_invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, amount }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Tezcheck create_invoice error:', err);
    return { ok: false, error: err.message };
  }
}

async function checkTezcheckInvoiceStatus(orderId: number) {
  try {
    const apiKey = process.env.TEZCHECK_API_KEY || 'ee77747df48bae33ee5bee58047c3ab093a84a76';
    const res = await fetch('https://tezcheck.uz/status_invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, order_id: orderId }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Tezcheck status_invoice error:', err);
    return { ok: false, error: err.message };
  }
}
`;

if (!content.includes('createTezcheckInvoice')) {
  content = content.replace('async function handleCallbackQuery(callbackQuery: any) {', tezcheckHelpers + '\nasync function handleCallbackQuery(callbackQuery: any) {');
}

fs.writeFileSync('server/bot.ts', content);
console.log('Successfully added Tezcheck helpers & imports.');
