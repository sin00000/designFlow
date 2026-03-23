'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body style={{ background: '#0f0f0f', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0, textAlign: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#71717a', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {error.message || 'A critical error occurred.'}
          </p>
          <button
            onClick={reset}
            style={{ padding: '10px 20px', borderRadius: '12px', background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
