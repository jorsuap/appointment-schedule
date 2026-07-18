import { LinkButton } from '@/components/ui/link-button';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
}

export function HeroSection({
  title = 'Tu bienestar emocional merece un espacio seguro',
  subtitle = 'En conAlma te acompañamos con empatía y profesionalismo en tu proceso de crecimiento personal. Porque cuidar tu salud mental es un acto de valentía.',
  ctaText = 'Quiero agendar mi cita',
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-lilac to-white px-4 py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-grape sm:text-4xl lg:text-5xl xl:text-6xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg lg:text-xl">
          {subtitle}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
          <LinkButton href="/agendar" size="lg" className="w-full text-base sm:w-auto">
            {ctaText}
          </LinkButton>
          <LinkButton
            href="#servicios"
            variant="outline"
            size="lg"
            className="w-full text-base sm:w-auto"
          >
            Conocer servicios
          </LinkButton>
        </div>
      </div>

      {/* Decorative gradient circles */}
      <div className="absolute -top-24 left-1/2 hidden h-96 w-96 -translate-x-1/2 rounded-full bg-plum/20 blur-3xl sm:block" />
      <div className="absolute -bottom-24 right-0 hidden h-64 w-64 rounded-full bg-jasmine/30 blur-3xl sm:block" />
    </section>
  );
}
