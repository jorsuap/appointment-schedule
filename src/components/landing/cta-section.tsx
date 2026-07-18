import { LinkButton } from '@/components/ui/link-button';

interface CtaSectionProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
}

export function CtaSection({
  title = '¿Listo para dar el primer paso?',
  subtitle = 'No tienes que enfrentar esto solo. Estamos aquí para acompañarte con respeto, empatía y profesionalismo.',
  ctaText = 'Agendar mi primera cita',
}: CtaSectionProps) {
  return (
    <section className="bg-grape px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">{title}</h2>
        <p className="mt-4 text-base text-white/80 sm:text-lg">{subtitle}</p>
        <LinkButton
          href="/agendar"
          size="lg"
          className="mt-8 bg-jasmine text-base text-grape hover:bg-jasmine/90"
        >
          {ctaText}
        </LinkButton>
      </div>
    </section>
  );
}
