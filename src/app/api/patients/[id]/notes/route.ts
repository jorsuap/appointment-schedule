import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/patients/:id/notes — Add a progress note
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const body = await request.json();
  const { content, appointmentId } = body;

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  }

  const note = await prisma.progressNote.create({
    data: {
      patientId: id,
      content: content.trim(),
      ...(appointmentId && { appointmentId }),
    },
  });

  return NextResponse.json(note, { status: 201 });
}
