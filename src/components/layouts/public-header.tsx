'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-grape sm:text-2xl">conAlma</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/#servicios"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-grape"
          >
            Servicios
          </Link>
          <Link
            href="/#nosotros"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-grape"
          >
            Nosotros
          </Link>
          <LinkButton href="/agendar">Agendar cita</LinkButton>
        </nav>

        {/* Mobile nav toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <LinkButton href="/agendar" size="sm">
            Agendar
          </LinkButton>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Menú</span>
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="border-t border-border/40 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link
              href="/#servicios"
              className="rounded-lg px-3 py-2 text-base font-medium text-grape hover:bg-secondary"
              onClick={() => setMobileOpen(false)}
            >
              Servicios
            </Link>
            <Link
              href="/#nosotros"
              className="rounded-lg px-3 py-2 text-base font-medium text-grape hover:bg-secondary"
              onClick={() => setMobileOpen(false)}
            >
              Nosotros
            </Link>
            <LinkButton href="/agendar" className="mt-2 w-full">
              Agendar cita
            </LinkButton>
          </div>
        </nav>
      )}
    </header>
  );
}
