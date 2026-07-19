import { Suspense } from 'react';
import Link from 'next/link';
import { Search, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function PacientesPage() {
  const patients = await prisma.patient.findMany({
    include: {
      _count: { select: { appointments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-grape sm:text-3xl">Pacientes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Fichas y expedientes de todos los pacientes
      </p>

      {/* Patient list */}
      <div className="mt-6 flex flex-col gap-4">
        {patients.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay pacientes registrados aún.</p>
        ) : (
          patients.map((patient) => (
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
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-grape">{patient.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{patient.email}</p>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <Badge variant="secondary" className="text-xs">
                      {patient._count.appointments} cita{patient._count.appointments !== 1 ? 's' : ''}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {patient.country}
                    </Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
