'use client';

import { useEffect, useState } from 'react';
import { Eye, RefreshCw } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

interface ProfessionalProfile {
  id: string;
  name: string;
  email: string;
  specialty: string;
  description: string | null;
  traits: string[];
  photoUrl: string | null;
  tariff: { price: number; commission: number };
  googleCalendarConnected: boolean;
  googleCalendarEmail: string | null;
}

/**
 * Preview card showing how the professional appears on the public booking page.
 * Fetches profile from /api/professional/profile and renders it mimicking the
 * public professional selection card style.
 *
 * Validates: Requirements 3.4
 */
export function ProfilePreview() {
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchProfile() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/professional/profile');
      if (!res.ok) {
        throw new Error('Error al cargar el perfil');
      }
      const data: ProfessionalProfile = await res.json();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  if (isLoading) {
    return <PreviewSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!profile) return null;

  const initials = profile.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  const descriptionExcerpt = profile.description
    ? profile.description.length > 180
      ? profile.description.slice(0, 180).trimEnd() + '…'
      : profile.description
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-plum" />
            <CardTitle className="text-sm font-semibold text-grape">
              Así te ven los pacientes
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-grape"
            onClick={fetchProfile}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Vista previa de tu card en la página de agendamiento público.
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Simulated public card */}
        <div className="rounded-xl border border-border/40 bg-lilac/30 p-5">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
              <AvatarImage src={profile.photoUrl ?? undefined} alt={profile.name} />
              <AvatarFallback className="bg-plum/30 text-lg font-semibold text-grape">
                {initials}
              </AvatarFallback>
            </Avatar>

            <h2 className="mt-3 text-lg font-bold text-grape">{profile.name}</h2>
            <p className="mt-0.5 text-sm font-medium text-plum">{profile.specialty}</p>

            {profile.traits.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {profile.traits.map((trait) => (
                  <span
                    key={trait}
                    className="rounded-full bg-jasmine/30 px-2.5 py-0.5 text-xs font-medium text-grape"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            )}
          </div>

          {descriptionExcerpt && (
            <>
              <Separator className="my-4" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                {descriptionExcerpt}
              </p>
            </>
          )}

          {/* Simulated CTA button (non-functional, just for preview) */}
          <div className="mt-4 flex h-11 w-full items-center justify-center rounded-md bg-grape text-base font-medium text-white opacity-60">
            Agendar con {profile.name.split(' ')[0]}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PreviewSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-3 w-64 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-xl border border-border/40 p-5">
          <div className="flex flex-col items-center">
            <div className="h-20 w-20 animate-pulse rounded-full bg-muted sm:h-24 sm:w-24" />
            <div className="mt-3 h-5 w-36 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="mt-3 flex gap-1.5">
              <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
              <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
          <div className="my-4 h-px bg-muted" />
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
            <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
          </div>
          <div className="mt-4 h-11 w-full animate-pulse rounded-md bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
