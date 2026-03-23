'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutTemplate, FolderKanban, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export default function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  const navItems = [
    {
      href: '/',
      label: t.nav.portfolio,
      icon: LayoutTemplate,
      activePattern: /^(\/(portfolio)?)?$/,
    },
    {
      href: '/projects',
      label: t.nav.projects,
      icon: FolderKanban,
      activePattern: /^\/projects/,
    },
    {
      href: '/profile',
      label: t.nav.profile,
      icon: User,
      activePattern: /^\/(profile|settings)/,
    },
  ];

  return (
    <nav
      className={cn('fixed bottom-0 left-0 right-0 z-40')}
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div
        className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto"
        style={{ borderTop: '1px solid var(--border-default)' }}
      >
        {navItems.map((item) => {
          const isActive = item.activePattern.test(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-0 px-1"
            >
              <div className="relative flex flex-col items-center">
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full nav-accent-bar"
                    transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                  />
                )}

                {/* Icon container */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -1 : 0,
                  }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className="p-1.5 rounded-xl transition-colors duration-200"
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className="transition-all duration-200"
                    style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                  />
                </motion.div>

                {/* Label */}
                <span
                  className="text-[10px] font-medium transition-colors duration-200 leading-none"
                  style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      {/* Safe area fill */}
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)', backgroundColor: 'var(--bg-primary)' }} />
    </nav>
  );
}
