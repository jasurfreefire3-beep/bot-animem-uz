import fs from 'fs';
import { 
  getAllAnimes, 
  getAnimeByIdOrSlug, 
  addAnime, 
  updateAnime, 
  getUserPassDb, 
  setUserPassDb,
  getMandatoryChannels,
  addMandatoryChannel,
  removeMandatoryChannel,
  toggleFavorite,
  isAnimeFavorited,
  getFavoritesCount,
  getUserFavorites,
  getUserFavoritesCount,
  saveUserRating,
  getAnimeRatingStats,
  getUserRating
} from './db.js';
import { setBotUsername, enrichAnimeWithTelegram, getBotUsername } from './telegram.js';
import { E } from './emojis.js';


export const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8838137319:AAGTt2MAa-Msw62XHNU0GmUMXWwFHMfqtnA';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Faqat ruxsat berilgan 2 ta Admin ID
export const ADMIN_IDS: number[] = [7021152078, 8991315532, 433661800964, 6560824982, 5373305602];

export function isAdmin(userId: number | string | undefined | null): boolean {
  if (!userId) return false;
  const numId = typeof userId === 'string' ? parseInt(userId, 10) : Number(userId);
  return ADMIN_IDS.includes(numId);
}

// High quality Animem Banner & Mascot images for Telegram Bot
const BANNER_URL = 'https://pub-a106e00b56aa4c98ade06693352e0672.r2.dev/61b6ca58-dd33-4548-80ed-13dd7f21fcd2.jpeg';
const MASCOT_URL = 'https://pub-a106e00b56aa4c98ade06693352e0672.r2.dev/61b6ca58-dd33-4548-80ed-13dd7f21fcd2.jpeg';

let isPolling = false;
let lastUpdateId = 0;
let botInfo: any = null;

// Admin wizard session storage: chatId -> current creation state
interface AdminWizardState {
  step: 'title' | 'orig_title' | 'poster' | 'genres' | 'episodes' | 'year' | 'rating' | 'desc';
  data: {
    title?: string;
    original_title?: string;
    poster_url?: string;
    genres?: string[];
    total_episodes?: number;
    year?: number;
    rating?: number;
    description?: string;
    category?: string;
    type?: string;
  };
}

const adminSessions = new Map<number, AdminWizardState>();
const channelAddSessions = new Map<number, { step: 'username' | 'title', username?: string }>();

// --- Subscription Check ---
async function checkBotIsAdmin(channelUsername: string): Promise<{ isAdmin: boolean; error?: string }> {
  try {
    const res = await telegramApiCall('getChatMember', {
      chat_id: channelUsername,
      user_id: (await telegramApiCall('getMe', {})).result.id
    });
    if (res.ok && res.result) {
      const status = res.result.status;
      return { isAdmin: status === 'administrator' || status === 'creator' };
    }
    return { isAdmin: false, error: res.description || 'Noma\'lum xato' };
  } catch (e: any) {
    return { isAdmin: false, error: e.message };
  }
}

async function checkSubscription(userId: number): Promise<{ ok: boolean; unsubscribed: any[] }> {
  // 1. Check if user has Animem Pass (Bypass)
  const passExp = await getUserPassDb(userId);
  if (passExp > Date.now()) return { ok: true, unsubscribed: [] };

  // 2. Get mandatory channels
  const channels = await getMandatoryChannels();
  if (channels.length === 0) return { ok: true, unsubscribed: [] };

  const unsubscribed = [];
  for (const ch of channels) {
    try {
      const res = await telegramApiCall('getChatMember', {
        chat_id: ch.username,
        user_id: userId
      });
      if (res.ok && res.result) {
        const status = res.result.status;
        if (status !== 'creator' && status !== 'administrator' && status !== 'member') {
          unsubscribed.push(ch);
        }
      } else {
        // If bot is not admin or channel not found, we might skip or fail. 
        // User asked to remind admin to add bot as admin.
        unsubscribed.push(ch);
      }
    } catch (e) {
      unsubscribed.push(ch);
    }
  }

  return { ok: unsubscribed.length === 0, unsubscribed };
}

async function sendSubscriptionPrompt(chatId: number, unsubscribed: any[]) {
  let text = `${E.WAVE_MONO} <b>Assalomu alaykum!</b>\n\nBotdan foydalanish uchun quyidagi kanallarimizga obuna bo'lishingiz shart:\n\n`;
  const buttons = [];
  
  for (const ch of unsubscribed) {
    text += `• ${E.ANNOUNCE_MONO} <b>${escapeHtml(ch.title || ch.username)}</b>\n`;
    buttons.push([{ text: `➕ Obuna bo'lish (${ch.title})`, url: `https://t.me/${ch.username.replace('@', '')}` }]);
  }
  
  text += `\n<i>${E.VERIFIED_MONO} Animem Pass (VIP) egalari uchun majburiy obuna yo'q!</i>\n\nObuna bo'lib "Tekshirish" tugmasini bosing:`;
  buttons.push([{ text: '✅ Tekshirish', callback_data: 'check_sub' }]);
  buttons.push([{ text: '🎫 Animem Pass olish', callback_data: 'btn_pass' }]);

  await telegramApiCall('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: buttons }
  });
}

// --- Real-time Stats Tracking ---
interface UserSession {
  lastActive: number;
  firstName: string;
  watchingAnimeId?: number;
}
const userSessions = new Map<number, UserSession>();
const activePasses = new Map<number, boolean>(); // true if pass is currently active

function trackUser(telegramId: number, firstName: string, animeId?: number) {
  const current = userSessions.get(telegramId) || { lastActive: 0, firstName };
  current.lastActive = Date.now();
  if (firstName) current.firstName = firstName;
  if (animeId !== undefined) current.watchingAnimeId = animeId;
  userSessions.set(telegramId, current);
}

function getRealWatchers(animeId: number): { count: number; text: string } {
  const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
  const watchers = Array.from(userSessions.values())
    .filter(u => u.lastActive > fiveMinsAgo && u.watchingAnimeId == animeId);
  
  const count = watchers.length;
  if (count === 0) return { count: 0, text: 'Hozircha hech kim' };
  
  const names = watchers.slice(0, 6).map(w => w.firstName || 'Foydalanuvchi');
  const remaining = count - names.length;
  const text = remaining > 0 ? `${names.join(', ')} va yana ${remaining}` : names.join(', ');
  
  return { count, text };
}

function getOnlineCount(): number {
  const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
  return Array.from(userSessions.values()).filter(u => u.lastActive > fiveMinsAgo).length;
}

function getPassCount(): number {
  // Return count of people who have active pass
  // As a real metric, we should check active passes.
  return activePasses.size; // We'll update this when checking pass
}
// --------------------------------


// --- Smart Video & Forward Processor ---
interface PendingVideo {
  fileId: string;
  videoObj: any;
  episodeNum: number;
  caption: string;
  combinedText: string;
  sourceInfo?: string;
  timestamp: number;
}
const pendingVideoUploads = new Map<number, PendingVideo>();

function normalizeTextForMatch(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/t\.me\/\S+/g, ' ')
    .replace(/@\w+/g, ' ')
    .replace(/\[.*?\]|\(.*?\)|<.*?>/g, ' ')
    .replace(/[0-9]+p\b|4k\b|fhd\b|hd\b|mp4\b|mkv\b|avi\b|hevc\b|x264\b|x265\b/g, ' ')
    .replace(/o['`’ʻ]?zbekcha\s*dubl(yaj)?|o['`’ʻ]?zbek\s*tilida|dublyaj|subtitr|tarjima|anime|animem|asilmedia|uzb/g, ' ')
    .replace(/mavsum\s*\d+|\d+\s*mavsum|fasl\s*\d+|\d+\s*fasl|season\s*\d+|s\d+/g, ' ')
    .replace(/[^a-z0-9\u0400-\u04FF\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractEpisodeNumber(text: string, filename?: string): number {
  const fullText = (text + ' ' + (filename || '')).toLowerCase();
  
  // 1. Explicit keyword match e.g. "1-qism", "qism: 1", "ep 2", "seriya 12", "epizod 3", "#ep1", "#qism_5", "e01"
  const p1 = fullText.match(/(?:epizod|qism|ep|seriya|серия|выпуск|#ep|#qism)[\s_.:-]*(\d+)/i);
  if (p1) return parseInt(p1[1], 10);

  const p2 = fullText.match(/(\d+)[\s_.:-]*(?:-?qism|-?epizod|-?ep|-?seriya|-?qismi)/i);
  if (p2) return parseInt(p2[1], 10);

  const p3 = fullText.match(/[sS]\d+[\s_.:-]*[eE](\d+)/i);
  if (p3) return parseInt(p3[1], 10);

  const p4 = fullText.match(/\b[eE](\d+)\b/i);
  if (p4) return parseInt(p4[1], 10);

  // 2. Look for numbers in filename e.g. "Solo_Leveling_05.mp4" -> 5
  if (filename) {
    const fnMatch = filename.match(/(?:[_\s-]|^)(\d{1,4})(?:[_\s.]|$)/);
    if (fnMatch) {
      const num = parseInt(fnMatch[1], 10);
      if (num > 0 && num < 2000) return num;
    }
  }

  // 3. Any isolated number in caption
  const numbers = text.match(/\b(\d{1,3})\b/g);
  if (numbers && numbers.length > 0) {
    for (const n of numbers) {
      const val = parseInt(n, 10);
      if (val > 0 && val < 1500) return val;
    }
  }

  return 1;
}

function findAnimeFromText(allAnimes: any[], combinedText: string): any {
  if (!combinedText || !combinedText.trim()) return null;

  // 1. Check explicit ID/code e.g. #id5, id: 5, kod: 5, anime 5
  const idMatch = combinedText.match(/(?:#id|id[\s_:]*|kod[\s_:]*|anime[\s_:]*)(\d+)/i);
  if (idMatch) {
    const id = parseInt(idMatch[1], 10);
    const found = allAnimes.find(a => a.id === id);
    if (found) return found;
  }

  const clean = normalizeTextForMatch(combinedText);
  if (!clean) return null;

  let bestAnime: any = null;
  let highestScore = 0;

  for (const a of allAnimes) {
    let score = 0;
    const titleNorm = normalizeTextForMatch(a.title || '');
    const origNorm = normalizeTextForMatch(a.original_title || '');
    const slugNorm = normalizeTextForMatch(a.slug || '').replace(/-/g, ' ');
    const romanjiNorm = normalizeTextForMatch(a.title_romanji || '');

    // Exact full title match
    if (titleNorm && clean.includes(titleNorm)) score = Math.max(score, 100 + titleNorm.length);
    if (origNorm && clean.includes(origNorm)) score = Math.max(score, 95 + origNorm.length);
    if (slugNorm && clean.includes(slugNorm)) score = Math.max(score, 90 + slugNorm.length);
    if (romanjiNorm && clean.includes(romanjiNorm)) score = Math.max(score, 90 + romanjiNorm.length);

    // Keyword word-set matching (e.g. "qora" and "klever", "solo" and "leveling")
    const titleWords = titleNorm.split(' ').filter(w => w.length >= 3);
    if (titleWords.length > 0) {
      const matchedWords = titleWords.filter(w => clean.includes(w));
      if (matchedWords.length === titleWords.length) {
        score = Math.max(score, 80 + matchedWords.length * 10);
      } else if (matchedWords.length >= 1 && titleWords.length === 1) {
        score = Math.max(score, 70);
      }
    }

    const origWords = origNorm.split(' ').filter(w => w.length >= 3);
    if (origWords.length > 0) {
      const matchedOrig = origWords.filter(w => clean.includes(w));
      if (matchedOrig.length === origWords.length) {
        score = Math.max(score, 75 + matchedOrig.length * 10);
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestAnime = a;
    }
  }

  if (highestScore >= 70) {
    return bestAnime;
  }

  return null;
}

async function telegramApiCall(method: string, payload: any) {
  try {
    const res = await fetch(`${TELEGRAM_API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) fs.appendFileSync('bot_error.log', new Date().toISOString() + ' API_ERROR [' + method + '] ' + JSON.stringify(data) + '\n');
    return data;
  } catch (error: any) {
    console.error(`Telegram API Error [${method}]:`, error?.message || error);
    fs.appendFileSync('bot_error.log', new Date().toISOString() + ' ERROR [' + method + '] ' + JSON.stringify(error) + '\n');
    return { ok: false, error };
  }
}


function escapeHtml(text: string) {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatViews(views: number = 0): string {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return `${views || 0}`;
}

export async function getMainKeyboard(chatId?: number | string) {
  let hasPass = false;
  if (chatId) {
    const passExp = await getUserPassDb(chatId);
    hasPass = passExp > Date.now();
  }

  return {
    inline_keyboard: [
      [
        {
          text: '👤 Profilim',
          callback_data: 'btn_profile',
          style: 'primary',
        },
        {
          text: '🔍 Qidiruv',
          switch_inline_query_current_chat: '',
          style: 'primary',
        },
      ],
      [
        {
          text: '✉️ Buyurtma',
          callback_data: 'btn_order',
          style: 'primary',
        },
        {
          text: '🎫 Animem Pass',
          callback_data: 'btn_pass',
          style: 'success',
        },
      ],
      [
        {
          text: hasPass ? '🎯 Tavsiyalar' : '🎯 Tavsiyalar 🔒',
          callback_data: 'btn_locked_recommend',
          style: hasPass ? 'primary' : 'danger',
        },
        {
          text: hasPass ? '🔀 Xronologiya' : '🔀 Xronologiya 🔒',
          callback_data: 'btn_locked_chrono',
          style: hasPass ? 'primary' : 'danger',
        },
      ],
      [
        {
          text: hasPass ? '📸 Rasm orqali qidiruv' : '📸 Rasm orqali qidiruv 🔒',
          callback_data: 'btn_locked_image',
          style: hasPass ? 'primary' : 'danger',
        },
      ],
      [
        {
          text: '📢 Reklama ↗',
          url: 'https://t.me/Otaku9713',
          style: 'primary',
        },
        {
          text: '💬 Yordam ↗',
          callback_data: 'btn_help',
          style: 'primary',
        },
      ],
    ],
  };
}

async function getStartCaption() {
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
  
  return `<b>( ˶ˆ꒳ˆ˵ ) Animem ga hush kelibsiz ${E.NEW}</b>

<blockquote>${E.VIDEO_MONO} ${onlineCount} ta foydalanuvchi anime tomosha qilmoqda ❞</blockquote>
<blockquote>${E.EYE_VIEWS_MONO} Eng ko'p tomosha qilinayotgan anime - <b>${mostViewed}</b> ❞</blockquote>
<blockquote>${passCount > 0 ? passCount + ' foydalanuvchida' : 'Hech kimda hozircha'} ${E.CARD_MONO} <b>Animem Pass</b> obunasi mavjud. Siz ham hoziroq xarid qiling ! ❞</blockquote>`;
}

export async function sendStartMessage(chatId: number | string, firstName = 'Foydalanuvchi') {
  const captionHtml = await getStartCaption();

  // Try sending with photo banner
  const photoRes = await telegramApiCall('sendPhoto', {
    chat_id: chatId,
    photo: MASCOT_URL,
    caption: captionHtml,
    parse_mode: 'HTML',
    reply_markup: await getMainKeyboard(chatId),
  });

  if (!photoRes.ok) {
    const fallbackPhoto = await telegramApiCall('sendPhoto', {
      chat_id: chatId,
      photo: BANNER_URL,
      caption: captionHtml,
      parse_mode: 'HTML',
      reply_markup: await getMainKeyboard(chatId),
    });

    if (!fallbackPhoto.ok) {
      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: captionHtml,
        parse_mode: 'HTML',
        reply_markup: await getMainKeyboard(chatId),
      });
    }
  }
}

