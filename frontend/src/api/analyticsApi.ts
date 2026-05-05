import apiClient from './client';
import {
  getDashboardMetrics as mockGetDashboardMetrics,
  getTicketMetrics as mockGetTicketMetrics,
  getAgentMetrics as mockGetAgentMetrics,
} from './mockApi';
import { useMockApi } from './apiConfig';

export interface DashboardMetrics {
  ticketMetrics: {
    total: number;
    resolved: number;
    escalated: number;
    avgResolutionTime: number;
  };
  agentMetrics: {
    activeAgents: number;
    avgHandleTime: number;
    csat: number;
  };
  trends: {
    ticketsPerHour: number[];
    resolutionRatePerDay: number[];
  };
}

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  if (useMockApi) {
    return mockGetDashboardMetrics();
  }

  const response = await apiClient.get('/analytics/dashboard');
  return response.data;
};

export const getTicketMetrics = async (startDate: string, endDate: string) => {
  if (useMockApi) {
    return mockGetTicketMetrics(startDate, endDate);
  }

  const response = await apiClient.get('/analytics/tickets', {
    params: { startDate, endDate },
  });
  return response.data;
};

export const getAgentMetrics = async (agentId?: string) => {
  if (useMockApi) {
    return mockGetAgentMetrics(agentId);
  }

  const response = await apiClient.get('/analytics/agents', {
    params: { agentId },
  });
  return response.data;
};
