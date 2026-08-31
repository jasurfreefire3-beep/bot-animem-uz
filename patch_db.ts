import fs from 'fs';
let content = fs.readFileSync('server/db.ts', 'utf-8');

const tableCreation = `
    await client.query(\`
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
    \`);

    await client.query(\`
      CREATE TABLE IF NOT EXISTS users (
        telegram_id BIGINT PRIMARY KEY,
        first_name VARCHAR(255),
        username VARCHAR(255),
        pass_expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    \`);

    await client.query(\`
      CREATE TABLE IF NOT EXISTS invoices (
        order_id SERIAL PRIMARY KEY,
        telegram_id BIGINT NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        duration_days INTEGER NOT NULL,
        pay_url TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    \`);
`;

content = content.replace(
  `    await client.query(\`
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
    \`);`,
  tableCreation
);

const passHelpers = `
const memoryPasses = new Map<number, number>();

export async function getUserPassDb(telegramId: number): Promise<number> {
  try {
    if (isConnected) {
      const p = getPool();
      const res = await p.query('SELECT pass_expires_at FROM users WHERE telegram_id = $1', [telegramId]);
      if (res.rows.length > 0 && res.rows[0].pass_expires_at) {
        const exp = new Date(res.rows[0].pass_expires_at).getTime();
        if (exp > Date.now()) return exp;
      }
    }
  } catch (e: any) {
    console.warn('getUserPassDb error:', e.message);
  }
  return memoryPasses.get(telegramId) || 0;
}

export async function setUserPassDb(telegramId: number, days: number, firstName?: string, username?: string): Promise<number> {
  const currentExp = await getUserPassDb(telegramId);
  const baseTime = currentExp > Date.now() ? currentExp : Date.now();
  const newExpTime = baseTime + days * 24 * 60 * 60 * 1000;
  memoryPasses.set(telegramId, newExpTime);

  try {
    if (isConnected) {
      const p = getPool();
      await p.query(
        \`INSERT INTO users (telegram_id, first_name, username, pass_expires_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (telegram_id) DO UPDATE SET
           first_name = COALESCE($2, users.first_name),
           username = COALESCE($3, users.username),
           pass_expires_at = $4\`,
        [telegramId, firstName || null, username || null, new Date(newExpTime)]
      );
    }
  } catch (e: any) {
    console.warn('setUserPassDb error:', e.message);
  }
  return newExpTime;
}
`;

if (!content.includes('getUserPassDb')) {
  content += passHelpers;
}

fs.writeFileSync('server/db.ts', content);
console.log('Successfully patched server/db.ts');
