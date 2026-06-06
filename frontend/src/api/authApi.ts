import apiClient from './client';
import {
  login as mockLogin,
  logout as mockLogout,
  verifyToken as mockVerifyToken,
  refreshToken as mockRefreshToken,
} from './mockApi';
import { useMockApi } from './apiConfig';
import type { AuthUser, UserRole } from '../auth/roles';

export type User = AuthUser;

export interface AuthResponse {
  token: string;
  user: User;
}

const normalizeRole = (role: string): UserRole => {
  if (role === 'REQUESTOR' || role === 'REAL_AGENT' || role === 'PLATFORM_ADMIN') {
    return role;
  }

  if (role === 'agent') {
    return 'REAL_AGENT';
  }

  if (role === 'admin') {
    return 'PLATFORM_ADMIN';
  }

  return 'REQUESTOR';
};

const normalizeUser = (user: { id: string; email: string; role: string; name: string }): User => ({
  ...user,
  role: normalizeRole(user.role),
});

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  if (useMockApi) {
    const response = await mockLogin(email, password);
    return {
      ...response,
      user: normalizeUser(response.user),
    };
  }

  const response = await apiClient.post('/auth/login', { email, password });
  if (response.data.token) {
    localStorage.setItem('authToken', response.data.token);
  }
  return {
    ...response.data,
    user: normalizeUser(response.data.user),
  };
};

export const logout = async (): Promise<void> => {
  if (useMockApi) {
    await mockLogout();
    return;
  }

  localStorage.removeItem('authToken');
};

export const verifyToken = async (): Promise<{ valid: boolean; user?: User }> => {
  if (useMockApi) {
    const response = await mockVerifyToken();
    return response.user
      ? { valid: response.valid, user: normalizeUser(response.user) }
      : { valid: response.valid };
  }

  try {
    const response = await apiClient.get('/auth/verify');
    return response.data.user
      ? { valid: response.data.valid, user: normalizeUser(response.data.user) }
      : { valid: response.data.valid };
  } catch {
    return { valid: false };
  }
};

export const refreshToken = async (): Promise<AuthResponse> => {
  if (useMockApi) {
    const response = await mockRefreshToken();
    return {
      ...response,
      user: normalizeUser(response.user),
    };
  }

  const response = await apiClient.post('/auth/refresh');
  if (response.data.token) {
    localStorage.setItem('authToken', response.data.token);
  }
  return {
    ...response.data,
    user: normalizeUser(response.data.user),
  };
};
