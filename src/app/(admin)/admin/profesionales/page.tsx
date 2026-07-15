'use client';

import { Plus, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// TODO: Fetch from database
const professionals = [
  {
    id: '1',
    name: 'Alejandra Moreno',
    specialty: 'Psicóloga Clínica',
    email: 'alejandra@conalma.co',
    isActive: true,
    traits: ['Cálida', 'Profunda', 'Reflexiva', 'Sensible'],
    services: ['Acompañamiento emocional', 'Acompañamiento maternidad posparto'],
    totalAppointments: 18,
  },
  {
    id: '2',
    name: 'Carolina Jiménez',
    specialty: 'Psicóloga Perinatal',
    email: 'carolina@conalma.co',
    isActive: true,
    traits: ['Cercana', 'Práctica', 'Compasiva', 'Concreta'],
    services: ['Acompañamiento maternidad posparto', 'Acompañamiento emocional'],
    totalAppointments: 12,
  },
];

export default function ProfesionalesPage() {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-grape sm:text-3xl">Profesionales</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestiona los perfiles del equipo</p>
        </div>
        <Button className="gap-1">
          <Plus className="h-4 w-4" />
          Agregar profesional
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {professionals.map((pro) => {
          const initials = pro.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2);

          return (
            <Card key={pro.id} className="border-border/40">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-plum/20 font-semibold text-grape">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-grape">{pro.name}</p>
                      <p className="text-xs text-muted-foreground">{pro.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {pro.isActive ? (
                      <ToggleRight className="h-5 w-5 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {pro.traits.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-jasmine/30 px-2 py-0.5 text-xs font-medium text-grape"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {pro.services.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                  <span className="text-xs text-muted-foreground">
                    {pro.totalAppointments} citas realizadas
                  </span>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    <Edit className="h-3 w-3" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
