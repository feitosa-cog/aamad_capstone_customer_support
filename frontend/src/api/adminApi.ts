import apiClient from './client';
import { useMockApi } from './apiConfig';
import {
  getUsers as mockGetUsers,
  updateUserRole as mockUpdateUserRole,
  getSystemHealth as mockGetSystemHealth,
} from './mockApi';

export type AdminRole = 'REQUESTOR' | 'REAL_AGENT' | 'PLATFORM_ADMIN';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  status: 'active' | 'disabled';
}

export interface SystemHealth {
  api: 'healthy' | 'degraded' | 'down';
  orchestration: 'healthy' | 'degraded' | 'down';
  database: 'healthy' | 'degraded' | 'down';
  queue: 'healthy' | 'degraded' | 'down';
  lastUpdated: string;
}

export const getUsers = async (): Promise<AdminUser[]> => {
  if (useMockApi) {
    return mockGetUsers();
  }

  const response = await apiClient.get('/users');
  return response.data;
};

export const updateUserRole = async (userId: string, role: AdminRole): Promise<AdminUser> => {
  if (useMockApi) {
    return mockUpdateUserRole(userId, role);
  }

  const response = await apiClient.put(`/users/${userId}/role`, { role });
  return response.data;
};

export const getSystemHealth = async (): Promise<SystemHealth> => {
  if (useMockApi) {
    return mockGetSystemHealth();
  }

  const response = await apiClient.get('/system-health');
  return response.data;
};