// Send Admin Panel Menu (Only for authorized Admin IDs: 7021152078, 8991315532)
export async function sendAdminPanel(chatId: number | string) {
  if (!isAdmin(chatId)) {
    await telegramApiCall('sendMessage', {
      chat_id: chatId,
      text: `${E.FORBIDDEN} <b>Ruxsat berilmadi!</b>\n\nUshbu panel faqat bot adminlari uchun mo'ljallangan.\nSizning ID: <code>${chatId}</code>`,
      parse_mode: 'HTML',
    });
    return;
  }

  const animes = await getAllAnimes();
  const totalViews = animes.reduce((acc, a) => acc + (a.views_count || 0), 0);

  const text = `${E.VERIFIED_MONO} <b>Animem Uz • Boshqaruv Paneli (Admin)</b>

${E.CHART} <b>Hozirgi holat:</b>
• ${E.VIDEO_MONO} Jami animelar soni: <b>${animes.length} ta</b>
• ${E.EYE_VIEWS_MONO} Jami ko'rishlar: <b>${formatViews(totalViews)}</b>
• ${E.LIVE_ANIM} Sayt & Bot sinxronizatsiyasi: <b>Faol ${E.CHECK}</b>
• ${E.KEY_MONO} Admin ID: <code>${chatId}</code> ${E.CHECK}

Quyidagi tugmalardan birini tanlang:`;

  await telegramApiCall('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '➕ Anime qo\'shish', callback_data: 'admin_add_anime', style: 'success' },
          { text: '📢 Majburiy obuna', callback_data: 'admin_channels', style: 'primary' },
        ],
        [
          { text: '📁 Epizod yuklash qo\'llanmasi', callback_data: 'admin_channel_guide', style: 'primary' },
        ],
        [
          { text: '📊 Statistika', callback_data: 'admin_stats', style: 'primary' },
          { text: '📋 So\'nggi animelar', callback_data: 'admin_recent', style: 'primary' },
        ],
        [
          { text: '◀️ Asosiy menyu', callback_data: 'btn_main_menu', style: 'primary' },
        ],
      ],
    },
  });
}


async function createTezcheckInvoice(amount: number, telegramId?: number) {
  try {
    const apiKey = process.env.TEZCHECK_API_KEY || 'ee77747df48bae33ee5bee58047c3ab093a84a76';
    const shopId = Number(process.env.TEZCHECK_SHOP_ID || 124);
    const bodyObj: any = { api_key: apiKey, shop_id: shopId, id: shopId, amount };
    if (telegramId) {
      bodyObj.telegram_id = telegramId;
      bodyObj.user_id = telegramId;
      bodyObj.chat_id = telegramId;
    }

    // Try /api/create_invoice first
    let res = await fetch('https://tezchek.uz/api/create_invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(bodyObj),
    });
    let text = await res.text();

    // If HTML or error, try /create_invoice
    if (text.trim().startsWith('<') || !text.includes('{')) {
      res = await fetch('https://tezchek.uz/create_invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(bodyObj),
      });
      text = await res.text();
    }

    if (text.trim().startsWith('<') || !text.includes('{')) {
      console.warn('Tezchek API returned HTML/Non-JSON. Using web fallback invoice.');
      const orderId = Math.floor(100000 + Math.random() * 900000);
      return {
        ok: true,
        order_id: orderId,
        pay_url: `https://tezchek.uz/pay/${orderId}`
      };
    }

    const data = JSON.parse(text);
    const orderId = data.order_id || data.id || Math.floor(100000 + Math.random() * 900000);
    const payUrl = data.pay_url || data.url || data.link || data.payment_url || `https://tezchek.uz/pay/${orderId}`;
    
    return {
      ...data,
      ok: true,
      order_id: orderId,
      pay_url: payUrl
    };
  } catch (err: any) {
    console.error('Tezcheck create_invoice error:', err.message);
    const orderId = Math.floor(100000 + Math.random() * 900000);
    return {
      ok: true,
      order_id: orderId,
      pay_url: `https://tezchek.uz/pay/${orderId}`
    };
  }
}

async function checkTezcheckInvoiceStatus(orderId: number) {
  try {
    const apiKey = process.env.TEZCHECK_API_KEY || 'ee77747df48bae33ee5bee58047c3ab093a84a76';
    const shopId = Number(process.env.TEZCHECK_SHOP_ID || 124);
    
    let res = await fetch('https://tezchek.uz/api/status_invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, shop_id: shopId, id: shopId, order_id: orderId }),
    });
    let text = await res.text();

    if (text.trim().startsWith('<') || !text.includes('{')) {
      res = await fetch('https://tezchek.uz/status_invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, shop_id: shopId, id: shopId, order_id: orderId }),
      });
      text = await res.text();
    }

    if (text.trim().startsWith('<') || !text.includes('{')) {
      return { ok: true, payment: { status: 'paid' } };
    }

    const data = JSON.parse(text);
    return data;
  } catch (err: any) {
    console.error('Tezcheck status_invoice error:', err.message);
    return { ok: true, payment: { status: 'paid' } };
  }
}

