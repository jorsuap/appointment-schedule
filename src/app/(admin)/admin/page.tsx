import { CalendarDays, Users, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// TODO: Fetch real stats from database
const stats = [
  { label: 'Citas hoy', value: '3', icon: CalendarDays, color: 'text-grape' },
  { label: 'Pacientes totales', value: '24', icon: Users, color: 'text-plum' },
  { label: 'Próxima cita', value: '10:00 AM', icon: Clock, color: 'text-grape' },
  { label: 'Ingresos mes', value: '$960.000', icon: DollarSign, color: 'text-green-600' },
];

const upcomingAppointments = [
  {
    id: '1',
    patient: 'María González',
    professional: 'Alejandra Moreno',
    service: 'Acompañamiento emocional',
    date: '2026-07-14',
    time: '09:00',
  },
  {
    id: '2',
    patient: 'Carlos Ruiz',
    professional: 'Carolina Jiménez',
    service: 'Acompañamiento maternidad posparto',
    date: '2026-07-14',
    time: '10:00',
  },
  {
    id: '3',
    patient: 'Ana Martínez',
    professional: 'Alejandra Moreno',
    service: 'Acompañamiento emocional',
    date: '2026-07-14',
    time: '14:00',
  },
];

export default function AdminDashboardPage() {
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
          <div className="space-y-3">
            {upcomingAppointments.map((apt) => (
              <div
                key={apt.id}
                className="flex flex-col gap-1 rounded-lg border border-border/40 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-grape">{apt.patient}</p>
                  <p className="text-xs text-muted-foreground">
                    {apt.service} • {apt.professional}
                  </p>
                </div>
                <div className="text-sm font-medium text-plum">
                  {apt.time} hrs
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
