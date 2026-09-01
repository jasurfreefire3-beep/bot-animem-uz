import pg from 'pg';
import { initialAnimes } from './seedData.js';
import { enrichAnimeWithTelegram } from './telegram.js';

const { Pool } = pg;

// Connection configuration
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PG_URL;

export let dbConfig: any = connectionString
  ? {
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 7000,
      idleTimeoutMillis: 10000,
      max: 10
    }
  : {
      host: process.env.PGHOST || 'psql.fr-roub1.bengt.wasmernet.com',
      port: Number(process.env.PGPORT) || 20184,
      database: process.env.PGDATABASE || 'Animembot',
      user: process.env.PGUSER || 'user_db8f7558',
      password: process.env.PGPASSWORD || 'pw_6RUM4wvuayjkvEyDWjfQeXT18r5JOV0r',
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 7000,
      idleTimeoutMillis: 10000,
      max: 10
    };

let pool: pg.Pool | null = null;
let isConnected = false;
let lastError: string | null = null;
let fallbackMemoryStore: any[] = initialAnimes.map(a => enrichAnimeWithTelegram(a));

export async function clearAllAnimes() {
  fallbackMemoryStore = [];
  try {
    if (isConnected) {
      const p = getPool();
      await p.query('DELETE FROM animes;');
    }
  } catch (e: any) {
    console.warn('clearAllAnimes DB error:', e.message);
  }
  return true;
}

export function getPool(customConfig?: any): pg.Pool {
  if (customConfig) {
    dbConfig = { ...dbConfig, ...customConfig };
    if (pool) {
      pool.end().catch(() => {});
      pool = null;
    }
  }

  if (!pool) {
    pool = new Pool(dbConfig);
    pool.on('error', (err) => {
      console.error('PostgreSQL pool event error:', err.message);
      isConnected = false;
      lastError = err.message;
    });
  }
  return pool;
}

export async function testAndInitConnection(customConfig?: any) {
  try {
    const p = getPool(customConfig);
    const client = await p.connect();
    
    // Create the animes table in PostgreSQL


    await client.query(`
      CREATE TABLE IF NOT EXISTS animes (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'yangi',
        views_count INTEGER DEFAULT 0,
        rating NUMERIC(3, 1) DEFAULT 8.0,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        order_id SERIAL PRIMARY KEY,
        telegram_id BIGINT NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        duration_days INTEGER NOT NULL,
        pay_url TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS mandatory_channels (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        data BYTEA NOT NULL,
        size_bytes INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        telegram_id BIGINT PRIMARY KEY,
        first_name VARCHAR(255),
        username VARCHAR(255),
        pass_expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        telegram_id BIGINT NOT NULL,
        anime_id INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (telegram_id, anime_id)
      );
      CREATE INDEX IF NOT EXISTS idx_favorites_anime ON favorites(anime_id);
      CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(telegram_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        telegram_id BIGINT NOT NULL,
        anime_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (telegram_id, anime_id)
      );
      CREATE INDEX IF NOT EXISTS idx_ratings_anime ON ratings(anime_id);
    `);


    client.release();
    isConnected = true;
    lastError = null;

    // Sync memory store from DB after connection
    try {
      const all = await getAllAnimes();
      if (Array.isArray(all)) {
        fallbackMemoryStore = all;
      }
    } catch (syncErr) {
      console.warn('Initial sync error:', syncErr);
    }

    return { success: true, message: 'Database connected successfully.' };
  } catch (err: any) {
    console.warn('PostgreSQL connection error:', err.message);
    isConnected = false;
    lastError = err.message;
    return { success: false, error: err.message, message: 'Xatolik: ' + err.message };
  }
}

export async function initDatabase() {
  return await testAndInitConnection();
}

