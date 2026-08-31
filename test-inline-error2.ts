import fetch from 'node-fetch';
import { getAllAnimes } from './server/db.js';

async function telegramApiCall(method: string, payload: any) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data;
  } catch (error: any) {
    return { ok: false, error };
  }
}

async function run() {
  const payload = {
    inline_query_id: '1234567890', // dummy
    results: [],
    cache_time: 5,
    is_personal: false
  };
  const res = await telegramApiCall('answerInlineQuery', payload);
  console.log("RESPONSE NO BUTTON:", res);
}
run();