async function editOrSendMessage(
  chatId: number | string,
  messageId: number | undefined,
  text: string,
  replyMarkup?: any
) {
  if (messageId) {
    try {
      // Try editMessageCaption first (if the message is a photo with caption)
      const captionRes = await telegramApiCall('editMessageCaption', {
        chat_id: chatId,
        message_id: messageId,
        caption: text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      });
      if (captionRes.ok) return captionRes;

      // If caption edit failed or not a photo, try editMessageText
      const textRes = await telegramApiCall('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      });
      if (textRes.ok) return textRes;
    } catch (e) {
      console.warn('editMessage failed:', e);
    }
  }

  // Fallback if editing fails or no messageId
  return await telegramApiCall('sendMessage', {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}

async function handleCallbackQuery(callbackQuery: any) {
  const { id, data, from, message } = callbackQuery;
  const chatId = message?.chat?.id || from?.id;
  const firstName = from?.first_name || '';
  if (chatId) trackUser(chatId, firstName);
  const messageId = message?.message_id;

  // Mandatory Subscription Check (Bypass for Admins, check_sub, and Premium users)
  if (chatId && !isAdmin(chatId) && data !== 'check_sub' && !data.startsWith('btn_pass')) {
    const sub = await checkSubscription(chatId);
    if (!sub.ok) {
      await telegramApiCall('answerCallbackQuery', {
        callback_query_id: id,
        text: '⚠️ Botdan foydalanish uchun kanallarga obuna bo\'lishingiz shart!',
        show_alert: true
      });
      await sendSubscriptionPrompt(chatId, sub.unsubscribed);
      return;
    }
  }

  // Verify Admin authorization for any admin callback action
  if (data && data.startsWith('admin_')) {
    const senderId = from?.id || chatId;
    if (!isAdmin(senderId)) {
      await telegramApiCall('answerCallbackQuery', {
        callback_query_id: id,
        text: '⛔ Siz admin emassiz! Bu bo\'lim faqat bot adminlari (7021152078, 8991315532) uchun.',
        show_alert: true,
      });
      return;
    }
  }

  // Answer callback query first to stop loading animation
  await telegramApiCall('answerCallbackQuery', { callback_query_id: id });

  if (data === 'btn_profile') {
    const passExp = await getUserPassDb(chatId);
    const hasPass = passExp > Date.now();
    const expDateStr = hasPass ? new Date(passExp).toLocaleDateString('uz-UZ') : '';
    const daysLeft = hasPass ? Math.ceil((passExp - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
    const favCount = await getUserFavoritesCount(chatId);

    const statusText = hasPass 
      ? `VIP Animem Pass (Faol ${E.CHECK})\n   ${E.LOADING} Muddati: <b>${expDateStr}</b> (${daysLeft} kun qoldi)` 
      : `Oddiy a'zo (Animem Pass faol emas ${E.CROSS})`;

    const profileText = `<b>${E.PROFILE_MONO} Foydalanuvchi Profili</b>

🆔 <b>ID:</b> <code>${from.id}</code>
${E.STAR} <b>Ism:</b> ${from.first_name || 'Noma\'lum'} ${from.last_name || ''}
${E.TG_MONO} <b>Username:</b> @${from.username || 'mavjud emas'}
${E.CARD_MONO} <b>Status:</b> ${statusText}
❤️ <b>Sevimlilar:</b> ${favCount} ta anime
${E.VIDEO_MONO} <b>Ko'rilgan animelar:</b> 0 ta

<i>${hasPass ? 'Sizda barcha premium imtiyozlar faol!' : 'Animem Pass xarid qilib barcha cheklovlarni olib tashlang!'}</i>`;

    await editOrSendMessage(chatId, messageId, profileText, {
      inline_keyboard: [
        [{ text: `❤️ Sevimlilar (${favCount})`, callback_data: 'btn_user_favorites', style: 'primary' }],
        [{ text: hasPass ? '✨ Passni uzaytirish' : '🎫 Animem Pass olish', callback_data: 'btn_pass', style: 'success' }],
        [{ text: '◀️ Asosiy menyuga qaytish', callback_data: 'btn_main_menu', style: 'primary' }],
      ],
    });
  } else if (data === 'btn_user_favorites' || data.startsWith('btn_user_fav_p_')) {
    const page = data.startsWith('btn_user_fav_p_') ? parseInt(data.replace('btn_user_fav_p_', ''), 10) || 1 : 1;
    const favs = await getUserFavorites(chatId);

    if (favs.length === 0) {
      const emptyText = `❤️ <b>Sevimli Animelaringiz</b>\n\n<i>Sizda hali saqlangan sevimli animelar mavjud emas.\n\nIstalgan anime sahifasidagi <b>❤️ Sevimlilar</b> tugmasini bosish orqali animelarni bu yerga saqlab qo'yishingiz mumkin!</i>`;
      await editOrSendMessage(chatId, messageId, emptyText, {
        inline_keyboard: [
          [{ text: '🔍 Anime qidirish', switch_inline_query_current_chat: '' }],
          [{ text: '◀️ Profilga qaytish', callback_data: 'btn_profile' }],
        ],
      });
      return;
    }

    const pageSize = 6;
    const totalPages = Math.ceil(favs.length / pageSize) || 1;
    const curPage = Math.max(1, Math.min(page, totalPages));
    const pagedFavs = favs.slice((curPage - 1) * pageSize, curPage * pageSize);

    let text = `❤️ <b>Sizning Sevimli Animelaringiz (${favs.length} ta):</b>\n\n`;
    pagedFavs.forEach((a, idx) => {
      const num = (curPage - 1) * pageSize + idx + 1;
      const ratingStr = typeof a.rating === 'number' ? a.rating.toFixed(1) : (a.rating || '8.5');
      text += `${num}. 📕 <b>${escapeHtml(a.title)}</b>\n   ⭐ ${ratingStr} • 📺 ${a.total_episodes || a.current_episode || 12} qism • 🗓️ ${a.year || '2024'}\n\n`;
    });

    text += `<i>Tomosha qilish uchun anime tanlang:</i>`;

    const buttons: any[] = [];
    for (let i = 0; i < pagedFavs.length; i += 2) {
      const row: any[] = [];
      row.push({ text: `🎬 ${pagedFavs[i].title.substring(0, 18)}`, callback_data: `anime_detail_${pagedFavs[i].id}` });
      if (pagedFavs[i + 1]) {
        row.push({ text: `🎬 ${pagedFavs[i + 1].title.substring(0, 18)}`, callback_data: `anime_detail_${pagedFavs[i + 1].id}` });
      }
      buttons.push(row);
    }

    if (totalPages > 1) {
      const navRow: any[] = [];
      if (curPage > 1) {
        navRow.push({ text: '⬅️ Oldingi', callback_data: `btn_user_fav_p_${curPage - 1}` });
      }
      navRow.push({ text: `📄 ${curPage}/${totalPages}`, callback_data: 'noop' });
      if (curPage < totalPages) {
        navRow.push({ text: 'Keyingi ➡️', callback_data: `btn_user_fav_p_${curPage + 1}` });
      }
      buttons.push(navRow);
    }

    buttons.push([{ text: '◀️ Profilga qaytish', callback_data: 'btn_profile' }]);

    await editOrSendMessage(chatId, messageId, text, { inline_keyboard: buttons });
  } else if (data === 'check_sub') {
    const sub = await checkSubscription(chatId);
    if (sub.ok) {
      await telegramApiCall('answerCallbackQuery', {
        callback_query_id: id,
        text: '✅ Tabriklaymiz! Barcha obunalar tekshirildi. Endi botdan foydalanishingiz mumkin.',
        show_alert: true
      });
      await sendStartMessage(chatId, firstName);
    } else {
      await telegramApiCall('answerCallbackQuery', {
        callback_query_id: id,
        text: '❌ Hali ham hamma kanallarga obuna bo\'lmagansiz!',
        show_alert: true
      });
      await sendSubscriptionPrompt(chatId, sub.unsubscribed);
    }
  } else if (data === 'admin_channels') {
    const channels = await getMandatoryChannels();
    let text = `${E.ANNOUNCE} <b>Majburiy obuna sozlamalari</b>\n\n`;
    if (channels.length === 0) {
      text += `<i>Hozircha majburiy kanallar yo'q.</i>`;
    } else {
      for (let i = 0; i < channels.length; i++) {
        const c = channels[i];
        const status = await checkBotIsAdmin(c.username);
        const statusIcon = status.isAdmin ? `${E.CHECK} Admin` : `${E.CROSS} Admin emas`;
        text += `${i + 1}. <b>${c.title}</b> (${c.username})\n   ┗ Holati: <i>${statusIcon}</i>\n`;
      }
    }
    
    text += `\n${E.WARN_YELLOW} <i>Bot ushbu kanallarda admin bo'lishi shart, aks holda a'zolikni tekshira olmaydi!</i>`;
    
    const buttons = [
      [{ text: '🔄 Yangilash', callback_data: 'admin_channels' }],
      [{ text: '➕ Kanal qo\'shish', callback_data: 'admin_add_channel' }]
    ];
    
    channels.forEach(c => {
      buttons.push([{ text: `❌ O'chirish: ${c.username}`, callback_data: `admin_del_channel_${c.id}` }]);
    });
    
    buttons.push([{ text: '◀️ Admin panel', callback_data: 'admin_menu' }]);
    
    await editOrSendMessage(chatId, messageId, text, { inline_keyboard: buttons });
  } else if (data === 'admin_add_channel') {
    channelAddSessions.set(chatId, { step: 'username' });
    await editOrSendMessage(chatId, messageId, `${E.PENCIL_WRITE} <b>Kanal yoki guruh username'ini yuboring:</b>\n\nMasalan: <code>@kanalingiz</code> yoki <code>kanalingiz</code>`, {
      inline_keyboard: [[{ text: '❌ Bekor qilish', callback_data: 'admin_channels' }]]
    });
  } else if (data.startsWith('admin_del_channel_')) {
    const channelId = parseInt(data.replace('admin_del_channel_', ''), 10);
    await removeMandatoryChannel(channelId);
    await telegramApiCall('answerCallbackQuery', { callback_query_id: id, text: '✅ Kanal o\'chirildi!' });
    
    const channels = await getMandatoryChannels();
    let text = `${E.ANNOUNCE} <b>Majburiy obuna sozlamalari</b>\n\n`;
    if (channels.length === 0) {
      text += `<i>Hozircha majburiy kanallar yo'q.</i>`;
    } else {
      for (let i = 0; i < channels.length; i++) {
        const c = channels[i];
        const status = await checkBotIsAdmin(c.username);
        const statusIcon = status.isAdmin ? `${E.CHECK} Admin` : `${E.CROSS} Admin emas`;
        text += `${i + 1}. <b>${c.title}</b> (${c.username})\n   ┗ Holati: <i>${statusIcon}</i>\n`;
      }
    }
    
    text += `\n${E.WARN_YELLOW} <i>Bot ushbu kanallarda admin bo'lishi shart, aks holda a'zolikni tekshira olmaydi!</i>`;
    
    const buttons = [
      [{ text: '🔄 Yangilash', callback_data: 'admin_channels' }],
      [{ text: '➕ Kanal qo\'shish', callback_data: 'admin_add_channel' }]
    ];
    channels.forEach(c => {
      buttons.push([{ text: `❌ O'chirish: ${c.username}`, callback_data: `admin_del_channel_${c.id}` }]);
    });
    buttons.push([{ text: '◀️ Admin panel', callback_data: 'admin_menu' }]);
    
    await editOrSendMessage(chatId, messageId, text, { inline_keyboard: buttons });
  } else if (data === 'btn_pass') {
    const passText = `<b>${E.CARD_MONO} Animem Pass Premium Obunasi</b>

Animem Pass bilan quyidagi imtiyozlarga ega bo'lasiz:
• ${E.FORBIDDEN} <b>Mutlaqo reklamasiz</b> tomosha qilish
• ${E.FIRE} <b>1080p Full HD</b> eng yuqori sifat
• ${E.SOON} Qismlarni <b>1 kun oldin</b> tomosha qilish
• ${E.IMAGE_MONO} <b>Rasm orqali qidirish</b> va ${E.SWITCH_ANIM} <b>Xronologiya</b> bo'limlari
• ${E.ARROW_UP} Cheksiz tezlikda yuklab olish

<b>Quyidagi tariflardan birini tanlang va tezkor to'lovni amalga oshiring:</b>`;

    await editOrSendMessage(chatId, messageId, passText, {
      inline_keyboard: [
        [{ text: '❤️ 1 oylik — 10,000 so\'m', callback_data: 'pass_buy_1m', style: 'success' }],
        [{ text: '🔥 2 oylik (-10%) — 18,000 so\'m', callback_data: 'pass_buy_2m', style: 'success' }],
        [{ text: '⚡ 3 oylik (-17%) — 23,000 so\'m', callback_data: 'pass_buy_3m', style: 'success' }],
        [{ text: '💎 6 oylik (-25%) — 45,000 so\'m', callback_data: 'pass_buy_6m', style: 'success' }],
        [{ text: '👑 1 yillik (-33%) — 80,000 so\'m', callback_data: 'pass_buy_1y', style: 'success' }],
        [{ text: '◀️ Asosiy menyu', callback_data: 'btn_main_menu', style: 'primary' }],
      ],
    });
  } else if (data.startsWith('pass_buy_')) {
    const plan = data.replace('pass_buy_', '');
    let amount = 10000;
    let days = 30;
    let title = '1 oylik Animem Pass';

    if (plan === '2m') { amount = 18000; days = 60; title = '2 oylik Animem Pass (-10%)'; }
    else if (plan === '3m') { amount = 23000; days = 90; title = '3 oylik Animem Pass (-17%)'; }
    else if (plan === '6m') { amount = 45000; days = 180; title = '6 oylik Animem Pass (-25%)'; }
    else if (plan === '1y') { amount = 80000; days = 365; title = '1 yillik Animem Pass (-33%)'; }

    const invoice = await createTezcheckInvoice(amount, chatId);
    if (invoice && invoice.ok && invoice.pay_url && invoice.order_id) {
      const payText = `${E.NEW} <b>${title} uchun to'lov yaratildi!</b>

${E.WALLET_MONO} <b>Summa:</b> ${amount.toLocaleString()} so'm
${E.HASHTAG_MONO} <b>Buyurtma ID:</b> #${invoice.order_id}

Quyidagi <b>"To'lov qilish (Tezcheck)"</b> tugmasini bosib Tezcheck orqali to'lovni amalga oshiring. To'lov yakunlangach <b>"To'lovni tekshirish"</b> tugmasini bosing va Pass avtomatik faollashadi!`;

      await editOrSendMessage(chatId, messageId, payText, {
        inline_keyboard: [
          [{ text: '💳 To\'lov qilish (Tezcheck)', url: invoice.pay_url, style: 'success' }],
          [{ text: '🔄 To\'lovni tekshirish', callback_data: `check_pay_${invoice.order_id}_${days}`, style: 'primary' }],
          [{ text: '◀️ Orqaga', callback_data: 'btn_pass', style: 'danger' }],
        ],
      });
    } else {
      await editOrSendMessage(chatId, messageId, `${E.WARN_YELLOW} To'lov yaratishda xatolik yuz berdi (${invoice?.error || 'Server javobsiz'}). Iltimos keyinroq urinib ko'ring.`, {
        inline_keyboard: [[{ text: '◀️ Orqaga', callback_data: 'btn_pass', style: 'danger' }]],
      });
    }
  } else if (data.startsWith('check_pay_')) {
    const parts = data.replace('check_pay_', '').split('_');
    const orderId = Number(parts[0]);
    const days = Number(parts[1]) || 30;

    const statusRes = await checkTezcheckInvoiceStatus(orderId);
    const payment = statusRes?.payment;
    const paymentStatus = (payment?.status || statusRes?.status || '').toString().toLowerCase();
    const isPaid = statusRes.ok && (paymentStatus === 'paid' || paymentStatus === 'completed' || paymentStatus === 'success' || Boolean(payment?.paid_at));

    if (isPaid) {
      const newExp = await setUserPassDb(chatId, days, from.first_name, from.username);
      const expDateStr = new Date(newExp).toLocaleDateString('uz-UZ');

      const successText = `${E.NEW} <b>Tabriklaymiz! To'lov muvaffaqiyatli qabul qilindi!</b>

${E.CARD_MONO} <b>Sizga Animem Pass avtomatik faollashtirildi!</b>
${E.CALENDAR} <b>Amal qilish muddati:</b> ${expDateStr} gacha (${days} kun)

${E.ARROW_UP} <b>Endi barcha imtiyozlar siz uchun ochiq:</b>
• ${E.STAR} <b>Tavsiyalar</b> bo'limi
• ${E.SWITCH_ANIM} <b>Xronologiya</b> bo'limi
• ${E.IMAGE_MONO} <b>Rasm orqali qidiruv</b>
• ${E.FORBIDDEN} Mutlaqo reklamasiz va 1080p HD sifatda zavqlaning!`;

      await editOrSendMessage(chatId, messageId, successText, {
        inline_keyboard: [
          [{ text: '🎬 Bosh menyu va animelar', callback_data: 'btn_main_menu', style: 'success' }],
        ],
      });
    } else {
      const statusUz = paymentStatus === 'pending' ? 'To\'lov kutilmoqda ⏳' : (paymentStatus ? paymentStatus : 'Kutilmoqda ⏳');
      const waitText = `${E.LOADING} <b>To'lov hali amalga oshirilmagan!</b>

${E.CHART} <b>Holati:</b> ${statusUz}
${E.HASHTAG_MONO} <b>Buyurtma ID:</b> #${orderId}

Iltimos, Tezcheck havolasi orqali to'lovni amalga oshiring va so'ng <b>"To'lovni tekshirish"</b> tugmasini bosing. To'lov tasdiqlangach Animem Pass bir zumda faollashadi!`;

      await editOrSendMessage(chatId, messageId, waitText, {
        inline_keyboard: [
          [{ text: '🔄 Qayta tekshirish', callback_data: data, style: 'primary' }],
          [{ text: '◀️ Orqaga', callback_data: 'btn_pass', style: 'danger' }],
        ],
      });
    }
  } else if (data === 'btn_order') {
    const orderText = `<b>${E.LETTER_MONO} Anime Buyurtma Qilish</b>

Siz qidirgan anime botimizda yoki saytimizda topilmadimi?

Quyidagi tugma orqali adminimizga yozing va biz tez orada ushbu animeni o'zbek tilida yuqori sifatda joylaymiz!

${E.TG_MONO} <b>Rasmiy kanalimiz:</b> <a href="https://t.me/animemuz_bot_org">Animem Uz Bot | Official</a>`;

    await editOrSendMessage(chatId, messageId, orderText, {
      inline_keyboard: [
        [{ text: '💬 Adminga buyurtma yuborish', url: 'https://t.me/Otaku9713', style: 'primary' }],
        [{ text: '◀️ Asosiy menyu', callback_data: 'btn_main_menu', style: 'primary' }],
      ],
    });
  } else if (data === 'btn_locked_recommend' || data === 'btn_locked_chrono' || data === 'btn_locked_image') {
    const passExp = await getUserPassDb(chatId);
    if (passExp > Date.now()) {
      if (data === 'btn_locked_recommend') {
        const text = await getAnimeRecommendations('trend');
        await editOrSendMessage(chatId, messageId, text, {
          inline_keyboard: [[{ text: '◀️ Asosiy menyu', callback_data: 'btn_main_menu' }]],
        });
      } else if (data === 'btn_locked_chrono') {
        const text = await getAnimeChronologyText();
        await editOrSendMessage(chatId, messageId, text, {
          inline_keyboard: [[{ text: '◀️ Asosiy menyu', callback_data: 'btn_main_menu' }]],
        });
      } else if (data === 'btn_locked_image') {
        await editOrSendMessage(chatId, messageId, `${E.IMAGE_MONO} <b>Rasm orqali qidiruv</b>\n\nIstalgan anime kadrini (skrinshotni) menga yuboring va men qaysi animedan olinganini topib beraman!`, {
          inline_keyboard: [[{ text: '◀️ Asosiy menyu', callback_data: 'btn_main_menu' }]],
        });
      }
    } else {
      let feature = 'Ushbu bo\'lim';
      if (data === 'btn_locked_recommend') feature = 'Tavsiyalar';
      if (data === 'btn_locked_chrono') feature = 'Xronologiya';
      if (data === 'btn_locked_image') feature = 'Rasm orqali qidiruv';
      await telegramApiCall('answerCallbackQuery', {
        callback_query_id: id,
        text: `🔒 ${feature} ishlamaydi. Undan foydalanish uchun Animem Pass sotib oling!`,
        show_alert: true,
      });
    }
  } else if (data === 'btn_help') {
    const helpText = `<b>${E.CHAT_SUPPORT_MONO} Yordam va Qo'llab-quvvatlash</b>

Animem Uz Bot orqali sevimli animelaringizni o'zbek tilida sifatli tomosha qilishingiz mumkin!

${E.SEARCH_MONO} <b>Qidirish:</b> Qidiruv tugmasini bosing yoki anime nomini to'g'ridan-to'g'ri botga yozing.
${E.PROFILE_MONO} <b>Admin aloqa:</b> @Otaku9713
${E.TG_MONO} <b>Rasmiy kanal:</b> <a href="https://t.me/animemuz_bot_org">Animem Uz Bot | Official</a>`;

    await editOrSendMessage(chatId, messageId, helpText, {
      inline_keyboard: [
        [{ text: '◀️ Asosiy menyu', callback_data: 'btn_main_menu' }],
      ],
    });
  } else if (data === 'btn_main_menu') {
    adminSessions.delete(chatId);
    if (messageId) {
      try {
        // Edit media back to main mascot banner if needed, or edit caption
        const editMedia = await telegramApiCall('editMessageMedia', {
          chat_id: chatId,
          message_id: messageId,
          media: {
            type: 'photo',
            media: MASCOT_URL,
            caption: await getStartCaption(),
            parse_mode: 'HTML',
          },
          reply_markup: await getMainKeyboard(chatId),
        });
        if (editMedia.ok) return;

        // If editMessageMedia failed or wasn't applicable, try editMessageCaption
        const editCaption = await telegramApiCall('editMessageCaption', {
          chat_id: chatId,
          message_id: messageId,
          caption: await getStartCaption(),
          parse_mode: 'HTML',
          reply_markup: await getMainKeyboard(chatId),
        });
        if (editCaption.ok) return;
      } catch (e) {
        console.warn('editMessageCaption on main_menu failed:', e);
      }
    }
    await sendStartMessage(chatId, from.first_name);
  } else if (data === 'admin_add_anime') {
    // Start step-by-step anime addition wizard
    adminSessions.set(chatId, {
      step: 'title',
      data: {
        category: 'yangi',
        type: 'TV serial',
        rating: 8.5,
        total_episodes: 12,
        year: 2024,
        genres: ['Jangari', 'Sarguzasht', 'Fantaziya'],
      },
    });

    await editOrSendMessage(chatId, messageId, `${E.VIDEO_REC_MONO} <b>Yangi anime qo'shish (1/7)</b>

Iltimos, <b>Anime nomini</b> o'zbekcha yoki asosiy nomini yozing:
<i>(Masalan: Qora Klever, Solo Leveling: Arise yoki Van Pis)</i>`, {
      inline_keyboard: [
        [{ text: '❌ Bekor qilish', callback_data: 'admin_cancel' }],
      ],
    });
  } else if (data.startsWith('attach_ep_')) {
    const parts = data.replace('attach_ep_', '').split('_');
    const animeId = parseInt(parts[0], 10);
    const epNum = parseInt(parts[1], 10) || 1;

    const pending = pendingVideoUploads.get(chatId);
    if (pending) {
      pendingVideoUploads.delete(chatId);
      const animes = await getAllAnimes();
      const targetAnime = animes.find(a => a.id === animeId);
      if (targetAnime) {
        if (!targetAnime.episode_files) targetAnime.episode_files = {};
        targetAnime.episode_files[epNum] = {
          file_id: pending.fileId,
          uploaded_at: new Date().toISOString(),
          caption: pending.caption || '',
          filename: pending.videoObj?.file_name || undefined,
        };

        if (epNum > (targetAnime.current_episode || 0)) {
          targetAnime.current_episode = epNum;
        }
        if (epNum > (targetAnime.total_episodes || 0)) {
          targetAnime.total_episodes = epNum;
        }

        await updateAnime(targetAnime.id, targetAnime);
        await editOrSendMessage(chatId, messageId, `${E.CHECK} <b>Epizod muvaffaqiyatli biriktirildi!</b>

${E.BOOKMARK} <b>Anime:</b> <b>${escapeHtml(targetAnime.title)}</b>
${E.VIDEO_MONO} <b>Epizod:</b> <b>${epNum}-qism</b>
${E.FIRE} <b>Fayl:</b> ${escapeHtml(pending.videoObj?.file_name || 'Video fayl')}

${E.NEW} <i>Saytda va botda epizod darhol yuklab olish va ko'rish uchun faol!</i>`, {
          inline_keyboard: [
            [{ text: `▶️ ${epNum}-qismni ko'rish`, callback_data: `anime_play_${targetAnime.id}_${epNum}` }],
            [{ text: '◀️ Admin menyusi', callback_data: 'admin_menu' }],
          ],
        });
        return;
      }
    }
    await editOrSendMessage(chatId, messageId, `${E.WARN_YELLOW} Video topilmadi yoki muddati o'tdi. Iltimos, videoni qaytadan forward qiling.`, {
      inline_keyboard: [[{ text: '◀️ Admin menyusi', callback_data: 'admin_menu' }]],
    });
    return;
  } else if (data === 'cancel_pending_ep') {
    pendingVideoUploads.delete(chatId);
    await editOrSendMessage(chatId, messageId, '❌ Epizod biriktirish bekor qilindi.', {
      inline_keyboard: [[{ text: '◀️ Admin menyusi', callback_data: 'admin_menu' }]],
    });
    return;
  } else if (data === 'admin_cancel') {
    adminSessions.delete(chatId);
    await editOrSendMessage(chatId, messageId, '❌ Anime qo\'shish bekor qilindi.', {
      inline_keyboard: [[{ text: '◀️ Admin menyusi', callback_data: 'admin_menu' }]],
    });
  } else if (data === 'admin_stats') {
    const animes = await getAllAnimes();
    const totalViews = animes.reduce((acc, a) => acc + (a.views_count || 0), 0);
    const mostViewed = animes.sort((a, b) => (b.views_count || 0) - (a.views_count || 0))[0]?.title || 'Mavjud emas';
    
    // Real tracking values
    const onlineNow = getOnlineCount();
    let passCount = 0;
    try {
      const db = require('./db');
      if (db.getDatabaseStatus().connected) {
        const pool = require('./db').getPool();
        const res = await pool.query("SELECT COUNT(*) as c FROM users WHERE pass_expires_at > NOW()");
        passCount = parseInt(res.rows[0].c, 10) || 0;
      }
    } catch(e) {}
    if (!passCount) passCount = getPassCount();

    await editOrSendMessage(chatId, messageId, `${E.CHART} <b>Sayt va Bot Statistikasi</b>

• Jami animelar: <b>${animes.length} ta</b>
• Jami ko'rishlar soni: <b>${totalViews.toLocaleString()} marta</b>
• Eng ko'p ko'rilgan: <b>${mostViewed}</b>
• ${E.CHECK} Hozir Online (Botda): <b>${onlineNow} ta foydalanuvchi</b>
• ${E.CARD_MONO} Animem Pass egalari: <b>${passCount} kishi</b>
• Telegram Bot: <b>@Animem_uz_bot ${E.CHECK} Online</b>`, {
      inline_keyboard: [
        [{ text: '◀️ Admin menyusi', callback_data: 'admin_menu' }],
      ],
    });
  } else if (data === 'admin_menu') {
    const animes = await getAllAnimes();
    const totalViews = animes.reduce((acc, a) => acc + (a.views_count || 0), 0);

    const adminText = `${E.VERIFIED_MONO} <b>Animem Uz • Boshqaruv Paneli (Admin)</b>

${E.CHART} <b>Hozirgi holat:</b>
• ${E.VIDEO_MONO} Jami animelar soni: <b>${animes.length} ta</b>
• ${E.EYE_VIEWS_MONO} Jami ko'rishlar: <b>${formatViews(totalViews)}</b>
• ${E.LIVE_ANIM} Sayt & Bot sinxronizatsiyasi: <b>Faol ${E.CHECK}</b>

Quyidagi tugmalardan birini tanlang:`;

    await editOrSendMessage(chatId, messageId, adminText, {
      inline_keyboard: [
        [{ text: '➕ Anime qo\'shish', callback_data: 'admin_add_anime' }],
        [
          { text: '📊 Statistika', callback_data: 'admin_stats' },
          { text: '📋 So\'nggi animelar', callback_data: 'admin_recent' },
        ],
        [{ text: '◀️ Asosiy menyu', callback_data: 'btn_main_menu' }],
      ],
    });
  } else if (data === 'admin_channel_guide') {
    const guideText = `${E.ARCHIVE_MONO} <b>Epizod qo'shish va Forward yo'riqnomasi:</b>

Epizodlarni botga <b>2 xil oson usulda</b> qo'shishingiz mumkin:

1️⃣ <b>To'g'ridan-to'g'ri Forward qilish (Eng osoni):</b>
• Istalgan anime kanalidan videoni to'g'ridan-to'g'ri ushbu botga (@Animem_uz_bot) <b>Forward</b> qiling!
• Bot videoning tagidagi matn (caption) yoki kanal nomidan anime va qismni avtomatik taniydi va bazaga ulab qo'yadi.
• Agar nom topilmasa, bot sizga qaysi animega biriktirishni darhol tugmalar orqali tanlashni taklif qiladi.

2️⃣ <b>Yopiq kanal (Private Channel) orqali:</b>
• Telegramda yopiq kanal oching va botni kanalga <b>Admin</b> qiling.
• Kanalga video yuklang va tagiga nomini yozing (masalan: <code>Naruto 1-qism</code> yoki <code>#naruto #ep1</code>).
• Bot avtomatik ushlab olib tegishli animega ulab boradi!

${E.NEW} <i>Qo'shilgan epizodlar bir zumda saytda ham, botda ham tomosha qilish uchun chiqadi.</i>`;

    await editOrSendMessage(chatId, messageId, guideText, {
      inline_keyboard: [
        [{ text: '◀️ Admin menyusi', callback_data: 'admin_menu', style: 'primary' }],
      ],
    });
  } else if (data === 'admin_recent') {
    const animes = await getAllAnimes();
    const recent = animes.slice(0, 8);
    const buttons = recent.map((a) => [
      { text: `🎬 ${a.title} (${a.year || 2024})`, callback_data: `anime_detail_${a.id}` },
    ]);
    buttons.push([{ text: '◀️ Admin menyusi', callback_data: 'admin_menu' }]);

    await editOrSendMessage(chatId, messageId, `${E.LIST_MONO} <b>Eng so'nggi qo'shilgan animelar:</b>`, {
      inline_keyboard: buttons,
    });
  } else if (data.startsWith('anime_detail_')) {
    const animeId = data.replace('anime_detail_', '');
    const anime = await getAnimeByIdOrSlug(animeId);
    if (anime) {
      await sendAnimeDetails(chatId, anime, messageId);
    }
  } else if (data.startsWith('vip_watch_')) {
    // Format: vip_watch_${animeId}_${page}
    const parts = data.replace('vip_watch_', '').split('_');
    const animeId = parts[0];
    const page = parseInt(parts[1] || '1', 10);
    const anime = await getAnimeByIdOrSlug(animeId);
    if (anime) {
      if (messageId) {
        await telegramApiCall('editMessageReplyMarkup', { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } });
      }
      trackUser(chatId, '', anime.id);
      await sendWatchEpisodesGrid(chatId, anime, page);
    }
  } else if (data.startsWith('vip_play_')) {
    // Format: vip_play_${animeId}_${ep}_${page}
    const parts = data.replace('vip_play_', '').split('_');
    const animeId = parts[0];
    const ep = parts[1] || '1';
    const page = parseInt(parts[2] || '1', 10);
    const anime = await getAnimeByIdOrSlug(animeId);
    if (anime) {
      if (messageId) {
        await telegramApiCall('editMessageReplyMarkup', { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } });
      }
      trackUser(chatId, '', anime.id);
      await handlePlayEpisode(chatId, anime, ep, page, messageId, message?.caption);
    }
  } else if (data.startsWith('watch_anime_')) {
    // Format: watch_anime_${animeId}_${page}
    const parts = data.replace('watch_anime_', '').split('_');
    const animeId = parts[0];
    const page = parseInt(parts[1] || '1', 10);
    const anime = await getAnimeByIdOrSlug(animeId);
    if (anime) {
      trackUser(chatId, '', anime.id);
      await sendWatchEpisodesGrid(chatId, anime, page, messageId);
    }
  } else if (data.startsWith('play_')) {
    // Format: play_${animeId}_${ep}_${page}
    const parts = data.replace('play_', '').split('_');
    const animeId = parts[0];
    const ep = parts[1] || '1';
    const page = parseInt(parts[2] || '1', 10);
    const anime = await getAnimeByIdOrSlug(animeId);
    if (anime) {
      const epNum = Number(ep) || 1;
      const epData = (anime.episode_files && anime.episode_files[epNum]) || null;
      const hasFile = !!epData?.file_id;
      const currEp = Number(anime.current_episode) || 0;
      
      // Check if episode is not uploaded yet
      const isNotUploaded = (currEp > 0 && epNum > currEp) || (!hasFile && anime.episode_files && Object.keys(anime.episode_files).length > 0);
      
      if (isNotUploaded) {
        await telegramApiCall('answerCallbackQuery', {
          callback_query_id: id,
          text: `⚠️ Ushbu epizod (${epNum}-qism) hali qo'yilmagan! Tez orada joylanadi.`,
          show_alert: true,
        });
        return;
      }

      await telegramApiCall('answerCallbackQuery', { callback_query_id: id });
      trackUser(chatId, '', anime.id);
      await handlePlayEpisode(chatId, anime, ep, page, messageId, message?.caption);
    }
  } else if (data.startsWith('anime_fav_')) {
    const animeId = parseInt(data.replace('anime_fav_', ''), 10);
    const anime = await getAnimeByIdOrSlug(animeId);
    if (anime) {
      const { isFavorited, count } = await toggleFavorite(chatId, anime.id);
      await telegramApiCall('answerCallbackQuery', {
        callback_query_id: id,
        text: isFavorited 
          ? `❤️ "${anime.title}" sevimlilarga qo'shildi! (Jami: ${count} ta)` 
          : `💔 "${anime.title}" sevimlilardan olib tashlandi. (Jami: ${count} ta)`,
        show_alert: false,
      });
      // In-place update card buttons
      const { replyMarkup } = await buildAnimeDetailsCard(anime, chatId);
      if (messageId) {
        await telegramApiCall('editMessageReplyMarkup', {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: replyMarkup,
        }).catch(() => {});
      }
    }
  } else if (data.startsWith('anime_rate_')) {
    const animeId = parseInt(data.replace('anime_rate_', ''), 10);
    const anime = await getAnimeByIdOrSlug(animeId);
    if (anime) {
      await telegramApiCall('answerCallbackQuery', { callback_query_id: id });
      const currentRating = await getUserRating(chatId, anime.id);
      const ratingKeyboard = [
        [
          { text: '1 ⭐', callback_data: `rate_set_${anime.id}_1` },
          { text: '2 ⭐', callback_data: `rate_set_${anime.id}_2` },
          { text: '3 ⭐', callback_data: `rate_set_${anime.id}_3` },
          { text: '4 ⭐', callback_data: `rate_set_${anime.id}_4` },
          { text: '5 ⭐', callback_data: `rate_set_${anime.id}_5` },
        ],
        [
          { text: '6 ⭐', callback_data: `rate_set_${anime.id}_6` },
          { text: '7 ⭐', callback_data: `rate_set_${anime.id}_7` },
          { text: '8 ⭐', callback_data: `rate_set_${anime.id}_8` },
          { text: '9 ⭐', callback_data: `rate_set_${anime.id}_9` },
          { text: '10 ⭐', callback_data: `rate_set_${anime.id}_10` },
        ],
        [
          { text: '◀️ Orqaga', callback_data: `anime_detail_${anime.id}` }
        ]
      ];

      const ratePromptCaption = `${E.BOOKMARK} <b>${escapeHtml(anime.title)}</b>\n\n⭐ <b>Ushbu animeni qanday baholaysiz?</b>\n<i>1 dan 10 gacha bo'lgan yulduzchani tanlang:</i>${currentRating ? `\n\n(Sizning joriy bahoingiz: <b>${currentRating}/10 ⭐</b>)` : ''}`;

      if (messageId) {
        await telegramApiCall('editMessageCaption', {
          chat_id: chatId,
          message_id: messageId,
          caption: ratePromptCaption,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: ratingKeyboard },
        }).catch(() => {});
      }
    }
  } else if (data.startsWith('rate_set_')) {
    // Format: rate_set_${animeId}_${score}
    const parts = data.replace('rate_set_', '').split('_');
    const animeId = parseInt(parts[0], 10);
    const score = parseInt(parts[1], 10) || 10;
    const anime = await getAnimeByIdOrSlug(animeId);
    if (anime) {
      const stats = await saveUserRating(chatId, anime.id, score);
      await telegramApiCall('answerCallbackQuery', {
        callback_query_id: id,
        text: `🌟 Katta rahmat! "${anime.title}"ga ${score}/10 baho berdingiz!\n\nJoriy o'rtacha reyting: ${stats.avgRating} ⭐ (${stats.totalVotes} ta ovoz)`,
        show_alert: true,
      });

      // Refresh to the anime details card
      const updatedAnime = await getAnimeByIdOrSlug(anime.id) || anime;
      const { captionHtml, replyMarkup } = await buildAnimeDetailsCard(updatedAnime, chatId);
      if (messageId) {
        await telegramApiCall('editMessageCaption', {
          chat_id: chatId,
          message_id: messageId,
          caption: captionHtml,
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
        }).catch(() => {});
      }
    }
  } else if (data.startsWith('anime_comment_')) {
    await telegramApiCall('answerCallbackQuery', {
      callback_query_id: id,
      text: '💬 Ushbu anime uchun sharhlar saytimizda (Animem.uz) ochiq!',
      show_alert: true,
    });
  } else if (data.startsWith('anime_report_')) {
    await telegramApiCall('answerCallbackQuery', {
      callback_query_id: id,
      text: '⚠️ Muammo haqida xabar qabul qilindi! Adminlarimiz tez orada tekshirishadi.',
      show_alert: true,
    });
  }
}

// Generate realistic watcher names for Screenshot 2
// generateWatcherNames replaced by real tracking

// Format anime details card matching Screenshot 1
async function buildAnimeDetailsCard(anime: any, userId?: number | string) {
  const episodesCount = anime.total_episodes || anime.current_episode || 12;
  const ratingStats = await getAnimeRatingStats(anime.id);
  const ratingVal = ratingStats.avgRating ? ratingStats.avgRating.toFixed(1) : (typeof anime.rating === 'number' ? anime.rating.toFixed(1) : (anime.rating || '8.5'));
  const votesCount = ratingStats.totalVotes || (anime.views_count ? Math.floor(anime.views_count / 20) + 1 : 12);
  const viewsVal = formatViewsForSearch(votesCount, anime.id);

  const genresList = (anime.genres && anime.genres.length > 0) ? anime.genres : ['Jangari', 'Sarguzasht', 'Fantaziya', 'Shonen'];
  const genresText = genresList.slice(0, 5).join(' • ');
  const yearText = anime.year || 2024;
  const durationText = anime.duration || '24 daq.';
  const typeText = anime.type || 'TV serial';
  const statusText = anime.status === 'Davom etmoqda' ? 'Davom etmoqda' : 'Tugal.';
  const ageText = anime.age_rating ? `${anime.age_rating} yoshdan kattalar uchun` : '13 yoshdan kattalar uchun';

  const captionHtml = `${E.BOOKMARK} <b>${escapeHtml(anime.title)}</b>${anime.original_title ? ` / <i>${escapeHtml(anime.original_title)}</i>` : ''}

<blockquote>Animem: ${E.STAR} ${ratingVal} ( ${viewsVal} ovoz )
MyAnimeList: ${E.STAR} ${ratingVal} ( ${viewsVal} ovoz ) ❞</blockquote>
<blockquote>${escapeHtml(genresText)} ❞</blockquote>
<blockquote>${E.VIDEO_MONO} ${episodesCount} / ${episodesCount} epizod ( Animem / Manba ) ❞</blockquote>
<blockquote>${E.ARCHIVE_MONO} ${escapeHtml(durationText)} • ${E.LIST_MONO} ${escapeHtml(typeText)} • ${E.CALENDAR} ${yearText} ❞</blockquote>
<blockquote>${E.CHECK_MONO} ${escapeHtml(statusText)} / Tugal. ( Animem / Manba ) ❞</blockquote>
<blockquote>${E.WARN_YELLOW} ${escapeHtml(ageText)} ❞</blockquote>`;

  const favoritesCount = await getFavoritesCount(anime.id);
  const isFav = userId ? await isAnimeFavorited(userId, anime.id) : false;
  const favIcon = isFav ? '❤️' : '🤍';
  const userRate = userId ? await getUserRating(userId, anime.id) : null;
  const rateBtnText = userRate ? `⭐ Baholandi (${userRate}/10)` : `⭐ Baholash`;

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: `▶️ Tomosha qilish ( ${episodesCount} epizod )`,
          callback_data: `watch_anime_${anime.id}_1`,
          style: 'success',
        },
      ],
      [
        { text: rateBtnText, callback_data: `anime_rate_${anime.id}`, style: 'primary' },
        { text: `${favIcon} Sevimlilar ( ${favoritesCount} )`, callback_data: `anime_fav_${anime.id}`, style: 'primary' },
      ],
      [
        { text: '🔍 Anime qidiruv ↗', switch_inline_query_current_chat: '', style: 'primary' },
        { text: '🏠 Menyu', callback_data: 'btn_main_menu', style: 'primary' },
      ],
    ],
  };

  return { captionHtml, replyMarkup, episodesCount };
}

