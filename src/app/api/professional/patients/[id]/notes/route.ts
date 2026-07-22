import { NextRequest, NextResponse } from 'next/server';

import { getProfessionalSession } from '@/lib/get-professional-session';
import { prisma } from '@/lib/prisma';
import { createProgressNoteSchema } from '@/lib/validations/professional-profile';

/**
 * GET /api/professional/patients/[id]/notes
 * Returns progress notes for the patient, filtered by authorId = professionalId.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  try {
    const { id: patientId } = await params;

    // Verify this patient has at least one appointment with the current professional
    const hasAppointment = await prisma.appointment.findFirst({
      where: {
        patientId,
        professionalId,
      },
      select: { id: true },
    });

    if (!hasAppointment) {
      return NextResponse.json(
        { error: 'PATIENT_NOT_YOURS' },
        { status: 403 }
      );
    }

    // Fetch progress notes authored by this professional for this patient
    const progressNotes = await prisma.progressNote.findMany({
      where: {
        patientId,
        authorId: professionalId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      notes: progressNotes.map((note) => ({
        id: note.id,
        content: note.content,
        appointmentId: note.appointmentId,
        createdAt: note.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Patient notes GET error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

/**
 * POST /api/professional/patients/[id]/notes
 * Creates a new progress note for the patient.
 * Validates body with createProgressNoteSchema.
 * Sets authorId = professionalId from session.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  try {
    const { id: patientId } = await params;

    // Verify this patient has at least one appointment with the current professional
    const hasAppointment = await prisma.appointment.findFirst({
      where: {
        patientId,
        professionalId,
      },
      select: { id: true },
    });

    if (!hasAppointment) {
      return NextResponse.json(
        { error: 'PATIENT_NOT_YOURS' },
        { status: 403 }
      );
    }

    // Parse and validate body with Zod
    const body = await request.json();
    const parsed = createProgressNoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { content, appointmentId } = parsed.data;

    // Create the progress note with authorId = professionalId
    const note = await prisma.progressNote.create({
      data: {
        patientId,
        authorId: professionalId,
        content,
        ...(appointmentId && { appointmentId }),
      },
    });

    return NextResponse.json(
      {
        id: note.id,
        content: note.content,
        appointmentId: note.appointmentId,
        createdAt: note.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Patient notes POST error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
