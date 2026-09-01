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
  generateFullSqlDump 
} from './server/db.js';
import { generateTelegramLinks, generateEpisodeTelegramLink, DEFAULT_BOT_USERNAME } from './server/telegram.js';
import { initTelegramBot } from './server/bot.js';
import { 
  generateSitemapXml, 
  generateRobotsTxt, 
  generateAnimeSeoTags, 
  injectSeoIntoHtml 
} from './server/seo.js';


async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

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

  // --- Admin Auth State ---
  const adminAttempts = new Map<string, { count: number, lockoutUntil: number }>();
  const ADMIN_PASSWORD = '1213234';
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

  // Middleware for Admin Auth
  const adminAuth = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token === `admin_${ADMIN_PASSWORD}`) {
      next();
    } else {
      res.status(401).json({ error: 'Ruxsat etilmagan' });
    }
  };

  app.post('/api/admin/login', (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const state = adminAttempts.get(ip) || { count: 0, lockoutUntil: 0 };

    if (Date.now() < state.lockoutUntil) {
      const remainingMinutes = Math.ceil((state.lockoutUntil - Date.now()) / 60000);
      return res.status(429).json({ error: `Juda ko'p urinish. ${remainingMinutes} daqiqadan so'ng qayta urinib ko'ring.` });
    }

    if (req.body.password === ADMIN_PASSWORD) {
      adminAttempts.delete(ip);
      return res.json({ token: `admin_${ADMIN_PASSWORD}` });
    } else {
      state.count += 1;
      if (state.count >= MAX_ATTEMPTS) {
        state.lockoutUntil = Date.now() + LOCKOUT_DURATION;
      }
      adminAttempts.set(ip, state);
      return res.status(401).json({ error: 'Noto\'g\'ri parol' });
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