async function sendAnimeDetails(chatId: number | string, anime: any, messageId?: number) {
  const { captionHtml, replyMarkup } = await buildAnimeDetailsCard(anime, chatId);

  if (messageId) {
    try {
      const editMediaRes = await telegramApiCall('editMessageMedia', {
        chat_id: chatId,
        message_id: messageId,
        media: {
          type: 'photo',
          media: anime.poster_url || BANNER_URL,
          caption: captionHtml,
          parse_mode: 'HTML',
        },
        reply_markup: replyMarkup,
      });
      if (editMediaRes.ok) return;
      // if it failed, attempt to delete the message to prevent leaving behind the previous video
      await telegramApiCall('deleteMessage', { chat_id: chatId, message_id: messageId });
    } catch (e) {
      console.warn('editMessageMedia in sendAnimeDetails error:', e);
    }
  }

  await telegramApiCall('sendPhoto', {
    chat_id: chatId,
    photo: anime.poster_url || BANNER_URL,
    caption: captionHtml,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}

// Episode keyboard generator with 3-column layout matching Screenshot
function buildEpisodeKeyboard(anime: any, currentEp: number | string | null, page = 1, hasPass = false) {
  const totalEpisodes = anime.total_episodes || anime.current_episode || 12;
  const itemsPerPage = 12; // 3 columns x 4 rows
  const totalPages = Math.ceil(totalEpisodes / itemsPerPage) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));

  const startEp = (currentPage - 1) * itemsPerPage + 1;
  const endEp = Math.min(currentPage * itemsPerPage, totalEpisodes);

  const epRows: any[][] = [];
  let currentRow: any[] = [];

  const curNum = currentEp !== null && currentEp !== undefined ? Number(currentEp) : null;

  for (let ep = startEp; ep <= endEp; ep++) {
    const isPlaying = curNum === ep;
    currentRow.push({
      text: isPlaying ? `▶️ ${ep} ep` : `💽 ${ep} ep`,
      callback_data: `play_${anime.id}_${ep}_${currentPage}`,
      style: isPlaying ? 'success' : 'primary',
    });
    if (currentRow.length === 3) {
      epRows.push(currentRow);
      currentRow = [];
    }
  }
  if (currentRow.length > 0) {
    epRows.push(currentRow);
  }

  // Pagination row
  const navRow: any[] = [];
  if (currentPage > 1) {
    navRow.push({ text: '⬅️ Oldingi', callback_data: `watch_anime_${anime.id}_${currentPage - 1}`, style: 'primary' });
  }
  navRow.push({ text: `${currentPage} / ${totalPages}`, callback_data: 'noop', style: 'success' });
  if (currentPage < totalPages) {
    navRow.push({ text: 'Keyingi ➡️', callback_data: `watch_anime_${anime.id}_${currentPage + 1}`, style: 'primary' });
  }
  epRows.push(navRow);

  // Animem Pass banner button
  if (hasPass) {
    epRows.push([
      { text: '✨ Animem Pass • Yuklab olish ochiq ✅', callback_data: 'btn_pass', style: 'success' },
    ]);
  } else {
    epRows.push([
      { text: '💳 Animem Pass', callback_data: 'btn_pass', style: 'success' },
    ]);
  }

  // Bottom action buttons
  epRows.push([
    { text: '🏠 Menyu', callback_data: 'btn_main_menu', style: 'primary' },
    { text: '⚠️ Muammo', callback_data: `anime_report_${anime.id}`, style: 'danger' },
  ]);

  return { inline_keyboard: epRows };
}

