import { CalendarDays, Users, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const [todayAppointments, totalPatients, totalRevenue, upcomingAppointments] = await Promise.all([
    prisma.appointment.count({
      where: { date: { gte: startOfDay, lt: endOfDay }, status: 'CONFIRMED' },
    }),
    prisma.patient.count(),
    prisma.payment.aggregate({
      where: { status: 'APPROVED' },
      _sum: { amount: true },
    }),
    prisma.appointment.findMany({
      where: { date: { gte: now }, status: 'CONFIRMED' },
      include: { patient: true, professional: true, service: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      take: 10,
    }),
  ]);

  const stats = [
    { label: 'Citas hoy', value: String(todayAppointments), icon: CalendarDays, color: 'text-grape' },
    { label: 'Pacientes totales', value: String(totalPatients), icon: Users, color: 'text-plum' },
    { label: 'Próximas citas', value: String(upcomingAppointments.length), icon: Clock, color: 'text-grape' },
    { label: 'Ingresos totales', value: `$${(totalRevenue._sum.amount || 0).toLocaleString('es-CO')}`, icon: DollarSign, color: 'text-green-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-grape sm:text-3xl">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Resumen general de conAlma</p>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/40">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold text-grape">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming appointments */}
      <Card className="mt-8 border-border/40">
        <CardHeader>
          <CardTitle className="text-lg text-grape">Próximas citas</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay citas próximas programadas.</p>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex flex-col gap-1 rounded-lg border border-border/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-grape">{apt.patient.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {apt.service.name} • {apt.professional.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {apt.date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </Badge>
                    <span className="text-sm font-medium text-plum">{apt.startTime} hrs</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
