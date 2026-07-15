'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, ChevronRight, ToggleRight, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

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
    upcomingAppointments: 3,
  },
  {
    id: '2',
    name: 'Carolina Jiménez',
    specialty: 'Psicóloga Perinatal',
    email: 'carolina@conalma.co',
    isActive: true,
    traits: ['Cercana', 'Práctica', 'Compasiva', 'Concreta'],
    services: ['Acompañamiento maternidad posparto', 'Acompañamiento emocional'],
    upcomingAppointments: 2,
  },
];

const availableServices = [
  { id: '1', name: 'Acompañamiento emocional' },
  { id: '2', name: 'Acompañamiento maternidad posparto' },
];

const availableTraits = [
  'Cálida', 'Profunda', 'Reflexiva', 'Sensible', 'Cercana', 'Práctica',
  'Compasiva', 'Concreta', 'Espiritual', 'Breve', 'Directa',
];

export default function ProfesionalesPage() {
  const [showModal, setShowModal] = useState(false);
  const [newPro, setNewPro] = useState({
    name: '',
    email: '',
    specialty: '',
    description: '',
    price: '',
    commission: '',
    traits: [] as string[],
    services: [] as string[],
  });

  function toggleTrait(trait: string) {
    setNewPro((prev) => ({
      ...prev,
      traits: prev.traits.includes(trait)
        ? prev.traits.filter((t) => t !== trait)
        : [...prev.traits, trait],
    }));
  }

  function toggleService(serviceId: string) {
    setNewPro((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  }

  function handleSave() {
    // TODO: Save to database
    console.log('New professional:', newPro);
    setShowModal(false);
    setNewPro({ name: '', email: '', specialty: '', description: '', price: '', commission: '', traits: [], services: [] });
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-grape sm:text-3xl">Profesionales</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona perfiles, agenda, disponibilidad y tarifas
          </p>
        </div>
        <Button className="gap-1" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Agregar profesional
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {professionals.map((pro) => {
          const initials = pro.name.split(' ').map((n) => n[0]).join('').slice(0, 2);

          return (
            <Link key={pro.id} href={`/admin/profesionales/${pro.id}`} className="block">
              <Card className="cursor-pointer border-border/40 py-0 transition-all hover:border-plum hover:shadow-sm">
                <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback className="bg-plum/20 font-semibold text-grape">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-grape">{pro.name}</p>
                      <ToggleRight className="h-4 w-4 shrink-0 text-green-500" />
                    </div>
                    <p className="text-xs text-muted-foreground">{pro.specialty}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {pro.traits.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-jasmine/30 px-2 py-0.5 text-[10px] font-medium text-grape"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="hidden flex-col items-end gap-1 sm:flex">
                    <Badge variant="secondary" className="text-xs">
                      {pro.upcomingAppointments} citas próximas
                    </Badge>
                    <div className="flex gap-1">
                      {pro.services.map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px]">
                          {s.split(' ')[0]}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Modal: Agregar profesional */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 sm:items-center sm:pt-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-white shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
              <h2 className="text-lg font-bold text-grape">Agregar profesional</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Nombre completo *</Label>
                  <Input
                    className="mt-1 h-11 text-base"
                    placeholder="Nombre del profesional"
                    value={newPro.name}
                    onChange={(e) => setNewPro({ ...newPro, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label className="text-sm">Correo electrónico *</Label>
                  <Input
                    type="email"
                    className="mt-1 h-11 text-base"
                    placeholder="email@conalma.co"
                    value={newPro.email}
                    onChange={(e) => setNewPro({ ...newPro, email: e.target.value })}
                  />
                </div>

                <div>
                  <Label className="text-sm">Especialidad *</Label>
                  <Input
                    className="mt-1 h-11 text-base"
                    placeholder="Ej: Psicóloga Clínica"
                    value={newPro.specialty}
                    onChange={(e) => setNewPro({ ...newPro, specialty: e.target.value })}
                  />
                </div>

                <div>
                  <Label className="text-sm">Descripción</Label>
                  <Textarea
                    className="mt-1 min-h-[80px] text-base"
                    placeholder="Breve descripción del profesional y su enfoque..."
                    value={newPro.description}
                    onChange={(e) => setNewPro({ ...newPro, description: e.target.value })}
                  />
                </div>

                {/* Price & Commission */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Precio sesión (COP) *</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      className="mt-1 h-11 text-base"
                      placeholder="80000"
                      value={newPro.price}
                      onChange={(e) => setNewPro({ ...newPro, price: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Comisión plataforma (%) *</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      className="mt-1 h-11 text-base"
                      placeholder="40"
                      value={newPro.commission}
                      onChange={(e) => setNewPro({ ...newPro, commission: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                </div>
                {newPro.price && newPro.commission && (
                  <div className="rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Pago neto profesional: </span>
                    <span className="font-semibold text-grape">
                      ${(Number(newPro.price) - (Number(newPro.price) * Number(newPro.commission)) / 100).toLocaleString('es-CO')} COP
                    </span>
                  </div>
                )}

                {/* Services */}
                <div>
                  <Label className="text-sm">Servicios que ofrece *</Label>
                  <div className="mt-2 space-y-2">
                    {availableServices.map((service) => (
                      <label
                        key={service.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/40 px-3 py-2.5 transition-colors hover:bg-secondary/50"
                      >
                        <Checkbox
                          checked={newPro.services.includes(service.id)}
                          onCheckedChange={() => toggleService(service.id)}
                          className="h-5 w-5 border-grape bg-white"
                        />
                        <span className="text-sm">{service.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Traits */}
                <div>
                  <Label className="text-sm">Características de estilo</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Selecciona las que mejor describan al profesional
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {availableTraits.map((trait) => (
                      <button
                        key={trait}
                        type="button"
                        onClick={() => toggleTrait(trait)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          newPro.traits.includes(trait)
                            ? 'bg-grape text-white'
                            : 'bg-secondary text-grape hover:bg-plum/20'
                        }`}
                      >
                        {trait}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-border/40 px-5 py-4">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!newPro.name || !newPro.email || !newPro.specialty || !newPro.price || !newPro.commission || newPro.services.length === 0}
              >
                Guardar profesional
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
