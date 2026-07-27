import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/profesional/', '/api/', '/auth/'],
      },
    ],
    sitemap: 'https://conalma.care/sitemap.xml',
  };
}
