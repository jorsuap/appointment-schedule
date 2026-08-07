'use client';

import { useState } from 'react';
import { Copy, ExternalLink, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface PaymentLinkDisplayProps {
  linkUrl: string;
  patientName: string;
}

/**
 * Post-creation component displayed after the wizard completes with Wompi payment method.
 * Shows the Wompi payment link with copy and open-in-new-tab functionality.
 *
 * Validates: Requirements 4.3
 */
export function PaymentLinkDisplay({
  linkUrl,
  patientName,
}: PaymentLinkDisplayProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the input text
      const input = document.querySelector<HTMLInputElement>(
        '[data-payment-link-input]',
      );
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }

  function handleOpenNewTab() {
    window.open(linkUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <Card className="border-plum/30 bg-plum/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-grape">
          Link de pago generado
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Comparte este link de pago con{' '}
          <span className="font-medium text-grape">{patientName}</span>
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Link display */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            data-payment-link-input
            readOnly
            value={linkUrl}
            className="flex-1 text-sm"
            aria-label="Link de pago Wompi"
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            size="lg"
            className="min-h-[44px] flex-1 bg-grape text-white hover:bg-grape/90"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copiar link</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="min-h-[44px] flex-1"
            onClick={handleOpenNewTab}
          >
            <ExternalLink className="h-4 w-4" />
            <span>Abrir en nueva pestaña</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
