'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, DollarSign, Users, Calendar as CalendarIcon, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

// TODO: Fetch from database with real calculations
const metricsByProfessional = {
  all: {
    totalSessions: 30,
    totalRevenue: 2400000,
    totalCommission: 960000,
    totalPayout: 1440000,
  },
  '1': {
    totalSessions: 18,
    totalRevenue: 1440000,
    totalCommission: 576000,
    totalPayout: 864000,
  },
  '2': {
    totalSessions: 12,
    totalRevenue: 960000,
    totalCommission: 384000,
    totalPayout: 576000,
  },
};

const sessionHistory = [
  { id: '1', patient: 'María González', professional: 'Alejandra Moreno', professionalId: '1', date: '2026-07-10', service: 'Acompañamiento emocional', amount: 80000, commission: 32000, payout: 48000 },
  { id: '2', patient: 'Carlos Ruiz', professional: 'Carolina Jiménez', professionalId: '2', date: '2026-07-10', service: 'Acompañamiento maternidad posparto', amount: 90000, commission: 36000, payout: 54000 },
  { id: '3', patient: 'Ana Martínez', professional: 'Alejandra Moreno', professionalId: '1', date: '2026-07-08', service: 'Acompañamiento emocional', amount: 80000, commission: 32000, payout: 48000 },
  { id: '4', patient: 'Laura Sánchez', professional: 'Carolina Jiménez', professionalId: '2', date: '2026-07-07', service: 'Acompañamiento emocional', amount: 80000, commission: 32000, payout: 48000 },
  { id: '5', patient: 'Pedro López', professional: 'Alejandra Moreno', professionalId: '1', date: '2026-07-05', service: 'Acompañamiento emocional', amount: 80000, commission: 32000, payout: 48000 },
];

const professionals = [
  { id: 'all', name: 'Todos los profesionales' },
  { id: '1', name: 'Alejandra Moreno' },
  { id: '2', name: 'Carolina Jiménez' },
];

export default function MetricasPage() {
  const [filterPro, setFilterPro] = useState('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2026, 6, 1),
    to: new Date(2026, 6, 14),
  });
  const [showCalendar, setShowCalendar] = useState(false);

  const metrics = metricsByProfessional[filterPro as keyof typeof metricsByProfessional] || metricsByProfessional.all;

  const filteredHistory = filterPro === 'all'
    ? sessionHistory
    : sessionHistory.filter((s) => s.professionalId === filterPro);

  const dateLabel = dateRange.from && dateRange.to
    ? `${format(dateRange.from, 'd MMM', { locale: es })} — ${format(dateRange.to, 'd MMM yyyy', { locale: es })}`
    : 'Seleccionar rango';

  return (
    <div>
      <h1 className="text-2xl font-bold text-grape sm:text-3xl">Métricas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ingresos, comisiones y detalle de sesiones realizadas
      </p>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Select value={filterPro} onValueChange={(v) => v && setFilterPro(v)}>
          <SelectTrigger className="h-10 w-full text-sm sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {professionals.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range picker */}
        <div className="relative">
          <Button
            variant="outline"
            className="h-10 w-full justify-start gap-2 text-sm font-normal sm:w-64"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {dateLabel}
          </Button>

          {showCalendar && (
            <div className="absolute z-50 mt-1 rounded-xl border border-border bg-white p-3 shadow-lg">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  if (range) {
                    setDateRange({ from: range.from, to: range.to });
                    if (range.from && range.to) {
                      setShowCalendar(false);
                    }
                  }
                }}
                numberOfMonths={1}
                className="rounded-lg"
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateRange({ from: undefined, to: undefined });
                  }}
                >
                  Limpiar
                </Button>
                <Button size="sm" onClick={() => setShowCalendar(false)}>
                  Aplicar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

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
              <p className="text-xl font-bold text-grape">${metrics.totalRevenue.toLocaleString('es-CO')}</p>
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
              <p className="text-xl font-bold text-grape">${metrics.totalCommission.toLocaleString('es-CO')}</p>
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
              <p className="text-xl font-bold text-grape">${metrics.totalPayout.toLocaleString('es-CO')}</p>
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
          <div className="space-y-3">
            {filteredHistory.map((session) => (
              <div
                key={session.id}
                className="rounded-lg border border-border/40 p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-grape">{session.patient}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.date} • {session.service} • {session.professional}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="text-right">
                      <p className="text-muted-foreground">Cobrado</p>
                      <p className="font-semibold">${session.amount.toLocaleString('es-CO')}</p>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div className="text-right">
                      <p className="text-muted-foreground">Comisión</p>
                      <p className="font-semibold text-grape">${session.commission.toLocaleString('es-CO')}</p>
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div className="text-right">
                      <p className="text-muted-foreground">Neto</p>
                      <p className="font-semibold text-green-600">${session.payout.toLocaleString('es-CO')}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
