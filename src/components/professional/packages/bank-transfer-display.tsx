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
    // High-res canvas (2x for retina)
    const scale = 2;
    const W = 900;
    const H = 600;
    const canvas = document.createElement('canvas');
    canvas.width = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(scale, scale);

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    // Top accent bar
    ctx.fillStyle = '#3C1955';
    ctx.fillRect(0, 0, W, 6);

    // Title
    ctx.fillStyle = '#3C1955';
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Datos para transferencia', W / 2, 50);

    // Subtitle - amount
    ctx.fillStyle = '#3C1955';
    ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
    ctx.fillText(formatCOP(totalPrice), W / 2, 90);

    // Divider
    ctx.strokeStyle = '#E8D5F5';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(60, 110);
    ctx.lineTo(W - 60, 110);
    ctx.stroke();

    // Holder section
    ctx.textAlign = 'left';
    ctx.fillStyle = '#6B7280';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillText('TITULAR', 60, 145);

    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.fillText(BANK_DETAILS.holder, 60, 170);

    ctx.fillStyle = '#6B7280';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillText(`CC: ${BANK_DETAILS.cc}`, 60, 195);

    // Nequi section - rounded box
    const nequiY = 225;
    ctx.fillStyle = '#F8F8F8';
    ctx.beginPath();
    ctx.roundRect(60, nequiY, W - 120, 90, 12);
    ctx.fill();

    ctx.fillStyle = '#E91E63';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText('Nequi', 90, nequiY + 35);

    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText(BANK_DETAILS.nequi, 90, nequiY + 65);

    // Bancolombia section - rounded box
    const bancoY = 335;
    ctx.fillStyle = '#F8F8F8';
    ctx.beginPath();
    ctx.roundRect(60, bancoY, W - 120, 90, 12);
    ctx.fill();

    ctx.fillStyle = '#FDDA24';
    ctx.beginPath();
    ctx.roundRect(60, bancoY, 5, 90, [12, 0, 0, 12]);
    ctx.fill();

    ctx.fillStyle = '#004B8D';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText('Bancolombia', 90, bancoY + 35);

    ctx.fillStyle = '#6B7280';
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Cuenta ${BANK_DETAILS.bancolombia.type}`, 90, bancoY + 55);

    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText(BANK_DETAILS.bancolombia.account, 90, bancoY + 80);

    // Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '13px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Paciente: ${patientName}`, W / 2, H - 50);

    ctx.fillStyle = '#3C1955';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillText('conAlma — Psicología online', W / 2, H - 25);

    // Bottom accent bar
    ctx.fillStyle = '#D2AAF0';
    ctx.fillRect(0, H - 6, W, 6);

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
