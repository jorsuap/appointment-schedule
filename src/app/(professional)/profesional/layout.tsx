import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProfessionalSidebar } from '@/components/layouts/professional-sidebar';
import { ChangePasswordModal } from '@/components/professional/change-password-modal';

export default async function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'PROFESSIONAL') {
    redirect('/auth/login');
  }

  // Read mustChangePassword directly from DB (JWT cache may be stale)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mustChangePassword: true },
  });

  const mustChangePassword = user?.mustChangePassword ?? false;

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <ProfessionalSidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {mustChangePassword && <ChangePasswordModal />}
          {children}
        </div>
      </main>
    </div>
  );
}
