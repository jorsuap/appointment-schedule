import { prisma } from '@/lib/prisma';
import { HeroSection } from '@/components/landing/hero-section';
import { AboutSection } from '@/components/landing/about-section';
import { ServicesSection } from '@/components/landing/services-section';
import { CtaSection } from '@/components/landing/cta-section';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [content, services] = await Promise.all([
    prisma.siteContent.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.service.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
  ]);

  const hero = content.find((c) => c.section === 'hero');
  const about = content.find((c) => c.section === 'about');
  const servicesContent = content.find((c) => c.section === 'services');
  const cta = content.find((c) => c.section === 'cta');

  return (
    <>
      <HeroSection
        title={hero?.title || undefined}
        subtitle={hero?.subtitle || undefined}
        ctaText={hero?.ctaText || undefined}
      />
      <AboutSection title={about?.title || undefined} body={about?.body || undefined} />
      <ServicesSection
        title={servicesContent?.title || undefined}
        subtitle={servicesContent?.subtitle || undefined}
        services={services}
      />
      <CtaSection
        title={cta?.title || undefined}
        subtitle={cta?.subtitle || undefined}
        ctaText={cta?.ctaText || undefined}
      />
    </>
  );
}
