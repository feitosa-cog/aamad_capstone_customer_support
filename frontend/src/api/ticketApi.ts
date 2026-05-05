import apiClient from './client';
import {
  getTickets as mockGetTickets,
  getTicketDetail as mockGetTicketDetail,
  updateTicket as mockUpdateTicket,
  escalateTicket as mockEscalateTicket,
  assignTicket as mockAssignTicket,
} from './mockApi';
import { useMockApi } from './apiConfig';

export interface Ticket {
  id: string;
  customerId: string;
  conversationId: string;
  status: 'open' | 'resolved' | 'escalated';
  createdAt: string;
  updatedAt: string;
  transcript: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  agentNotes: string;
  priority: 1 | 2 | 3 | 4 | 5;
  category: string;
  resolutionNotes?: string;
  agentAssigned?: string;
}

export interface TicketListResponse {
  data: Ticket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export const getTickets = async (page = 1, limit = 20, status?: string): Promise<TicketListResponse> => {
  if (useMockApi) {
    return mockGetTickets(page, limit, status);
  }

  const response = await apiClient.get('/tickets', {
    params: { page, limit, status },
  });
  return response.data;
};

export const getTicketDetail = async (ticketId: string): Promise<Ticket> => {
  if (useMockApi) {
    return mockGetTicketDetail(ticketId);
  }

  const response = await apiClient.get(`/tickets/${ticketId}`);
  return response.data;
};

export const updateTicket = async (ticketId: string, updates: Partial<Ticket>): Promise<Ticket> => {
  if (useMockApi) {
    return mockUpdateTicket(ticketId, updates as Record<string, any>);
  }

  const response = await apiClient.patch(`/tickets/${ticketId}`, updates);
  return response.data;
};

export const escalateTicket = async (ticketId: string, reason: string): Promise<Ticket> => {
  if (useMockApi) {
    return mockEscalateTicket(ticketId, reason);
  }

  const response = await apiClient.post(`/tickets/${ticketId}/escalate`, { reason });
  return response.data;
};

export const assignTicket = async (ticketId: string, agentId: string): Promise<Ticket> => {
  if (useMockApi) {
    return mockAssignTicket(ticketId, agentId);
  }

  const response = await apiClient.post(`/tickets/${ticketId}/assign`, { agentId });
  return response.data;
};
