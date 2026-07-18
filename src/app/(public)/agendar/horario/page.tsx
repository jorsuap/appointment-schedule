'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AvailabilityData {
  professionalId: string;
  serviceId: string;
  serviceDuration: number;
  servicePrice: number;
  slots: Record<string, string[]>;
}

export default function HorarioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const servicioId = searchParams.get('servicio');
  const profesionalId = searchParams.get('profesional');

  const [data, setData] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    if (!profesionalId || !servicioId) return;

    fetch(`/api/availability?professionalId=${profesionalId}&serviceId=${servicioId}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [profesionalId, servicioId]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Cargando disponibilidad...</p>
      </div>
    );
  }

  if (!data || !data.slots) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">No hay disponibilidad en este momento.</p>
      </div>
    );
  }

  const dateKey = selectedDate?.toISOString().split('T')[0];
  const slotsForDate = dateKey ? data.slots[dateKey] || [] : [];

  function handleConfirm() {
    if (!selectedDate || !selectedTime) return;
    router.push(
      `/agendar/confirmar?servicio=${servicioId}&profesional=${profesionalId}&fecha=${dateKey}&hora=${selectedTime}`,
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-10 sm:pb-16 sm:pt-16">
      <div className="text-center">
        <p className="text-sm font-medium text-plum">Paso 5 de 6</p>
        <h1 className="mt-2 text-2xl font-bold text-grape sm:text-3xl">Selecciona fecha y hora</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Elige el día y horario que mejor te funcione.
        </p>
      </div>

      {/* Service info */}
      <div className="mt-6 flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-grape">Sesión individual</p>
          <p className="text-xs text-muted-foreground">{data.serviceDuration} min • Online</p>
        </div>
        <Badge className="bg-jasmine text-grape hover:bg-jasmine/90">
          ${data.servicePrice.toLocaleString('es-CO')} COP
        </Badge>
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
              return !data.slots[key] || date < new Date();
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

      {/* Sticky button */}
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
