import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';

import { createServer as createViteServer } from 'vite';
import { 
  initDatabase, 
  testAndInitConnection, 
  getAllAnimes, 
  getAnimeByIdOrSlug, 
  addAnime, 
  updateAnime,
  deleteAnime,
  getDatabaseStatus, 
  generateFullSqlDump,
  saveImageToDatabase,
  getImageFromDatabase
} from './server/db.js';
import { generateTelegramLinks, generateEpisodeTelegramLink, DEFAULT_BOT_USERNAME } from './server/telegram.js';
import { initTelegramBot, findMatchingAnimeInDb } from './server/bot.js';
import { 
  generateSitemapXml, 
  generateRobotsTxt, 
  generateAnimeSeoTags, 
  injectSeoIntoHtml 
} from './server/seo.js';


async function startServer() {
  // Global error safety handlers for production hosting (Northflank, Render, Docker)
  process.on('unhandledRejection', (reason, promise) => {
    console.warn('[Global Safety] Unhandled Promise Rejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('[Global Safety] Uncaught Exception:', err);
  });

  const app = express();
  const PORT = Number(process.env.PORT || process.env.NORTHFLANK_PORT) || 3000;

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Initialize PostgreSQL database in the background
  initDatabase().catch((err) => {
    console.warn('Background database initialization:', err?.message || err);
  });

  // Initialize Telegram Bot
  initTelegramBot().catch((err) => {
    console.warn('Background Telegram Bot initialization:', err?.message || err);
  });

  // --- Admin Auth State with 5-Attempts & 30-Minute Lockout ---
  const adminAttempts = new Map<string, { count: number, lockoutUntil: number }>();
  const ADMIN_PASSWORD = '1213234';
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

  const getClientIp = (req: any): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    return req.ip || req.socket.remoteAddress || '127.0.0.1';
  };

  // Middleware for Admin Auth
  const adminAuth = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token === `admin_${ADMIN_PASSWORD}`) {
      next();
    } else {
      res.status(401).json({ error: 'Ruxsat etilmagan' });
    }
  };

  app.get('/api/admin/status', (req, res) => {
    const ip = getClientIp(req);
    const state = adminAttempts.get(ip) || { count: 0, lockoutUntil: 0 };
    const now = Date.now();
    if (now < state.lockoutUntil) {
      const remainingMs = state.lockoutUntil - now;
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      return res.json({ 
        isLocked: true, 
        remainingMs,
        remainingMinutes,
        message: `Tizim bloklangan. ${remainingMinutes} daqiqadan so'ng qayta urinib ko'ring.` 
      });
    }
    return res.json({ 
      isLocked: false, 
      attemptsUsed: state.count, 
      remainingAttempts: Math.max(0, MAX_ATTEMPTS - state.count) 
    });
  });

  app.post('/api/admin/login', (req, res) => {
    const ip = getClientIp(req);
    const state = adminAttempts.get(ip) || { count: 0, lockoutUntil: 0 };
    const now = Date.now();

    // Check if currently locked out
    if (now < state.lockoutUntil) {
      const remainingMs = state.lockoutUntil - now;
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      return res.status(429).json({ 
        error: `Xavfsizlik tizimi faollashtirilgan! 5 ta noto'g'ri urinish tufayli kirish bloklangan. Iltimos, ${remainingMinutes} daqiqa kuting.`,
        isLocked: true,
        remainingMs
      });
    }

    // Reset expired lockout
    if (state.lockoutUntil > 0 && now >= state.lockoutUntil) {
      state.count = 0;
      state.lockoutUntil = 0;
    }

    if (req.body.password === ADMIN_PASSWORD) {
      adminAttempts.delete(ip);
      return res.json({ success: true, token: `admin_${ADMIN_PASSWORD}` });
    } else {
      state.count += 1;
      const remaining = MAX_ATTEMPTS - state.count;

      if (state.count >= MAX_ATTEMPTS) {
        state.lockoutUntil = now + LOCKOUT_DURATION;
        adminAttempts.set(ip, state);
        return res.status(429).json({ 
          error: `5 marta noto'g'ri parol kiritildi! Xavfsizlik yuzasidan admin panelga kirish 30 daqiqaga bloklandi.`,
          isLocked: true,
          remainingMs: LOCKOUT_DURATION
        });
      } else {
        adminAttempts.set(ip, state);
        return res.status(401).json({ 
          error: `Noto'g'ri parol! Qolgan urinishlar soni: ${remaining} ta`,
          remainingAttempts: remaining
        });
      }
    }
  });

  app.get('/api/admin/verify', adminAuth, (req, res) => {
    res.json({ success: true });
  });

  // --- API Routes ---


  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Animem Uz Bot API' });
  });

  // Serve image from database
  const handleServeImage = async (req: express.Request, res: express.Response) => {
    try {
      const filename = req.params.filename;
      if (!filename) {
        return res.status(400).send('Filename required');
      }

      const img = await getImageFromDatabase(filename);
      if (!img) {
        return res.status(404).send('Image not found');
      }

      res.setHeader('Content-Type', img.mimeType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(img.data);
    } catch (err: any) {
      console.warn('handleServeImage error:', err.message);
      res.status(500).send('Error loading image');
    }
  };

  app.get('/api/image/:filename', handleServeImage);
  app.get('/api/images/:filename', handleServeImage);

  // Upload image directly to PostgreSQL database (data table, not disk)
  app.post('/api/upload/image', async (req, res) => {
    try {
      const { data, filename: originalFilename, mimeType: userMimeType } = req.body;
      if (!data) {
        return res.status(400).json({ error: 'Rasm ma\'lumoti (data) topilmadi' });
      }

      let buffer: Buffer;
      let mimeType = userMimeType || 'image/jpeg';

      if (typeof data === 'string' && data.startsWith('data:')) {
        const matches = data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          buffer = Buffer.from(matches[2], 'base64');
        } else {
          const commaIdx = data.indexOf(',');
          buffer = Buffer.from(commaIdx !== -1 ? data.slice(commaIdx + 1) : data, 'base64');
        }
      } else if (typeof data === 'string') {
        buffer = Buffer.from(data, 'base64');
      } else {
        buffer = Buffer.from(data);
      }

      // Generate clean filename
      const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : mimeType.includes('gif') ? 'gif' : 'jpg';
      let cleanName = (originalFilename || `poster_${Date.now()}`)
        .toLowerCase()
        .replace(/[^a-z0-9_.-]+/g, '_')
        .replace(/\.[a-z0-9]+$/i, '');
      
      const filename = `${Date.now()}_${cleanName}.${ext}`;

      // Save to database
      await saveImageToDatabase(filename, mimeType, buffer);

      const fullUrl = `https://bot.animem.uz/api/image/${filename}`;
      const localUrl = `/api/image/${filename}`;

      res.json({
        success: true,
        filename,
        url: fullUrl,
        local_url: localUrl,
        size_kb: Math.round(buffer.length / 1024)
      });
    } catch (err: any) {
      console.error('API image upload error:', err);
      res.status(500).json({ error: err.message || 'Rasm yuklashda xatolik' });
    }
  });

  // Database Connection Status
  app.get('/api/db-status', (req, res) => {
    const status = getDatabaseStatus();
    res.json(status);
  });

  // Download complete SQL dump
  app.get('/api/download-sql', (req, res) => {
    const sql = generateFullSqlDump();
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename="kawaii_anime_dump.sql"');
    res.send(sql);
  });

  // Re-test and provision PostgreSQL tables & seed data
  app.post('/api/db-setup', async (req, res) => {
    try {
      const { host, port, database, user, password } = req.body || {};
      const configOverride = host ? { host, port: Number(port) || 20184, database, user, password } : undefined;
      const result = await testAndInitConnection(configOverride);
      res.json({
        ...result,
        status: getDatabaseStatus()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ----------------- Trace.moe Reverse Anime Image Search API -----------------
  app.post('/api/search/trace', async (req, res) => {
    try {
      const { image, url } = req.body || {};
      let buffer: Buffer | null = null;
      let contentType = 'image/jpeg';

      if (image && typeof image === 'string') {
        if (image.startsWith('data:')) {
          const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            contentType = matches[1];
            buffer = Buffer.from(matches[2], 'base64');
          } else {
            const commaIdx = image.indexOf(',');
            buffer = Buffer.from(commaIdx !== -1 ? image.slice(commaIdx + 1) : image, 'base64');
          }
        } else {
          buffer = Buffer.from(image, 'base64');
        }
      } else if (url && typeof url === 'string') {
        const fetchRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
          signal: AbortSignal.timeout(15000),
        });
        if (!fetchRes.ok) {
          return res.status(400).json({ error: `Rasm URL manzilidan yuklab olinmadi (HTTP ${fetchRes.status})` });
        }
        const cType = fetchRes.headers.get('content-type');
        if (cType) contentType = cType;
        buffer = Buffer.from(await fetchRes.arrayBuffer());
      }

      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ error: 'Qidirish uchun rasm (fayl yoki URL) taqdim etilmadi' });
      }

      // Call Trace.moe API v2 with cutBorders and anilistInfo
      const traceRes = await fetch('https://api.trace.moe/search?anilistInfo&cutBorders', {
        method: 'POST',
        body: buffer,
        headers: {
          'Content-Type': contentType.startsWith('image/') ? contentType : 'image/jpeg',
        },
        signal: AbortSignal.timeout(25000),
      });

      if (!traceRes.ok) {
        const errText = await traceRes.text();
        console.warn('Trace.moe API error:', traceRes.status, errText);
        return res.status(traceRes.status).json({
          error: 'Trace.moe serverida xatolik yuz berdi. Iltimos, boshqa rasm bilan qayta urinib ko\'ring.',
          details: errText,
        });
      }

      const data = await traceRes.json();
      if (!data || !data.result || data.result.length === 0) {
        return res.json({
          success: false,
          message: 'Rasmdan anime aniqlanmadi. Iltimos, yorqinroq yoki boshqa anime kadrini sinab ko\'ring.',
          results: [],
        });
      }

      const allAnimes = await getAllAnimes();
      const formatSec = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
      };

      const mappedResults = data.result.slice(0, 5).map((item: any) => {
        const local = findMatchingAnimeInDb(allAnimes, item);
        const simPercent = Math.round((item.similarity || 0) * 1000) / 10;
        return {
          title: item.anilist?.title?.romaji || item.filename || 'Noma\'lum anime',
          englishTitle: item.anilist?.title?.english,
          nativeTitle: item.anilist?.title?.native,
          episode: typeof item.episode === 'number' ? item.episode : (item.episode || 1),
          fromTime: formatSec(item.from || 0),
          toTime: formatSec(item.to || 0),
          similarity: simPercent,
          previewVideoUrl: item.video,
          previewImageUrl: item.image,
          anilistId: item.anilist?.id,
          matchedAnime: local ? {
            ...local,
            telegram: generateTelegramLinks(local),
          } : undefined,
        };
      });

      return res.json({
        success: true,
        match: mappedResults[0],
        allResults: mappedResults,
      });
    } catch (err: any) {
      console.error('API /api/search/trace error:', err);
      res.status(500).json({ error: 'Rasm qidiruvida xatolik yuz berdi: ' + (err?.message || err) });
    }
  });

  // List all anime with query filters (category, search, genre, sort)
  app.get('/api/animes', async (req, res) => {
    try {
      const { category, search, genre, sort } = req.query;
      const animes = await getAllAnimes({
        category: category as string,
        search: search as string,
        genre: genre as string,
        sort: sort as string
      });

      // Enrich with telegram links
      const enriched = animes.map(a => ({
        ...a,
        telegram: generateTelegramLinks(a)
      }));

      res.json({
        total: enriched.length,
        animes: enriched
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Categories & Sections structured endpoint for the Kawaii homepage clone
  app.get('/api/sections', async (req, res) => {
    try {
      const all = await getAllAnimes();
      const enriched = all.map(a => ({
        ...a,
        telegram: generateTelegramLinks(a)
      }));

      // Pro-level sorting!
      const sortByCreated = [...enriched].sort((a, b) => {
         const tA = new Date(a.created_at || 0).getTime();
         const tB = new Date(b.created_at || 0).getTime();
         return tB - tA;
      });
      const sortByUpdated = [...enriched].sort((a, b) => {
         const tA = new Date(a.updated_at || a.created_at || 0).getTime();
         const tB = new Date(b.updated_at || b.created_at || 0).getTime();
         return tB - tA;
      });
      const sortByViews = [...enriched].sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
      const randomized = [...enriched].sort(() => 0.5 - Math.random());

      const sections = [
        {
          id: 'yangi',
          title: 'YANGI ANIMELAR',
          type: 'grid',
          items: sortByCreated.slice(0, 10)
        },
        {
          id: 'songgi',
          title: "SO'NGGI YANGILANISHLAR",
          type: 'updates',
          items: sortByUpdated.slice(0, 10)
        },
        {
          id: 'birinchilardan',
          title: "BIRINCHILARDAN BO'LING",
          type: 'grid',
          items: sortByCreated.slice(10, 20)
        },
        {
          id: 'bugungi_top',
          title: 'BUGUNGI TOP',
          type: 'grid',
          items: sortByViews.slice(0, 10) // We use views for top
        },
        {
          id: 'oylik_top',
          title: 'OYLIK TOP',
          type: 'grid',
          items: sortByViews.slice(10, 20) // Give the next top chunk for variety
        },
        {
          id: 'filmlar',
          title: 'FILMLAR',
          type: 'grid',
          items: enriched.filter(a => a.type === 'Film' || a.category === 'filmlar').slice(0, 10)
        },
        {
          id: 'tasodifiy',
          title: 'TASODIFIY',
          type: 'grid',
          items: randomized.slice(0, 10)
        }
      ];
      res.json({ sections });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single anime detail by ID or Slug
  app.get('/api/animes/:idOrSlug', async (req, res) => {
    try {
      const anime = await getAnimeByIdOrSlug(req.params.idOrSlug);
      if (!anime) {
        return res.status(404).json({ error: "Anime topilmadi" });
      }

      const telegramLinks = generateTelegramLinks(anime);
      
      // Generate individual episode telegram links if episodes are available
      const episodesList = [];
      const total = anime.total_episodes || 12;
      for (let i = 1; i <= Math.min(total, 24); i++) {
        episodesList.push(generateEpisodeTelegramLink(anime.id, i, anime.title));
      }

      res.json({
        ...anime,
        telegram: telegramLinks,
        episodes_links: episodesList
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Direct redirection endpoint: opens Telegram Bot directly
  app.get('/api/telegram/watch/:id', async (req, res) => {
    try {
      const anime = await getAnimeByIdOrSlug(req.params.id);
      if (!anime) {
        return res.status(404).json({ error: "Anime topilmadi" });
      }
      const links = generateTelegramLinks(anime);
      
      // Redirect or send JSON based on accept header
      if (req.headers.accept?.includes('application/json')) {
        return res.json(links);
      }
      return res.redirect(links.webUrl);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Telegram Bot info
  app.get('/api/telegram/bot-info', (req, res) => {
    const bot = process.env.TELEGRAM_BOT_USERNAME || DEFAULT_BOT_USERNAME;
    res.json({
      bot_username: bot,
      bot_link: `https://t.me/${bot}`,
      app_link: `tg://resolve?domain=${bot}`,
      supported_commands: [
        { command: '/start', description: "Botni ishga tushirish va asosiy menyu" },
        { command: '/anime [kod]', description: "Anime qismlarini tanlash va tomosha qilish" },
        { command: '/qidiruv [nom]', description: "Anime qidirish" },
        { command: '/top', description: "Eng ko'p ko'rilgan animelar ro'yxati" },
        { command: '/tasodifiy', description: "Tasodifiy anime tavsiyasi" }
      ]
    });
  });

  // Add anime endpoint
  app.post('/api/animes', adminAuth, async (req, res) => {
    try {
      const created = await addAnime(req.body);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update anime endpoint
  app.put('/api/animes/:id', adminAuth, async (req, res) => {
    try {
      const updated = await updateAnime(Number(req.params.id), req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete anime endpoint
  app.delete('/api/animes/:id', adminAuth, async (req, res) => {
    try {
      const success = await deleteAnime(Number(req.params.id));
      res.json({ success, message: "Anime muvaffaqiyatli o'chirildi (PostgreSQL)" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Dynamic sitemap.xml for SEO with all animes
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const xml = await generateSitemapXml();
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(xml);
    } catch (err: any) {
      console.error('Sitemap generation error:', err);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Dynamic robots.txt
  app.get('/robots.txt', (req, res) => {
    const robots = generateRobotsTxt();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(robots);
  });

  // Helper to render anime page with complete SEO meta tags
  async function renderHtmlWithAnimeSeo(urlPath: string, rawIndexHtml: string): Promise<string> {
    const animeMatch = urlPath.match(/^\/anime\/([^\/\?#]+)/);
    if (animeMatch) {
      const idOrSlug = animeMatch[1];
      try {
        const anime = await getAnimeByIdOrSlug(idOrSlug);
        if (anime) {
          const seoTags = generateAnimeSeoTags(anime);
          return injectSeoIntoHtml(rawIndexHtml, seoTags);
        }
      } catch (e) {
        console.warn('Could not inject anime SEO:', e);
      }
    }
    return rawIndexHtml;
  }

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Custom SEO interceptor for development
    app.use(async (req, res, next) => {
      const url = req.originalUrl || req.url;
      if (url.startsWith('/api/') || url.includes('.')) {
        return next();
      }

      if (url.startsWith('/anime/')) {
        try {
          const templatePath = path.resolve(process.cwd(), 'index.html');
          let template = fs.readFileSync(templatePath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          const finalHtml = await renderHtmlWithAnimeSeo(url, template);
          res.setHeader('Content-Type', 'text/html');
          return res.status(200).send(finalHtml);
        } catch (e) {
          return next();
        }
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexHtmlPath = path.join(distPath, 'index.html');
    app.use(express.static(distPath, { index: false }));

    app.get('*', async (req, res) => {
      try {
        const rawHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
        const url = req.originalUrl || req.url;
        const finalHtml = await renderHtmlWithAnimeSeo(url, rawHtml);
        res.setHeader('Content-Type', 'text/html');
        res.send(finalHtml);
      } catch (err) {
        res.sendFile(indexHtmlPath);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Animem Uz Bot server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
