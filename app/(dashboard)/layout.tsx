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
    redirect('/create');
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)' }}>
      <DashboardHeader user={session.user} />
      <main
        style={{
          paddingTop: '60px',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="max-w-2xl mx-auto px-4">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
