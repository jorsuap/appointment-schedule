'use client';

import { useEffect, useState } from 'react';
import { User, Heart, Shield, Calendar } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface PatientData {
  id: string;
  fullName: string;
  preferredName: string | null;
  email: string;
  dateOfBirth: string;
  country: string;
  isAdult: boolean;
  reasonForVisit: string | null;
  recentFeelings: string | null;
  selfHarmRisk: boolean;
  currentTreatment: boolean;
  previousDiagnosis: string | null;
  desiredOutcome: string | null;
  additionalNotes: string | null;
  informedConsent: boolean;
  emergencyName: string | null;
  emergencyRelation: string | null;
  emergencyPhone: string | null;
  emergencyCountry: string | null;
  dataPrivacyConsent: boolean;
  commsConsent: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AppointmentSummary {
  id: string;
  patientName: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  meetLink: string | null;
}

interface ProgressNoteEntry {
  id: string;
  content: string;
  appointmentId: string | null;
  createdAt: string;
}

interface PatientDetailResponse {
  patient: PatientData;
  appointments: AppointmentSummary[];
  progressNotes: ProgressNoteEntry[];
}

interface PatientDetailProps {
  patientId: string;
}

const statusLabels: Record<string, string> = {
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Completada',
  PENDING_PAYMENT: 'Pendiente',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Expirada',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CONFIRMED: 'default',
  COMPLETED: 'secondary',
  PENDING_PAYMENT: 'outline',
  CANCELLED: 'destructive',
  EXPIRED: 'outline',
};

/**
 * Patient detail component — readonly view for the professional portal.
 * Displays personal info, emotional assessment, emergency contact,
 * and appointment history with this professional.
 *
 * Validates: Requirements 8.2
 */
export function PatientDetail({ patientId }: PatientDetailProps) {
  const [data, setData] = useState<PatientDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPatientDetail() {
      try {
        const res = await fetch(`/api/professional/patients/${patientId}`);
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error('No tienes acceso a este paciente');
          }
          if (res.status === 404) {
            throw new Error('Paciente no encontrado');
          }
          throw new Error('Error al cargar los datos del paciente');
        }
        const json: PatientDetailResponse = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPatientDetail();
  }, [patientId]);

  if (isLoading) {
    return <PatientDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { patient, appointments } = data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-grape sm:text-2xl">
            {patient.fullName}
          </h2>
          <p className="text-sm text-muted-foreground">
            {patient.email} • {patient.country}
          </p>
        </div>
        {patient.selfHarmRisk && (
          <Badge variant="destructive">⚠️ Riesgo reportado</Badge>
        )}
      </div>

      {/* Personal Info */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-grape">
            <User className="h-4 w-4 text-plum" />
            Datos personales
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <InfoField label="Nombre completo" value={patient.fullName} />
          <InfoField label="Nombre preferido" value={patient.preferredName} />
          <InfoField label="Email" value={patient.email} />
          <InfoField
            label="Fecha de nacimiento"
            value={formatDate(patient.dateOfBirth)}
          />
          <InfoField label="País" value={patient.country} />
        </CardContent>
      </Card>

      {/* Emotional Assessment */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-grape">
            <Heart className="h-4 w-4 text-plum" />
            Evaluación emocional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground">¿Qué te trae por aquí?</p>
            <p className="mt-0.5 font-medium">
              {patient.reasonForVisit || '—'}
            </p>
          </div>
          <Separator />
          <div>
            <p className="text-muted-foreground">¿Cómo te has sentido?</p>
            <p className="mt-0.5 font-medium">
              {patient.recentFeelings || '—'}
            </p>
          </div>
          <Separator />
          <div>
            <p className="text-muted-foreground">Riesgo de autolesión:</p>
            <Badge
              variant={patient.selfHarmRisk ? 'destructive' : 'secondary'}
              className="mt-0.5"
            >
              {patient.selfHarmRisk ? 'Sí — requiere atención' : 'No'}
            </Badge>
          </div>
          <Separator />
          <div>
            <p className="text-muted-foreground">Tratamiento actual:</p>
            <p className="mt-0.5 font-medium">
              {patient.currentTreatment ? 'Sí' : 'No'}
            </p>
          </div>
          <Separator />
          <div>
            <p className="text-muted-foreground">Diagnóstico previo:</p>
            <p className="mt-0.5 font-medium">
              {patient.previousDiagnosis || '—'}
            </p>
          </div>
          <Separator />
          <div>
            <p className="text-muted-foreground">
              ¿Qué busca en el acompañamiento?
            </p>
            <p className="mt-0.5 font-medium">
              {patient.desiredOutcome || '—'}
            </p>
          </div>
          <Separator />
          <div>
            <p className="text-muted-foreground">Notas adicionales:</p>
            <p className="mt-0.5 font-medium">
              {patient.additionalNotes || '—'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-grape">
            <Shield className="h-4 w-4 text-plum" />
            Contacto de emergencia
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <InfoField label="Nombre" value={patient.emergencyName} />
          <InfoField label="Relación" value={patient.emergencyRelation} />
          <InfoField label="Teléfono" value={patient.emergencyPhone} />
          <InfoField label="País" value={patient.emergencyCountry} />
        </CardContent>
      </Card>

      {/* Appointment History */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base text-grape">
              <Calendar className="h-4 w-4 text-plum" />
              Historial de citas
            </CardTitle>
            <Badge className="bg-plum/20 text-grape hover:bg-plum/30">
              {appointments.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No hay citas registradas con este paciente
            </p>
          ) : (
            <div className="space-y-3">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex flex-col gap-2 rounded-lg bg-secondary/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-grape">
                      {formatDate(appt.date)} — {appt.startTime} hrs
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {appt.serviceName}
                    </p>
                  </div>
                  <Badge variant={statusVariants[appt.status] || 'outline'}>
                    {statusLabels[appt.status] || appt.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span>{' '}
      <span className="font-medium">{value || '—'}</span>
    </div>
  );
}

function PatientDetailSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>

      {/* Cards skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border-border/40">
          <CardHeader className="pb-3">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
