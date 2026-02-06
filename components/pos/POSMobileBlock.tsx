'use client';

import { clearAuth } from '@/lib/auth';
import type { User } from './types';

interface POSMobileBlockProps {
  user: User | null;
  router: { push: (path: string) => void };
}

export function POSMobileBlock({ user, router }: POSMobileBlockProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
          <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Akses Tidak Diizinkan
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          POS hanya dapat diakses melalui <span className="font-semibold">Desktop, Laptop, atau Tablet</span>. 
          Silakan gunakan perangkat dengan layar lebih besar untuk mengakses fitur kasir.
        </p>
        {user?.role === 'KASIR' ? (
          <button
            onClick={() => { clearAuth(); router.push('/login'); }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        ) : (
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Dashboard
          </a>
        )}
      </div>
    </div>
  );
}
