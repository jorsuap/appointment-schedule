'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Video, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// TODO: Fetch from database
const allAppointments = [
  { id: '1', patient: 'María González', professional: 'Alejandra Moreno', professionalColor: 'bg-plum/40', service: 'Acompañamiento emocional', date: '2026-07-14', time: '09:00', endTime: '10:00', status: 'CONFIRMED', meetLink: 'https://meet.google.com/abc-defg-hij', patientEmail: 'maria@email.com', patientPhone: '3001234567' },
  { id: '2', patient: 'Carlos Ruiz', professional: 'Carolina Jiménez', professionalColor: 'bg-jasmine/40', service: 'Acompañamiento maternidad posparto', date: '2026-07-14', time: '10:00', endTime: '11:00', status: 'CONFIRMED', meetLink: 'https://meet.google.com/klm-nopq-rst', patientEmail: 'carlos@email.com', patientPhone: '3109876543' },
  { id: '3', patient: 'Ana Martínez', professional: 'Alejandra Moreno', professionalColor: 'bg-plum/40', service: 'Acompañamiento emocional', date: '2026-07-14', time: '11:00', endTime: '12:00', status: 'CONFIRMED', meetLink: 'https://meet.google.com/uvw-xyz-123', patientEmail: 'ana@email.com', patientPhone: '3201112233' },
  { id: '4', patient: 'Laura Sánchez', professional: 'Carolina Jiménez', professionalColor: 'bg-jasmine/40', service: 'Acompañamiento emocional', date: '2026-07-14', time: '14:00', endTime: '15:00', status: 'CONFIRMED', meetLink: 'https://meet.google.com/456-789-abc', patientEmail: 'laura@email.com', patientPhone: '3154445566' },
  { id: '5', patient: 'Pedro López', professional: 'Alejandra Moreno', professionalColor: 'bg-plum/40', service: 'Acompañamiento emocional', date: '2026-07-14', time: '15:00', endTime: '16:00', status: 'CONFIRMED', meetLink: 'https://meet.google.com/def-ghi-jkl', patientEmail: 'pedro@email.com', patientPhone: '3006667788' },
  { id: '6', patient: 'Sofía Rodríguez', professional: 'Carolina Jiménez', professionalColor: 'bg-jasmine/40', service: 'Acompañamiento maternidad posparto', date: '2026-07-14', time: '16:00', endTime: '17:00', status: 'CONFIRMED', meetLink: 'https://meet.google.com/mno-pqr-stu', patientEmail: 'sofia@email.com', patientPhone: '3187778899' },
  { id: '7', patient: 'Diego Vargas', professional: 'Alejandra Moreno', professionalColor: 'bg-plum/40', service: 'Acompañamiento emocional', date: '2026-07-14', time: '17:00', endTime: '18:00', status: 'PENDING_PAYMENT', meetLink: null, patientEmail: 'diego@email.com', patientPhone: '3209990011' },
  { id: '8', patient: 'Valentina Mora', professional: 'Carolina Jiménez', professionalColor: 'bg-jasmine/40', service: 'Acompañamiento emocional', date: '2026-07-16', time: '09:00', endTime: '10:00', status: 'CONFIRMED', meetLink: 'https://meet.google.com/vwx-yza-bcd', patientEmail: 'valentina@email.com', patientPhone: '3152223344' },
  { id: '9', patient: 'Andrés Gómez', professional: 'Alejandra Moreno', professionalColor: 'bg-plum/40', service: 'Acompañamiento emocional', date: '2026-07-16', time: '10:00', endTime: '11:00', status: 'CONFIRMED', meetLink: 'https://meet.google.com/efg-hij-klm', patientEmail: 'andres@email.com', patientPhone: '3005556677' },
  { id: '10', patient: 'Camila Torres', professional: 'Alejandra Moreno', professionalColor: 'bg-plum/40', service: 'Acompañamiento emocional', date: '2026-07-18', time: '14:00', endTime: '15:00', status: 'CONFIRMED', meetLink: null, patientEmail: 'camila@email.com', patientPhone: '3178889900' },
];

type Appointment = (typeof allAppointments)[number];

export default function CalendarioPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 6, 1)); // July 2026
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sunday

  const monthName = currentMonth.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  // Build calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  function getAppointmentsForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allAppointments.filter((a) => a.date === dateStr);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-grape sm:text-3xl">Calendario</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Vista global de todas las citas de todos los profesionales
      </p>

      {/* Month navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold capitalize text-grape">{monthName}</h2>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border/40">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
              <div key={d} className="px-1 py-2 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dayAppointments = day ? getAppointmentsForDay(day) : [];
              return (
                <div
                  key={i}
                  className="min-h-[100px] border-b border-r border-border/30 p-1.5"
                >
                  {day && (
                    <>
                      <span className="text-xs font-medium text-muted-foreground">{day}</span>
                      <div className="mt-1 max-h-[80px] space-y-1 overflow-y-auto">
                        {dayAppointments.map((apt) => (
                          <button
                            key={apt.id}
                            type="button"
                            onClick={() => setSelectedAppointment(apt)}
                            className={`w-full truncate rounded px-1.5 py-1 text-left text-[10px] font-medium text-grape transition-opacity hover:opacity-80 ${apt.professionalColor}`}
                          >
                            {apt.time} {apt.patient.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-plum/40" />
          <span className="text-xs text-muted-foreground">Alejandra Moreno</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-jasmine/40" />
          <span className="text-xs text-muted-foreground">Carolina Jiménez</span>
        </div>
      </div>

      {/* Modal: Appointment detail */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base text-grape">Detalle de la cita</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSelectedAppointment(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fecha y hora</span>
                <span className="font-medium">{selectedAppointment.date} • {selectedAppointment.time} - {selectedAppointment.endTime}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Profesional</span>
                <span className="font-medium">{selectedAppointment.professional}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Paciente</span>
                <span className="font-medium">{selectedAppointment.patient}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{selectedAppointment.patientEmail}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Teléfono</span>
                <span className="font-medium">{selectedAppointment.patientPhone}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Servicio</span>
                <span className="font-medium">{selectedAppointment.service}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estado</span>
                <Badge variant="default" className="text-xs">{selectedAppointment.status === 'CONFIRMED' ? 'Confirmada' : selectedAppointment.status}</Badge>
              </div>
              {selectedAppointment.meetLink && (
                <>
                  <Separator />
                  <a
                    href={selectedAppointment.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary py-2.5 text-sm font-medium text-grape hover:bg-plum/20"
                  >
                    <Video className="h-4 w-4" />
                    Abrir Google Meet
                  </a>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
