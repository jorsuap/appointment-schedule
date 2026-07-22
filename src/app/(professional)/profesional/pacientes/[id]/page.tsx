'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';

import { PatientDetail } from '@/components/professional/patient-detail';
import { ProgressNoteForm } from '@/components/professional/progress-note-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Appointment {
  id: string;
  date: string;
  serviceName: string;
}

interface ProgressNoteEntry {
  id: string;
  content: string;
  appointmentId: string | null;
  createdAt: string;
}

/**
 * Patient detail page for the professional portal.
 * Renders PatientDetail (readonly info + appointment history),
 * ProgressNoteForm (add notes), and a list of existing progress notes.
 *
 * Validates: Requirements 8.2, 8.3
 */
export default function PacienteDetailPage() {
  const params = useParams();
  const patientId = params.id as string;

  const [notes, setNotes] = useState<ProgressNoteEntry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/professional/patients/${patientId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes ?? []);
      }
    } catch {
      // Silent fail — notes are supplementary
    }
  }, [patientId]);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch(`/api/professional/patients/${patientId}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(
          (data.appointments ?? []).map((a: { id: string; date: string; serviceName: string }) => ({
            id: a.id,
            date: a.date,
            serviceName: a.serviceName,
          }))
        );
      }
    } catch {
      // Silent fail
    }
  }, [patientId]);

  useEffect(() => {
    async function loadData() {
      setIsLoadingNotes(true);
      await Promise.all([fetchNotes(), fetchAppointments()]);
      setIsLoadingNotes(false);
    }
    loadData();
  }, [fetchNotes, fetchAppointments]);

  const handleNoteAdded = useCallback(() => {
    fetchNotes();
  }, [fetchNotes]);

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link
        href="/profesional/pacientes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-grape"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a pacientes
      </Link>

      {/* Patient detail (readonly info + appointment history) */}
      <PatientDetail patientId={patientId} />

      <Separator />

      {/* Progress Notes Section */}
      <section className="space-y-4">
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base text-grape">
                <FileText className="h-4 w-4 text-plum" />
                Notas de progreso
              </CardTitle>
              <Badge className="bg-plum/20 text-grape hover:bg-plum/30">
                {notes.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add note form */}
            <ProgressNoteForm
              patientId={patientId}
              appointments={appointments}
              onNoteAdded={handleNoteAdded}
            />

            {/* Notes list */}
            {isLoadingNotes ? (
              <NotesSkeleton />
            ) : notes.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No hay notas de progreso registradas
              </p>
            ) : (
              <div className="space-y-3 pt-4">
                <Separator />
                <h4 className="text-sm font-medium text-grape">Notas anteriores</h4>
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-lg bg-secondary/50 p-3"
                  >
                    <p className="whitespace-pre-wrap text-sm">{note.content}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDate(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function NotesSkeleton() {
  return (
    <div className="space-y-3 pt-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg bg-muted/50 p-3">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
