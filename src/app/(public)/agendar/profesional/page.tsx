import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LinkButton } from '@/components/ui/link-button';
import { Separator } from '@/components/ui/separator';

export const dynamic = 'force-dynamic';

async function ProfessionalList({ servicioId }: { servicioId: string | null }) {
  const professionals = await prisma.professional.findMany({
    where: {
      isActive: true,
      ...(servicioId && { services: { some: { serviceId: servicioId } } }),
    },
    include: {
      services: { include: { service: true } },
      tariffs: true,
    },
  });

  return (
    <div className="mt-8 flex flex-col gap-5">
      {professionals.map((professional) => {
        const initials = professional.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2);

        const tariff = servicioId
          ? professional.tariffs.find((t) => t.serviceId === servicioId)
          : professional.tariffs[0];

        return (
          <Card key={professional.id} className="border-border/40">
            <CardContent className="p-5">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                  <AvatarImage src={professional.photoUrl ?? undefined} alt={professional.name} />
                  <AvatarFallback className="bg-plum/30 text-lg font-semibold text-grape">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <h2 className="mt-3 text-lg font-bold text-grape">{professional.name}</h2>
                <p className="mt-0.5 text-sm font-medium text-plum">{professional.specialty}</p>

                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {professional.traits.map((trait) => (
                    <span
                      key={trait}
                      className="rounded-full bg-jasmine/30 px-2.5 py-0.5 text-xs font-medium text-grape"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              <Separator className="my-4" />

              <p className="text-sm leading-relaxed text-muted-foreground">
                {professional.description}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {professional.services.map((ps) => (
                  <Badge key={ps.serviceId} variant="secondary" className="text-xs">
                    {ps.service.name}
                  </Badge>
                ))}
              </div>

              {tariff && (
                <div className="mt-3 text-sm text-muted-foreground">
                  Valor sesión: <strong className="text-grape">${tariff.price.toLocaleString('es-CO')} COP</strong>
                </div>
              )}

              <LinkButton
                href={`/agendar/horario?servicio=${servicioId}&profesional=${professional.id}`}
                className="mt-4 h-11 w-full text-base"
              >
                Agendar con {professional.name.split(' ')[0]}
              </LinkButton>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default async function ProfesionalPage({
  searchParams,
}: {
  searchParams: Promise<{ servicio?: string }>;
}) {
  const { servicio } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:py-16">
      <div className="text-center">
        <p className="text-sm font-medium text-plum">Paso 4 de 6</p>
        <h1 className="mt-2 text-2xl font-bold text-grape sm:text-3xl">Elige tu especialista</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Conoce a nuestras profesionales y elige con quién te sientes más cómodo/a.
        </p>
      </div>

      <Suspense fallback={<div className="mt-8 animate-pulse text-center text-sm text-muted-foreground">Cargando profesionales...</div>}>
        <ProfessionalList servicioId={servicio || null} />
      </Suspense>
    </div>
  );
}
