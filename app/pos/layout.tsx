'use client';

import ErrorBoundary from '@/components/ErrorBoundary';

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
