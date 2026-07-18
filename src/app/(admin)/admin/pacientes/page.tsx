'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// TODO: Fetch from database
const patients = [
  {
    id: '1',
    fullName: 'María González',
    preferredName: 'Mari',
    email: 'maria@email.com',
    country: 'Colombia',
    totalAppointments: 5,
    lastAppointment: '2026-07-10',
  },
  {
    id: '2',
    fullName: 'Carlos Ruiz',
    preferredName: 'Carlos',
    email: 'carlos@email.com',
    country: 'México',
    totalAppointments: 2,
    lastAppointment: '2026-07-08',
  },
  {
    id: '3',
    fullName: 'Ana Martínez',
    preferredName: 'Anita',
    email: 'ana@email.com',
    country: 'España',
    totalAppointments: 1,
    lastAppointment: '2026-07-12',
  },
];

export default function PacientesPage() {
  const [search, setSearch] = useState('');

  const filtered = patients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-grape sm:text-3xl">Pacientes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Fichas y expedientes de todos los pacientes
      </p>

      {/* Search */}
      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o correo..."
          className="h-11 pl-10 text-base"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Patient list */}
      <div className="mt-4 flex flex-col gap-4">
        {filtered.map((patient) => (
          <Link key={patient.id} href={`/admin/pacientes/${patient.id}`} className="block">
            <Card className="cursor-pointer border-border/40 py-0 transition-all hover:border-plum hover:shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-plum/20 text-sm font-semibold text-grape">
                  {patient.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-grape">{patient.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{patient.email}</p>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <Badge variant="secondary" className="text-xs">
                    {patient.totalAppointments} citas
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {patient.country}
                  </Badge>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
