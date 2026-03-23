import type { Metadata } from 'next';
import Link from 'next/link';
import StarEyeLogo from '@/components/icons/StarEyeLogo';

export const metadata: Metadata = {
  title: 'DesignFlow — 포트폴리오 만들기',
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 h-14"
        style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-default)' }}
      >
        <Link href="/create" className="flex items-center gap-2">
          <StarEyeLogo size={26} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>DesignFlow</span>
        </Link>
        <Link
          href="/login"
          className="text-xs font-medium px-4 py-2 rounded-xl transition-colors"
          style={{ background: 'rgba(var(--accent-primary-rgb),0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(var(--accent-primary-rgb),0.3)' }}
        >
          로그인
        </Link>
      </header>
      <main style={{ paddingTop: '56px' }}>
        <div className="max-w-2xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
