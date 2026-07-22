import { DashboardStats } from '@/components/professional/dashboard-stats';

export default function ProfessionalDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-grape">Dashboard</h1>
      <DashboardStats />
    </div>
  );
}
