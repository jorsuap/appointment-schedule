import { LinkButton } from '@/components/ui/link-button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number;
}

interface ServicesSectionProps {
  title?: string;
  subtitle?: string;
  services?: Service[];
}

export function ServicesSection({
  title = 'Nuestros servicios',
  subtitle = 'Elige el tipo de acompañamiento que mejor se adapte a lo que necesitas en este momento.',
  services = [],
}: ServicesSectionProps) {
  return (
    <section id="servicios" className="bg-white px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-grape sm:text-4xl">{title}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {services.map((service) => (
            <Card
              key={service.id}
              className="flex flex-col border-border/40 transition-all hover:border-plum hover:shadow-lg"
            >
              <CardHeader>
                <CardTitle className="text-xl text-grape">{service.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground">{service.description}</p>
                <div className="mt-4 flex items-center gap-2">
                  <Badge variant="secondary">{service.durationMin} min</Badge>
                  {service.price > 0 && (
                    <Badge variant="outline">
                      ${service.price.toLocaleString('es-CO')} COP
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <LinkButton href={`/agendar?servicio=${service.id}`} className="w-full">
                  Agendar
                </LinkButton>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
