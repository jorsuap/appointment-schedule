import { notFound } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { LinkButton } from '@/components/ui/link-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { prisma } from '@/lib/prisma';
import { AddNoteForm } from './add-note-form';

export const dynamic = 'force-dynamic';

export default async function PacienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        include: { professional: true, service: true },
        orderBy: { date: 'desc' },
      },
      progressNotes: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!patient) notFound();

  return (
    <div>
      <LinkButton href="/admin/pacientes" variant="ghost" size="sm" className="mb-4 gap-1">
        <ArrowLeft className="h-4 w-4" />
        Volver a pacientes
      </LinkButton>

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-grape">{patient.fullName}</h1>
          <p className="text-sm text-muted-foreground">
            {patient.email} • {patient.country}
          </p>
        </div>
        {patient.selfHarmRisk && <Badge variant="destructive">⚠️ Riesgo reportado</Badge>}
      </div>

      <Tabs defaultValue="ficha" className="mt-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="ficha">Ficha</TabsTrigger>
          <TabsTrigger value="citas">Citas ({patient.appointments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="ficha" className="mt-4 space-y-4">
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-grape">Datos personales</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Nombre preferido:</span>{' '}
                <span className="font-medium">{patient.preferredName || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Fecha de nacimiento:</span>{' '}
                <span className="font-medium">
                  {patient.dateOfBirth.toLocaleDateString('es-CO')}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">País:</span>{' '}
                <span className="font-medium">{patient.country}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Mayor de edad:</span>{' '}
                <span className="font-medium">{patient.isAdult ? 'Sí' : 'No'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-grape">Evaluación emocional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">¿Qué te trae por aquí?</p>
                <p className="mt-0.5 font-medium">{patient.reasonForVisit || '—'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">¿Cómo te has sentido?</p>
                <p className="mt-0.5 font-medium">{patient.recentFeelings || '—'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">Riesgo de autolesión:</p>
                <Badge variant={patient.selfHarmRisk ? 'destructive' : 'secondary'} className="mt-0.5">
                  {patient.selfHarmRisk ? 'Sí — requiere atención' : 'No'}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">Tratamiento actual:</p>
                <p className="mt-0.5 font-medium">{patient.currentTreatment ? 'Sí' : 'No'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Diagnóstico previo:</p>
                <p className="mt-0.5 font-medium">{patient.previousDiagnosis || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">¿Qué busca en el acompañamiento?</p>
                <p className="mt-0.5 font-medium">{patient.desiredOutcome || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Notas adicionales:</p>
                <p className="mt-0.5 font-medium">{patient.additionalNotes || '—'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-grape">Contacto de emergencia</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Nombre:</span>{' '}
                <span className="font-medium">{patient.emergencyName || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Relación:</span>{' '}
                <span className="font-medium">{patient.emergencyRelation || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Teléfono:</span>{' '}
                <span className="font-medium">{patient.emergencyPhone || '—'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">País:</span>{' '}
                <span className="font-medium">{patient.emergencyCountry || '—'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Progress Notes */}
          <Card className="border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base text-grape">Notas de progreso (HC)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <AddNoteForm patientId={patient.id} />

              {patient.progressNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no hay notas de progreso registradas.
                </p>
              ) : (
                patient.progressNotes.map((note) => (
                  <div key={note.id} className="rounded-lg border border-border/40 p-3">
                    <p className="text-[11px] font-medium text-plum">
                      {note.createdAt.toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground">{note.content}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Citas */}
        <TabsContent value="citas" className="mt-4">
          <div className="space-y-3">
            {patient.appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay citas registradas.</p>
            ) : (
              patient.appointments.map((apt) => (
                <Card key={apt.id} className="border-border/40">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-grape">
                        {apt.date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })} — {apt.startTime} hrs
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {apt.service.name} • {apt.professional.name}
                      </p>
                    </div>
                    <Badge variant={apt.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                      {apt.status === 'CONFIRMED' ? 'Confirmada' : apt.status === 'COMPLETED' ? 'Completada' : apt.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