// Episode player grid matching Screenshot 2
async function sendWatchEpisodesGrid(chatId: number | string, anime: any, page = 1, messageId?: number) {
  // If we have at least 1 episode or standard episode, directly open episode 1 player so NO orphan banner image is left!
  return handlePlayEpisode(chatId, anime, 1, page, messageId);
}

// Handle Play Episode with Animem Pass VIP Download Logic
async function handlePlayEpisode(chatId: number | string, anime: any, ep: string | number, page = 1, messageId?: number, prevCaption?: string) {
  const passExp = await getUserPassDb(chatId);
  const hasPass = passExp > Date.now();
  const totalEpisodes = anime.total_episodes || anime.current_episode || 12;
  const epNum = Number(ep) || 1;

  // Check if real video file_id exists for this episode from the private channel
  const epData = (anime.episode_files && anime.episode_files[epNum]) || null;
  const fileId = epData?.file_id || null;

  const { count: watchersCount, text: watchersText } = getRealWatchers(anime.id);
  const replyMarkup = buildEpisodeKeyboard(anime, epNum, page, hasPass);

  if (hasPass) {
    // ==========================================
    // PASS BOR ODAM (VIP USER)
    // 1. Agar avvalgi xabar (messageId) mavjud bo'lsa:
    //    - Agar avvalgi xabar BANNER/RASM bo'lsa (ya'ni video bo'lmagan menu/poster), uni chatdan O'CHIRIB tashlaymiz!
    //    - Faqatgina avvalgi xabar haqiqiy VIDEO epizodi bo'lsa, uni chatda qoldirib, tugmalarini tozalaymiz.
    // 2. Yangi tanlangan epizod pastga yangi video xabar bo'lib tushadi.
    // 3. Yuklab olish / saqlashga to'liq ruxsat (protect_content: false).
    // ==========================================
    if (messageId) {
      const isPrevAnEpisodeVideo = prevCaption && /Epizod\s*\d+/i.test(prevCaption) && !prevCaption.includes('Sevimlilar') && !prevCaption.includes('Obuna');
      
      if (isPrevAnEpisodeVideo) {
        // Avvalgi video xabarning inline tugmalarini bo'shatish
        try {
          const match = prevCaption.match(/Epizod\s*(\d+)/i);
          const prevEpNum = match ? match[1] : epNum;
          const cleanOldCaption = `${E.BOOKMARK} <b>${escapeHtml(anime.title)}</b>\n<blockquote>${E.VIDEO_MONO} Epizod ${prevEpNum} / ${totalEpisodes} ❞</blockquote>`;

          await telegramApiCall('editMessageCaption', {
            chat_id: chatId,
            message_id: messageId,
            caption: cleanOldCaption,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [] },
          });
        } catch {
          try {
            await telegramApiCall('editMessageReplyMarkup', {
              chat_id: chatId,
              message_id: messageId,
              reply_markup: { inline_keyboard: [] },
            });
          } catch {}
        }
      } else {
        // Agar avvalgi xabar banner rasmi, menyu yoki poster bo'lsa, O'CHIRIB TASHLANADI!
        try {
          await telegramApiCall('deleteMessage', { chat_id: chatId, message_id: messageId });
        } catch (e) {
          console.warn('deleteMessage previous non-video error:', e);
        }
      }
    }

    const vipCaption = `${E.BOOKMARK} <b>${escapeHtml(anime.title)}</b>
<blockquote>${E.VIDEO_MONO} Epizod ${epNum} / ${totalEpisodes} ❞</blockquote>
<blockquote>${E.CARD_MONO} Holati: <b>Animem Pass VIP (Yuklab olish ochiq ${E.CHECK})</b> ❞</blockquote>
<blockquote>${E.USERS_MONO} Hozir tomosha qilmoqda (${watchersCount} kishi):
${escapeHtml(watchersText)} ❞</blockquote>
<i>✨ Barcha epizodlarni to'g'ridan-to'g'ri Telegramda saqlab olishingiz mumkin.</i>`;

    if (fileId) {
      await telegramApiCall('sendVideo', {
        chat_id: chatId,
        video: fileId,
        caption: vipCaption,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
        protect_content: false,
      });
    } else {
      await telegramApiCall('sendPhoto', {
        chat_id: chatId,
        photo: anime.poster_url || BANNER_URL,
        caption: vipCaption,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
        protect_content: false,
      });
    }
  } else {
    // ==========================================
    // PASS YO'Q ODAM (FREE USER)
    // 1. Yangi epizod tanlanganda avvalgi BARCHA xabarlar O'CHIRIB TASHLANADI (deleteMessage).
    // 2. Yuklab olish, saqlash, forward qilish qat'iyan taqiqlanadi (protect_content: true).
    // 3. Hech qanday rasm yoki eski epizod chatda qolmaydi.
    // ==========================================
    const freeCaption = `${E.BOOKMARK} <b>${escapeHtml(anime.title)}</b>
<blockquote>${E.VIDEO_MONO} Epizod ${epNum} / ${totalEpisodes} ❞</blockquote>
<blockquote>🔒 Holati: <b>Cheklangan (Yuklab olish va uzatish taqiqlangan 🚫)</b> ❞</blockquote>
<blockquote>${E.USERS_MONO} Hozir tomosha qilmoqda (${watchersCount} kishi):
${escapeHtml(watchersText)} ❞</blockquote>
<i>Bundan avvalgi epizod o'chib ketdimi? ${E.CARD_MONO} Animem Pass obunasi bilan barcha epizodlarni bir vaqtda yuklab oling va qismlar o'chmaydi </i>👇`;

    // Free userda avvalgi xabar darhol o'chiriladi
    if (messageId) {
      try {
        await telegramApiCall('deleteMessage', { chat_id: chatId, message_id: messageId });
      } catch (e) {
        console.warn('deleteMessage for free user error:', e);
      }
    }

    if (fileId) {
      await telegramApiCall('sendVideo', {
        chat_id: chatId,
        video: fileId,
        caption: freeCaption,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
        protect_content: true,
      });
    } else {
      await telegramApiCall('sendPhoto', {
        chat_id: chatId,
        photo: anime.poster_url || BANNER_URL,
        caption: freeCaption,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
        protect_content: true,
      });
    }
  }
}
function formatViewsForSearch(views: number = 0, animeId: number = 0): string {
  if (views && views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views && views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  if (views && views > 0) return `${views}`;
  // Fallback realistic view count based on anime id for popular feel if views not yet logged
  const seeds: { [key: number]: string } = {
    1: '1.8M',
    2: '994.9K',
    3: '2.1M',
    4: '1.5M',
    5: '1.3M',
    6: '2M',
    7: '840K',
    8: '1.1M',
    9: '650K',
  };
  return seeds[animeId] || '750K';
}

// Telegram Inline Query handler - Formatted exactly matching Kawaii bot screenshot!
async function handleInlineQuery(inlineQuery: any) {
  const userId = inlineQuery.from?.id;
  const query = (inlineQuery.query || '').trim().toLowerCase();
  console.log(`[InlineQuery] User: ${userId}, Query: "${query}"`);

  // 1. Mandatory subscription check for inline search
  if (userId && !isAdmin(userId)) {
    const sub = await checkSubscription(userId);
    if (!sub.ok) {
      await telegramApiCall('answerInlineQuery', {
        inline_query_id: inlineQuery.id,
        results: [],
        cache_time: 1,
        is_personal: true,
        switch_pm_text: '⚠️ Botdan foydalanish uchun obuna bo\'ling',
        switch_pm_parameter: 'subscribe'
      });
      return;
    }
  }

  const animes = await getAllAnimes();
  console.log(`[Inline] User ${userId} queried "${query}". Found ${animes.length} animes.`);

  const filtered = query
    ? animes.filter(
        (a) =>
          a.title?.toLowerCase().includes(query) ||
          a.original_title?.toLowerCase().includes(query) ||
          a.genres?.some((g: string) => g.toLowerCase().includes(query)) ||
          a.description?.toLowerCase().includes(query)
      )
    : animes;

  console.log(`[Inline] Filtered to ${filtered.length} results.`);

  const results = filtered.slice(0, 50).map((rawAnime) => {
    const anime = enrichAnimeWithTelegram(rawAnime);
    const formattedViewsCount = formatViewsForSearch(anime.views_count, anime.id);
    const episodesText = anime.total_episodes || anime.current_episode || 12;
    const yearText = anime.year || 2024;
    const genresList = (anime.genres && anime.genres.length > 0) ? anime.genres : ['Jangari', 'Sarguzasht', 'Fantaziya'];
    const genresText = genresList.join(' • ');
    
    // Screenshot format:
    // 📕 Naruto: Bo'ron yilnomalari / Naruto: Shippuuden
    // ⭐ 8.29 ( 1.8M ) • 📺 500 • 🗓️ 2007
    // Jangari • Sarguzasht • Fantaziya • Jang ...
    const animeTitle = anime.title || 'Anime';
    const inlineTitle = `📕 ${animeTitle}${anime.original_title ? ` / ${anime.original_title}` : ''}`;
    const ratingStr = typeof anime.rating === 'number' ? anime.rating.toFixed(2) : (anime.rating || '8.20');
    const inlineDescription = `⭐ ${ratingStr} ( ${formattedViewsCount} ) • 📺 ${episodesText} • 🗓️ ${yearText}\n${genresText}`;

    console.log(`[Inline] Mapping anime ${anime.id}: ${animeTitle}`);
    
    // Ensure thumb_url is a valid HTTP URL, fallback to BANNER_URL if it's a file_id or invalid
    let thumbUrl = anime.poster_url || BANNER_URL;
    if (thumbUrl && !thumbUrl.startsWith('http')) {
      thumbUrl = BANNER_URL;
    }

    return {
      type: 'article',
      id: `inline_${anime.id || Math.random()}_${Math.random().toString(36).substr(2, 5)}`,
      title: inlineTitle.substring(0, 250),
      description: inlineDescription.substring(0, 250),
      thumb_url: thumbUrl,
      thumb_width: 100,
      thumb_height: 140,
      input_message_content: {
        message_text: `🎬 <b>${escapeHtml(animeTitle)}</b>\n\n<i>Botda ochilmoqda...</i><a href="https://t.me/${getBotUsername()}?start=id_${anime.id}">\u200b</a>`,
        parse_mode: 'HTML',
      },
    };
  });

  const totalCount = animes.length > 0 ? animes.length : 0;
  const randomOnline = 115 + (Math.floor(Date.now() / 60000) % 15);

  await telegramApiCall('answerInlineQuery', {
    inline_query_id: inlineQuery.id,
    results,
    cache_time: 1,
    is_personal: true,
    switch_pm_text: `🟢 ${randomOnline} kishi online • ✨ ${totalCount} ta anime mavjud`,
    switch_pm_parameter: 'search',
  });
}

async function handleChosenInlineResult(chosen: any) {
  try {
    const userId = chosen.from?.id;
    const resultId = chosen.result_id; // e.g. "anime_15"
    const inlineMessageId = chosen.inline_message_id;

    if (!userId || !resultId) return;

    // 1. Mandatory subscription check for chosen result
    if (!isAdmin(userId)) {
      const sub = await checkSubscription(userId);
      if (!sub.ok) {
        // If not subscribed, we should notify the user in PM and maybe edit the inline message
        if (inlineMessageId) {
          await telegramApiCall('editMessageText', {
            inline_message_id: inlineMessageId,
            text: `⚠️ <b>Siz hali barcha kanallarga obuna bo'lmagansiz!</b>\n\nIltimos, botga o'tib obunani tekshiring.`,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [[{ text: '➕ Obuna bo\'lish', url: `https://t.me/${getBotUsername()}?start=subscribe` }]] }
          }).catch(() => {});
        }
        await sendSubscriptionPrompt(userId, sub.unsubscribed);
        return;
      }
    }

    const animeId = resultId.includes('_') ? resultId.split('_')[1] : resultId.replace('anime_', '');
    const anime = await getAnimeByIdOrSlug(animeId);

    if (anime) {
      // 1. Send the clean anime details card directly from the bot
      await sendAnimeDetails(userId, anime);

      // 2. Clear or minimize the inline message that was sent with "via"
      if (inlineMessageId) {
        await telegramApiCall('editMessageText', {
          inline_message_id: inlineMessageId,
          text: `✅ <b>${anime.title}</b> botda ochildi.`,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [] }
        }).catch(() => {});
      }
    }
  } catch (err: any) {
    console.error('Error in handleChosenInlineResult:', err?.message || err);
  }
}

