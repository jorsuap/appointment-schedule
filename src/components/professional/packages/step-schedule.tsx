'use client';

import { useMemo } from 'react';
import { CalendarDays, Clock, Repeat } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/shared/date-picker';

import type { Frequency } from '@/lib/packages/session-scheduler';

interface StepScheduleProps {
  startDate: string;
  startTime: string;
  frequency: Frequency;
  sessionCount: number;
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

/**
 * Calculate session dates client-side for preview.
 * Uses the same logic as session-scheduler (add days based on frequency).
 */
function calculatePreviewDates(
  startDate: string,
  sessionCount: number,
  frequency: Frequency,
): Date[] {
  if (!startDate || sessionCount < 1) return [];

  const intervalDays = FREQUENCY_DAYS[frequency];
  const dates: Date[] = [];
  const start = new Date(startDate + 'T12:00:00');

  for (let i = 0; i < sessionCount; i++) {
    const d = new Date(start.getTime());
    d.setDate(d.getDate() + i * intervalDays);
    dates.push(d);
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
 * Step 3 of the package wizard — Schedule configuration.
 * Start date, time, frequency selection + preview of all scheduled dates.
 *
 * Validates: Requirements 3.1, 3.6
 */
export function StepSchedule({
  startDate,
  startTime,
  frequency,
  sessionCount,
  onDateChange,
  onTimeChange,
  onFrequencyChange,
}: StepScheduleProps) {
  const previewDates = useMemo(
    () => calculatePreviewDates(startDate, sessionCount, frequency),
    [startDate, sessionCount, frequency],
  );

  return (
    <div className="space-y-5">
      {/* Start date */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-grape">
          <CalendarDays className="h-4 w-4 text-plum" />
          Fecha de inicio
        </label>
        <DatePicker
          value={startDate}
          onChange={onDateChange}
          placeholder="Selecciona la fecha de inicio"
          mode="general"
        />
      </div>

      {/* Start time */}
      <div className="space-y-2">
        <label
          htmlFor="start-time"
          className="flex items-center gap-2 text-sm font-medium text-grape"
        >
          <Clock className="h-4 w-4 text-plum" />
          Hora de la sesión
        </label>
        <Input
          id="start-time"
          type="time"
          value={startTime}
          onChange={(e) => onTimeChange(e.target.value)}
          className="text-base"
        />
      </div>

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

      {/* Preview of scheduled dates */}
      {startDate && previewDates.length > 0 && (
        <Card className="border-plum/30 bg-plum/5">
          <CardContent className="p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-grape/70">
              Fechas programadas ({previewDates.length}{' '}
              {previewDates.length === 1 ? 'sesión' : 'sesiones'})
            </p>

            <div className="max-h-[240px] space-y-1.5 overflow-y-auto pr-1">
              {previewDates.map((date, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-md bg-white/60 px-3 py-2"
                >
                  <Badge className="shrink-0 bg-grape/10 text-grape hover:bg-grape/10">
                    {idx + 1}
                  </Badge>
                  <span className="text-sm text-foreground">
                    {dateFormatter.format(date)}
                  </span>
                  {startTime && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {startTime}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!startDate && (
        <p className="text-center text-xs text-muted-foreground">
          Selecciona una fecha para ver el calendario de sesiones
        </p>
      )}
    </div>
  );
}
