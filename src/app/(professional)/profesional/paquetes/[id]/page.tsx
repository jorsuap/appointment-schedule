'use client';

import { useParams } from 'next/navigation';
import { PackageDetail } from '@/components/professional/packages/package-detail';

export default function PaqueteDetallePage() {
  const params = useParams();
  const id = params.id as string;

  return <PackageDetail packageId={id} />;
}
