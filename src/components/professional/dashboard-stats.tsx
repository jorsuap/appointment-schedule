'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Clock, DollarSign, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

interface DashboardResponse {
  todayAppointments: AppointmentSummary[];
  upcomingAppointments: AppointmentSummary[];
  monthlyIncome: {
    totalBilled: number;
    commission: number;
    netIncome: number;
  };
}

const formatCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
});

/**
 * Dashboard stats component for the professional portal.
 * Displays today's appointments, upcoming appointments (max 5),
 * and monthly income summary.
 *
 * Validates: Requirements 2.1, 2.2, 2.3
 */
export function DashboardStats() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/professional/dashboard');
        if (!res.ok) {
          throw new Error('Error al cargar el dashboard');
        }
        const json: DashboardResponse = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Citas de hoy */}
      <Card className="sm:col-span-2 lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-grape">
              <CalendarDays className="h-5 w-5 text-plum" />
              Citas de hoy
            </CardTitle>
            <Badge className="bg-plum/20 text-grape hover:bg-plum/30">
              {data.todayAppointments.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {data.todayAppointments.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No tienes citas hoy
            </p>
          ) : (
            <ul className="space-y-3">
              {data.todayAppointments.map((appt) => (
                <li
                  key={appt.id}
                  className="flex min-h-11 items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2"
                >
                  <Clock className="h-4 w-4 shrink-0 text-plum" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {appt.patientName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {appt.startTime} – {appt.endTime}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Próximas citas */}
      <Card className="sm:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-grape">
            <Clock className="h-5 w-5 text-plum" />
            Próximas citas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.upcomingAppointments.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No tienes citas próximas
            </p>
          ) : (
            <ul className="space-y-3">
              {data.upcomingAppointments.map((appt) => (
                <li
                  key={appt.id}
                  className="flex min-h-11 items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2"
                >
                  <CalendarDays className="h-4 w-4 shrink-0 text-plum" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {appt.patientName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(appt.date)} • {appt.startTime} – {appt.endTime}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Ingresos del mes */}
      <Card className="sm:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-grape">
            <TrendingUp className="h-5 w-5 text-plum" />
            Ingresos del mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex min-h-11 items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4 text-plum" />
                Total Facturado
              </span>
              <span className="text-sm font-semibold">
                {formatCOP.format(data.monthlyIncome.totalBilled)}
              </span>
            </div>

            <div className="flex min-h-11 items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4 text-plum" />
                Comisión
              </span>
              <span className="text-sm font-semibold text-destructive">
                -{formatCOP.format(data.monthlyIncome.commission)}
              </span>
            </div>

            <div className="flex min-h-11 items-center justify-between rounded-lg border border-plum/30 bg-plum/10 px-3 py-2">
              <span className="flex items-center gap-2 text-sm font-medium text-grape">
                <TrendingUp className="h-4 w-4 text-grape" />
                Neto a Recibir
              </span>
              <span className="text-base font-bold text-grape">
                {formatCOP.format(data.monthlyIncome.netIncome)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className={i < 3 ? 'sm:col-span-2 lg:col-span-1' : 'sm:col-span-2 lg:col-span-1'}>
          <CardHeader>
            <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-11 animate-pulse rounded-lg bg-muted" />
              <div className="h-11 animate-pulse rounded-lg bg-muted" />
              <div className="h-11 animate-pulse rounded-lg bg-muted" />
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
    month: 'short',
  });
}
