'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, Repeat, AlertCircle, Pencil } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
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
  sessionTimeOverrides: Record<number, string>;
  sessionDateOverrides: Record<number, string>;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onFrequencyChange: (frequency: Frequency) => void;
  onSessionTimeOverride: (sessionIndex: number, time: string) => void;
  onSessionDateOverride: (sessionIndex: number, date: string) => void;
  onAvailabilityChange?: (allAvailable: boolean) => void;
}

const FREQUENCY_OPTIONS: { value: Frequency; label: string; days: number }[] = [
  { value: 'weekly', label: 'Semanal (cada 7 días)', days: 7 },
  { value: 'biweekly', label: 'Quincenal (cada 2 semanas)', days: 14 },
  { value: 'monthly', label: 'Mensual (cada 4 semanas)', days: 28 },
];

const FREQUENCY_DAYS: Record<Frequency, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 28,
};

/**
 * Calcula las fechas base del paquete por frecuencia (sin overrides).
 */
function calculateBaseDates(
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
    dates.push(toLocalDateStr(d));
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
 * Format a Date to YYYY-MM-DD in local timezone (avoids UTC shift issues).
 */
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Step 3 — Schedule with calendar date picker and real availability.
 * Each session can be individually edited (date + time) via its pencil,
 * independently and without cascade. Overrides are reported to the parent.
 */
export function StepSchedule({
  startDate,
  startTime,
  frequency,
  sessionCount,
  serviceId,
  sessionTimeOverrides,
  sessionDateOverrides,
  onDateChange,
  onTimeChange,
  onFrequencyChange,
  onSessionTimeOverride,
  onSessionDateOverride,
  onAvailabilityChange,
}: StepScheduleProps) {
  const [slots, setSlots] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<number | null>(null);

  useEffect(() => {
    if (!serviceId) return;
    async function fetchSlots() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/professional/availability/slots?serviceId=${serviceId}`);
        if (!res.ok) throw new Error('Error al cargar disponibilidad');
        const data = await res.json();
        setSlots(data.slots ?? {});
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar disponibilidad');
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, [serviceId]);

  // Set of available date strings for quick lookup
  const availableDateSet = useMemo(() => new Set(Object.keys(slots)), [slots]);

  // Convert selected date string to Date for Calendar
  const selectedDate = useMemo(
    () => (startDate ? new Date(startDate + 'T12:00:00') : undefined),
    [startDate],
  );

  // Time slots for the selected date
  const timeSlots = useMemo(() => (startDate && slots[startDate]) || [], [startDate, slots]);

  // Base dates by frequency
  const baseDates = useMemo(
    () => calculateBaseDates(startDate, sessionCount, frequency),
    [startDate, sessionCount, frequency],
  );

  // Effective session date/time per session (applying overrides).
  const sessions = useMemo(() => {
    return baseDates.map((baseDate, idx) => {
      const date = sessionDateOverrides[idx] || baseDate;
      const time = sessionTimeOverrides[idx] || startTime;
      const daySlots = slots[date];
      const hasDateOverride = sessionDateOverrides[idx] !== undefined;
      const hasTimeOverride = sessionTimeOverrides[idx] !== undefined;

      let available: boolean;
      let reason: string;
      if (!daySlots) {
        available = false;
        reason = 'Sin disponibilidad';
      } else if (!time) {
        available = true;
        reason = '';
      } else if (!daySlots.includes(time)) {
        available = false;
        reason = 'Hora ocupada';
      } else {
        available = true;
        reason = '';
      }
      return { date, time, available, reason, hasDateOverride, hasTimeOverride };
    });
  }, [baseDates, slots, startTime, sessionTimeOverrides, sessionDateOverrides]);

  const allSessionsAvailable = sessions.length > 0 && sessions.every((s) => s.available);
  useEffect(() => {
    onAvailabilityChange?.(allSessionsAvailable);
  }, [allSessionsAvailable, onAvailabilityChange]);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="border-plum border-t-grape h-6 w-6 animate-spin rounded-full border-2" />
          <p className="text-muted-foreground text-sm">Cargando disponibilidad...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  if (availableDateSet.size === 0) {
    return (
      <div className="border-plum/20 flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6">
        <AlertCircle className="text-muted-foreground h-8 w-8" />
        <p className="text-muted-foreground text-sm">
          No hay disponibilidad configurada. Configura tu horario en Disponibilidad.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Calendar date picker */}
      <div className="space-y-2">
        <label className="text-grape flex items-center gap-2 text-sm font-medium">
          <CalendarDays className="text-plum h-4 w-4" />
          Fecha de inicio
        </label>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                const isoDate = toLocalDateStr(date);
                onDateChange(isoDate);
              }
            }}
            disabled={(date) => {
              const dateStr = toLocalDateStr(date);
              return !availableDateSet.has(dateStr);
            }}
            defaultMonth={selectedDate || new Date()}
            className="border-border rounded-xl border"
          />
        </div>
        {startDate && (
          <p className="text-muted-foreground text-center text-xs">
            {dateFormatter.format(new Date(startDate + 'T12:00:00'))} — {timeSlots.length} horarios
            disponibles
          </p>
        )}
      </div>

      {/* Time selection */}
      {startDate && timeSlots.length > 0 && (
        <div className="space-y-2">
          <label className="text-grape flex items-center gap-2 text-sm font-medium">
            <Clock className="text-plum h-4 w-4" />
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
                    : 'border-border text-foreground hover:border-plum hover:bg-plum/5 bg-white'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Frequency */}
      <div className="space-y-2">
        <label className="text-grape flex items-center gap-2 text-sm font-medium">
          <Repeat className="text-plum h-4 w-4" />
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

      {/* Session preview — pencil available on EVERY session (edit date + time) */}
      {startDate && startTime && sessions.length > 0 && (
        <Card className="border-plum/30 bg-plum/5">
          <CardContent className="p-4">
            <p className="text-grape/70 mb-3 text-xs font-medium tracking-wide uppercase">
              Sesiones programadas ({sessions.length})
            </p>

            <div className="max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
              {sessions.map((item, idx) => {
                const d = new Date(item.date + 'T12:00:00');
                const isEditing = editingSession === idx;
                const editDaySlots = slots[item.date] || [];
                const customized = item.hasDateOverride || item.hasTimeOverride;

                return (
                  <div key={idx}>
                    <div
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
                      <span
                        className={`text-sm ${customized ? 'text-grape font-semibold' : 'text-foreground'}`}
                      >
                        {dateFormatter.format(d)}
                      </span>
                      <span
                        className={`ml-auto text-xs ${customized ? 'text-grape font-semibold' : 'text-muted-foreground'}`}
                      >
                        {item.time}
                      </span>

                      {/* Pencil on EVERY session: edit date + time */}
                      <button
                        type="button"
                        onClick={() => setEditingSession(isEditing ? null : idx)}
                        className="text-grape hover:bg-plum/20 rounded-md p-1"
                        title="Cambiar fecha y hora"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      {!item.available && (
                        <Badge className="bg-red-100 text-[10px] text-red-600 hover:bg-red-100">
                          {item.reason}
                        </Badge>
                      )}
                    </div>

                    {/* Inline editor: date picker + time picker */}
                    {isEditing && (
                      <div className="border-plum/20 mt-1 mb-1 ml-10 space-y-3 rounded-md border bg-white p-3">
                        {/* Date selector */}
                        <div>
                          <p className="text-grape mb-2 text-xs font-medium">Fecha disponible</p>
                          <div className="flex justify-center">
                            <Calendar
                              mode="single"
                              selected={new Date(item.date + 'T12:00:00')}
                              onSelect={(date) => {
                                if (date) onSessionDateOverride(idx, toLocalDateStr(date));
                              }}
                              disabled={(date) => !availableDateSet.has(toLocalDateStr(date))}
                              defaultMonth={new Date(item.date + 'T12:00:00')}
                              className="border-border rounded-xl border"
                            />
                          </div>
                        </div>

                        {/* Time selector for the chosen date */}
                        <div>
                          <p className="text-grape mb-2 text-xs font-medium">Horario disponible</p>
                          {editDaySlots.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {editDaySlots.map((time) => (
                                <button
                                  key={time}
                                  type="button"
                                  onClick={() => {
                                    onSessionTimeOverride(idx, time);
                                    setEditingSession(null);
                                  }}
                                  className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all ${
                                    item.time === time
                                      ? 'border-grape bg-grape text-white'
                                      : 'border-border text-foreground hover:border-plum hover:bg-plum/5 bg-white'
                                  }`}
                                >
                                  {time}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-xs">
                              Esta fecha no tiene horarios disponibles. Elige otra fecha.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {sessions.some((s) => !s.available) && (
              <p className="mt-3 flex items-center gap-1 text-xs text-amber-600">
                <AlertCircle className="h-3 w-3" />
                Haz click en el lápiz para cambiar la fecha u hora de las sesiones con conflicto.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!startDate && (
        <p className="text-muted-foreground text-center text-xs">
          Selecciona una fecha en el calendario para ver los horarios disponibles
        </p>
      )}
    </div>
  );
}
