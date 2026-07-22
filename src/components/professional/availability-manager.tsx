'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CalendarOff,
  Clock,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// --- Interfaces ---

interface AvailabilityBlock {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface BlockedDateEntry {
  id: string;
  date: string;
  reason: string | null;
}

// --- Constants ---

const DAY_NAMES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

/**
 * AvailabilityManager component for the professional portal.
 * CRUD visual for weekly time blocks grouped by day + blocked dates management.
 *
 * Validates: Requirements 5.1, 5.2, 5.3
 */
export function AvailabilityManager() {
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDateEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/professional/availability');
      if (!res.ok) throw new Error('Error al cargar la disponibilidad');
      const data = await res.json();
      setBlocks(data.blocks);
      setBlockedDates(data.blockedDates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <AvailabilitySkeleton />;

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Bloques horarios por día */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-grape">Bloques horarios</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Configura tus horarios disponibles para cada día de la semana.
        </p>
        <div className="space-y-4">
          {DAY_NAMES.map((dayName, dayIndex) => (
            <DayBlock
              key={dayIndex}
              dayIndex={dayIndex}
              dayName={dayName}
              blocks={blocks.filter((b) => b.dayOfWeek === dayIndex)}
              onBlockAdded={(block) => setBlocks((prev) => [...prev, block])}
              onBlockDeleted={(id) =>
                setBlocks((prev) => prev.filter((b) => b.id !== id))
              }
            />
          ))}
        </div>
      </section>

      {/* Fechas bloqueadas */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-grape">Fechas bloqueadas</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Bloquea fechas específicas en las que no estarás disponible (vacaciones,
          feriados, etc.).
        </p>
        <BlockedDatesSection
          blockedDates={blockedDates}
          onDateAdded={(entry) =>
            setBlockedDates((prev) => [...prev, entry])
          }
          onDateDeleted={(id) =>
            setBlockedDates((prev) => prev.filter((d) => d.id !== id))
          }
        />
      </section>
    </div>
  );
}

// --- Day Block Component ---

function DayBlock({
  dayIndex,
  dayName,
  blocks,
  onBlockAdded,
  onBlockDeleted,
}: {
  dayIndex: number;
  dayName: string;
  blocks: AvailabilityBlock[];
  onBlockAdded: (block: AvailabilityBlock) => void;
  onBlockDeleted: (id: string) => void;
}) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd() {
    if (!startTime || !endTime) {
      toast.error('Ingresa hora de inicio y fin');
      return;
    }

    if (endTime <= startTime) {
      toast.error('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    setIsAdding(true);

    try {
      const res = await fetch('/api/professional/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayOfWeek: dayIndex, startTime, endTime }),
      });

      if (res.status === 409) {
        toast.error(
          'El bloque se superpone con uno existente. Ajusta los horarios.'
        );
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear bloque');
      }

      const newBlock: AvailabilityBlock = await res.json();
      onBlockAdded(newBlock);
      setStartTime('');
      setEndTime('');
      toast.success('Bloque horario agregado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al agregar bloque');
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);

    try {
      const res = await fetch(`/api/professional/availability?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Error al eliminar bloque');
      }

      onBlockDeleted(id);
      toast.success('Bloque eliminado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base text-grape">
            <Clock className="h-4 w-4 text-plum" />
            {dayName}
          </CardTitle>
          <Badge className="bg-plum/20 text-grape hover:bg-plum/30">
            {blocks.length} {blocks.length === 1 ? 'bloque' : 'bloques'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Existing blocks */}
        {blocks.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">
            Sin bloques configurados
          </p>
        ) : (
          <ul className="space-y-2">
            {blocks.map((block) => (
              <li
                key={block.id}
                className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2"
              >
                <span className="text-sm font-medium">
                  {block.startTime} – {block.endTime}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(block.id)}
                  disabled={deletingId === block.id}
                  aria-label={`Eliminar bloque ${block.startTime} – ${block.endTime}`}
                >
                  {deletingId === block.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}

        {/* Add form */}
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-end sm:gap-3">
          <div className="flex-1">
            <Label htmlFor={`start-${dayIndex}`} className="text-xs text-muted-foreground">
              Inicio
            </Label>
            <Input
              id={`start-${dayIndex}`}
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-11 text-base"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor={`end-${dayIndex}`} className="text-xs text-muted-foreground">
              Fin
            </Label>
            <Input
              id={`end-${dayIndex}`}
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-11 text-base"
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={isAdding}
            className="h-11 min-w-[44px] bg-grape text-white hover:bg-grape/90 sm:px-4"
            aria-label={`Agregar bloque a ${dayName}`}
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="mr-1 h-4 w-4" />
                <span className="sm:hidden">Agregar</span>
                <span className="hidden sm:inline">Agregar</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Blocked Dates Section ---

function BlockedDatesSection({
  blockedDates,
  onDateAdded,
  onDateDeleted,
}: {
  blockedDates: BlockedDateEntry[];
  onDateAdded: (entry: BlockedDateEntry) => void;
  onDateDeleted: (id: string) => void;
}) {
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd() {
    if (!date) {
      toast.error('Selecciona una fecha');
      return;
    }

    setIsAdding(true);

    try {
      const res = await fetch('/api/professional/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, reason: reason || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al bloquear fecha');
      }

      const newEntry: BlockedDateEntry = await res.json();
      onDateAdded(newEntry);
      setDate('');
      setReason('');
      toast.success('Fecha bloqueada agregada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al bloquear fecha');
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);

    try {
      const res = await fetch(`/api/professional/blocked-dates?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Error al eliminar fecha bloqueada');
      }

      onDateDeleted(id);
      toast.success('Fecha desbloqueada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-grape">
          <CalendarOff className="h-4 w-4 text-plum" />
          Fechas bloqueadas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing blocked dates */}
        {blockedDates.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No tienes fechas bloqueadas
          </p>
        ) : (
          <ul className="space-y-2">
            {blockedDates.map((entry) => (
              <li
                key={entry.id}
                className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {formatBlockedDate(entry.date)}
                  </p>
                  {entry.reason && (
                    <p className="truncate text-xs text-muted-foreground">
                      {entry.reason}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(entry.id)}
                  disabled={deletingId === entry.id}
                  aria-label={`Eliminar fecha bloqueada ${formatBlockedDate(entry.date)}`}
                >
                  {deletingId === entry.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}

        {/* Add blocked date form */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
            <div className="flex-1">
              <Label htmlFor="blocked-date" className="text-xs text-muted-foreground">
                Fecha
              </Label>
              <Input
                id="blocked-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="h-11 text-base"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="blocked-reason" className="text-xs text-muted-foreground">
                Motivo (opcional)
              </Label>
              <Input
                id="blocked-reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Vacaciones, feriado..."
                className="h-11 text-base"
              />
            </div>
            <Button
              onClick={handleAdd}
              disabled={isAdding}
              className="h-11 min-w-[44px] bg-grape text-white hover:bg-grape/90 sm:px-4"
              aria-label="Bloquear fecha"
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="mr-1 h-4 w-4" />
                  Bloquear
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Skeleton ---

function AvailabilitySkeleton() {
  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="mb-6 h-4 w-64 animate-pulse rounded bg-muted" />
        <div className="space-y-4">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-16 animate-pulse rounded bg-muted" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-11 animate-pulse rounded-lg bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section>
        <div className="mb-4 h-6 w-40 animate-pulse rounded bg-muted" />
        <Card>
          <CardContent className="pt-6">
            <div className="h-11 animate-pulse rounded-lg bg-muted" />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// --- Utils ---

function formatBlockedDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
