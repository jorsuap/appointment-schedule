import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-grape">conAlma</h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Tu refugio seguro para el bienestar psicológico y emocional. Agenda tu cita con
          profesionales que te acompañan con empatía.
        </p>
        <div className="flex gap-4">
          <Button size="lg">Agendar cita</Button>
          <Button variant="outline" size="lg">
            Conocer servicios
          </Button>
        </div>
      </div>
    </main>
  );
}
