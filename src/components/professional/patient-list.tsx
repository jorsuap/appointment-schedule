'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// --- Types ---

interface PatientSummary {
  id: string;
  fullName: string;
  preferredName: string | null;
  email: string;
  lastAppointmentDate: string | null;
  totalAppointments: number;
}

// --- Component ---

/**
 * Patient list component for the professional portal.
 * Displays a searchable list/table of patients with links to individual profiles.
 * Mobile-first: card-based on mobile, table-like on desktop.
 *
 * Validates: Requirements 8.1
 */
export function PatientList() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchPatients() {
      try {
        const res = await fetch('/api/professional/patients');
        if (!res.ok) {
          throw new Error('Error al cargar los pacientes');
        }
        const json = await res.json();
        setPatients(json.patients ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPatients();
  }, []);

  // Client-side filtering by fullName or email
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const query = searchQuery.toLowerCase().trim();
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query)
    );
  }, [patients, searchQuery]);

  if (isLoading) {
    return <PatientListSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-grape sm:text-3xl">
          Pacientes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona las fichas de tus pacientes
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-10 text-base"
              aria-label="Buscar pacientes"
            />
          </div>
        </CardContent>
      </Card>

      {/* Empty state */}
      {patients.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              No tienes pacientes registrados
            </p>
          </CardContent>
        </Card>
      )}

      {/* No search results */}
      {patients.length > 0 && filteredPatients.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Search className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              No se encontraron pacientes para &quot;{searchQuery}&quot;
            </p>
          </CardContent>
        </Card>
      )}

      {/* Patient list */}
      {filteredPatients.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-grape">
                <Users className="h-5 w-5 text-plum" />
                Mis pacientes
              </CardTitle>
              <Badge className="bg-plum/20 text-grape hover:bg-plum/30">
                {filteredPatients.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop table-like header (hidden on mobile) */}
            <div className="mb-2 hidden grid-cols-[1fr_1fr_auto_auto_32px] items-center gap-4 border-b border-border/40 px-3 py-2 text-xs font-medium text-muted-foreground lg:grid">
              <span>Nombre</span>
              <span>Email</span>
              <span>Última cita</span>
              <span>Sesiones</span>
              <span />
            </div>

            {/* Patient rows */}
            <ul className="space-y-2 lg:space-y-1">
              {filteredPatients.map((patient) => (
                <li key={patient.id}>
                  <Link
                    href={`/profesional/pacientes/${patient.id}`}
                    className="group flex min-h-[44px] items-center gap-3 rounded-lg bg-secondary/50 px-3 py-3 transition-colors hover:bg-secondary lg:grid lg:grid-cols-[1fr_1fr_auto_auto_32px] lg:gap-4 lg:rounded-md lg:py-2"
                  >
                    {/* Mobile: stacked layout / Desktop: grid row */}
                    <div className="min-w-0 flex-1 lg:contents">
                      {/* Name */}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground group-hover:text-grape">
                          {patient.fullName}
                        </p>
                        {patient.preferredName && (
                          <p className="truncate text-xs text-muted-foreground lg:hidden">
                            &quot;{patient.preferredName}&quot;
                          </p>
                        )}
                        {/* Mobile: email below name */}
                        <p className="truncate text-xs text-muted-foreground lg:hidden">
                          {patient.email}
                        </p>
                      </div>

                      {/* Desktop: email column */}
                      <p className="hidden truncate text-sm text-muted-foreground lg:block">
                        {patient.email}
                      </p>

                      {/* Mobile: meta row */}
                      <div className="mt-1 flex items-center gap-2 lg:hidden">
                        {patient.lastAppointmentDate && (
                          <span className="text-xs text-muted-foreground">
                            Última: {formatDate(patient.lastAppointmentDate)}
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className="border-plum/30 text-[10px] text-grape"
                        >
                          {patient.totalAppointments}{' '}
                          {patient.totalAppointments === 1
                            ? 'sesión'
                            : 'sesiones'}
                        </Badge>
                      </div>

                      {/* Desktop: last appointment column */}
                      <span className="hidden whitespace-nowrap text-sm text-muted-foreground lg:block">
                        {patient.lastAppointmentDate
                          ? formatDate(patient.lastAppointmentDate)
                          : '—'}
                      </span>

                      {/* Desktop: total appointments column */}
                      <Badge
                        variant="outline"
                        className="hidden border-plum/30 text-xs text-grape lg:inline-flex"
                      >
                        {patient.totalAppointments}
                      </Badge>
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-grape" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Skeleton ---

function PatientListSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="h-11 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-[44px] animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Helpers ---

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
