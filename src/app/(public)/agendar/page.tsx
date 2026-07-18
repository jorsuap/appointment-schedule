import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AgendarPage() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

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
                  <div className="mt-2 flex gap-2">
                    <Badge variant="secondary">{service.durationMin} min</Badge>
                    {service.price > 0 && (
                      <Badge variant="outline">
                        ${service.price.toLocaleString('es-CO')} COP
                      </Badge>
                    )}
                  </div>
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
