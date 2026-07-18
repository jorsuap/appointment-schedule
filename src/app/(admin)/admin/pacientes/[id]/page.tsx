'use client';

import { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { LinkButton } from '@/components/ui/link-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

// TODO: Fetch from database by patient ID
const patient = {
  id: '1',
  fullName: 'María González',
  preferredName: 'Mari',
  email: 'maria@email.com',
  dateOfBirth: '1995-03-15',
  country: 'Colombia',
  isAdult: true,
  reasonForVisit: 'Me siento ansiosa y con dificultad para dormir desde hace un mes.',
  recentFeelings: 'Me he sentido abrumada, con pensamientos acelerados y poca energía.',
  selfHarmRisk: false,
  currentTreatment: false,
  previousDiagnosis: 'Ninguno',
  desiredOutcome: 'Entender mejor lo que me pasa',
  additionalNotes: 'Prefiero sesiones en la mañana.',
  emergencyName: 'Pedro González',
  emergencyRelation: 'Pareja',
  emergencyPhone: '3001234567',
  emergencyCountry: 'Colombia',
};

const appointments = [
  { id: '1', date: '2026-07-10', time: '09:00', status: 'COMPLETED', professional: 'Alejandra Moreno' },
  { id: '2', date: '2026-07-03', time: '09:00', status: 'COMPLETED', professional: 'Alejandra Moreno' },
  { id: '3', date: '2026-06-26', time: '10:00', status: 'COMPLETED', professional: 'Alejandra Moreno' },
];

const progressNotes = [
  { id: '1', date: '2026-07-10', content: 'Paciente reporta mejoría en patrón de sueño. Trabajamos técnica de respiración 4-7-8. Tarea: registrar calidad de sueño durante la semana.' },
  { id: '2', date: '2026-07-03', content: 'Identificamos gatillos principales de ansiedad: carga laboral y comunicación con pareja. Se introduce técnica de journaling.' },
  { id: '3', date: '2026-06-26', content: 'Primera sesión. Rapport establecido. Paciente expresa sentirse abrumada por cambios recientes en su trabajo. Se establece plan de acompañamiento inicial.' },
];

export default function PacienteDetailPage() {
  const [newNote, setNewNote] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);

  function handleSaveNote() {
    if (!newNote.trim()) return;
    // TODO: Save to database
    console.log('Saving note:', newNote);
    setNewNote('');
    setShowNoteForm(false);
  }

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
        {patient.selfHarmRisk && (
          <Badge variant="destructive">⚠️ Riesgo reportado</Badge>
        )}
      </div>

      <Tabs defaultValue="ficha" className="mt-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="ficha">Ficha</TabsTrigger>
          <TabsTrigger value="citas">Citas ({appointments.length})</TabsTrigger>
        </TabsList>

        {/* Ficha del paciente */}
        <TabsContent value="ficha" className="mt-4 space-y-4">
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-grape">Datos personales</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Nombre preferido:</span>{' '}
                <span className="font-medium">{patient.preferredName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Fecha de nacimiento:</span>{' '}
                <span className="font-medium">{patient.dateOfBirth}</span>
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
                <p className="mt-0.5 font-medium">{patient.reasonForVisit}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">¿Cómo te has sentido?</p>
                <p className="mt-0.5 font-medium">{patient.recentFeelings}</p>
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
                <p className="mt-0.5 font-medium">{patient.previousDiagnosis}</p>
              </div>
              <div>
                <p className="text-muted-foreground">¿Qué busca en el acompañamiento?</p>
                <p className="mt-0.5 font-medium">{patient.desiredOutcome}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Notas adicionales:</p>
                <p className="mt-0.5 font-medium">{patient.additionalNotes}</p>
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
                <span className="font-medium">{patient.emergencyName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Relación:</span>{' '}
                <span className="font-medium">{patient.emergencyRelation}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Teléfono:</span>{' '}
                <span className="font-medium">{patient.emergencyPhone}</span>
              </div>
              <div>
                <span className="text-muted-foreground">País:</span>{' '}
                <span className="font-medium">{patient.emergencyCountry}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notas de progreso — dentro de la ficha */}
          <Card className="border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base text-grape">
                Notas de progreso (HC)
              </CardTitle>
              {!showNoteForm && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={() => setShowNoteForm(true)}
                >
                  <Plus className="h-3 w-3" />
                  Agregar nota
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Form to add new note */}
              {showNoteForm && (
                <div className="rounded-lg border border-plum/30 bg-secondary/30 p-3">
                  <Textarea
                    placeholder="Escribe tu nota de progreso..."
                    className="min-h-[100px] border-0 bg-transparent text-sm focus-visible:ring-0"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    autoFocus
                  />
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={handleSaveNote} disabled={!newNote.trim()}>
                      Guardar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowNoteForm(false);
                        setNewNote('');
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Existing notes */}
              {progressNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no hay notas de progreso registradas.
                </p>
              ) : (
                progressNotes.map((note) => (
                  <div key={note.id} className="rounded-lg border border-border/40 p-3">
                    <p className="text-[11px] font-medium text-plum">{note.date}</p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground">{note.content}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historial de citas */}
        <TabsContent value="citas" className="mt-4">
          <div className="space-y-3">
            {appointments.map((apt) => (
              <Card key={apt.id} className="border-border/40">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-grape">{apt.date} — {apt.time} hrs</p>
                    <p className="text-xs text-muted-foreground">{apt.professional}</p>
                  </div>
                  <Badge variant="secondary">{apt.status === 'COMPLETED' ? 'Completada' : apt.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
