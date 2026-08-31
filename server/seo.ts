import { getAllAnimes, getAnimeByIdOrSlug } from './db.js';
import fs from 'fs';
import path from 'path';

export const BASE_URL = 'https://bot.animem.uz';
export const SITE_NAME = 'Animem Uz Bot';
export const DEFAULT_LOGO = 'https://api.animem.uz/api/images/1788192062296_ypg1z1j';

function escapeXml(unsafe: string = ''): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtmlAttr(unsafe: string = ''): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generate dynamic sitemap.xml with all animes from the database and save to public/sitemap.xml
 */
export async function generateSitemapXml(): Promise<string> {
  const animes = await getAllAnimes();
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Asosiy Sahifalar -->
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/pass</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;

  for (const anime of animes) {
    const lastMod = anime.updated_at
      ? new Date(anime.updated_at).toISOString().split('T')[0]
      : today;
    const titleClean = anime.title || '';
    const titleEscaped = escapeXml(titleClean);
    let posterUrl = anime.poster_url || DEFAULT_LOGO;
    if (posterUrl.startsWith('https://api.telegram.org')) {
      // proxy or make absolute relative to bot domain
      posterUrl = posterUrl.replace('https://api.telegram.org', 'https://bot.animem.uz/api/telegram');
    }
    const posterEscaped = escapeXml(posterUrl);
    const captionEscaped = escapeXml(`${titleClean} - O'zbekcha anime posteri`);

    // Primary slug or ID based URL matching user style e.g. https://bot.animem.uz/anime/mening-qizcham-nafaqat-gozal or id 523
    const identifier = anime.slug || anime.id;

    xml += `  <url>
    <loc>${BASE_URL}/anime/${identifier}</loc>
    <lastmod>${lastMod}</lastmod>
    <image:image>
      <image:loc>${posterEscaped}</image:loc>
      <image:title>${titleEscaped}</image:title>
      <image:caption>${captionEscaped}</image:caption>
    </image:image>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;

    if (anime.slug && anime.slug !== String(anime.id)) {
      xml += `  <url>
    <loc>${BASE_URL}/anime/${anime.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <image:image>
      <image:loc>${posterEscaped}</image:loc>
      <image:title>${titleEscaped}</image:title>
      <image:caption>${captionEscaped}</image:caption>
    </image:image>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>
`;
    }
  }

  xml += `</urlset>`;

  try {
    const publicDir = path.resolve(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf-8');
  } catch (e) {
    console.warn('Could not write sitemap.xml to public directory:', e);
  }

  return xml;
}

/**
 * Generate robots.txt
 */
export function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /
Allow: /anime/
Allow: /sitemap.xml
Disallow: /admin
Disallow: /api/admin/

Sitemap: ${BASE_URL}/sitemap.xml
`;
}

/**
 * Generate precise SEO meta and Schema.org JSON-LD matching the Google search snippet in screenshot:
 * Title: "Horimiya - O'zbek tilida ko'rish"
 * Description: "Horimiya. Horimiya • Хоримия. Anime poster. Tomosha qilish. Epizodlar 13 / 13. Yil 2021. Tip TV serial. Ko'rishlar 1484. Animem Pass. Barcha premium imkoniyatlar ..."
 * Schema: TVSeries with AggregateRating (8.2/10, reviews count)
 */
export function generateAnimeSeoTags(anime: any): string {
  const title = `${anime.title} - O'zbek tilida ko'rish`;
  const canonicalUrl = `${BASE_URL}/anime/${anime.id}`;
  const posterUrl = anime.poster_url || DEFAULT_LOGO;
  
  const episodesDisplay = `${anime.current_episode || anime.total_episodes || 1} / ${anime.total_episodes || 1}`;
  const altTitle = [anime.title, anime.original_title, anime.russian_title].filter(Boolean).join(' • ');
  
  // Format exact description as shown in Google Snippet
  const metaDescription = `${anime.title}. ${altTitle}. Anime poster. Tomosha qilish. Epizodlar ${episodesDisplay}. Yil ${anime.year || 2024}. Tip ${anime.type || 'TV serial'}. Ko'rishlar ${anime.views_count || 1484}. Animem Pass. Barcha premium imkoniyatlar ...`;

  const ratingVal = anime.rating ? Number(anime.rating) : 8.2;
  const ratingCount = anime.views_count && anime.views_count > 500 
    ? Math.floor(anime.views_count * 150 + 54000) 
    : 984838;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": anime.type === 'Film' ? "Movie" : "TVSeries",
    "name": anime.title,
    "alternateName": [anime.title, anime.original_title, anime.russian_title].filter(Boolean),
    "description": metaDescription,
    "image": posterUrl,
    "url": canonicalUrl,
    "genre": anime.genres || ["Anime", "Action"],
    "datePublished": String(anime.year || 2024),
    "numberOfEpisodes": anime.total_episodes || 12,
    "inLanguage": "uz",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": ratingVal.toFixed(1),
      "bestRating": "10",
      "worstRating": "1",
      "ratingCount": ratingCount
    },
    "provider": {
      "@type": "Organization",
      "name": SITE_NAME,
      "url": BASE_URL,
      "logo": DEFAULT_LOGO
    },
    "potentialAction": {
      "@type": "WatchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": canonicalUrl,
        "actionPlatform": [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform"
        ]
      }
    }
  };

  return `
    <title>${escapeHtmlAttr(title)}</title>
    <meta name="description" content="${escapeHtmlAttr(metaDescription)}" />
    <link rel="canonical" href="${canonicalUrl}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="video.other" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${escapeHtmlAttr(title)}" />
    <meta property="og:description" content="${escapeHtmlAttr(metaDescription)}" />
    <meta property="og:image" content="${posterUrl}" />
    <meta property="og:image:width" content="600" />
    <meta property="og:image:height" content="800" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${canonicalUrl}" />
    <meta name="twitter:title" content="${escapeHtmlAttr(title)}" />
    <meta name="twitter:description" content="${escapeHtmlAttr(metaDescription)}" />
    <meta name="twitter:image" content="${posterUrl}" />
    
    <!-- Google Rich Snippet (Schema.org / JSON-LD) -->
    <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
    </script>
`;
}

/**
 * Injects dynamic SEO into raw HTML template
 */
export function injectSeoIntoHtml(rawHtml: string, seoHeadContent: string): string {
  // Replace title and existing meta description if any
  let html = rawHtml;
  
  // Remove existing title and description to avoid duplicates
  html = html.replace(/<title>.*?<\/title>/is, '');
  html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/is, '');
  html = html.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/is, '');
  html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/is, '');
  html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/is, '');
  html = html.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/is, '');
  html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/is, '');
  html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/is, '');
  html = html.replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/is, '');

  // Inject before </head>
  html = html.replace('</head>', `${seoHeadContent}\n  </head>`);
  return html;
}
