import { AdminPackageList } from '@/components/admin/packages/admin-package-list';

/**
 * Admin page for viewing and managing all session packages.
 * Renders AdminPackageList which includes filters and contextual status actions.
 *
 * Validates: Requirements 9.2, 5.4
 */
export default function PaquetesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-grape sm:text-3xl">
          Paquetes de Sesiones
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visualiza y gestiona todos los paquetes de sesiones del sistema
        </p>
      </div>

      <AdminPackageList />
    </div>
  );
}
