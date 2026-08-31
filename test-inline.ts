import { getAllAnimes } from './server/db.js';

async function run() {
    const animes = await getAllAnimes();
    console.log(animes[0]);
}
run();
