import apiClient from './client';
import {
  login as mockLogin,
  logout as mockLogout,
  verifyToken as mockVerifyToken,
  refreshToken as mockRefreshToken,
} from './mockApi';
import { useMockApi } from './apiConfig';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'agent' | 'viewer';
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  if (useMockApi) {
    return mockLogin(email, password);
  }

  const response = await apiClient.post('/auth/login', { email, password });
  if (response.data.token) {
    localStorage.setItem('authToken', response.data.token);
  }
  return response.data;
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
    return mockVerifyToken();
  }

  try {
    const response = await apiClient.get('/auth/verify');
    return response.data;
  } catch {
    return { valid: false };
  }
};

export const refreshToken = async (): Promise<AuthResponse> => {
  if (useMockApi) {
    return mockRefreshToken();
  }

  const response = await apiClient.post('/auth/refresh');
  if (response.data.token) {
    localStorage.setItem('authToken', response.data.token);
  }
  return response.data;
};
