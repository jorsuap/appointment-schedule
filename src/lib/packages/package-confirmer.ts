/**
 * Package Confirmer — Confirms a SessionPackage by creating appointments
 * and scheduling Google Calendar events.
 *
 * Flow:
 * 1. Fetch SessionPackage from DB (include professional, patient)
 * 2. Calculate session dates using Session Scheduler
 * 3. Prisma transaction: update status → CONFIRMED + create N Appointments
 * 4. Outside transaction: create Google Calendar events + Meet (fire-and-forget)
 *    - Sequential with 1s delay between calendar API calls (rate limit)
 *    - If any call fails: log error, skip, continue
 * 5. If transaction fails: throw error (package stays PENDING_PAYMENT)
 */

import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { refreshAccessToken, createCalendarEvent } from '@/lib/google-oauth';
import { sendPackageConfirmation } from '@/lib/emails/send-package-confirmation';
import {
  calculateSessionDates,
  type Frequency,
} from './session-scheduler';

/**
 * Delays execution for the specified number of milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Confirms a SessionPackage:
 * - Creates all appointments in a single transaction
 * - Creates Google Calendar events outside the transaction (fire-and-forget)
 *
 * @param packageId - The ID of the SessionPackage to confirm
 * @throws Error if the package is not found or the transaction fails
 */
export async function confirmPackage(packageId: string): Promise<void> {
  // 1. Fetch SessionPackage with professional and patient data
  const sessionPackage = await prisma.sessionPackage.findUnique({
    where: { id: packageId },
    include: {
      professional: true,
      patient: true,
    },
  });

  if (!sessionPackage) {
    throw new Error(`SessionPackage not found: ${packageId}`);
  }

  // 2. Calculate session dates from package configuration
  const scheduledSessions = calculateSessionDates(
    sessionPackage.startDate,
    sessionPackage.startTime,
    sessionPackage.endTime,
    sessionPackage.sessionCount,
    sessionPackage.frequency.toLowerCase() as Frequency,
  );

  // 3. Prisma transaction: update status + create appointments
  const createdAppointments = await prisma.$transaction(async (tx) => {
    // Update SessionPackage status to CONFIRMED
    await tx.sessionPackage.update({
      where: { id: packageId },
      data: { status: 'CONFIRMED' },
    });

    // Create N Appointments (one per scheduled session)
    const appointmentData = scheduledSessions.map((session) => ({
      patientId: sessionPackage.patientId,
      professionalId: sessionPackage.professionalId,
      serviceId: sessionPackage.serviceId,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      status: 'CONFIRMED' as const,
      sessionPackageId: packageId,
    }));

    // createMany doesn't return created records in PostgreSQL with Prisma,
    // so we create individually to get IDs for calendar event updates
    const appointments = [];
    for (const data of appointmentData) {
      const appointment = await tx.appointment.create({ data });
      appointments.push(appointment);
    }

    return appointments;
  });

  // 4. Outside transaction: Create Google Calendar events (fire-and-forget)
  const professional = sessionPackage.professional;

  if (professional.googleCalendarConnected && professional.googleRefreshToken) {
    try {
      const decryptedRefreshToken = decrypt(professional.googleRefreshToken);
      const { accessToken } = await refreshAccessToken(decryptedRefreshToken);

      for (const appointment of createdAppointments) {
        try {
          const dateStr = appointment.date.toISOString().split('T')[0];
          const startDateTime = `${dateStr}T${appointment.startTime}:00`;
          const endDateTime = `${dateStr}T${appointment.endTime}:00`;

          const result = await createCalendarEvent({
            accessToken,
            summary: `conAlma — Paquete de sesiones`,
            description: `Sesión con ${sessionPackage.patient.preferredName || sessionPackage.patient.fullName}.`,
            startDateTime,
            endDateTime,
            attendeeEmail: sessionPackage.patient.email,
          });

          if (result) {
            await prisma.appointment.update({
              where: { id: appointment.id },
              data: {
                googleEventId: result.eventId,
                meetLink: result.meetLink,
              },
            });
          }
        } catch (calendarError) {
          console.error(
            `[PackageConfirmer] Calendar event failed for appointment ${appointment.id}:`,
            calendarError,
          );
          // Skip this event, continue with the rest
        }

        // Rate limit: 1 second delay between calendar API calls
        await delay(1000);
      }
    } catch (authError) {
      console.error(
        `[PackageConfirmer] Google OAuth authentication failed for professional ${professional.id}:`,
        authError,
      );
      // Calendar events won't be created, but appointments are already confirmed
    }
  }

  // 5. Send confirmation email to patient (fire-and-forget)
  const frequencyLabels: Record<string, string> = {
    weekly: 'Semanal',
    biweekly: 'Quincenal',
    monthly: 'Mensual',
  };

  // Refetch appointments to get any meetLinks that were just set
  const updatedAppointments = await prisma.appointment.findMany({
    where: { sessionPackageId: packageId },
    orderBy: { date: 'asc' },
  });

  sendPackageConfirmation({
    to: sessionPackage.patient.email,
    patientName: sessionPackage.patient.preferredName || sessionPackage.patient.fullName,
    professionalName: professional.name,
    sessionCount: sessionPackage.sessionCount,
    frequency: frequencyLabels[sessionPackage.frequency.toLowerCase()] || sessionPackage.frequency,
    totalPrice: sessionPackage.totalPrice,
    sessions: updatedAppointments.map((appt) => ({
      date: appt.date.toISOString().split('T')[0],
      startTime: appt.startTime,
      meetLink: appt.meetLink,
    })),
  }).catch((err) => {
    console.error(`[PackageConfirmer] Email notification failed for package ${packageId}:`, err);
  });
}
