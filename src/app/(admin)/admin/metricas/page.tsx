'use client';

import { useCallback, useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Users, Calendar as CalendarIcon, CalendarDays, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Professional {
  id: string;
  name: string;
}

interface SessionDetail {
  id: string;
  patient: string;
  professional: string;
  professionalId: string;
  date: string;
  service: string;
  amount: number;
  commission: number;
  payout: number;
}

interface MetricsData {
  totalSessions: number;
  totalRevenue: number;
  totalCommission: number;
  totalPayout: number;
  sessions: SessionDetail[];
}

const formatCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
});

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export default function MetricasPage() {
  const { start: defaultStart, end: defaultEnd } = getCurrentMonthRange();

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filterPro, setFilterPro] = useState('all');
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch professionals list
  useEffect(() => {
    fetch('/api/professionals')
      .then((r) => r.json())
      .then((data) => {
        setProfessionals(
          Array.isArray(data) ? data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })) : []
        );
      })
      .catch(() => {});
  }, []);

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ startDate, endDate });
      if (filterPro !== 'all') params.set('professionalId', filterPro);

      const res = await fetch(`/api/admin/metrics?${params}`);
      if (!res.ok) throw new Error('Error al cargar métricas');

      const data: MetricsData = await res.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, filterPro]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-grape sm:text-3xl">Métricas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ingresos, comisiones y detalle de sesiones realizadas
      </p>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 sm:max-w-56">
          <Label className="text-xs text-muted-foreground">Profesional</Label>
          <Select value={filterPro} onValueChange={(v) => v && setFilterPro(v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los profesionales</SelectItem>
              {professionals.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Desde</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Hasta</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="mt-8 flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-plum" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {!isLoading && !error && metrics && (
        <>
          {/* Stats cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/40">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <CalendarIcon className="h-5 w-5 text-grape" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sesiones</p>
                  <p className="text-xl font-bold text-grape">{metrics.totalSessions}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ingresos totales</p>
                  <p className="text-xl font-bold text-grape">{formatCOP.format(metrics.totalRevenue)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-jasmine/20">
                  <TrendingUp className="h-5 w-5 text-grape" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Comisión plataforma</p>
                  <p className="text-xl font-bold text-grape">{formatCOP.format(metrics.totalCommission)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-plum/20">
                  <Users className="h-5 w-5 text-grape" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">A pagar profesionales</p>
                  <p className="text-xl font-bold text-grape">{formatCOP.format(metrics.totalPayout)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Session history */}
          <Card className="mt-8 border-border/40">
            <CardHeader>
              <CardTitle className="text-base text-grape">Historial de sesiones</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.sessions.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No hay sesiones en este período
                </p>
              ) : (
                <div className="space-y-3">
                  {metrics.sessions.map((session) => (
                    <div key={session.id} className="rounded-lg border border-border/40 p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-grape">{session.patient}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(session.date)} • {session.service} • {session.professional}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="text-right">
                            <p className="text-muted-foreground">Cobrado</p>
                            <p className="font-semibold">{formatCOP.format(session.amount)}</p>
                          </div>
                          <Separator orientation="vertical" className="h-8" />
                          <div className="text-right">
                            <p className="text-muted-foreground">Comisión</p>
                            <p className="font-semibold text-grape">{formatCOP.format(session.commission)}</p>
                          </div>
                          <Separator orientation="vertical" className="h-8" />
                          <div className="text-right">
                            <p className="text-muted-foreground">Neto</p>
                            <p className="font-semibold text-green-600">{formatCOP.format(session.payout)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
