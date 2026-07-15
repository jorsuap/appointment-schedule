'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const professionals = [
  { id: '1', name: 'Alejandra Moreno' },
  { id: '2', name: 'Carolina Jiménez' },
];

const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// TODO: Fetch from database
const scheduleByProfessional: Record<string, { dayOfWeek: number; startTime: string; endTime: string }[]> = {
  '1': [
    { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
    { dayOfWeek: 1, startTime: '14:00', endTime: '17:00' },
    { dayOfWeek: 3, startTime: '09:00', endTime: '12:00' },
    { dayOfWeek: 5, startTime: '14:00', endTime: '18:00' },
  ],
  '2': [
    { dayOfWeek: 2, startTime: '09:00', endTime: '13:00' },
    { dayOfWeek: 4, startTime: '10:00', endTime: '14:00' },
    { dayOfWeek: 4, startTime: '15:00', endTime: '18:00' },
  ],
};

const blockedDates = [
  { id: '1', professionalId: '1', date: '2026-07-21', reason: 'Vacaciones' },
  { id: '2', professionalId: '1', date: '2026-07-22', reason: 'Vacaciones' },
  { id: '3', professionalId: '2', date: '2026-08-01', reason: 'Festivo' },
];

export default function DisponibilidadPage() {
  const [selectedPro, setSelectedPro] = useState('1');

  const schedule = scheduleByProfessional[selectedPro] || [];
  const blocked = blockedDates.filter((b) => b.professionalId === selectedPro);

  return (
    <div>
      <h1 className="text-2xl font-bold text-grape sm:text-3xl">Disponibilidad</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Horarios recurrentes y fechas bloqueadas por profesional
      </p>

      {/* Professional selector */}
      <div className="mt-6">
        <Select value={selectedPro} onValueChange={(v) => v && setSelectedPro(v)}>
          <SelectTrigger className="h-11 w-full text-base sm:w-64">
            <SelectValue placeholder="Seleccionar profesional" />
          </SelectTrigger>
          <SelectContent>
            {professionals.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-base">
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Weekly schedule */}
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base text-grape">Horario semanal</CardTitle>
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <Plus className="h-3 w-3" />
              Agregar bloque
            </Button>
          </CardHeader>
          <CardContent>
            {schedule.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay horarios configurados.</p>
            ) : (
              <div className="space-y-2">
                {schedule.map((slot, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {days[slot.dayOfWeek]}
                      </Badge>
                      <span className="text-sm font-medium">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Blocked dates */}
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base text-grape">Fechas bloqueadas</CardTitle>
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <Plus className="h-3 w-3" />
              Bloquear fecha
            </Button>
          </CardHeader>
          <CardContent>
            {blocked.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay fechas bloqueadas.</p>
            ) : (
              <div className="space-y-2">
                {blocked.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{b.date}</p>
                      <p className="text-xs text-muted-foreground">{b.reason}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
