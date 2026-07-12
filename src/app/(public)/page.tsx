import { HeroSection } from '@/components/landing/hero-section';
import { AboutSection } from '@/components/landing/about-section';
import { ServicesSection } from '@/components/landing/services-section';
import { CtaSection } from '@/components/landing/cta-section';

export default function HomePage() {
  // TODO: Fetch content from SiteContent table when DB is connected
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <CtaSection />
    </>
  );
}
