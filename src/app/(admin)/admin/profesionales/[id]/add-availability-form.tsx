'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const days = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miércoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sábado' },
];

export function AddAvailabilityForm({ professionalId }: { professionalId: string }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!dayOfWeek || !startTime || !endTime) return;
    setSaving(true);

    await fetch('/api/availability/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        professionalId,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
      }),
    });

    setDayOfWeek('');
    setStartTime('');
    setEndTime('');
    setShowForm(false);
    setSaving(false);
    router.refresh();
  }

  if (!showForm) {
    return (
      <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setShowForm(true)}>
        <Plus className="h-3 w-3" />
        Agregar bloque horario
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-plum/30 bg-secondary/30 p-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label className="text-xs">Día</Label>
          <Select value={dayOfWeek} onValueChange={(v) => v && setDayOfWeek(v)}>
            <SelectTrigger className="mt-1 h-10 text-sm">
              <SelectValue placeholder="Día" />
            </SelectTrigger>
            <SelectContent>
              {days.map((d) => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Hora inicio</Label>
          <Input
            type="time"
            className="mt-1 h-10 text-sm"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs">Hora fin</Label>
          <Input
            type="time"
            className="mt-1 h-10 text-sm"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={!dayOfWeek || !startTime || !endTime || saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
