import { NextRequest, NextResponse } from 'next/server';

import { getProfessionalSession } from '@/lib/get-professional-session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { error, professionalId } = await getProfessionalSession();

  if (error) return error;

  const { searchParams } = new URL(request.url);
  const eligible = searchParams.get('eligible');

  // When eligible=packages, filter only patients with CONFIRMED/COMPLETED appointments
  const appointmentStatusFilter =
    eligible === 'packages'
      ? { status: { in: ['CONFIRMED' as const, 'COMPLETED' as const] } }
      : {};

  try {
    // Find patients that have at least one appointment with this professional
    const patients = await prisma.patient.findMany({
      where: {
        appointments: {
          some: {
            professionalId,
            ...appointmentStatusFilter,
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        preferredName: true,
        email: true,
        appointments: {
          where: { professionalId, ...appointmentStatusFilter },
          select: { date: true },
          orderBy: { date: 'desc' },
        },
      },
    });

    // Map to response shape with computed fields
    const patientsWithStats = patients
      .map((patient) => ({
        id: patient.id,
        fullName: patient.fullName,
        preferredName: patient.preferredName,
        email: patient.email,
        lastAppointmentDate:
          patient.appointments.length > 0
            ? patient.appointments[0].date.toISOString()
            : null,
        totalAppointments: patient.appointments.length,
      }))
      .sort((a, b) => {
        // Order by lastAppointmentDate DESC (most recent first), nulls last
        if (!a.lastAppointmentDate && !b.lastAppointmentDate) return 0;
        if (!a.lastAppointmentDate) return 1;
        if (!b.lastAppointmentDate) return -1;
        return b.lastAppointmentDate.localeCompare(a.lastAppointmentDate);
      });

    return NextResponse.json({ patients: patientsWithStats });
  } catch (err) {
    console.error('Patients GET error:', err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