export async function getAllAnimes(filter?: { category?: string; search?: string; genre?: string; sort?: string }) {
  console.log(`[DB] getAllAnimes called with filter:`, filter);
  try {
    if (isConnected) {
      const currentPool = getPool();
      let query = 'SELECT id, slug, title, category, views_count, rating, data, created_at FROM animes WHERE 1=1';
      const params: any[] = [];

      if (filter?.category && filter.category !== 'all') {
        params.push(filter.category);
        query += ` AND category = $${params.length}`;
      }

      if (filter?.search) {
        params.push(`%${filter.search.toLowerCase()}%`);
        query += ` AND (LOWER(title) LIKE $${params.length} OR LOWER(data->>'original_title') LIKE $${params.length} OR LOWER(data->>'description') LIKE $${params.length})`;
      }

      if (filter?.genre && filter.genre !== 'all') {
        params.push(filter.genre);
        query += ` AND data->'genres' ? $${params.length}`;
      }

      if (filter?.sort === 'views') {
        query += ' ORDER BY views_count DESC';
      } else if (filter?.sort === 'rating') {
        query += ' ORDER BY rating DESC';
      } else if (filter?.sort === 'year') {
        query += " ORDER BY (data->>'year')::int DESC";
      } else {
        query += ' ORDER BY id DESC';
      }

      const result = await currentPool.query(query, params);
      if (result.rows.length > 0) {
        return result.rows.map(row => {
          const item = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
          const merged = {
            ...item,
            id: row.id,
            slug: row.slug,
            views_count: row.views_count,
            category: row.category,
            created_at: row.created_at
          };
          return enrichAnimeWithTelegram(merged);
        });
      }
    }
  } catch (e: any) {
    console.warn('PostgreSQL query error, using active memory cache:', e.message);
  }

  // Fallback in-memory list
  let list = fallbackMemoryStore.map(a => enrichAnimeWithTelegram(a));
  list.sort((a, b) => (b.id || 0) - (a.id || 0));
  if (filter?.category && filter.category !== 'all') {
    list = list.filter(a => a.category === filter.category);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    list = list.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.original_title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    );
  }
  if (filter?.genre && filter.genre !== 'all') {
    list = list.filter(a => a.genres?.includes(filter.genre!));
  }
  if (filter?.sort === 'views') {
    list.sort((a, b) => b.views_count - a.views_count);
  } else if (filter?.sort === 'rating') {
    list.sort((a, b) => b.rating - a.rating);
  }
  return list;
}

export async function getAnimeByIdOrSlug(idOrSlug: string | number) {
  const rawStr = String(idOrSlug || '').trim();
  // Strip common prefixes and any non-alphanumeric characters at the start
  const cleanParam = rawStr.replace(/^(anime_|id_|id|anime|watch_|watch)/i, '').replace(/^[^a-z0-9]+/i, '');
  const isNum = !isNaN(Number(cleanParam)) && cleanParam !== '';
  const numId = isNum ? Number(cleanParam) : null;
  
  const slugStr = rawStr.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const cleanSlug = cleanParam.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  try {
    if (isConnected) {
      const currentPool = getPool();
      const query = `
        SELECT id, slug, title, category, views_count, rating, data 
        FROM animes 
        WHERE 
          ($1::bigint IS NOT NULL AND id = $1)
          OR slug = $2
          OR slug = $3
          OR slug = $4
          OR data->>'telegram_code' = $2
          OR data->>'telegram_code' = $3
          OR data->>'telegram_code' = $5
          OR data->>'slug' = $2
      `;
      const result = await currentPool.query(query, [
        numId,
        rawStr,
        cleanParam,
        slugStr,
        `anime_${cleanParam}`
      ]);

      if (result.rows.length > 0) {
        const row = result.rows[0];
        await currentPool.query('UPDATE animes SET views_count = views_count + 1 WHERE id = $1', [row.id]).catch(() => {});
        const item = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
        const merged = {
          ...item,
          id: row.id,
          slug: row.slug,
          views_count: (row.views_count || 0) + 1,
          category: row.category
        };
        return enrichAnimeWithTelegram(merged);
      }
    }
  } catch (e: any) {
    console.warn('PostgreSQL getAnimeById error:', e.message);
  }

  const found = fallbackMemoryStore.find(a => {
    return (
      (numId !== null && a.id === numId) ||
      a.slug === rawStr ||
      a.slug === cleanParam ||
      a.slug === slugStr ||
      a.slug === cleanSlug ||
      a.telegram_code === rawStr ||
      a.telegram_code === cleanParam ||
      a.telegram_code === `anime_${cleanParam}` ||
      String(a.id) === rawStr ||
      String(a.id) === cleanParam
    );
  });

  if (found) {
    found.views_count += 1;
    return enrichAnimeWithTelegram(found);
  }
  return null;
}

