'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getAuth } from '@/lib/auth';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  theme: ResolvedTheme; // Alias for backward compatibility
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated
  const checkAuth = () => {
    const { token } = getAuth();
    return !!token;
  };

  // Apply theme to document
  const applyTheme = (mode: ThemeMode, forceLight: boolean = false) => {
    let resolved: ResolvedTheme;
    
    // Force light mode for unauthenticated users (public pages)
    if (forceLight) {
      resolved = 'light';
    } else if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolved = prefersDark ? 'dark' : 'light';
    } else {
      resolved = mode;
    }
    
    setResolvedTheme(resolved);
    
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    setMounted(true);
    
    // Check authentication status
    const authenticated = checkAuth();
    setIsAuthenticated(authenticated);
    
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
    const initialMode = savedTheme || 'system';
    setThemeModeState(initialMode);
    
    // Only apply dark mode if authenticated, otherwise force light
    applyTheme(initialMode, !authenticated);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeMode === 'system') {
        applyTheme('system', !checkAuth());
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Re-apply when themeMode changes or auth status changes
  useEffect(() => {
    if (mounted) {
      const authenticated = checkAuth();
      setIsAuthenticated(authenticated);
      applyTheme(themeMode, !authenticated);
    }
  }, [themeMode, mounted]);

  // Listen for storage changes (login/logout)
  useEffect(() => {
    const handleStorageChange = () => {
      const authenticated = checkAuth();
      setIsAuthenticated(authenticated);
      applyTheme(themeMode, !authenticated);
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom auth change event
    window.addEventListener('authChange', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleStorageChange);
    };
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('theme', mode);
    applyTheme(mode, !isAuthenticated);
  };

  const toggleTheme = () => {
    const newMode: ThemeMode = resolvedTheme === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ themeMode, resolvedTheme, theme: resolvedTheme, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return default values for SSR/static generation
    return {
      themeMode: 'system' as ThemeMode,
      resolvedTheme: 'light' as ResolvedTheme,
      theme: 'light' as ResolvedTheme,
      setThemeMode: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}