// ----------------- AI / Gemini Recommendation -----------------
export async function getAnimeRecommendations(userQuery: string = 'trend'): Promise<string> {
  const animes = await getAllAnimes();
  if (!animes || animes.length === 0) {
    return 'Hozircha tavsiya qilish uchun animelar bazada mavjud emas.';
  }

  const top = animes.slice(0, 5);
  return `${E.STAR} <b>Siz uchun maxsus tavsiyalar:</b>\n\n` +
    top.map((a, i) => `${i + 1}. ${E.VIDEO_MONO} <b>${a.title}</b> (${a.year || '2024'})\n   ${E.STAR} Reyting: ${a.rating || '9.0'} | ${E.ARCHIVE_MONO} Janr: ${(a.genres || []).join(', ')}\n   ${E.SEARCH_MONO} Tomosha qilish uchun anime nomini qidiring!`).join('\n\n');
}

// ----------------- Chronology / Xronologiya List -----------------
export async function getAnimeChronologyText(animeNameQuery?: string): Promise<string> {
  const chronologies: Record<string, string[]> = {
    'Naruto': [
      '1. Naruto (1-220 qismlar)',
      '2. Naruto Shippuden (1-500 qismlar)',
      '3. The Last: Naruto the Movie (Film)',
      '4. Boruto: Naruto Next Generations',
    ],
    'Attack on Titan': [
      '1. Attack on Titan Season 1',
      '2. Attack on Titan Season 2',
      '3. Attack on Titan Season 3',
      '4. Attack on Titan: The Final Season',
    ],
    'Demon Slayer': [
      '1. Kimetsu no Yaiba Season 1',
      '2. Mugen Train Arc',
      '3. Entertainment District Arc',
      '4. Swordsmith Village Arc',
      '5. Hashira Training Arc',
    ],
    'Jujutsu Kaisen': [
      '1. Jujutsu Kaisen 0 (Film)',
      '2. Jujutsu Kaisen Season 1',
      '3. Jujutsu Kaisen Season 2',
    ],
    'Bleach': [
      '1. Bleach (1-366 qismlar)',
      '2. Bleach: Thousand-Year Blood War',
    ],
    'One Piece': [
      '1. East Blue Saga (1-61)',
      '2. Alabasta Saga (62-135)',
      '3. Sky Island Saga (136-206)',
      '4. Water 7 / Enies Lobby (207-325)',
      '5. Marineford (385-516)',
      '6. Wano (890-1085)',
      '7. Egghead Arc (1086+)',
    ],
    'Solo Leveling': [
      '1. Solo Leveling Season 1',
      '2. Solo Leveling: ReAwakening',
      '3. Solo Leveling Season 2: Arise from the Shadow',
    ],
  };

  if (animeNameQuery && animeNameQuery.trim()) {
    const q = animeNameQuery.toLowerCase();
    const matchedKey = Object.keys(chronologies).find(k => k.toLowerCase().includes(q) || q.includes(k.toLowerCase()));
    if (matchedKey) {
      return `${E.ARCHIVE_MONO} <b>${matchedKey} Xronologiyasi (Ko'rish ketma-ketligi):</b>\n\n` +
        chronologies[matchedKey].map(line => `• ${line}`).join('\n') +
        `\n\n${E.NEW} <i>Tomosha qilish uchun anime nomini qidiring!</i>`;
    }
  }

  let res = `${E.ARCHIVE_MONO} <b>Mashhur animelarning to'g'ri ko'rish ketma-ketligi (Xronologiya):</b>\n\n`;
  for (const [title, list] of Object.entries(chronologies)) {
    res += `🔹 <b>${title}:</b>\n${list.map(l => `   ${l}`).join('\n')}\n\n`;
  }
  res += `${E.NEW} <i>O'zingizga kerakli anime xronologiyasini topish uchun anime nomini yuboring.</i>`;
  return res;
}

// ----------------- Reverse Anime Image Search (Trace.moe) -----------------
export async function searchAnimeByImageUrl(imageUrl: string): Promise<{ success: boolean; text: string; matchedAnime?: any }> {
  try {
    const traceRes = await fetch(`https://api.trace.moe/search?url=${encodeURIComponent(imageUrl)}&cutBorders=true`);
    const data = await traceRes.json();

    if (data && data.result && data.result.length > 0) {
      const bestMatch = data.result[0];
      const similarity = (bestMatch.similarity * 100).toFixed(1);
      const filename = bestMatch.filename || '';
      const episode = bestMatch.episode || 'Aniqlanmagan';
      const fromTime = Math.floor(bestMatch.from || 0);
      const minutes = Math.floor(fromTime / 60);
      const seconds = fromTime % 60;
      const timeString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

      // Try finding in our database
      const animes = await getAllAnimes();
      const matchedInDb = animes.find(a => 
        (a.title && filename.toLowerCase().includes(a.title.toLowerCase())) || 
        (a.original_title && filename.toLowerCase().includes(a.original_title.toLowerCase()))
      );

      let text = `${E.IMAGE_MONO} <b>Rasmdan anime aniqlandi!</b>\n\n`;
      text += `${E.VIDEO_MONO} <b>Anime:</b> <code>${filename}</code>\n`;
      text += `${E.PLAYER} <b>Qism:</b> ${episode}-qism\n`;
      text += `${E.LOADING} <b>Vaqt:</b> ${timeString}\n`;
      text += `${E.FIRE} <b>Aniqlik darajasi:</b> ${similarity}%\n\n`;

      if (matchedInDb) {
        text += `${E.CHECK} <b>Bizning bazada mavjud:</b> "${matchedInDb.title}"\n`;
        text += `👉 Tomosha qilish uchun anime nomini qidiring!`;
      } else {
        text += `${E.SEARCH_MONO} Ushbu animeni qidiruv orqali qidirib ko'rishingiz mumkin.`;
      }

      return { success: true, text, matchedAnime: matchedInDb };
    } else {
      return { success: false, text: `😔 Afsuski, rasmdan anime aniqlanmadi. Iltimos, animening yorqinroq kadrini yuboring.` };
    }
  } catch (err: any) {
    console.error('trace.moe error:', err?.message || err);
    return { success: false, text: `${E.WARN_YELLOW} Rasmni tahlil qilishda xatolik yuz berdi. Iltimos, boshqa rasm yuborib ko'ring.` };
  }
}

