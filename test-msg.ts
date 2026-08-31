import fetch from 'node-fetch';

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
    chat_id: 1111111, // I don't know the admin's chat id
  };
}
