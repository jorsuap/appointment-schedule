'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Hash, TrendingDown, DollarSign } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface PricePreview {
  pricePerSession: number;
  discountPerSession: number;
  totalPrice: number;
  totalDiscount: number;
}

interface StepSessionsConfigProps {
  sessionCount: number;
  serviceId: string;
  onCountChange: (count: number) => void;
  onServiceChange: (id: string) => void;
}

const formatCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
});

/**
 * Step 2 of the package wizard — Session count + live price preview.
 * Fetches price preview from POST /api/professional/packages/calculate
 * when sessionCount changes (debounced 500ms).
 *
 * Validates: Requirements 1.2, 1.4, 2.3
 */
export function StepSessionsConfig({
  sessionCount,
  serviceId,
  onCountChange,
  onServiceChange: _onServiceChange,
}: StepSessionsConfigProps) {
  const [preview, setPreview] = useState<PricePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPreview = useCallback(
    async (count: number, svcId: string) => {
      if (count < 1 || !svcId) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/professional/packages/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionCount: count, serviceId: svcId }),
        });
        if (!res.ok) {
          throw new Error('Error al calcular precio');
        }
        const data: PricePreview = await res.json();
        setPreview(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Error al calcular precio',
        );
        setPreview(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Debounced fetch when sessionCount or serviceId changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchPreview(sessionCount, serviceId);
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [sessionCount, serviceId, fetchPreview]);

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
      onCountChange(val);
    } else if (e.target.value === '') {
      onCountChange(1);
    }
  };

  return (
    <div className="space-y-5">
      {/* Session count input */}
      <div className="space-y-2">
        <label
          htmlFor="session-count"
          className="flex items-center gap-2 text-sm font-medium text-grape"
        >
          <Hash className="h-4 w-4 text-plum" />
          Cantidad de sesiones
        </label>
        <Input
          id="session-count"
          type="number"
          min={1}
          value={sessionCount}
          onChange={handleCountChange}
          className="text-base"
          aria-describedby="session-count-hint"
        />
        <p id="session-count-hint" className="text-xs text-muted-foreground">
          Mínimo 1 sesión. A más sesiones, mayor descuento.
        </p>
      </div>

      {/* Price preview */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-plum border-t-grape" />
          <span className="ml-2 text-sm text-muted-foreground">
            Calculando precio...
          </span>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {preview && !loading && (
        <Card className="border-plum/30 bg-plum/5">
          <CardContent className="space-y-3 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-grape/70">
              Resumen de precio
            </p>

            <div className="space-y-2">
              {/* Price per session */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  Precio por sesión
                </span>
                <span className="text-sm font-medium text-foreground">
                  {formatCOP.format(preview.pricePerSession + preview.discountPerSession)}
                </span>
              </div>

              {/* Discount per session */}
              {preview.discountPerSession > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingDown className="h-3.5 w-3.5" />
                    Descuento por sesión
                  </span>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    -{formatCOP.format(preview.discountPerSession)}
                  </Badge>
                </div>
              )}

              {/* Total discount */}
              {preview.totalDiscount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Ahorro total
                  </span>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    -{formatCOP.format(preview.totalDiscount)}
                  </Badge>
                </div>
              )}

              {/* Separator */}
              <div className="border-t border-plum/20 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-grape">
                    Total del paquete
                  </span>
                  <span className="text-lg font-bold text-grape">
                    {formatCOP.format(preview.totalPrice)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {sessionCount} {sessionCount === 1 ? 'sesión' : 'sesiones'}
                  {preview.discountPerSession > 0 && (
                    <> × {formatCOP.format(preview.pricePerSession)} c/u</>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
