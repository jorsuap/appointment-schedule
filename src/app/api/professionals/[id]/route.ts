import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/professionals/[id]
 * Elimina un profesional y su User asociado.
 * Cascade: elimina servicios, tarifas, disponibilidad, fechas bloqueadas.
 * NO elimina citas ni pacientes (datos históricos se preservan).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const professional = await prisma.professional.findUnique({
      where: { id },
      select: { id: true, userId: true, name: true },
    });

    if (!professional) {
      return NextResponse.json({ error: 'PROFESSIONAL_NOT_FOUND' }, { status: 404 });
    }

    // Delete in correct order to avoid FK constraint violations
    await prisma.$transaction(async (tx) => {
      // 1. Get all appointment IDs for this professional
      const appointments = await tx.appointment.findMany({
        where: { professionalId: id },
        select: { id: true },
      });
      const appointmentIds = appointments.map((a) => a.id);

      // 2. Delete progress notes linked to these appointments OR authored by this professional
      await tx.progressNote.deleteMany({
        where: {
          OR: [
            { appointmentId: { in: appointmentIds } },
            { authorId: id },
          ],
        },
      });

      // 3. Delete payments linked to these appointments
      if (appointmentIds.length > 0) {
        await tx.payment.deleteMany({
          where: { appointmentId: { in: appointmentIds } },
        });
      }

      // 4. Delete appointments
      await tx.appointment.deleteMany({ where: { professionalId: id } });

      // 5. Delete tariffs
      await tx.professionalTariff.deleteMany({ where: { professionalId: id } });

      // 6. Delete professional-service associations
      await tx.professionalService.deleteMany({ where: { professionalId: id } });

      // 7. Delete availabilities
      await tx.availability.deleteMany({ where: { professionalId: id } });

      // 8. Delete blocked dates
      await tx.blockedDate.deleteMany({ where: { professionalId: id } });

      // 9. Delete the Professional record
      await tx.professional.delete({ where: { id } });

      // 10. Delete associated User (if exists)
      if (professional.userId) {
        await tx.user.delete({ where: { id: professional.userId } });
      }
    });

    return NextResponse.json({ success: true, deleted: professional.name });
  } catch (error) {
    console.error('Error deleting professional:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
