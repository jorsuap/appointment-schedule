import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/patients/:id — Get patient detail with appointments and notes
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        include: { professional: true, service: true },
        orderBy: { date: 'desc' },
      },
      progressNotes: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  }

  return NextResponse.json(patient);
}
