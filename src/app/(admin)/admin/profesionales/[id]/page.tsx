import { notFound } from 'next/navigation';
import { ArrowLeft, Video, CalendarCheck, CalendarX } from 'lucide-react';
import { LinkButton } from '@/components/ui/link-button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { prisma } from '@/lib/prisma';
import { DeleteProfessionalButton } from './delete-professional-button';

export const dynamic = 'force-dynamic';

const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default async function ProfesionalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const professional = await prisma.professional.findUnique({
    where: { id },
    include: {
      services: { include: { service: true } },
      availabilities: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
      blockedDates: { orderBy: { date: 'asc' } },
      tariffs: true,
      appointments: {
        include: { patient: true, service: true },
        orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
        take: 20,
      },
    },
  });

  if (!professional) notFound();

  const initials = professional.name.split(' ').map((n) => n[0]).join('').slice(0, 2);

  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    CONFIRMED: { label: 'Confirmada', variant: 'default' },
    COMPLETED: { label: 'Completada', variant: 'secondary' },
    CANCELLED: { label: 'Cancelada', variant: 'destructive' },
    PENDING_PAYMENT: { label: 'Pendiente', variant: 'outline' },
  };

  return (
    <div>
      <LinkButton href="/admin/profesionales" variant="ghost" size="sm" className="mb-4 gap-1">
        <ArrowLeft className="h-4 w-4" />
        Profesionales
      </LinkButton>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        <DeleteProfessionalButton
          professionalId={professional.id}
          professionalName={professional.name}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="agenda" className="mt-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="disponibilidad">Disponibilidad</TabsTrigger>
          <TabsTrigger value="tarifas">Tarifas</TabsTrigger>
        </TabsList>

        {/* AGENDA */}
        <TabsContent value="agenda" className="mt-4 space-y-3">
          {professional.appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay citas registradas.</p>
          ) : (
            professional.appointments.map((apt) => {
              const statusInfo = statusLabels[apt.status] || { label: apt.status, variant: 'outline' as const };
              return (
                <Card key={apt.id} className="border-border/40">
                  <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-grape">
                          {apt.date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} • {apt.startTime}
                        </span>
                        <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
                      </div>
                      <p className="mt-1 text-sm font-medium">{apt.patient.fullName}</p>
                      <p className="text-xs text-muted-foreground">{apt.service.name}</p>
                    </div>
                    {apt.meetLink && (
                      <a href={apt.meetLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-grape hover:bg-plum/20">
                        <Video className="h-3.5 w-3.5" /> Meet
                      </a>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* DISPONIBILIDAD */}
        <TabsContent value="disponibilidad" className="mt-4 space-y-6">
          {/* Estado Google Calendar */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-grape">Google Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              {professional.googleCalendarConnected ? (
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-green-600" />
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Google Calendar conectado
                  </Badge>
                  {professional.googleEmail && (
                    <span className="text-sm text-muted-foreground">{professional.googleEmail}</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CalendarX className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary" className="text-muted-foreground">
                    Google Calendar no conectado
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Horario semanal (solo lectura) */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-grape">Horario semanal</CardTitle>
              <p className="text-xs text-muted-foreground">El profesional gestiona su propia disponibilidad</p>
            </CardHeader>
            <CardContent>
              {professional.availabilities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay horarios configurados.</p>
              ) : (
                <div className="space-y-2">
                  {professional.availabilities.map((slot) => (
                    <div key={slot.id} className="flex items-center rounded-lg border border-border/40 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{days[slot.dayOfWeek]}</Badge>
                        <span className="text-sm font-medium">{slot.startTime} - {slot.endTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TARIFAS */}
        <TabsContent value="tarifas" className="mt-4">
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-grape">Tarifas por servicio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {professional.tariffs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay tarifas configuradas.</p>
              ) : (
                professional.tariffs.map((tariff) => {
                  const netAmount = tariff.price - (tariff.price * tariff.commission) / 100;
                  const service = professional.services.find((s) => s.serviceId === tariff.serviceId);
                  return (
                    <div key={tariff.id} className="rounded-lg border border-border/40 p-4">
                      <p className="text-sm font-semibold text-grape">{service?.service.name || 'Servicio'}</p>
                      <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                        <div>
                          <span className="text-xs text-muted-foreground">Precio</span>
                          <p className="font-medium">${tariff.price.toLocaleString('es-CO')} COP</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Comisión</span>
                          <p className="font-medium">{tariff.commission}%</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Neto profesional</span>
                          <p className="font-semibold text-green-600">${netAmount.toLocaleString('es-CO')} COP</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