export async function addAnime(animeData: any) {
  const isNew = !animeData.id;
  const slug = animeData.slug || (animeData.title || 'anime').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  let newId = animeData.id;
  let fullItem = { ...animeData, slug };

  try {
    if (isConnected) {
      const currentPool = getPool();
      if (isNew) {
        const res = await currentPool.query(
          `INSERT INTO animes (slug, title, category, views_count, rating, data)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (slug) DO UPDATE SET 
             title = EXCLUDED.title,
             category = EXCLUDED.category,
             views_count = EXCLUDED.views_count,
             rating = EXCLUDED.rating,
             data = EXCLUDED.data
           RETURNING id;`,
          [
            slug,
            fullItem.title,
            fullItem.category || 'yangi',
            fullItem.views_count || 0,
            fullItem.rating || 8.0,
            JSON.stringify(fullItem)
          ]
        );
        newId = res.rows[0].id;
        fullItem.id = newId;
        await currentPool.query(
          `UPDATE animes SET data = $1 WHERE id = $2;`,
          [JSON.stringify(fullItem), newId]
        );
        console.log(`✅ Anime PostgreSQL bazasiga muvaffaqiyatli saqlandi: ${fullItem.title} (ID: ${newId})`);
      } else {
        await currentPool.query(
          `INSERT INTO animes (id, slug, title, category, views_count, rating, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (slug) DO UPDATE SET 
             title = $3,
             category = $4,
             views_count = $5,
             rating = $6,
             data = $7;`,
          [
            newId,
            slug,
            fullItem.title,
            fullItem.category || 'yangi',
            fullItem.views_count || 0,
            fullItem.rating || 8.0,
            JSON.stringify(fullItem)
          ]
        );
        console.log(`✅ Anime PostgreSQL bazasida yangilandi: ${fullItem.title} (ID: ${newId})`);
      }
    } else {
      console.warn('⚠️ Database ulanmagan, anime faqat xotirada saqlanadi!');
      if (isNew) {
         newId = Math.floor(Math.random() * 2000000000);
         fullItem.id = newId;
      }
    }
  } catch (e: any) {
    console.warn('PostgreSQL insert error:', e.message);
    if (isNew && !newId) {
       newId = Math.floor(Math.random() * 2000000000);
       fullItem.id = newId;
    }
  }

  // Update fallback memory store
  console.log(`[DB] addAnime: updating memory store for ${fullItem.title} (slug: ${slug})`);
  const existingIdx = fallbackMemoryStore.findIndex(a => a.id === fullItem.id || a.slug === slug);
  if (existingIdx >= 0) {
    fallbackMemoryStore[existingIdx] = fullItem;
  } else {
    fallbackMemoryStore.unshift(fullItem);
  }
  return fullItem;
}

export async function updateAnime(id: number, animeData: any) {
  const slug = animeData.slug || animeData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const fullItem = { ...animeData, id, slug };

  try {
    if (isConnected) {
      const currentPool = getPool();
      await currentPool.query(
        `UPDATE animes 
         SET title = $1, category = $2, views_count = $3, rating = $4, data = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6;`,
        [
          fullItem.title,
          fullItem.category || 'yangi',
          fullItem.views_count || 0,
          fullItem.rating || 8.0,
          JSON.stringify(fullItem),
          id
        ]
      );
    }
  } catch (e: any) {
    console.warn('PostgreSQL update error:', e.message);
  }

  const idx = fallbackMemoryStore.findIndex(a => a.id === Number(id));
  if (idx >= 0) {
    fallbackMemoryStore[idx] = fullItem;
  }
  return fullItem;
}

export async function deleteAnime(id: number) {
  try {
    if (isConnected) {
      const currentPool = getPool();
      await currentPool.query('DELETE FROM animes WHERE id = $1', [Number(id)]);
    }
  } catch (e: any) {
    console.warn('PostgreSQL delete error:', e.message);
  }

  const idx = fallbackMemoryStore.findIndex(a => a.id === Number(id));
  if (idx >= 0) {
    fallbackMemoryStore.splice(idx, 1);
    return true;
  }
  return true;
}

