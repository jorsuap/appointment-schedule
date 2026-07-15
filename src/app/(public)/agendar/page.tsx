'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// TODO: Fetch from database (Service model)
const services = [
  {
    id: '1',
    name: 'Acompañamiento emocional',
    description:
      'Sesiones individuales para explorar tus emociones y fortalecer tu bienestar emocional.',
    durationMin: 60,
  },
  {
    id: '2',
    name: 'Acompañamiento maternidad posparto',
    description:
      'Espacio seguro para madres que atraviesan la etapa posparto con apoyo profesional.',
    durationMin: 60,
  },
];

export default function AgendarPage() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-grape sm:text-3xl">
          ¿Qué tipo de acompañamiento buscas?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Selecciona el servicio que mejor se adapte a lo que necesitas.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {services.map((service) => (
          <Link key={service.id} href={`/agendar/datos?servicio=${service.id}`}>
            <Card className="cursor-pointer border-border/40 transition-all active:scale-[0.98] hover:border-plum hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-grape">{service.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
                  <Badge variant="secondary" className="mt-2">
                    {service.durationMin} min
                  </Badge>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
