import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateTariffSchema } from '@/lib/validations/tariffs';
import type { Session } from 'next-auth';

/**
 * PUT /api/admin/professionals/[id]/tariffs/[tariffId]
 * Actualiza price y commission de una tarifa de un profesional.
 * Requiere sesión ADMIN. Valida que la tarifa exista y pertenezca al
 * profesional del path antes de persistir.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; tariffId: string }> },
) {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id, tariffId } = await params;
    const body = await request.json();
    const parsed = updateTariffSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 },
      );
    }

    const tariff = await prisma.professionalTariff.findUnique({
      where: { id: tariffId },
    });

    if (!tariff || tariff.professionalId !== id) {
      return NextResponse.json({ error: 'TARIFF_NOT_FOUND' }, { status: 404 });
    }

    const updated = await prisma.professionalTariff.update({
      where: { id: tariffId },
      data: {
        price: parsed.data.price,
        commission: parsed.data.commission,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[admin/professionals/[id]/tariffs/[tariffId]] PUT error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
