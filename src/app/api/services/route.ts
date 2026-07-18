import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/services — List active services
export async function GET() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json(services);
}
