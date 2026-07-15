'use client';

import { Plus, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// TODO: Fetch from database
const services = [
  {
    id: '1',
    name: 'Acompañamiento emocional',
    description: 'Sesiones individuales para explorar tus emociones y fortalecer tu bienestar mental.',
    durationMin: 60,
    price: 80000,
    isActive: true,
  },
  {
    id: '2',
    name: 'Acompañamiento maternidad posparto',
    description: 'Espacio seguro para madres que atraviesan la etapa posparto con apoyo profesional.',
    durationMin: 60,
    price: 80000,
    isActive: true,
  },
];

export default function ServiciosPage() {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-grape sm:text-3xl">Servicios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tipos de acompañamiento que ofrece conAlma
          </p>
        </div>
        <Button className="gap-1">
          <Plus className="h-4 w-4" />
          Agregar servicio
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {services.map((service) => (
          <Card key={service.id} className="border-border/40">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-grape">{service.name}</h3>
                  {service.isActive ? (
                    <ToggleRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
                <div className="mt-2 flex gap-2">
                  <Badge variant="secondary">{service.durationMin} min</Badge>
                  <Badge variant="outline">${service.price.toLocaleString('es-CO')} COP</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 self-end text-xs sm:self-center">
                <Edit className="h-3 w-3" />
                Editar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
