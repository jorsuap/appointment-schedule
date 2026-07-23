'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AppointmentDetailModal,
  type AppointmentForModal,
} from '@/components/professional/appointment-detail-modal';

// --- Types ---

type AppointmentStatus =
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PENDING_PAYMENT'
  | 'EXPIRED';

export interface CalendarAppointment {
  id: string;
  patient: { id: string; fullName: string; email: string };
  service: { name: string; durationMin: number };
  date: string; // ISO date
  startTime: string; // HH:mm
  endTime: string;
  status: AppointmentStatus;
  meetLink: string | null;
  googleEventId: string | null;
  createdAt: string;
}

// --- Status color mapping ---

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  PENDING_PAYMENT: 'bg-amber-100 text-amber-800 border-amber-200',
  EXPIRED: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_PILL: Record<AppointmentStatus, string> = {
  CONFIRMED: 'bg-emerald-500',
  COMPLETED: 'bg-blue-500',
  CANCELLED: 'bg-red-500',
  PENDING_PAYMENT: 'bg-amber-500',
  EXPIRED: 'bg-gray-400',
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  PENDING_PAYMENT: 'Pendiente pago',
  EXPIRED: 'Expirada',
};

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// --- Component ---

/**
 * Monthly calendar view for the professional portal.
 * Displays appointments as colored pills by status.
 * Click on an appointment opens the detail modal.
 *
 * Validates: Requirements 7.1, 7.4
 */
export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentForModal | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthParam = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthName = currentMonth.toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
  });

  // Fetch appointments when month changes
  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/professional/appointments?month=${monthParam}`
      );
      if (!res.ok) {
        throw new Error('Error al cargar las citas');
      }
      const json = await res.json();
      setAppointments(json.appointments ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  }, [monthParam]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Calendar grid calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  // Get appointments for a specific day
  function getAppointmentsForDay(day: number): CalendarAppointment[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.filter((a) => {
      // Extract YYYY-MM-DD directly from ISO string to avoid timezone conversion
      const apptDateStr = a.date.split('T')[0];
      return apptDateStr === dateStr;
    });
  }

  // Navigation handlers
  function goToPrevMonth() {
    setCurrentMonth(new Date(year, month - 1, 1));
  }

  function goToNextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1));
  }

  // Handle appointment completion (refreshes data)
  function handleAppointmentUpdated() {
    fetchAppointments();
    setSelectedAppointment(null);
  }

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-grape sm:text-3xl">
          Calendario
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu agenda mensual de citas
        </p>
      </div>

      {/* Month navigation */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              onClick={goToPrevMonth}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="flex items-center gap-2 capitalize text-grape">
              <Calendar className="h-5 w-5 text-plum" />
              {monthName}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              onClick={goToNextMonth}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-2 sm:p-4">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-plum border-t-transparent" />
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={fetchAppointments}
              >
                Reintentar
              </Button>
            </div>
          )}

          {/* Calendar grid */}
          {!isLoading && !error && (
            <>
              {/* Days of week header */}
              <div className="grid grid-cols-7 border-b border-border/40">
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day}
                    className="px-1 py-2 text-center text-xs font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, i) => {
                  const dayAppointments = day
                    ? getAppointmentsForDay(day)
                    : [];
                  return (
                    <div
                      key={i}
                      className={`min-h-[80px] border-b border-r border-border/30 p-1 sm:min-h-[100px] sm:p-1.5 ${
                        day && isToday(day)
                          ? 'bg-plum/5'
                          : ''
                      }`}
                    >
                      {day && (
                        <>
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                              isToday(day)
                                ? 'bg-grape text-white'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {day}
                          </span>
                          <div className="mt-0.5 max-h-[56px] space-y-0.5 overflow-y-auto sm:max-h-[72px] sm:space-y-1">
                            {dayAppointments.map((appt) => (
                              <button
                                key={appt.id}
                                type="button"
                                onClick={() =>
                                  setSelectedAppointment({
                                    id: appt.id,
                                    patient: { fullName: appt.patient.fullName, email: appt.patient.email },
                                    service: appt.service,
                                    date: appt.date,
                                    startTime: appt.startTime,
                                    endTime: appt.endTime,
                                    status: appt.status,
                                    meetLink: appt.meetLink,
                                    googleEventId: appt.googleEventId,
                                  })
                                }
                                className={`flex w-full min-h-[28px] items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium transition-opacity hover:opacity-80 sm:text-xs ${STATUS_COLORS[appt.status]}`}
                                aria-label={`Cita con ${appt.patient.fullName} a las ${appt.startTime} - ${STATUS_LABELS[appt.status]}`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_PILL[appt.status]}`}
                                />
                                <span className="truncate">
                                  {appt.startTime}{' '}
                                  {appt.patient.fullName.split(' ')[0]}
                                </span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-3">
                {(
                  Object.entries(STATUS_LABELS) as [
                    AppointmentStatus,
                    string,
                  ][]
                )
                  .filter(([status]) => status !== 'EXPIRED')
                  .map(([status, label]) => (
                    <div key={status} className="flex items-center gap-1.5">
                      <div
                        className={`h-3 w-3 rounded-full ${STATUS_PILL[status]}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {label}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Empty state */}
              {appointments.length === 0 && (
                <div className="py-8 text-center">
                  <Calendar className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No tienes citas este mes
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Mobile list view (complementary for small screens) */}
      {!isLoading && !error && appointments.length > 0 && (
        <Card className="sm:hidden">
          <CardHeader>
            <CardTitle className="text-sm text-grape">
              Citas del mes ({appointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {appointments.map((appt) => {
              const apptDate = new Date(appt.date);
              const dateLabel = apptDate.toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'short',
              });
              return (
                <button
                  key={appt.id}
                  type="button"
                  onClick={() =>
                    setSelectedAppointment({
                      id: appt.id,
                      patient: { fullName: appt.patient.fullName, email: appt.patient.email },
                      service: appt.service,
                      date: appt.date,
                      startTime: appt.startTime,
                      endTime: appt.endTime,
                      status: appt.status,
                      meetLink: appt.meetLink,
                      googleEventId: appt.googleEventId,
                    })
                  }
                  className="flex w-full min-h-[44px] items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2 text-left transition-colors hover:bg-secondary"
                >
                  <span
                    className={`h-3 w-3 shrink-0 rounded-full ${STATUS_PILL[appt.status]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {appt.patient.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dateLabel} • {appt.startTime} – {appt.endTime}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] ${STATUS_COLORS[appt.status]}`}
                  >
                    {STATUS_LABELS[appt.status]}
                  </Badge>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Appointment detail modal */}
      <AppointmentDetailModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onCompleted={handleAppointmentUpdated}
      />
    </div>
  );
}
