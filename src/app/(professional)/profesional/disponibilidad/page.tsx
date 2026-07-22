import { AvailabilityManager } from '@/components/professional/availability-manager';
import { GoogleCalendarConnect } from '@/components/professional/google-calendar-connect';

interface DisponibilidadPageProps {
  searchParams: Promise<{ connected?: string; error?: string }>;
}

export default async function DisponibilidadPage({
  searchParams,
}: DisponibilidadPageProps) {
  const params = await searchParams;
  const showConnectedBanner = params.connected === 'true';
  const oauthError = params.error;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-grape">Disponibilidad</h1>

      {/* OAuth redirect banners */}
      {showConnectedBanner && (
        <div
          className="rounded-xl border border-emerald-300 bg-emerald-50 p-4"
          role="status"
        >
          <p className="text-sm font-medium text-emerald-800">
            ✓ Google Calendar conectado exitosamente
          </p>
        </div>
      )}

      {oauthError && (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
          role="alert"
        >
          <p className="text-sm font-medium text-destructive">
            Error al conectar Google Calendar. Por favor, intenta nuevamente.
          </p>
        </div>
      )}

      <GoogleCalendarConnect />
      <AvailabilityManager />
    </div>
  );
}
