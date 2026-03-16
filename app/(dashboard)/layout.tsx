import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import BottomNav from '@/components/navigation/BottomNav';
import DashboardHeader from '@/components/navigation/DashboardHeader';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <DashboardHeader user={session.user} />
      <main
        className="pt-[60px] pb-[80px]"
        style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <div className="max-w-2xl mx-auto px-4">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
