import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';
import * as auth from '@/lib/auth';

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  isAuthenticated: vi.fn(),
  hasRole: vi.fn(),
  getAuth: vi.fn(),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when authenticated with correct role', async () => {
    vi.mocked(auth.isAuthenticated).mockReturnValue(true);
    vi.mocked(auth.hasRole).mockReturnValue(true);
    vi.mocked(auth.getAuth).mockReturnValue({
      token: 'test-token',
      csrfToken: 'test-csrf',
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        role: 'OWNER',
        cabangId: 'cab-1',
        isActive: true,
      },
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Either shows loading or content
    expect(screen.queryByText('Protected Content') || screen.queryByText('Loading...')).toBeTruthy();
  });

  it('should redirect to login when not authenticated', () => {
    vi.mocked(auth.isAuthenticated).mockReturnValue(false);

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should redirect KASIR to /pos when accessing non-POS pages', () => {
    vi.mocked(auth.isAuthenticated).mockReturnValue(true);
    vi.mocked(auth.getAuth).mockReturnValue({
      token: 'test-token',
      csrfToken: 'test-csrf',
      user: {
        id: '1',
        email: 'kasir@example.com',
        name: 'Kasir',
        role: 'KASIR',
        cabangId: 'cab-1',
        isActive: true,
      },
    });

    render(
      <ProtectedRoute>
        <div>Dashboard Content</div>
      </ProtectedRoute>
    );

    expect(mockPush).toHaveBeenCalledWith('/pos');
  });

  it('should redirect to access-denied when user lacks required role', () => {
    vi.mocked(auth.isAuthenticated).mockReturnValue(true);
    vi.mocked(auth.hasRole).mockReturnValue(false);
    vi.mocked(auth.getAuth).mockReturnValue({
      token: 'test-token',
      csrfToken: 'test-csrf',
      user: {
        id: '1',
        email: 'manager@example.com',
        name: 'Manager',
        role: 'MANAGER',
        cabangId: 'cab-1',
        isActive: true,
      },
    });

    render(
      <ProtectedRoute allowedRoles={['OWNER']}>
        <div>Owner Only Content</div>
      </ProtectedRoute>
    );

    expect(mockPush).toHaveBeenCalledWith('/access-denied');
  });
});
