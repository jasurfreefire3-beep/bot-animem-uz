export const DEFAULT_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'Animem_uz_bot';
let activeBotUsername = process.env.TELEGRAM_BOT_USERNAME || '';

export function setBotUsername(username: string) {
  if (username) {
    activeBotUsername = username.replace(/^@/, '');
  }
}

export function getBotUsername(): string {
  return activeBotUsername || process.env.TELEGRAM_BOT_USERNAME || DEFAULT_BOT_USERNAME;
}

export interface TelegramAnimeLink {
  botUsername: string;
  startParameter: string;
  webUrl: string;
  appUrl: string;
  qrCodeUrl: string;
  shareText: string;
}

export function generateTelegramLinks(anime: { id: number; slug?: string; telegram_code?: string; title: string }): TelegramAnimeLink {
  const bot = getBotUsername();
  const startParam = anime.telegram_code || `anime_${anime.id}`;
  
  const webUrl = `https://t.me/${bot}?start=${encodeURIComponent(startParam)}`;
  const appUrl = `tg://resolve?domain=${bot}&start=${encodeURIComponent(startParam)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(webUrl)}`;
  const shareText = `🎬 ${anime.title} animeni o'zbek tilida tomosha qiling:\n${webUrl}`;

  return {
    botUsername: bot,
    startParameter: startParam,
    webUrl,
    appUrl,
    qrCodeUrl,
    shareText
  };
}

export function enrichAnimeWithTelegram(anime: any) {
  if (!anime) return anime;
  const bot = getBotUsername();
  const code = anime.telegram_code || `anime_${anime.id || anime.slug}`;
  const startUrl = `https://t.me/${bot}?start=${encodeURIComponent(code)}`;
  const tgLinks = generateTelegramLinks(anime);

  return {
    ...anime,
    telegram_code: code,
    telegram_bot_url: startUrl,
    start_url: startUrl,
    telegram_url: startUrl,
    telegram: tgLinks,
  };
}

export function generateEpisodeTelegramLink(animeId: number, episodeNum: number, animeTitle: string) {
  const bot = getBotUsername();
  const startParam = `anime_${animeId}_ep_${episodeNum}`;
  
  return {
    botUsername: bot,
    episode: episodeNum,
    startParameter: startParam,
    webUrl: `https://t.me/${bot}?start=${encodeURIComponent(startParam)}`,
    appUrl: `tg://resolve?domain=${bot}&start=${encodeURIComponent(startParam)}`,
    label: `${episodeNum}-qism (HD O'zbekcha)`
  };
}