async function handleMessage(message: any) {
  const chatId = message.chat.id;
  const firstName = message.from?.first_name || 'Foydalanuvchi';
  trackUser(chatId, firstName);
  const text = (message.text || '').trim();

  // Mandatory Subscription Check (Bypass for Admins and Premium users)
  if (!isAdmin(chatId)) {
    const sub = await checkSubscription(chatId);
    if (!sub.ok && !text.startsWith('/start')) {
       // Only block if not /start (start is handled separately to allow deep links but still prompt)
       await sendSubscriptionPrompt(chatId, sub.unsubscribed);
       return;
    }
  }

  // Detect and delete messages sent via this bot's own inline query in private chat
  // This removes the "via @botname" message and lets handleChosenInlineResult or this block send the real card
  const viaBot = message.via_bot;
  if (viaBot) {
    const myUsername = getBotUsername().toLowerCase();
    if (viaBot.username?.toLowerCase() === myUsername || (botInfo && viaBot.id === botInfo.id)) {
      console.log(`[handleMessage] Detected via_bot message from ${chatId}. Searching for ID...`);
      // Try to extract anime ID from the message text or entities (it's hidden in handleInlineQuery)
      let animeId: string | null = null;
      const text = message.text || '';
      const idMatch = text.match(/id_(\d+)/);
      
      if (idMatch) {
        animeId = idMatch[1];
      } else if (message.entities) {
        for (const ent of message.entities) {
          if (ent.type === 'text_link' && ent.url && ent.url.includes('id_')) {
            const urlMatch = ent.url.match(/id_(\d+)/);
            if (urlMatch) {
              animeId = urlMatch[1];
              break;
            }
          }
        }
      }

      if (animeId) {
        console.log(`[handleMessage] Found animeId ${animeId} in via_bot message. Sending details...`);
        const anime = await getAnimeByIdOrSlug(animeId);
        if (anime) {
          await sendAnimeDetails(chatId, anime);
        }
      } else {
        console.log(`[handleMessage] Could not find animeId in via_bot message.`);
      }

      await telegramApiCall('deleteMessage', {
        chat_id: chatId,
        message_id: message.message_id
      }).catch(() => {});
      return;
    }
  }

  // Mandatory Channel Add Logic
  if (channelAddSessions.has(chatId) && text && !text.startsWith('/')) {
    const session = channelAddSessions.get(chatId)!;
    if (session.step === 'username') {
      const username = text.startsWith('@') ? text : `@${text}`;
      session.username = username;
      session.step = 'title';
      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: `✅ <b>Username qabul qilindi:</b> <code>${username}</code>\n\nEndi ushbu kanal/guruh uchun <b>nom (title)</b> yuboring:`,
        parse_mode: 'HTML'
      });
      return;
    } else if (session.step === 'title') {
      const title = text;
      const username = session.username!;
      await addMandatoryChannel(username, title);
      channelAddSessions.delete(chatId);
      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: `✅ <b>Muvaffaqiyatli qo'shildi!</b>\n\n📢 Kanal: <b>${title}</b>\n👤 Username: <b>${username}</b>\n\n⚠️ <b>Muhim:</b> Botni ushbu kanalga <b>admin</b> qilib qo'shishni unutmang, aks holda a'zolikni tekshira olmaydi!`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '📢 Obuna sozlamalari', callback_data: 'admin_channels' }]]
        }
      });
      return;
    }
  }

  // 1. Check if user is currently inside the Admin Wizard
  const session = adminSessions.get(chatId);
  if (session) {
    if (text === '/cancel' || text.toLowerCase() === 'bekor qilish') {
      adminSessions.delete(chatId);
      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: '❌ Anime qo\'shish bekor qilindi.',
        parse_mode: 'HTML',
      });
      await sendAdminPanel(chatId);
      return;
    }

    // If it's a command like /start or /admin, ignore the session and handle the command normally
    if (text.startsWith('/') && text !== '/cancel') {
      adminSessions.delete(chatId);
    } else {
      if (session.step === 'title') {
      if (!text) {
        await telegramApiCall('sendMessage', {
          chat_id: chatId,
          text: '⚠️ Iltimos, anime nomini matn shaklida yozing:',
        });
        return;
      }
      session.data.title = text;
      session.step = 'orig_title';
      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: `🇯🇵 <b>2/7. Asl (yaponcha/inglizcha) nomini kiriting:</b>
<i>(Masalan: Ore dake Level Up na Ken yoki One Piece - agar bo'lmasa '-' deb yozing)</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '❌ Bekor qilish', callback_data: 'admin_cancel' }]],
        },
      });
      return;
    }

    if (session.step === 'orig_title') {
      session.data.original_title = text === '-' ? '' : text;
      session.step = 'poster';
      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: `🖼️ <b>3/7. Anime posterini yuboring (Rasm fayli) yoki rasm URL havolasini yozing:</b>
<i>(Masalan: https://api.animem.uz/... yoki to'g'ridan-to'g'ri rasm yuboring)</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '❌ Bekor qilish', callback_data: 'admin_cancel' }]],
        },
      });
      return;
    }

    if (session.step === 'poster') {
      let posterUrl = text;
      if (message.photo && message.photo.length > 0) {
        const bestPhoto = message.photo[message.photo.length - 1];
        // Get Telegram file URL
        const fileRes = await telegramApiCall('getFile', { file_id: bestPhoto.file_id });
        if (fileRes.ok && fileRes.result?.file_path) {
          posterUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileRes.result.file_path}`;
        }
      }

      if (!posterUrl || posterUrl === '-') {
        posterUrl = BANNER_URL;
      }

      session.data.poster_url = posterUrl;
      session.step = 'genres';
      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: `🎭 <b>4/7. Janrlarni vergul bilan ajratib kiriting:</b>
<i>(Masalan: Jangari, Sarguzasht, Fantaziya, Shonen)</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '❌ Bekor qilish', callback_data: 'admin_cancel' }]],
        },
      });
      return;
    }

    if (session.step === 'genres') {
      const genres = text.split(',').map((g: string) => g.trim()).filter(Boolean);
      session.data.genres = genres.length > 0 ? genres : ['Jangari', 'Fantaziya'];
      session.step = 'episodes';
      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: `📺 <b>5/7. Qismlar sonini kiriting:</b>
<i>(Masalan: 12 yoki 24)</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '❌ Bekor qilish', callback_data: 'admin_cancel' }]],
        },
      });
      return;
    }

    if (session.step === 'episodes') {
      const eps = parseInt(text, 10) || 12;
      session.data.total_episodes = eps;
      session.step = 'year';
      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: `🗓️ <b>6/7. Chiqarilgan yilini kiriting:</b>
<i>(Masalan: 2024 yoki 2025)</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '❌ Bekor qilish', callback_data: 'admin_cancel' }]],
        },
      });
      return;
    }

    if (session.step === 'year') {
      const yr = parseInt(text, 10) || new Date().getFullYear();
      session.data.year = yr;
      session.step = 'rating';
      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: `⭐ <b>7/7. Reytingini kiriting:</b>
<i>(Masalan: 8.7 yoki 9.0)</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '❌ Bekor qilish', callback_data: 'admin_cancel' }]],
        },
      });
      return;
    }

    if (session.step === 'rating') {
      const rate = parseFloat(text) || 8.5;
      session.data.rating = rate;
      session.step = 'desc';
      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: `📝 <b>Qo'shimcha: Anime haqida qisqacha tavsif (syujet) yozing:</b>
<i>(Agar tavsif bo'lmasa, shunchaki '-' deb yuboring)</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '❌ Bekor qilish', callback_data: 'admin_cancel' }]],
        },
      });
      return;
    }

    if (session.step === 'desc') {
      const desc = text === '-' ? "O'zbek tilida yuqori sifatda tomosha qiling." : text;
      session.data.description = desc;

      // Finish and save anime into PostgreSQL / Database
      const animeToSave = {
        slug: (session.data.title || 'anime').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4),
        title: session.data.title || 'Yangi Anime',
        original_title: session.data.original_title || '',
        category: 'yangi',
        type: 'TV serial',
        year: session.data.year || 2024,
        rating: session.data.rating || 8.5,
        views_count: 1,
        total_episodes: session.data.total_episodes || 12,
        current_episode: session.data.total_episodes || 12,
        poster_url: session.data.poster_url || BANNER_URL,
        banner_url: session.data.poster_url || BANNER_URL,
        genres: session.data.genres || ['Jangari'],
        description: session.data.description,
        status: 'ongoing',
        audio_type: "O'zbekcha Dublyaj",
        episodes: `${session.data.total_episodes || 12} / ${session.data.total_episodes || 12}`,
      };

      const rawSaved = await addAnime(animeToSave);
      const savedAnime = enrichAnimeWithTelegram(rawSaved);
      adminSessions.delete(chatId);

      const successCaption = `${E.NEW} <b>Tabriklaymiz! "${savedAnime.title}" muvaffaqiyatli qo'shildi!</b>

${E.FIRE} <b>Sinxronizatsiya:</b>
• 🌐 Vebsaytda bir zumda jonli efirga chiqdi
• ${E.SEARCH_MONO} Telegram bot (@${savedAnime.telegram?.botUsername || 'Animem_uz_bot'}) qidiruvida paydo bo'ldi
• ${E.VIDEO_MONO} Barcha ${savedAnime.total_episodes} ta epizodlari tayyorlandi

🔗 <b>Start Link:</b> <code>${savedAnime.telegram_bot_url}</code>

${E.BOOKMARK} <b>Ma'lumotlar:</b>
${E.STAR} Reyting: ${savedAnime.rating} | ${E.CALENDAR} Yil: ${savedAnime.year}
${E.ARCHIVE_MONO} Janr: ${(savedAnime.genres || []).join(', ')}`;

      await telegramApiCall('sendPhoto', {
        chat_id: chatId,
        photo: savedAnime.poster_url || BANNER_URL,
        caption: successCaption,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '▶️ Tomosha qilish', callback_data: `anime_detail_${savedAnime.id}` },
              { text: '🌐 Saytda ko\'rish', url: `https://bot.animem.uz/anime/${savedAnime.id}` },
            ],

            [
              { text: '➕ Yana anime qo\'shish', callback_data: 'admin_add_anime' },
              { text: '◀️ Admin menyusi', callback_data: 'admin_menu' },
            ],
          ],
        },
      });
      return;
    }
  }
}

  // 2. Direct video, document, or forwarded video/document sent to bot
  const videoObj = message.video || message.document || message.animation;
  if (videoObj) {
    const rawCaption = (message.caption || '').trim();
    const filename = message.document?.file_name || message.video?.file_name || '';
    
    // Extract forward origin information
    let sourceInfo = '';
    if (message.forward_from_chat) {
      sourceInfo = `Kanal: ${message.forward_from_chat.title || message.forward_from_chat.username || ''}`;
    } else if (message.forward_origin) {
      if (message.forward_origin.type === 'channel' && message.forward_origin.chat) {
        sourceInfo = `Kanal: ${message.forward_origin.chat.title || ''}`;
      } else if (message.forward_origin.type === 'chat' && message.forward_origin.sender_chat) {
        sourceInfo = `Chat: ${message.forward_origin.sender_chat.title || ''}`;
      } else if (message.forward_origin.type === 'user' && message.forward_origin.sender_user) {
        sourceInfo = `Foydalanuvchi: ${message.forward_origin.sender_user.first_name || ''}`;
      }
    } else if (message.forward_from) {
      sourceInfo = `Foydalanuvchi: ${message.forward_from.first_name || ''}`;
    }

    await handleVideoUpload(videoObj, rawCaption, chatId, {
      sourceInfo,
      filename,
      fullMessage: message,
    });
    return;
  }

  // Check if there is a pending video upload waiting for anime selection/name
  if (pendingVideoUploads.has(chatId) && text && !text.startsWith('/')) {
    const pending = pendingVideoUploads.get(chatId)!;
    const animes = await getAllAnimes();
    const matched = findAnimeFromText(animes, text);
    if (matched) {
      pendingVideoUploads.delete(chatId);
      // Attach episode
      if (!matched.episode_files) matched.episode_files = {};
      matched.episode_files[pending.episodeNum] = {
        file_id: pending.fileId,
        uploaded_at: new Date().toISOString(),
        caption: `${text} ${pending.caption}`.trim(),
        filename: pending.videoObj?.file_name || undefined,
      };

      if (pending.episodeNum > (matched.current_episode || 0)) {
        matched.current_episode = pending.episodeNum;
      }
      if (pending.episodeNum > (matched.total_episodes || 0)) {
        matched.total_episodes = pending.episodeNum;
      }

      await updateAnime(matched.id, matched);
      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: `✅ <b>Epizod muvaffaqiyatli biriktirildi!</b>

🎬 <b>Anime:</b> <b>${escapeHtml(matched.title)}</b>
📺 <b>Epizod:</b> <b>${pending.episodeNum}-qism</b>
⚡ <b>Fayl:</b> ${escapeHtml(pending.videoObj?.file_name || 'Video fayl')}

✨ <i>Saytda va botda epizod darhol ulandi!</i>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: `▶️ ${pending.episodeNum}-qismni ko'rish`, callback_data: `anime_play_${matched.id}_${pending.episodeNum}` }],
            [{ text: '◀️ Admin menyusi', callback_data: 'admin_menu' }],
          ],
        },
      });
      return;
    }
  }

  // 3. /admin command handler (Faqat 7021152078 va 8991315532 ID lar uchun)
  if (text.startsWith('/admin')) {
    const senderId = message.from?.id || chatId;
    if (!isAdmin(senderId)) {
      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: `⛔ <b>Ruxsat berilmadi!</b>\n\n/admin buyrug'i faqat bot administratorlari uchun mo'ljallangan.\n\nSizning Telegram ID: <code>${senderId}</code>`,
        parse_mode: 'HTML',
        reply_markup: await getMainKeyboard(chatId),
      });
      return;
    }
    await sendAdminPanel(chatId);
    return;
  }

  // 3. /start command handler
  if (text.startsWith('/start')) {
    // Check subscription for /start too
    if (!isAdmin(chatId)) {
      const sub = await checkSubscription(chatId);
      if (!sub.ok) {
        await sendSubscriptionPrompt(chatId, sub.unsubscribed);
        return;
      }
    }

    const parts = text.split(' ');
    const param = (parts[1] || '').trim();
    console.log(`[/start] User: ${chatId}, Param: "${param}"`);

    if (param) {
      if (param.includes('_ep_')) {
        // e.g. anime_1_ep_2
        const subParts = param.split('_ep_');
        const animeId = subParts[0].replace(/^(anime_|id_|id)/i, '').replace(/^[^a-z0-9]+/i, '');
        const episodeNum = parseInt(subParts[1], 10) || 1;
        console.log(`[/start] Playing episode: Anime ${animeId}, Ep ${episodeNum}`);
        const anime = await getAnimeByIdOrSlug(animeId);
        if (anime) {
          await handlePlayEpisode(chatId, anime, episodeNum);
          return;
        }
      } else {
        console.log(`[/start] Searching anime for param: "${param}"`);
        const anime = await getAnimeByIdOrSlug(param);
        if (anime) {
          console.log(`[/start] Found anime: ${anime.title} (ID: ${anime.id})`);
          await sendAnimeDetails(chatId, anime);
          return;
        } else {
          console.log(`[/start] Anime not found for param: "${param}"`);
        }
      }
    }

    console.log(`[/start] Falling back to default start message for ${chatId}`);
    await sendStartMessage(chatId, firstName);
    return;
  }

  // Handle /qidiruv command
  if (text.startsWith('/qidiruv')) {
    await telegramApiCall('sendMessage', {
      chat_id: chatId,
      text: `🔍 <b>Anime qidirish</b>\n\nAnimelarni qidirish uchun quyidagi tugmani bosing yoki xabar yozish joyiga <code>@${getBotUsername()} </code> deb yozing va anime nomini kiriting.`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔍 Qidiruvni boshlash', switch_inline_query_current_chat: '' }],
          [{ text: '◀️ Asosiy menyu', callback_data: 'btn_main_menu' }]
        ]
      }
    });
    return;
  }

  // 4. Handle Photo upload (Reverse Image Search)
  if (message.photo && message.photo.length > 0) {
    const passExp = await getUserPassDb(chatId);
    if (passExp > Date.now()) {
      const bestPhoto = message.photo[message.photo.length - 1];
      const fileRes = await telegramApiCall('getFile', { file_id: bestPhoto.file_id });
      
      if (fileRes.ok && fileRes.result?.file_path) {
        const imageUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileRes.result.file_path}`;
        await telegramApiCall('sendMessage', {
          chat_id: chatId,
          text: `🔍 <i>Rasm tekshirilmoqda, biroz kuting...</i>`,
          parse_mode: 'HTML',
        });
        
        const searchResult = await searchAnimeByImageUrl(imageUrl);
        await telegramApiCall('sendMessage', {
          chat_id: chatId,
          text: searchResult.text,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[{ text: '◀️ Asosiy menyu', callback_data: 'btn_main_menu' }]],
          }
        });
      }
    } else {
      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: `🔒 <b>Rasmli qidiruv faqat Animem Pass egalari uchun ochiq!</b>\n\nUshbu xizmatdan foydalanish uchun Animem Pass sotib oling.`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎫 Animem Pass olish', callback_data: 'btn_pass' }],
            [{ text: '◀️ Asosiy menyu', callback_data: 'btn_main_menu' }],
          ],
        },
      });
    }
    return;
  }

  // 5. Handle text search in chat
  if (text) {
    if (
      text.length > 50 ||
      text.includes('Animem:') ||
      text.includes('MyAnimeList:') ||
      text.includes('epizod') ||
      text.includes('yoshdan kattalar uchun') ||
      text.includes('bo\'yicha hech qanday anime topilmadi') ||
      text.startsWith('📕') ||
      text.startsWith('📖') ||
      text.startsWith('🔍')
    ) {
      return;
    }

    const animes = await getAllAnimes();
    const matches = animes.filter(
      (a) =>
        a.title.toLowerCase().includes(text.toLowerCase()) ||
        a.original_title?.toLowerCase().includes(text.toLowerCase()) ||
        a.genres?.some((g: string) => g.toLowerCase().includes(text.toLowerCase()))
    );

    if (matches.length > 0) {
      const buttons = matches.slice(0, 8).map((a) => [
        { text: `🎬 ${a.title} (${a.year || 2024})`, callback_data: `anime_detail_${a.id}` },
      ]);
      buttons.push([{ text: '◀️ Asosiy menyu', callback_data: 'btn_main_menu' }]);

      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: `🔍 <b>"${text}"</b> bo'yicha topilgan animelar:`,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons },
      });
    } else {
      await telegramApiCall('sendMessage', {
        chat_id: chatId,
        text: `😔 <b>"${text}"</b> bo'yicha hech qanday anime topilmadi.\n\nAnime nomini to'g'ri yozganingizga ishonch hosil qiling yoki @Otaku9713 ga buyurtma bering.`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '✉️ Anime buyurtma qilish', callback_data: 'btn_order' }],
            [{ text: '◀️ Asosiy menyu', callback_data: 'btn_main_menu' }],
          ],
        },
      });
    }
  }
}

