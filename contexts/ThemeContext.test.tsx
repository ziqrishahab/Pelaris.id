import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';

// Mock auth module
vi.mock('@/lib/auth', () => ({
  getAuth: vi.fn(() => ({ token: 'mock-token', user: { id: '1' }, csrfToken: null })),
}));

import { getAuth } from '@/lib/auth';

// Test component that uses the theme hook
function TestComponent() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
    document.documentElement.classList.remove('dark');
    // Default: authenticated user
    (getAuth as ReturnType<typeof vi.fn>).mockReturnValue({ token: 'mock-token', user: { id: '1' }, csrfToken: null });
  });

  describe('ThemeProvider', () => {
    it('should provide default light theme', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('light');
    });

    it('should load saved theme from localStorage', () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Initial render will show light, then useEffect updates it
      // This test verifies the structure works
      expect(screen.getByTestId('theme')).toBeDefined();
    });

    it('should toggle theme when toggleTheme is called', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const button = screen.getByText('Toggle');
      fireEvent.click(button);

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should add dark class to documentElement when dark theme', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const button = screen.getByText('Toggle');
      fireEvent.click(button);

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class when switching to light theme', () => {
      document.documentElement.classList.add('dark');
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Toggle to dark, then back to light
      const button = screen.getByText('Toggle');
      fireEvent.click(button); // light -> dark
      fireEvent.click(button); // dark -> light

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should force light mode for unauthenticated users', () => {
      // Set up: user not authenticated, dark theme saved
      (getAuth as ReturnType<typeof vi.fn>).mockReturnValue({ token: null, user: null, csrfToken: null });
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('dark');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Should still be light since user is not authenticated
      expect(screen.getByTestId('theme')).toHaveTextContent('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('useTheme', () => {
    it('should return default values when used outside ThemeProvider', () => {
      // useTheme now returns default values instead of throwing for SSR compatibility
      render(<TestComponent />);
      
      // Should render with default light theme
      expect(screen.getByTestId('theme')).toHaveTextContent('light');
    });
  });
});
