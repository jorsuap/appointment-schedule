'use client';

import { useState } from 'react';
import { CalendarDays, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// TODO: Fetch from database
const allAppointments = [
  {
    id: '1',
    patient: 'María González',
    professional: 'Alejandra Moreno',
    professionalId: '1',
    service: 'Acompañamiento emocional',
    date: '2026-07-14',
    time: '09:00',
    status: 'CONFIRMED',
    meetLink: 'https://meet.google.com/abc-defg-hij',
  },
  {
    id: '2',
    patient: 'Carlos Ruiz',
    professional: 'Carolina Jiménez',
    professionalId: '2',
    service: 'Acompañamiento maternidad posparto',
    date: '2026-07-14',
    time: '10:00',
    status: 'CONFIRMED',
    meetLink: 'https://meet.google.com/klm-nopq-rst',
  },
  {
    id: '3',
    patient: 'Ana Martínez',
    professional: 'Alejandra Moreno',
    professionalId: '1',
    service: 'Acompañamiento emocional',
    date: '2026-07-14',
    time: '14:00',
    status: 'CONFIRMED',
    meetLink: 'https://meet.google.com/uvw-xyz-123',
  },
  {
    id: '4',
    patient: 'Laura Sánchez',
    professional: 'Carolina Jiménez',
    professionalId: '2',
    service: 'Acompañamiento emocional',
    date: '2026-07-15',
    time: '09:00',
    status: 'PENDING_PAYMENT',
    meetLink: null,
  },
];

const professionals = [
  { id: 'all', name: 'Todas' },
  { id: '1', name: 'Alejandra Moreno' },
  { id: '2', name: 'Carolina Jiménez' },
];

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  CONFIRMED: { label: 'Confirmada', variant: 'default' },
  PENDING_PAYMENT: { label: 'Pendiente de pago', variant: 'outline' },
  COMPLETED: { label: 'Completada', variant: 'secondary' },
  CANCELLED: { label: 'Cancelada', variant: 'destructive' },
};

export default function CitasPage() {
  const [filterProfessional, setFilterProfessional] = useState('all');

  const filtered =
    filterProfessional === 'all'
      ? allAppointments
      : allAppointments.filter((a) => a.professionalId === filterProfessional);

  // Group by date
  const grouped = filtered.reduce(
    (acc, apt) => {
      if (!acc[apt.date]) acc[apt.date] = [];
      acc[apt.date].push(apt);
      return acc;
    },
    {} as Record<string, typeof allAppointments>,
  );

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-grape sm:text-3xl">Agenda de citas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vista general de todas las citas programadas
          </p>
        </div>

        {/* Filter by professional */}
        <Select value={filterProfessional} onValueChange={(v) => v && setFilterProfessional(v)}>
          <SelectTrigger className="h-10 w-full text-sm sm:w-56">
            <SelectValue placeholder="Filtrar por profesional" />
          </SelectTrigger>
          <SelectContent>
            {professionals.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grouped appointments */}
      <div className="mt-6 space-y-6">
        {Object.entries(grouped).map(([date, apts]) => (
          <div key={date}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-grape">
              <CalendarDays className="h-4 w-4" />
              {new Date(date + 'T12:00:00').toLocaleDateString('es-CO', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h3>

            <div className="mt-2 space-y-2">
              {apts.map((apt) => {
                const statusInfo = statusLabels[apt.status] || { label: apt.status, variant: 'outline' as const };
                return (
                  <Card key={apt.id} className="border-border/40">
                    <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-grape">{apt.time}</span>
                          <Badge variant={statusInfo.variant} className="text-xs">
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm font-medium">{apt.patient}</p>
                        <p className="text-xs text-muted-foreground">
                          {apt.service} • {apt.professional}
                        </p>
                      </div>
                      {apt.meetLink && (
                        <a
                          href={apt.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-grape transition-colors hover:bg-plum/20"
                        >
                          <Video className="h-3.5 w-3.5" />
                          Meet
                        </a>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
