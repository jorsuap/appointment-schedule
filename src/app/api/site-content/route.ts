import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/site-content — Get all site content sections
export async function GET() {
  const content = await prisma.siteContent.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json(content);
}

// PUT /api/site-content — Update site content (admin)
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { sections } = body;

  if (!sections || !Array.isArray(sections)) {
    return NextResponse.json({ error: 'sections array is required' }, { status: 400 });
  }

  const updated = await prisma.$transaction(
    sections.map((section: { section: string; title?: string; subtitle?: string; body?: string; ctaText?: string }) =>
      prisma.siteContent.update({
        where: { section: section.section },
        data: {
          ...(section.title !== undefined && { title: section.title }),
          ...(section.subtitle !== undefined && { subtitle: section.subtitle }),
          ...(section.body !== undefined && { body: section.body }),
          ...(section.ctaText !== undefined && { ctaText: section.ctaText }),
        },
      }),
    ),
  );

  return NextResponse.json(updated);
}
