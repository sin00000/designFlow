'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { House, BookImage, FolderKanban, Users, LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/',
    label: 'Home',
    icon: House,
    activePattern: /^\/$/,
  },
  {
    href: '/references',
    label: 'References',
    icon: BookImage,
    activePattern: /^\/references/,
  },
  {
    href: '/projects',
    label: 'Projects',
    icon: FolderKanban,
    activePattern: /^\/projects/,
  },
  {
    href: '/community',
    label: 'Community',
    icon: Users,
    activePattern: /^\/community/,
  },
  {
    href: '/portfolio',
    label: 'Portfolio',
    icon: LayoutTemplate,
    activePattern: /^\/portfolio/,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'backdrop-blur-xl',
        'shadow-bottom-nav',
        'bottom-nav'
      )}
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-default)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
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
                  className={cn(
                    'p-1.5 rounded-xl transition-colors duration-200',
                    isActive
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  )}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className={cn(
                      'transition-all duration-200',
                      isActive
                        ? 'text-white drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]'
                        : 'text-gray-500'
                    )}
                  />
                </motion.div>

                {/* Label */}
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors duration-200 leading-none',
                    isActive ? 'text-white' : 'text-gray-600'
                  )}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
