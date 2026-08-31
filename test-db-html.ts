import { getAllAnimes } from './server/db.js';

async function check() {
  const animes = await getAllAnimes();
  for (const a of animes) {
    if (/<|>|&/.test(a.title || '') || /<|>|&/.test(a.description || '')) {
      console.log('Found HTML chars in anime ID:', a.id, a.title);
    }
  }
  console.log('Done');
}
check();
