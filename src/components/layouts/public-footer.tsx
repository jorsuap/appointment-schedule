import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="border-t border-border/40 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <span className="text-xl font-bold text-grape">conAlma</span>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Tu refugio seguro para el bienestar psicológico y emocional.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-grape">Enlaces</h4>
            <ul className="mt-3 space-y-3">
              <li>
                <Link
                  href="/agendar"
                  className="text-sm text-muted-foreground hover:text-grape"
                >
                  Agendar cita
                </Link>
              </li>
              <li>
                <Link
                  href="/#servicios"
                  className="text-sm text-muted-foreground hover:text-grape"
                >
                  Servicios
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-grape">Legal</h4>
            <ul className="mt-3 space-y-3">
              <li>
                <Link href="/terminos" className="text-sm text-muted-foreground hover:text-grape">
                  Términos de servicio
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-sm text-muted-foreground hover:text-grape">
                  Aviso de privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/consentimiento"
                  className="text-sm text-muted-foreground hover:text-grape"
                >
                  Consentimiento informado
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground sm:text-sm">
          © {new Date().getFullYear()} conAlma. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
