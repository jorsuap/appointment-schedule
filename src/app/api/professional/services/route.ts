import { NextResponse } from 'next/server';

import { getProfessionalSession } from '@/lib/get-professional-session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { error, professionalId } = await getProfessionalSession();
  if (error) return error;

  try {
    const services = await prisma.professionalService.findMany({
      where: { professionalId },
      include: { service: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      services: services.map((ps) => ({
        id: ps.serviceId,
        serviceId: ps.serviceId,
        name: ps.service.name,
      })),
    });
  } catch (err) {
    console.error('Professional services GET error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
