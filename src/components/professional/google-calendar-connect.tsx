'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  Loader2,
  Unlink,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// --- Interfaces ---

interface GoogleCalendarStatus {
  connected: boolean;
  email: string | null;
  expiresAt: string | null;
  needsReconnect?: boolean;
}

/**
 * GoogleCalendarConnect component for the professional portal.
 * Shows connection status, connect/disconnect buttons, and reconnect banner.
 *
 * States:
 * 1. Not connected → "Conectar Google Calendar" button
 * 2. Connected → Green badge "Conectado" + email + "Desconectar" button
 * 3. Needs reconnect → Warning banner + "Reconectar" button
 *
 * Validates: Requirements 4.1, 4.4, 4.5, 4.6
 */
export function GoogleCalendarConnect() {
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/professional/google-calendar/status');
      if (!res.ok) throw new Error('Error al obtener estado de Google Calendar');
      const data: GoogleCalendarStatus = await res.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  function handleConnect() {
    window.location.href = '/api/professional/google-calendar/connect';
  }

  async function handleDisconnect() {
    setIsDisconnecting(true);

    try {
      const res = await fetch('/api/professional/google-calendar/disconnect', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al desconectar Google Calendar');
      }

      toast.success('Google Calendar desconectado correctamente');
      setDisconnectDialogOpen(false);
      await fetchStatus();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al desconectar'
      );
    } finally {
      setIsDisconnecting(false);
    }
  }

  if (isLoading) return <GoogleCalendarSkeleton />;

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="space-y-4">
      {/* Reconnect banner — shown when token is revoked/expired */}
      {status.needsReconnect && (
        <div
          className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Tu conexión con Google Calendar ha expirado
              </p>
              <p className="mt-0.5 text-xs text-amber-700">
                Reconecta para seguir creando eventos automáticamente.
              </p>
            </div>
          </div>
          <Button
            onClick={handleConnect}
            className="h-11 min-w-[44px] bg-amber-600 text-white hover:bg-amber-700"
          >
            Reconectar
          </Button>
        </div>
      )}

      {/* Main card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-grape">
            <Calendar className="h-4 w-4 text-plum" />
            Google Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status.connected && !status.needsReconnect ? (
            <ConnectedState
              email={status.email}
              isDisconnecting={isDisconnecting}
              disconnectDialogOpen={disconnectDialogOpen}
              onDisconnectDialogChange={setDisconnectDialogOpen}
              onDisconnect={handleDisconnect}
            />
          ) : (
            <DisconnectedState onConnect={handleConnect} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- Connected State ---

function ConnectedState({
  email,
  isDisconnecting,
  disconnectDialogOpen,
  onDisconnectDialogChange,
  onDisconnect,
}: {
  email: string | null;
  isDisconnecting: boolean;
  disconnectDialogOpen: boolean;
  onDisconnectDialogChange: (open: boolean) => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
          <Check className="mr-1 h-3 w-3" />
          Conectado
        </Badge>
        {email && (
          <span className="truncate text-sm text-muted-foreground">
            {email}
          </span>
        )}
      </div>

      <Dialog open={disconnectDialogOpen} onOpenChange={onDisconnectDialogChange}>
        <DialogTrigger
          render={
            <Button
              variant="outline"
              className="h-11 min-w-[44px] border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
            />
          }
        >
          <Unlink className="mr-2 h-4 w-4" />
          Desconectar
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desconectar Google Calendar</DialogTitle>
            <DialogDescription>
              ¿Estás segura de que deseas desconectar tu Google Calendar? Las
              nuevas citas ya no generarán eventos ni links de Google Meet
              automáticamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button
                  variant="outline"
                  className="h-11 min-w-[44px]"
                  disabled={isDisconnecting}
                />
              }
            >
              Cancelar
            </DialogClose>
            <Button
              onClick={onDisconnect}
              disabled={isDisconnecting}
              className="h-11 min-w-[44px] bg-destructive text-white hover:bg-destructive/90"
            >
              {isDisconnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Unlink className="mr-2 h-4 w-4" />
              )}
              Desconectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Disconnected State ---

function DisconnectedState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Conecta tu Google Calendar para crear eventos con Meet automáticamente
        cuando se confirmen tus citas.
      </p>
      <Button
        onClick={onConnect}
        className="h-11 min-w-[44px] bg-grape text-white hover:bg-grape/90"
      >
        <Calendar className="mr-2 h-4 w-4" />
        Conectar Google Calendar
      </Button>
    </div>
  );
}

// --- Skeleton ---

function GoogleCalendarSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-pulse rounded bg-muted" />
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-5 w-48 animate-pulse rounded bg-muted" />
          <div className="h-11 w-48 animate-pulse rounded-md bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
