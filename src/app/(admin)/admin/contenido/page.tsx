import { prisma } from '@/lib/prisma';
import { ContentEditor } from './content-editor';

export const dynamic = 'force-dynamic';

export default async function ContenidoPage() {
  const content = await prisma.siteContent.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  const serialized = content.map((c) => ({
    id: c.id,
    section: c.section,
    title: c.title,
    subtitle: c.subtitle,
    body: c.body,
    ctaText: c.ctaText,
  }));

  return <ContentEditor initialContent={serialized} />;
}
