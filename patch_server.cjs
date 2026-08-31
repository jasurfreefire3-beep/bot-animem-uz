const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.get\('\/api\/sections', async \(req, res\) => \{[\s\S]*?res\.json\(\{ sections \}\);\n    \} catch \(error: any\) \{/;

const newLogic = `app.get('/api/sections', async (req, res) => {
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
    } catch (error: any) {`;

content = content.replace(regex, newLogic);
fs.writeFileSync('server.ts', content);
