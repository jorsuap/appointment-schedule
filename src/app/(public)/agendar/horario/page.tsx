'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// TODO: Fetch from database based on professional availability & existing appointments
const availableSlots: Record<string, string[]> = {
  '2026-07-14': ['09:00', '10:00', '11:00', '14:00', '15:00'],
  '2026-07-15': ['09:00', '10:00', '16:00'],
  '2026-07-16': ['11:00', '14:00', '15:00', '16:00'],
  '2026-07-17': ['09:00', '10:00', '11:00'],
  '2026-07-18': ['14:00', '15:00', '16:00', '17:00'],
};

export default function HorarioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const servicioId = searchParams.get('servicio');
  const profesionalId = searchParams.get('profesional');

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const dateKey = selectedDate?.toISOString().split('T')[0];
  const slotsForDate = dateKey ? availableSlots[dateKey] || [] : [];

  // Dates that have available slots
  const availableDates = Object.keys(availableSlots).map((d) => new Date(d + 'T12:00:00'));

  function handleConfirm() {
    if (!selectedDate || !selectedTime) return;
    // TODO: Save to Zustand booking store
    router.push(
      `/agendar/confirmar?servicio=${servicioId}&profesional=${profesionalId}&fecha=${dateKey}&hora=${selectedTime}`,
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-10 sm:pb-16 sm:pt-16">
      <div className="text-center">
        <p className="text-sm font-medium text-plum">Paso 5 de 6</p>
        <h1 className="mt-2 text-2xl font-bold text-grape sm:text-3xl">
          Selecciona fecha y hora
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Elige el día y horario que mejor te funcione.
        </p>
      </div>

      {/* Service info */}
      <div className="mt-6 flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-grape">Sesión individual</p>
          <p className="text-xs text-muted-foreground">60 min • Online</p>
        </div>
        <Badge className="bg-jasmine text-grape hover:bg-jasmine/90">$80.000 COP</Badge>
      </div>

      {/* Calendar */}
      <Card className="mt-6 border-border/40">
        <CardContent className="flex justify-center p-2 sm:p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date);
              setSelectedTime(null);
            }}
            disabled={(date) => {
              const key = date.toISOString().split('T')[0];
              return !availableSlots[key] || date < new Date();
            }}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Time slots */}
      {selectedDate && (
        <Card className="mt-4 border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-grape">
              Horarios disponibles —{' '}
              {selectedDate.toLocaleDateString('es-CO', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {slotsForDate.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay horarios disponibles para esta fecha.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slotsForDate.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? 'default' : 'outline'}
                    className="h-11 text-base"
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sticky button on mobile */}
      {selectedTime && (
        <div className="fixed inset-x-0 bottom-0 border-t border-border/40 bg-white p-4 sm:static sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0">
          <Button size="lg" className="h-12 w-full text-base" onClick={handleConfirm}>
            Confirmar {selectedTime} hrs
          </Button>
        </div>
      )}
    </div>
  );
}
