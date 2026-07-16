import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/patients — List all patients (admin)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');

  const patients = await prisma.patient.findMany({
    where: search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined,
    include: {
      appointments: {
        orderBy: { date: 'desc' },
        take: 1,
      },
      _count: { select: { appointments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(patients);
}
