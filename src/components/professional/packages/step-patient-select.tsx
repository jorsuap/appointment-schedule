'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface EligiblePatient {
  id: string;
  fullName: string;
  email: string;
  lastAppointmentDate: string | null;
  totalAppointments: number;
}

interface StepPatientSelectProps {
  selectedPatientId?: string;
  onSelect: (patientId: string, patientName?: string) => void;
}

/**
 * Step 1 of the package wizard — Patient selection.
 * Fetches eligible patients (those with at least 1 CONFIRMED/COMPLETED appointment)
 * from GET /api/professional/patients and renders a searchable list.
 *
 * Validates: Requirements 1.1, 1.3
 */
export function StepPatientSelect({
  selectedPatientId,
  onSelect,
}: StepPatientSelectProps) {
  const [patients, setPatients] = useState<EligiblePatient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPatients() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/professional/patients?eligible=packages');
        if (!res.ok) {
          throw new Error('Error al cargar pacientes');
        }
        const data = await res.json();
        setPatients(data.patients ?? []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error al cargar pacientes',
        );
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    if (!search.trim()) return patients;
    const term = search.toLowerCase().trim();
    return patients.filter((p) => p.fullName.toLowerCase().includes(term));
  }, [patients, search]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sin citas';
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-plum border-t-grape" />
          <p className="text-sm text-muted-foreground">
            Cargando pacientes...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar paciente por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-base"
        />
      </div>

      {/* Patient list */}
      <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
        {filteredPatients.length === 0 ? (
          <div className="flex min-h-[120px] items-center justify-center rounded-lg border-2 border-dashed border-plum/20 p-4">
            <p className="text-sm text-muted-foreground">
              {search.trim()
                ? 'No se encontraron pacientes con ese nombre'
                : 'No hay pacientes elegibles'}
            </p>
          </div>
        ) : (
          filteredPatients.map((patient) => {
            const isSelected = patient.id === selectedPatientId;
            return (
              <Card
                key={patient.id}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'border-grape bg-plum/10 ring-2 ring-grape/30'
                    : 'hover:border-plum/50 hover:bg-plum/5'
                }`}
                onClick={() => onSelect(patient.id, patient.fullName)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(patient.id, patient.fullName);
                  }
                }}
                aria-pressed={isSelected}
                aria-label={`Seleccionar paciente ${patient.fullName}`}
              >
                <CardContent className="flex min-h-[44px] items-center gap-3 py-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      isSelected ? 'bg-grape text-white' : 'bg-plum/20 text-grape'
                    }`}
                  >
                    <User className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-semibold ${
                        isSelected ? 'text-grape' : 'text-foreground'
                      }`}
                    >
                      {patient.fullName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {patient.email}
                    </p>
                  </div>

                  <Badge
                    className={`shrink-0 text-[10px] ${
                      isSelected
                        ? 'bg-grape/20 text-grape'
                        : 'bg-plum/15 text-grape/80'
                    }`}
                  >
                    {formatDate(patient.lastAppointmentDate)}
                  </Badge>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Selection summary */}
      {selectedPatientId && (
        <p className="text-center text-xs text-grape">
          Paciente seleccionado ✓
        </p>
      )}
    </div>
  );
}
