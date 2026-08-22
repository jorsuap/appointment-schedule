'use client';

import { useRef } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BankTransferDisplayProps {
  patientName: string;
  totalPrice: number;
}

const BANK_DETAILS = {
  holder: 'Yenny Marcela Diaz Moyano',
  cc: '1101204361',
  nequi: '3123944604',
  bancolombia: {
    account: '912-169945-88',
    type: 'Ahorros',
  },
};

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);

/**
 * Post-creation component for bank transfer packages.
 * Shows banking details (Nequi + Bancolombia) with option to download as image.
 */
export function BankTransferDisplay({
  patientName,
  totalPrice,
}: BankTransferDisplayProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  async function handleCopy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Silent fail
    }
  }

  function handleDownload() {
    // Create a canvas-based image with bank details
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 500;

    // Background
    ctx.fillStyle = '#FAF5FA';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = '#3C1955';
    ctx.font = 'bold 28px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Datos para transferencia', canvas.width / 2, 50);

    // Amount
    ctx.fillStyle = '#3C1955';
    ctx.font = 'bold 24px Montserrat, sans-serif';
    ctx.fillText(`Total a pagar: ${formatCOP(totalPrice)}`, canvas.width / 2, 90);

    // Divider
    ctx.strokeStyle = '#D2AAF0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 110);
    ctx.lineTo(canvas.width - 60, 110);
    ctx.stroke();

    // Holder info
    ctx.textAlign = 'left';
    ctx.fillStyle = '#3C1955';
    ctx.font = 'bold 18px Montserrat, sans-serif';
    ctx.fillText('Titular:', 60, 150);
    ctx.font = '18px Montserrat, sans-serif';
    ctx.fillText(BANK_DETAILS.holder, 180, 150);

    ctx.font = 'bold 18px Montserrat, sans-serif';
    ctx.fillText('CC:', 60, 185);
    ctx.font = '18px Montserrat, sans-serif';
    ctx.fillText(BANK_DETAILS.cc, 180, 185);

    // Nequi
    ctx.font = 'bold 20px Montserrat, sans-serif';
    ctx.fillStyle = '#3C1955';
    ctx.fillText('📱 Nequi', 60, 240);
    ctx.font = '18px Montserrat, sans-serif';
    ctx.fillText(BANK_DETAILS.nequi, 60, 270);

    // Bancolombia
    ctx.font = 'bold 20px Montserrat, sans-serif';
    ctx.fillText('🏦 Bancolombia', 60, 330);
    ctx.font = '18px Montserrat, sans-serif';
    ctx.fillText(`Cuenta ${BANK_DETAILS.bancolombia.type}: ${BANK_DETAILS.bancolombia.account}`, 60, 360);

    // Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#666';
    ctx.font = '14px Montserrat, sans-serif';
    ctx.fillText(`Paciente: ${patientName}`, canvas.width / 2, 430);
    ctx.fillText('conAlma — Psicología online', canvas.width / 2, 460);

    // Download
    const link = document.createElement('a');
    link.download = `datos-transferencia-conalma.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <Card className="border-plum/30 bg-plum/5" ref={cardRef}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-grape">
          Datos para transferencia bancaria
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Comparte estos datos con{' '}
          <span className="font-medium text-grape">{patientName}</span> para
          que realice el pago de{' '}
          <span className="font-semibold text-grape">{formatCOP(totalPrice)}</span>
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Holder info */}
        <div className="rounded-lg bg-white p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Titular</p>
              <p className="font-semibold text-grape">{BANK_DETAILS.holder}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cédula</p>
            <p className="font-medium">{BANK_DETAILS.cc}</p>
          </div>
        </div>

        {/* Nequi */}
        <div className="rounded-lg bg-white p-4">
          <div className="flex items-center gap-3">
            <Image src="/Logo-nequi.png" alt="Nequi" width={40} height={40} className="rounded-lg" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Nequi</p>
              <p className="text-lg font-semibold text-grape">{BANK_DETAILS.nequi}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(BANK_DETAILS.nequi, 'nequi')}
              className="shrink-0"
            >
              {copied === 'nequi' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Bancolombia */}
        <div className="rounded-lg bg-white p-4">
          <div className="flex items-center gap-3">
            <Image src="/LogoBancolombia.png" alt="Bancolombia" width={40} height={40} className="rounded-lg" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Bancolombia — {BANK_DETAILS.bancolombia.type}</p>
              <p className="text-lg font-semibold text-grape">{BANK_DETAILS.bancolombia.account}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(BANK_DETAILS.bancolombia.account, 'bancolombia')}
              className="shrink-0"
            >
              {copied === 'bancolombia' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Download button */}
        <Button
          size="lg"
          className="min-h-[44px] w-full gap-2 bg-grape text-white hover:bg-grape/90"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
          Descargar imagen con datos
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          El paquete se activará cuando el administrador confirme la transferencia.
        </p>
      </CardContent>
    </Card>
  );
}