export function generateFullSqlDump(): string {
  let sql = `-- ==========================================================
-- KAWAI / ANIMEM POSTGRESQL TO'LIQ DUMP VA DDL STRUKTURASI
-- Bazaga 'animes' jadvalini yaratadi va barcha 26 ta animeni yuklaydi
-- ==========================================================

-- 1. Jadvalni yaratish
CREATE TABLE IF NOT EXISTS animes (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'yangi',
  views_count INTEGER DEFAULT 0,
  rating NUMERIC(3, 1) DEFAULT 8.0,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Qidiruv va saralash indexlari
CREATE INDEX IF NOT EXISTS idx_animes_category ON animes(category);
CREATE INDEX IF NOT EXISTS idx_animes_rating ON animes(rating DESC);
CREATE INDEX IF NOT EXISTS idx_animes_views ON animes(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_animes_data_gin ON animes USING gin (data);

-- 3. Barcha 26 ta anime ma'lumotlarini yuklash (JSONB)
`;

  for (const a of initialAnimes) {
    const jsonStr = JSON.stringify(a).replace(/'/g, "''");
    const escapedTitle = a.title.replace(/'/g, "''");
    const escapedSlug = a.slug.replace(/'/g, "''");
    const escapedCategory = a.category.replace(/'/g, "''");
    const views = a.views_count || 0;
    const rating = a.rating || 8.0;

    sql += `INSERT INTO animes (id, slug, title, category, views_count, rating, data)
VALUES (${a.id}, '${escapedSlug}', '${escapedTitle}', '${escapedCategory}', ${views}, ${rating}, '${jsonStr}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  views_count = EXCLUDED.views_count,
  rating = EXCLUDED.rating,
  data = EXCLUDED.data;
`;
  }

  sql += `
-- Serial sekvensiyani yangilash
SELECT setval('animes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM animes));
`;

  return sql;
}

export function getDatabaseStatus() {
  return {
    connected: isConnected,
    source: isConnected ? 'postgresql' : 'fallback_cache',
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    lastError: lastError,
    totalAnimes: fallbackMemoryStore.length,
    message: isConnected 
      ? 'PostgreSQL bazasiga muvaffaqiyatli ulangan (Jadvallar faol)' 
      : 'PostgreSQL ulanish kutilmoqda (Lokal keshda 26 ta anime tayyor)',
    lastChecked: new Date().toISOString(),
    sqlSchema: generateFullSqlDump()
  };
}


const memoryPasses = new Map<number, number>();

export async function getUserPassDb(telegramId: number | string): Promise<number> {
  const numId = Number(telegramId);
  if (!numId || isNaN(numId)) return 0;
  try {
    if (isConnected) {
      const p = getPool();
      const res = await p.query('SELECT pass_expires_at FROM users WHERE telegram_id = $1', [numId]);
      if (res.rows.length > 0 && res.rows[0].pass_expires_at) {
        const exp = new Date(res.rows[0].pass_expires_at).getTime();
        if (exp > Date.now()) return exp;
      }
    }
  } catch (e: any) {
    console.warn('getUserPassDb error:', e.message);
  }
  return memoryPasses.get(numId) || 0;
}

export async function setUserPassDb(telegramId: number | string, days: number, firstName?: string, username?: string): Promise<number> {
  const numId = Number(telegramId);
  const currentExp = await getUserPassDb(numId);
  const baseTime = currentExp > Date.now() ? currentExp : Date.now();
  const newExpTime = baseTime + days * 24 * 60 * 60 * 1000;
  memoryPasses.set(numId, newExpTime);

  try {
    if (isConnected) {
      const p = getPool();
      await p.query(
        `INSERT INTO users (telegram_id, first_name, username, pass_expires_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (telegram_id) DO UPDATE SET
           first_name = COALESCE($2, users.first_name),
           username = COALESCE($3, users.username),
           pass_expires_at = $4`,
        [numId, firstName || null, username || null, new Date(newExpTime)]
      );
    }
  } catch (e: any) {
    console.warn('setUserPassDb error:', e.message);
  }
  return newExpTime;
}

export async function getTotalActivePasses(): Promise<number> {
  let count = 0;
  try {
    if (isConnected) {
      const p = getPool();
      const res = await p.query('SELECT COUNT(*) as c FROM users WHERE pass_expires_at > NOW()');
      count = parseInt(res.rows[0].c, 10) || 0;
    }
  } catch(e) {}
  
  // also check memoryPasses if DB fails or isn't connected
  if (!isConnected) {
    const now = Date.now();
    count = Array.from(memoryPasses.values()).filter(exp => exp > now).length;
  }
  return count;
}

// --- Mandatory Channels Logic ---
let memoryChannels: { id: number; username: string; title?: string }[] = [];

export async function getMandatoryChannels(): Promise<{ id: number; username: string; title?: string }[]> {
  try {
    if (isConnected) {
      const p = getPool();
      const res = await p.query('SELECT id, username, title FROM mandatory_channels ORDER BY id ASC');
      memoryChannels = res.rows;
      return res.rows;
    }
  } catch (e: any) {
    console.warn('getMandatoryChannels error:', e.message);
  }
  return memoryChannels;
}

export async function addMandatoryChannel(username: string, title?: string): Promise<boolean> {
  const cleanUsername = username.startsWith('@') ? username : `@${username}`;
  try {
    if (isConnected) {
      const p = getPool();
      await p.query(
        'INSERT INTO mandatory_channels (username, title) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET title = EXCLUDED.title',
        [cleanUsername, title || cleanUsername]
      );
      await getMandatoryChannels(); // Refresh cache
      return true;
    }
  } catch (e: any) {
    console.warn('addMandatoryChannel error:', e.message);
  }
  
  if (!memoryChannels.find(c => c.username === cleanUsername)) {
    memoryChannels.push({ id: Math.floor(Math.random() * 1000), username: cleanUsername, title: title || cleanUsername });
  }
  return true;
}

export async function removeMandatoryChannel(id: number): Promise<boolean> {
  try {
    if (isConnected) {
      const p = getPool();
      await p.query('DELETE FROM mandatory_channels WHERE id = $1', [id]);
      await getMandatoryChannels(); // Refresh cache
      return true;
    }
  } catch (e: any) {
    console.warn('removeMandatoryChannel error:', e.message);
  }
  memoryChannels = memoryChannels.filter(c => c.id !== id);
  return true;
}

// In-memory cache for ultra fast image serving
const imageMemoryCache = new Map<string, { mimeType: string; data: Buffer }>();

export async function saveImageToDatabase(filename: string, mimeType: string, buffer: Buffer): Promise<{ success: boolean; filename: string }> {
  // Save to memory cache immediately
  imageMemoryCache.set(filename, { mimeType, data: buffer });

  try {
    if (isConnected) {
      const p = getPool();
      await p.query(
        `INSERT INTO images (filename, mime_type, data, size_bytes) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (filename) DO UPDATE SET mime_type = EXCLUDED.mime_type, data = EXCLUDED.data, size_bytes = EXCLUDED.size_bytes`,
        [filename, mimeType, buffer, buffer.length]
      );
      return { success: true, filename };
    }
  } catch (e: any) {
    console.warn('saveImageToDatabase error:', e.message);
  }
  return { success: true, filename };
}

export async function getImageFromDatabase(filename: string): Promise<{ mimeType: string; data: Buffer } | null> {
  // Check memory cache first
  if (imageMemoryCache.has(filename)) {
    return imageMemoryCache.get(filename)!;
  }

  try {
    if (isConnected) {
      const p = getPool();
      const res = await p.query('SELECT mime_type, data FROM images WHERE filename = $1 LIMIT 1', [filename]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        const img = { mimeType: row.mime_type, data: row.data };
        imageMemoryCache.set(filename, img);
        return img;
      }
    }
  } catch (e: any) {
    console.warn('getImageFromDatabase error:', e.message);
  }

  return null;
}

// ==========================================
// Favorites (Sevimlilar) System
// ==========================================
const memoryUserFavorites = new Map<string, Set<number>>();
const memoryAnimeFavCounts = new Map<number, number>();

export async function toggleFavorite(telegramId: number | string, animeId: number): Promise<{ isFavorited: boolean; count: number }> {
  const strId = String(telegramId);
  const numTgId = Number(telegramId);
  const numAnimeId = Number(animeId);

  let isFavorited = false;
  try {
    if (isConnected) {
      const p = getPool();
      // Check if already favorited
      const existing = await p.query('SELECT 1 FROM favorites WHERE telegram_id = $1 AND anime_id = $2', [numTgId, numAnimeId]);
      if (existing.rows.length > 0) {
        await p.query('DELETE FROM favorites WHERE telegram_id = $1 AND anime_id = $2', [numTgId, numAnimeId]);
        isFavorited = false;
      } else {
        await p.query('INSERT INTO favorites (telegram_id, anime_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [numTgId, numAnimeId]);
        isFavorited = true;
      }
      const countRes = await p.query('SELECT COUNT(*) as c FROM favorites WHERE anime_id = $1', [numAnimeId]);
      const count = parseInt(countRes.rows[0]?.c, 10) || 0;
      memoryAnimeFavCounts.set(numAnimeId, count);
      return { isFavorited, count };
    }
  } catch (e: any) {
    console.warn('toggleFavorite DB error:', e.message);
  }

  // Fallback in-memory
  if (!memoryUserFavorites.has(strId)) {
    memoryUserFavorites.set(strId, new Set());
  }
  const favSet = memoryUserFavorites.get(strId)!;
  let currentCount = memoryAnimeFavCounts.get(numAnimeId) || 0;

  if (favSet.has(numAnimeId)) {
    favSet.delete(numAnimeId);
    isFavorited = false;
    currentCount = Math.max(0, currentCount - 1);
  } else {
    favSet.add(numAnimeId);
    isFavorited = true;
    currentCount += 1;
  }
  memoryAnimeFavCounts.set(numAnimeId, currentCount);

  return { isFavorited, count: currentCount };
}

export async function isAnimeFavorited(telegramId: number | string, animeId: number): Promise<boolean> {
  const strId = String(telegramId);
  const numTgId = Number(telegramId);
  const numAnimeId = Number(animeId);

  try {
    if (isConnected) {
      const p = getPool();
      const res = await p.query('SELECT 1 FROM favorites WHERE telegram_id = $1 AND anime_id = $2', [numTgId, numAnimeId]);
      return res.rows.length > 0;
    }
  } catch (e: any) {
    console.warn('isAnimeFavorited DB error:', e.message);
  }

  return memoryUserFavorites.get(strId)?.has(numAnimeId) || false;
}

export async function getFavoritesCount(animeId: number): Promise<number> {
  const numAnimeId = Number(animeId);
  try {
    if (isConnected) {
      const p = getPool();
      const countRes = await p.query('SELECT COUNT(*) as c FROM favorites WHERE anime_id = $1', [numAnimeId]);
      return parseInt(countRes.rows[0]?.c, 10) || 0;
    }
  } catch (e: any) {
    console.warn('getFavoritesCount DB error:', e.message);
  }

  return memoryAnimeFavCounts.get(numAnimeId) || 0;
}

export async function getUserFavorites(telegramId: number | string): Promise<any[]> {
  const strId = String(telegramId);
  const numTgId = Number(telegramId);

  try {
    if (isConnected) {
      const p = getPool();
      const res = await p.query(
        `SELECT a.id, a.slug, a.title, a.category, a.views_count, a.rating, a.data
         FROM favorites f
         JOIN animes a ON f.anime_id = a.id
         WHERE f.telegram_id = $1
         ORDER BY f.created_at DESC`,
        [numTgId]
      );
      return res.rows.map(r => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        category: r.category,
        views_count: r.views_count,
        rating: typeof r.rating === 'string' ? parseFloat(r.rating) : r.rating,
        ...(typeof r.data === 'string' ? JSON.parse(r.data) : r.data),
      }));
    }
  } catch (e: any) {
    console.warn('getUserFavorites DB error:', e.message);
  }

  const set = memoryUserFavorites.get(strId);
  if (!set || set.size === 0) return [];
  const animeIds = Array.from(set);
  const list: any[] = [];
  for (const id of animeIds) {
    const a = await getAnimeByIdOrSlug(id);
    if (a) list.push(a);
  }
  return list;
}

export async function getUserFavoritesCount(telegramId: number | string): Promise<number> {
  const numTgId = Number(telegramId);
  try {
    if (isConnected) {
      const p = getPool();
      const res = await p.query('SELECT COUNT(*) as c FROM favorites WHERE telegram_id = $1', [numTgId]);
      return parseInt(res.rows[0]?.c, 10) || 0;
    }
  } catch (e: any) {}
  return memoryUserFavorites.get(String(telegramId))?.size || 0;
}

// ==========================================
// Ratings (Baholash 1-10) System
// ==========================================
const memoryRatings = new Map<string, number>(); // `${tgId}_${animeId}` -> rating

export async function saveUserRating(telegramId: number | string, animeId: number, rating: number): Promise<{ avgRating: number; totalVotes: number; userRating: number }> {
  const cleanRating = Math.max(1, Math.min(10, Math.round(rating)));
  const numTgId = Number(telegramId);
  const numAnimeId = Number(animeId);
  const strKey = `${telegramId}_${numAnimeId}`;

  memoryRatings.set(strKey, cleanRating);

  let avgRating = cleanRating;
  let totalVotes = 1;

  try {
    if (isConnected) {
      const p = getPool();
      await p.query(
        `INSERT INTO ratings (telegram_id, anime_id, rating)
         VALUES ($1, $2, $3)
         ON CONFLICT (telegram_id, anime_id) DO UPDATE SET rating = EXCLUDED.rating, created_at = CURRENT_TIMESTAMP`,
        [numTgId, numAnimeId, cleanRating]
      );

      const statsRes = await p.query('SELECT COUNT(*) as total, AVG(rating) as avg FROM ratings WHERE anime_id = $1', [numAnimeId]);
      totalVotes = parseInt(statsRes.rows[0]?.total, 10) || 1;
      avgRating = parseFloat(parseFloat(statsRes.rows[0]?.avg || '0').toFixed(1));

      // Update anime's rating in animes table
      await p.query(
        `UPDATE animes SET rating = $1, data = jsonb_set(data, '{rating}', $2::jsonb), updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
        [avgRating, JSON.stringify(avgRating), numAnimeId]
      );
    }
  } catch (e: any) {
    console.warn('saveUserRating DB error:', e.message);
  }

  // Also update in-memory anime if present
  const anime = await getAnimeByIdOrSlug(numAnimeId);
  if (anime) {
    anime.rating = avgRating;
  }

  return { avgRating, totalVotes, userRating: cleanRating };
}

export async function getAnimeRatingStats(animeId: number): Promise<{ avgRating: number; totalVotes: number }> {
  const numAnimeId = Number(animeId);
  try {
    if (isConnected) {
      const p = getPool();
      const statsRes = await p.query('SELECT COUNT(*) as total, AVG(rating) as avg FROM ratings WHERE anime_id = $1', [numAnimeId]);
      const totalVotes = parseInt(statsRes.rows[0]?.total, 10) || 0;
      if (totalVotes > 0) {
        const avgRating = parseFloat(parseFloat(statsRes.rows[0]?.avg || '0').toFixed(1));
        return { avgRating, totalVotes };
      }
    }
  } catch (e: any) {
    console.warn('getAnimeRatingStats DB error:', e.message);
  }

  const anime = await getAnimeByIdOrSlug(numAnimeId);
  const defaultRating = anime && typeof anime.rating === 'number' ? anime.rating : 8.5;
  return { avgRating: defaultRating, totalVotes: anime?.views_count ? Math.floor(anime.views_count / 15) + 1 : 12 };
}

export async function getUserRating(telegramId: number | string, animeId: number): Promise<number | null> {
  const numTgId = Number(telegramId);
  const numAnimeId = Number(animeId);
  try {
    if (isConnected) {
      const p = getPool();
      const res = await p.query('SELECT rating FROM ratings WHERE telegram_id = $1 AND anime_id = $2', [numTgId, numAnimeId]);
      if (res.rows.length > 0) return res.rows[0].rating;
    }
  } catch (e: any) {}
  return memoryRatings.get(`${telegramId}_${numAnimeId}`) || null;
}

