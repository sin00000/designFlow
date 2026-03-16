'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import ThemeProvider from '@/components/ThemeProvider';
import { useState } from 'react';
import type { Session } from 'next-auth';

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

export default function Providers({ children, session }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <ThemeProvider>
      <SessionProvider session={session}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#242424',
              color: '#ffffff',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              fontSize: '14px',
              padding: '12px 16px',
              maxWidth: '380px',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
          />
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
