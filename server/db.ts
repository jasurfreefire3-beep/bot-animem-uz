import pg from 'pg';
import { initialAnimes } from './seedData.js';
import { enrichAnimeWithTelegram } from './telegram.js';

const { Pool } = pg;

// Connection configuration
export let dbConfig = {
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
let fallbackMemoryStore: any[] = [];

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
      CREATE TABLE IF NOT EXISTS users (
        telegram_id BIGINT PRIMARY KEY,
        first_name VARCHAR(255),
        username VARCHAR(255),
        pass_expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
      CREATE TABLE IF NOT EXISTS users (
        telegram_id BIGINT PRIMARY KEY,
        first_name VARCHAR(255),
        username VARCHAR(255),
        pass_expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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


    // Clear all test animes as requested by user
    await client.query('DELETE FROM animes;');
    console.log('All test animes deleted from database successfully.');

    client.release();
    isConnected = true;
    lastError = null;
    return { success: true, count: 0, message: 'Barcha test animelar o\'chirildi va baza toza!' };
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
        query += ' ORDER BY id ASC';
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
  try {
    if (isConnected) {
      const currentPool = getPool();
      const isNum = !isNaN(Number(idOrSlug));
      const query = isNum 
        ? 'SELECT id, slug, title, category, views_count, rating, data FROM animes WHERE id = $1'
        : 'SELECT id, slug, title, category, views_count, rating, data FROM animes WHERE slug = $1';
      
      const result = await currentPool.query(query, [isNum ? Number(idOrSlug) : idOrSlug]);
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

  const isNum = !isNaN(Number(idOrSlug));
  const found = fallbackMemoryStore.find(a => isNum ? a.id === Number(idOrSlug) : a.slug === idOrSlug);
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
      }
    } else {
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
  const existingIdx = fallbackMemoryStore.findIndex(a => a.id === newId || a.slug === slug);
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
    totalAnimes: isConnected ? fallbackMemoryStore.length : fallbackMemoryStore.length,
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
