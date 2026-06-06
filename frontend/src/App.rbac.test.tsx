import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { useAuthStore } from './store/authStore';
import type { User } from './api/authApi';

const verifyTokenMock = vi.fn();

vi.mock('./api/authApi', () => ({
  verifyToken: (...args: unknown[]) => verifyTokenMock(...args),
}));

const setAuthUser = (user: User | null) => {
  if (user) {
    useAuthStore.setState({ token: 'test-token', user, error: null });
  } else {
    useAuthStore.setState({ token: null, user: null, error: null });
  }
};

describe('App RBAC route guards', () => {
  beforeEach(() => {
    verifyTokenMock.mockReset();
    useAuthStore.setState({ token: null, user: null, error: null });
  });

  it('redirects unauthenticated users to login', async () => {
    setAuthUser(null);
    window.history.pushState({}, '', '/admin');
    verifyTokenMock.mockResolvedValue({ valid: false });

    render(<App />);

    expect(await screen.findByText('Role-Based MVP Access')).toBeInTheDocument();
  });

  it('redirects requestor away from admin route', async () => {
    const requestor: User = {
      id: 'u-requestor',
      email: 'customer@example.com',
      role: 'REQUESTOR',
      name: 'Customer Requestor',
    };
    setAuthUser(requestor);
    verifyTokenMock.mockResolvedValue({ valid: true, user: requestor });
    window.history.pushState({}, '', '/admin');

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Support Chat' })).toBeInTheDocument();
  });

  it('allows platform admin to access admin route', async () => {
    const admin: User = {
      id: 'u-admin',
      email: 'admin@company.com',
      role: 'PLATFORM_ADMIN',
      name: 'Platform Admin',
    };
    setAuthUser(admin);
    verifyTokenMock.mockResolvedValue({ valid: true, user: admin });
    window.history.pushState({}, '', '/admin');

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Admin Console' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'User Management' })).toBeInTheDocument();
  });
});