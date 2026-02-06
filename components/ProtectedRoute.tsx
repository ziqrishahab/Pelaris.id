'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, hasRole, getAuth } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return false;
    }
    
    const { user } = getAuth();
    
    // KASIR can only access /pos - redirect to /pos for any other page
    if (user?.role === 'KASIR' && !pathname.startsWith('/pos')) {
      router.push('/pos');
      return false;
    }
    
    if (allowedRoles && !hasRole(allowedRoles)) {
      router.push('/access-denied');
      return false;
    }
    
    return true;
  }, [router, allowedRoles, pathname]);

  useEffect(() => {
    if (checkAuth()) {
      setIsLoading(false);
    }
  }, [checkAuth]);

  // Listen for auth changes from other tabs (via localStorage storage event)
  useEffect(() => {
    const handleAuthChange = () => {
      if (!isAuthenticated()) {
        router.push('/login');
      }
    };

    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', (e) => {
      if (e.key === 'token' && !e.newValue) {
        // Token was removed in another tab
        router.push('/login');
      }
    });

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
