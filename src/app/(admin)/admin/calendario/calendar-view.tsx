'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Video, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface Appointment {
  id: string;
  patient: string;
  professional: string;
  professionalId: string;
  service: string;
  date: string;
  time: string;
  endTime: string;
  status: string;
  meetLink: string | null;
  patientEmail: string;
  patientPhone: string;
}

interface CalendarViewProps {
  appointments: Appointment[];
  professionals: { id: string; name: string }[];
}

// Assign colors to professionals
const COLORS = ['bg-plum/40', 'bg-jasmine/40', 'bg-green-200', 'bg-blue-200', 'bg-orange-200'];

export function CalendarView({ appointments, professionals }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthName = currentMonth.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  const colorMap = Object.fromEntries(professionals.map((p, i) => [p.id, COLORS[i % COLORS.length]]));

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  function getAppointmentsForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.filter((a) => a.date === dateStr);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-grape sm:text-3xl">Calendario</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Vista global de todas las citas
      </p>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold capitalize text-grape">{monthName}</h2>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-7 border-b border-border/40">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
              <div key={d} className="px-1 py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dayAppointments = day ? getAppointmentsForDay(day) : [];
              return (
                <div key={i} className="min-h-[100px] border-b border-r border-border/30 p-1.5">
                  {day && (
                    <>
                      <span className="text-xs font-medium text-muted-foreground">{day}</span>
                      <div className="mt-1 max-h-[80px] space-y-1 overflow-y-auto">
                        {dayAppointments.map((apt) => (
                          <button
                            key={apt.id}
                            type="button"
                            onClick={() => setSelectedAppointment(apt)}
                            className={`w-full truncate rounded px-1.5 py-1 text-left text-[10px] font-medium text-grape transition-opacity hover:opacity-80 ${colorMap[apt.professionalId] || 'bg-secondary'}`}
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
        {professionals.map((p, i) => (
          <div key={p.id} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded ${COLORS[i % COLORS.length]}`} />
            <span className="text-xs text-muted-foreground">{p.name}</span>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base text-grape">Detalle de la cita</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedAppointment(null)}>
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
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Servicio</span>
                <span className="font-medium">{selectedAppointment.service}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estado</span>
                <Badge variant="default" className="text-xs">
                  {selectedAppointment.status === 'CONFIRMED' ? 'Confirmada' : selectedAppointment.status}
                </Badge>
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
