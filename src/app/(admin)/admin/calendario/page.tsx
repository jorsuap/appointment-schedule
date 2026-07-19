import { prisma } from '@/lib/prisma';
import { CalendarView } from './calendar-view';

export const dynamic = 'force-dynamic';

export default async function CalendarioPage() {
  const appointments = await prisma.appointment.findMany({
    where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
    include: { patient: true, professional: true, service: true },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  const professionals = await prisma.professional.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  // Serialize dates for client component
  const serializedAppointments = appointments.map((apt) => ({
    id: apt.id,
    patient: apt.patient.fullName,
    professional: apt.professional.name,
    professionalId: apt.professionalId,
    service: apt.service.name,
    date: apt.date.toISOString().split('T')[0],
    time: apt.startTime,
    endTime: apt.endTime,
    status: apt.status,
    meetLink: apt.meetLink,
    patientEmail: apt.patient.email,
    patientPhone: apt.patient.emergencyPhone || '—',
  }));

  return (
    <CalendarView
      appointments={serializedAppointments}
      professionals={professionals}
    />
  );
}
