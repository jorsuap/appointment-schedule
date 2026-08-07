import { AdminPackageList } from '@/components/admin/packages/admin-package-list';

/**
 * Admin page for packages pending bank transfer confirmation.
 * Renders AdminPackageList — the component has built-in status filters
 * which the admin can use to narrow down to PENDING_PAYMENT + BANK_TRANSFER.
 *
 * Validates: Requirements 5.4
 */
export default function PaquetesPendientesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-grape sm:text-3xl">
          Paquetes Pendientes de Confirmación
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paquetes con transferencia bancaria que requieren confirmación manual
          de pago
        </p>
      </div>

      <AdminPackageList />
    </div>
  );
}
