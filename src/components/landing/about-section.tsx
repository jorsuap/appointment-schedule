import { Card, CardContent } from '@/components/ui/card';

interface AboutSectionProps {
  title?: string;
  body?: string;
}

const values = [
  {
    icon: '🤝',
    title: 'Empatía',
    description: 'Te escuchamos sin juzgar. Tu historia es válida y merece ser atendida.',
  },
  {
    icon: '🛡️',
    title: 'Seguridad',
    description: 'Un espacio confidencial donde puedes ser tú mismo sin miedo.',
  },
  {
    icon: '🌱',
    title: 'Crecimiento',
    description: 'Te acompañamos en tu proceso con herramientas prácticas y profesionales.',
  },
  {
    icon: '💜',
    title: 'Confianza',
    description: 'Profesionales certificados comprometidos con tu bienestar integral.',
  },
];

export function AboutSection({
  title = '¿Qué es conAlma?',
  body = 'Somos un espacio de acompañamiento emocional online creado para personas que buscan un refugio seguro donde explorar sus emociones y encontrar herramientas para su bienestar. Creemos que pedir ayuda es un acto de valentía.',
}: AboutSectionProps) {
  return (
    <section id="nosotros" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-grape sm:text-4xl">{title}</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{body}</p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <Card
              key={value.title}
              className="border-border/40 bg-white text-center transition-shadow hover:shadow-md"
            >
              <CardContent className="pt-6">
                <div className="text-4xl">{value.icon}</div>
                <h3 className="mt-4 text-lg font-semibold text-grape">{value.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
