import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/professionals — List active professionals (optionally filter by service)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get('serviceId');

  const professionals = await prisma.professional.findMany({
    where: {
      isActive: true,
      ...(serviceId && {
        services: { some: { serviceId } },
      }),
    },
    include: {
      services: { include: { service: true } },
      tariffs: true,
    },
  });

  return NextResponse.json(professionals);
}
