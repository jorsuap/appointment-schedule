import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getProfessionalSession } from '@/lib/get-professional-session';
import { prisma } from '@/lib/prisma';

/**
 * Schema para creación de fecha bloqueada.
 * date: string ISO válida.
 * reason: motivo opcional.
 *
 * Validates: Requirement 5.3
 */
const createBlockedDateSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Fecha inválida. Usa formato ISO (YYYY-MM-DD o ISO 8601)',
  }),
  reason: z.string().optional(),
});

/**
 * GET /api/professional/blocked-dates
 * Retorna todas las fechas bloqueadas del profesional autenticado, ordenadas por fecha ASC.
 */
export async function GET() {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  try {
    const blockedDates = await prisma.blockedDate.findMany({
      where: { professionalId },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({
      blockedDates: blockedDates.map((bd) => ({
        id: bd.id,
        date: bd.date.toISOString(),
        reason: bd.reason,
      })),
    });
  } catch (err) {
    console.error('BlockedDates GET error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

/**
 * POST /api/professional/blocked-dates
 * Crea una nueva fecha bloqueada para el profesional autenticado.
 * Body: { date: string (ISO), reason?: string }
 */
export async function POST(request: NextRequest) {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  try {
    const body = await request.json();
    const parsed = createBlockedDateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const { date, reason } = parsed.data;

    const blockedDate = await prisma.blockedDate.create({
      data: {
        professionalId,
        date: new Date(date),
        reason: reason ?? null,
      },
    });

    return NextResponse.json(
      {
        id: blockedDate.id,
        date: blockedDate.date.toISOString(),
        reason: blockedDate.reason,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('BlockedDates POST error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

/**
 * DELETE /api/professional/blocked-dates?id=xxx
 * Elimina una fecha bloqueada por ID, verificando que pertenece al profesional autenticado.
 */
export async function DELETE(request: NextRequest) {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: 'El parámetro "id" es requerido' },
        { status: 422 },
      );
    }

    const blockedDate = await prisma.blockedDate.findUnique({
      where: { id },
    });

    if (!blockedDate || blockedDate.professionalId !== professionalId) {
      return NextResponse.json(
        { error: 'NOT_FOUND', details: 'Fecha bloqueada no encontrada' },
        { status: 404 },
      );
    }

    await prisma.blockedDate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('BlockedDates DELETE error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