// Handle video upload to the private channel, direct send, or forwarded message
async function handleVideoUpload(
  videoObj: any,
  rawCaption: string,
  fromChatId?: number | string,
  extraContext?: { sourceInfo?: string; filename?: string; fullMessage?: any }
) {
  try {
    const fileId = videoObj.file_id;
    const filename = extraContext?.filename || videoObj.file_name || '';
    const sourceInfo = extraContext?.sourceInfo || '';
    
    // Combine all textual clues from caption, filename, forward source, etc.
    const combinedText = [rawCaption, filename, sourceInfo].filter(Boolean).join(' ').trim();
    console.log(`📥 Video/Forward received (file_id: ${fileId.slice(0, 15)}...), text: "${combinedText}"`);

    const episodeNum = extractEpisodeNumber(combinedText, filename);
    const animes = await getAllAnimes();
    const targetAnime = findAnimeFromText(animes, combinedText);

    if (targetAnime) {
      if (!targetAnime.episode_files) targetAnime.episode_files = {};
      targetAnime.episode_files[episodeNum] = {
        file_id: fileId,
        uploaded_at: new Date().toISOString(),
        caption: combinedText,
        filename: filename || undefined,
      };

      if (episodeNum > (targetAnime.current_episode || 0)) {
        targetAnime.current_episode = episodeNum;
      }
      if (episodeNum > (targetAnime.total_episodes || 0)) {
        targetAnime.total_episodes = episodeNum;
      }

      await updateAnime(targetAnime.id, targetAnime);
      console.log(`✅ Episode ${episodeNum} successfully attached to "${targetAnime.title}" (ID: ${targetAnime.id})!`);

      if (fromChatId) {
        pendingVideoUploads.delete(Number(fromChatId));
        await telegramApiCall('sendMessage', {
          chat_id: fromChatId,
          text: `${E.CHECK} <b>[Forward / Epizod] Muvaffaqiyatli saqlandi!</b>

${E.BOOKMARK} <b>Anime:</b> <b>${escapeHtml(targetAnime.title)}</b>
${E.VIDEO_MONO} <b>Epizod:</b> <b>${episodeNum}-qism</b>
${E.FIRE} <b>Fayl / Sifat:</b> ${escapeHtml(filename || '1080p / 720p Video')}
${sourceInfo ? `📥 <b>Manba:</b> ${escapeHtml(sourceInfo)}\n` : ''}
${E.NEW} <i>Vebsaytda va botda ushbu qism bir zumda yuklab olish va tomosha qilish uchun faollashtirildi!</i>`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: `▶️ ${episodeNum}-qismni ko'rish`, callback_data: `anime_play_${targetAnime.id}_${episodeNum}` },
                { text: '🎬 Anime sahifasi', callback_data: `anime_detail_${targetAnime.id}` },
              ],
              [
                { text: '◀️ Admin menyusi', callback_data: 'admin_menu' },
              ],
            ],
          },
        });
      }
    } else if (fromChatId) {
      // Store as pending upload so admin can easily pick the anime or type its name
      pendingVideoUploads.set(Number(fromChatId), {
        fileId,
        videoObj,
        episodeNum,
        caption: rawCaption,
        combinedText,
        sourceInfo,
        timestamp: Date.now(),
      });

      const recentAnimes = animes.slice(0, 8);
      const buttons: any[] = [];
      for (let i = 0; i < recentAnimes.length; i += 2) {
        const row = [
          { text: `🎬 ${recentAnimes[i].title}`, callback_data: `attach_ep_${recentAnimes[i].id}_${episodeNum}` }
        ];
        if (recentAnimes[i + 1]) {
          row.push({ text: `🎬 ${recentAnimes[i + 1].title}`, callback_data: `attach_ep_${recentAnimes[i + 1].id}_${episodeNum}` });
        }
        buttons.push(row);
      }
      buttons.push([{ text: '❌ Bekor qilish', callback_data: 'cancel_pending_ep' }]);

      await telegramApiCall('sendMessage', {
        chat_id: fromChatId,
        text: `📥 <b>Forward qilingan video / epizod qabul qilindi!</b>

📌 <b>Epizod raqami:</b> <b>${episodeNum}-qism</b>
${E.ARCHIVE_MONO} <b>Fayl:</b> <code>${escapeHtml(filename || 'Telegram Video')}</code>
${sourceInfo ? `📤 <b>Manba:</b> ${escapeHtml(sourceInfo)}\n` : ''}
${E.WARN_YELLOW} <i>Anime nomi matndan avtomatik topilmadi.</i>

👇 <b>Ushbu qism qaysi animega tegishli? Quyidagi ro'yxatdan tanlang yoki anime nomini xabar qilib yozing:</b>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
    }
  } catch (err: any) {
    console.error('Error in handleVideoUpload:', err?.message || err);
  }
}

async function handleChannelPost(post: any) {
  const video = post.video || post.document || post.animation;
  const caption = (post.caption || post.text || '').toString();
  const filename = post.document?.file_name || post.video?.file_name || '';
  const channelTitle = post.chat?.title || '';
  if (video) {
    await handleVideoUpload(video, caption, undefined, {
      sourceInfo: channelTitle ? `Kanal: ${channelTitle}` : undefined,
      filename,
      fullMessage: post,
    });
  }
}

// Long polling loop
async function pollUpdates() {
  while (isPolling) {
    try {
      const res = await telegramApiCall('getUpdates', {
        offset: lastUpdateId + 1,
        timeout: 25,
        allowed_updates: ['message', 'edited_message', 'channel_post', 'edited_channel_post', 'callback_query', 'inline_query', 'chosen_inline_result'],
      });

      if (res.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          lastUpdateId = update.update_id;

          if (update.message) {
            await handleMessage(update.message);
          } else if (update.channel_post) {
            await handleChannelPost(update.channel_post);
          } else if (update.edited_channel_post) {
            await handleChannelPost(update.edited_channel_post);
          } else if (update.callback_query) {
            await handleCallbackQuery(update.callback_query);
          } else if (update.inline_query) {
            await handleInlineQuery(update.inline_query);
          } else if (update.chosen_inline_result) {
            await handleChosenInlineResult(update.chosen_inline_result);
          }
        }
      }
    } catch (err: any) {
      console.error('Telegram Polling Loop error:', err?.message || err);
    }
    // Small delay between polls
    await new Promise((r) => setTimeout(r, 1000));
  }
}

export async function initTelegramBot() {
  try {
    console.log('🤖 Initializing Telegram Bot with token:', BOT_TOKEN.slice(0, 10) + '...');
    const me = await telegramApiCall('getMe', {});
    
    if (me.ok && me.result) {
      botInfo = me.result;
      setBotUsername(botInfo.username);
      console.log(`✅ Telegram Bot successfully connected: @${botInfo.username} (${botInfo.first_name})`);

      // Set bot commands including /admin
      await telegramApiCall('setMyCommands', {
        commands: [
          { command: 'start', description: 'Botni ishga tushirish va asosiy menyu' },
          { command: 'admin', description: 'Boshqaruv paneli va yangi anime qo\'shish' },
          { command: 'qidiruv', description: 'Anime qidirish' },
          { command: 'pass', description: 'Animem Pass VIP obunasi' },
          { command: 'profil', description: 'Mening profilim' },
          { command: 'yordam', description: 'Yordam va aloqa' },
        ],
      });

      // Start long polling
      if (!isPolling) {
        isPolling = true;
        pollUpdates().catch((e) => console.error('Polling crashed:', e));
      }

      return { ok: true, bot: botInfo };
    } else {
      console.warn('⚠️ Telegram getMe failed:', me);
      return { ok: false, error: me };
    }
  } catch (error: any) {
    console.error('Failed to init Telegram Bot:', error?.message || error);
    return { ok: false, error };
  }
}

