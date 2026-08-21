'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, Repeat, AlertCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { Frequency } from '@/lib/packages/session-scheduler';

interface StepScheduleProps {
  startDate: string;
  startTime: string;
  frequency: Frequency;
  sessionCount: number;
  serviceId: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onFrequencyChange: (frequency: Frequency) => void;
}

const FREQUENCY_OPTIONS: { value: Frequency; label: string; days: number }[] = [
  { value: 'weekly', label: 'Semanal (cada 7 días)', days: 7 },
  { value: 'biweekly', label: 'Quincenal (cada 15 días)', days: 15 },
  { value: 'monthly', label: 'Mensual (cada 30 días)', days: 30 },
];

const FREQUENCY_DAYS: Record<Frequency, number> = {
  weekly: 7,
  biweekly: 15,
  monthly: 30,
};

function calculatePreviewDates(
  startDate: string,
  sessionCount: number,
  frequency: Frequency,
): string[] {
  if (!startDate || sessionCount < 1) return [];

  const intervalDays = FREQUENCY_DAYS[frequency];
  const dates: string[] = [];
  const start = new Date(startDate + 'T12:00:00');

  for (let i = 0; i < sessionCount; i++) {
    const d = new Date(start.getTime());
    d.setDate(d.getDate() + i * intervalDays);
    dates.push(d.toISOString().split('T')[0]);
  }

  return dates;
}

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/**
 * Step 3 of the package wizard — Schedule configuration with real availability.
 * Fetches available slots from /api/professional/availability/slots.
 * Shows only dates with availability and time slots for the selected date.
 *
 * Validates: Requirements 3.1, 3.6
 */
export function StepSchedule({
  startDate,
  startTime,
  frequency,
  sessionCount,
  serviceId,
  onDateChange,
  onTimeChange,
  onFrequencyChange,
}: StepScheduleProps) {
  const [slots, setSlots] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch availability on mount
  useEffect(() => {
    if (!serviceId) return;

    async function fetchSlots() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/professional/availability/slots?serviceId=${serviceId}`,
        );
        if (!res.ok) throw new Error('Error al cargar disponibilidad');
        const data = await res.json();
        setSlots(data.slots ?? {});
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error al cargar disponibilidad',
        );
      } finally {
        setLoading(false);
      }
    }

    fetchSlots();
  }, [serviceId]);

  // Available dates (keys of slots object)
  const availableDates = useMemo(() => Object.keys(slots).sort(), [slots]);

  // Time slots for the selected date
  const timeSlots = useMemo(
    () => (startDate && slots[startDate]) || [],
    [startDate, slots],
  );

  // Preview of all session dates
  const previewDates = useMemo(
    () => calculatePreviewDates(startDate, sessionCount, frequency),
    [startDate, sessionCount, frequency],
  );

  // Check which preview dates have availability at the selected time
  const dateAvailability = useMemo(() => {
    return previewDates.map((dateStr) => {
      const daySlots = slots[dateStr];
      if (!daySlots) return { date: dateStr, available: false, reason: 'Sin disponibilidad' };
      if (!startTime) return { date: dateStr, available: true, reason: '' };
      if (!daySlots.includes(startTime))
        return { date: dateStr, available: false, reason: 'Hora ocupada' };
      return { date: dateStr, available: true, reason: '' };
    });
  }, [previewDates, slots, startTime]);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-plum border-t-grape" />
          <p className="text-sm text-muted-foreground">
            Cargando disponibilidad...
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

  if (availableDates.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-plum/20 p-6">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No hay disponibilidad configurada. Configura tu horario en la sección
          de Disponibilidad.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Date selection */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-grape">
          <CalendarDays className="h-4 w-4 text-plum" />
          Fecha de inicio
        </label>
        <Select value={startDate} onValueChange={(v) => { if (v) onDateChange(v); }}>
          <SelectTrigger className="text-base">
            <SelectValue placeholder="Selecciona una fecha disponible" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {availableDates.map((dateStr) => {
              const d = new Date(dateStr + 'T12:00:00');
              return (
                <SelectItem key={dateStr} value={dateStr} className="text-sm">
                  {dateFormatter.format(d)} ({slots[dateStr].length} horarios)
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Time selection — only show when date is selected */}
      {startDate && timeSlots.length > 0 && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-grape">
            <Clock className="h-4 w-4 text-plum" />
            Hora de la sesión
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {timeSlots.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => onTimeChange(time)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                  startTime === time
                    ? 'border-grape bg-grape text-white'
                    : 'border-border bg-white text-foreground hover:border-plum hover:bg-plum/5'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}

      {startDate && timeSlots.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay horarios disponibles para esta fecha.
        </p>
      )}

      {/* Frequency */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-grape">
          <Repeat className="h-4 w-4 text-plum" />
          Frecuencia
        </label>
        <Select
          value={frequency}
          onValueChange={(v) => {
            if (v) onFrequencyChange(v as Frequency);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FREQUENCY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Preview of scheduled dates with availability check */}
      {startDate && startTime && dateAvailability.length > 0 && (
        <Card className="border-plum/30 bg-plum/5">
          <CardContent className="p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-grape/70">
              Sesiones programadas ({dateAvailability.length})
            </p>

            <div className="max-h-[240px] space-y-1.5 overflow-y-auto pr-1">
              {dateAvailability.map((item, idx) => {
                const d = new Date(item.date + 'T12:00:00');
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 ${
                      item.available ? 'bg-white/60' : 'bg-red-50'
                    }`}
                  >
                    <Badge
                      className={`shrink-0 ${
                        item.available
                          ? 'bg-grape/10 text-grape hover:bg-grape/10'
                          : 'bg-red-100 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      {idx + 1}
                    </Badge>
                    <span className="text-sm text-foreground">
                      {dateFormatter.format(d)}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {startTime}
                    </span>
                    {!item.available && (
                      <Badge className="bg-red-100 text-[10px] text-red-600 hover:bg-red-100">
                        {item.reason}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {dateAvailability.some((d) => !d.available) && (
              <p className="mt-3 flex items-center gap-1 text-xs text-amber-600">
                <AlertCircle className="h-3 w-3" />
                Algunas sesiones tienen conflictos. Considera cambiar la frecuencia o la hora.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!startDate && (
        <p className="text-center text-xs text-muted-foreground">
          Selecciona una fecha para ver los horarios disponibles
        </p>
      )}
    </div>
  );
}
