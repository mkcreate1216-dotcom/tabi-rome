import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ url }) => {
  const origin = url.origin;
  const pages = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/privacy', changefreq: 'monthly', priority: '0.5' },
  ];

  const urlsXml = pages
    .map(
      (page) => `  <url>
    <loc>${new URL(page.path, origin).href}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>
`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

