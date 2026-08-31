const fs = require('fs');
let content = fs.readFileSync('server/db.ts', 'utf8');

const newFunc = `
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
`;

content += newFunc;
fs.writeFileSync('server/db.ts', content);
