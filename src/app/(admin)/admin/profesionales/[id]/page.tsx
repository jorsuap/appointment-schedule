'use client';

import { useState } from 'react';
import { ArrowLeft, Video, Plus, Trash2 } from 'lucide-react';
import { LinkButton } from '@/components/ui/link-button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// TODO: Fetch from database by professional ID
const professional = {
  id: '1',
  name: 'Alejandra Moreno',
  specialty: 'Psicóloga Clínica',
  email: 'alejandra@conalma.co',
  traits: ['Cálida', 'Profunda', 'Reflexiva', 'Sensible'],
  services: ['Acompañamiento emocional', 'Acompañamiento maternidad posparto'],
  isActive: true,
};

const appointments = [
  {
    id: '1',
    patient: 'María González',
    service: 'Acompañamiento emocional',
    date: '2026-07-14',
    time: '09:00',
    status: 'CONFIRMED',
    meetLink: 'https://meet.google.com/abc-defg-hij',
  },
  {
    id: '2',
    patient: 'Ana Martínez',
    service: 'Acompañamiento emocional',
    date: '2026-07-14',
    time: '14:00',
    status: 'CONFIRMED',
    meetLink: 'https://meet.google.com/uvw-xyz-123',
  },
  {
    id: '3',
    patient: 'Laura Sánchez',
    service: 'Acompañamiento emocional',
    date: '2026-07-15',
    time: '09:00',
    status: 'COMPLETED',
    meetLink: null,
  },
];

const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const schedule = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
  { dayOfWeek: 1, startTime: '14:00', endTime: '17:00' },
  { dayOfWeek: 3, startTime: '09:00', endTime: '12:00' },
  { dayOfWeek: 5, startTime: '14:00', endTime: '18:00' },
];

const blockedDates = [
  { id: '1', date: '2026-07-21', reason: 'Vacaciones' },
  { id: '2', date: '2026-07-22', reason: 'Vacaciones' },
];

const tariffs = [
  { service: 'Acompañamiento emocional', price: 80000, commission: 40 },
  { service: 'Acompañamiento maternidad posparto', price: 90000, commission: 40 },
];

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  CONFIRMED: { label: 'Confirmada', variant: 'default' },
  COMPLETED: { label: 'Completada', variant: 'secondary' },
  CANCELLED: { label: 'Cancelada', variant: 'destructive' },
  PENDING_PAYMENT: { label: 'Pendiente', variant: 'outline' },
};

export default function ProfesionalDetailPage() {
  const initials = professional.name.split(' ').map((n) => n[0]).join('').slice(0, 2);

  return (
    <div>
      <LinkButton href="/admin/profesionales" variant="ghost" size="sm" className="mb-4 gap-1">
        <ArrowLeft className="h-4 w-4" />
        Profesionales
      </LinkButton>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-plum/20 text-lg font-semibold text-grape">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-grape">{professional.name}</h1>
          <p className="text-sm text-muted-foreground">{professional.specialty} • {professional.email}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {professional.traits.map((t) => (
              <span key={t} className="rounded-full bg-jasmine/30 px-2 py-0.5 text-xs font-medium text-grape">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="agenda" className="mt-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="disponibilidad">Disponibilidad</TabsTrigger>
          <TabsTrigger value="tarifas">Tarifas</TabsTrigger>
        </TabsList>

        {/* === AGENDA === */}
        <TabsContent value="agenda" className="mt-4 space-y-3">
          {appointments.map((apt) => {
            const statusInfo = statusLabels[apt.status] || { label: apt.status, variant: 'outline' as const };
            return (
              <Card key={apt.id} className="border-border/40">
                <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-grape">{apt.date} • {apt.time}</span>
                      <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium">{apt.patient}</p>
                    <p className="text-xs text-muted-foreground">{apt.service}</p>
                  </div>
                  {apt.meetLink && (
                    <a
                      href={apt.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-grape hover:bg-plum/20"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Meet
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* === DISPONIBILIDAD === */}
        <TabsContent value="disponibilidad" className="mt-4 space-y-6">
          <Card className="border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base text-grape">Horario semanal</CardTitle>
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <Plus className="h-3 w-3" />
                Agregar bloque
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {schedule.map((slot, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{days[slot.dayOfWeek]}</Badge>
                      <span className="text-sm font-medium">{slot.startTime} - {slot.endTime}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base text-grape">Fechas bloqueadas</CardTitle>
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <Plus className="h-3 w-3" />
                Bloquear fecha
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {blockedDates.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{b.date}</p>
                      <p className="text-xs text-muted-foreground">{b.reason}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === TARIFAS === */}
        <TabsContent value="tarifas" className="mt-4">
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-grape">Tarifas por servicio</CardTitle>
              <p className="text-xs text-muted-foreground">
                Configura el precio que cobra el profesional y el porcentaje de comisión de la plataforma.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {tariffs.map((tariff, i) => {
                const netAmount = tariff.price - (tariff.price * tariff.commission) / 100;
                return (
                  <div key={i} className="rounded-lg border border-border/40 p-4">
                    <p className="text-sm font-semibold text-grape">{tariff.service}</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Precio sesión</Label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          className="mt-1 h-10 text-sm"
                          defaultValue={tariff.price}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Comisión plataforma (%)</Label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          className="mt-1 h-10 text-sm"
                          defaultValue={tariff.commission}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Pago neto profesional</Label>
                        <div className="mt-1 flex h-10 items-center rounded-lg bg-secondary px-3 text-sm font-semibold text-grape">
                          ${netAmount.toLocaleString('es-CO')} COP
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <Button size="sm" className="mt-2">Guardar tarifas</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
