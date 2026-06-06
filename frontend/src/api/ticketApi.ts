import apiClient from './client';
import {
  getTickets as mockGetTickets,
  getTicketDetail as mockGetTicketDetail,
  updateTicket as mockUpdateTicket,
  escalateTicket as mockEscalateTicket,
  assignTicket as mockAssignTicket,
  getHandoffContext as mockGetHandoffContext,
} from './mockApi';
import { useMockApi } from './apiConfig';

export interface Ticket {
  id: string;
  customerId: string;
  conversationId: string;
  status: 'open' | 'in_progress' | 'resolved' | 'escalated';
  createdAt: string;
  updatedAt: string;
  escalationRequestedAt?: string;
  queueWaitSeconds?: number;
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

type BackendTicket = {
  id: string;
  customerId?: string;
  user_id?: string;
  userId?: string;
  conversationId?: string;
  conversation_id?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  escalationRequestedAt?: string;
  escalation_requested_at?: string;
  queueWaitSeconds?: number;
  queue_wait_seconds?: number;
  transcript?: Array<{
    role?: string;
    sender_type?: string;
    content?: string;
    timestamp?: string;
    created_at?: string;
  }>;
  agentNotes?: string;
  priority?: number;
  category?: string;
  resolutionNotes?: string;
  agentAssigned?: string;
  payload?: {
    category?: string;
    urgency?: number;
    handoff_notes?: string;
    resolutionNotes?: string;
    agentAssigned?: string;
    escalation_requested_at?: string;
    queue_wait_seconds?: number;
  };
};

export interface HandoffContext {
  ticket_id: string;
  escalation: {
    requested_at: string;
    reason: string;
    priority: 'low' | 'medium' | 'high';
    queue_wait_seconds: number;
  };
  ai_summary: {
    intent: string;
    attempted_actions: string[];
    resolution_attempts: number;
    last_ai_message: string;
  };
  customer_context: {
    user_id: string;
    open_ticket_count: number;
    recent_ticket_ids: string[];
  };
}

const normalizeStatus = (status?: string): Ticket['status'] => {
  if (status === 'resolved' || status === 'escalated' || status === 'in_progress' || status === 'open') {
    return status;
  }

  return 'open';
};

const normalizeTicket = (raw: BackendTicket): Ticket => {
  const now = new Date().toISOString();
  return {
    id: raw.id,
    customerId: raw.customerId || raw.user_id || raw.userId || 'unknown',
    conversationId: raw.conversationId || raw.conversation_id || '',
    status: normalizeStatus(raw.status),
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || raw.createdAt || now,
    escalationRequestedAt:
      raw.escalationRequestedAt ||
      raw.escalation_requested_at ||
      raw.payload?.escalation_requested_at ||
      undefined,
    queueWaitSeconds: raw.queueWaitSeconds || raw.queue_wait_seconds || raw.payload?.queue_wait_seconds,
    transcript: (raw.transcript || []).map((message) => ({
      role: message.role || message.sender_type || 'system',
      content: message.content || '',
      timestamp: message.timestamp || message.created_at || now,
    })),
    agentNotes: raw.agentNotes || raw.payload?.handoff_notes || '',
    priority: (raw.priority || raw.payload?.urgency || 3) as 1 | 2 | 3 | 4 | 5,
    category: raw.category || raw.payload?.category || 'general',
    resolutionNotes: raw.resolutionNotes || raw.payload?.resolutionNotes,
    agentAssigned: raw.agentAssigned || raw.payload?.agentAssigned,
  };
};

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
  return {
    data: (response.data.data as BackendTicket[]).map(normalizeTicket),
    pagination: response.data.pagination,
  };
};

export const getMyTickets = async (): Promise<Ticket[]> => {
  if (useMockApi) {
    const response = await mockGetTickets(1, 100);
    return response.data;
  }

  const response = await apiClient.get('/api/v1/tickets/mine');
  return (response.data as BackendTicket[]).map(normalizeTicket);
};

export const getQueueTickets = async (): Promise<Ticket[]> => {
  if (useMockApi) {
    const response = await mockGetTickets(1, 100, 'escalated');
    return response.data;
  }

  const response = await apiClient.get('/api/v1/queue');
  return (response.data as BackendTicket[]).map(normalizeTicket);
};

export const getTicketDetail = async (ticketId: string): Promise<Ticket> => {
  if (useMockApi) {
    return mockGetTicketDetail(ticketId);
  }

  const response = await apiClient.get(`/tickets/${ticketId}`);
  return normalizeTicket(response.data as BackendTicket);
};

export const updateTicket = async (ticketId: string, updates: Partial<Ticket>): Promise<Ticket> => {
  if (useMockApi) {
    return mockUpdateTicket(ticketId, updates as Record<string, any>);
  }

  const response = await apiClient.patch(`/tickets/${ticketId}`, updates);
  return normalizeTicket(response.data as BackendTicket);
};

export const escalateTicket = async (ticketId: string, reason: string): Promise<Ticket> => {
  if (useMockApi) {
    return mockEscalateTicket(ticketId, reason);
  }

  const response = await apiClient.post(`/tickets/${ticketId}/escalate`, { reason });
  return normalizeTicket(response.data as BackendTicket);
};

export const assignTicket = async (ticketId: string, agentId: string): Promise<Ticket> => {
  if (useMockApi) {
    return mockAssignTicket(ticketId, agentId);
  }

  const response = await apiClient.post(`/tickets/${ticketId}/assign`, { agentId });
  return normalizeTicket(response.data as BackendTicket);
};

export const acceptQueueTicket = async (ticketId: string): Promise<Ticket> => {
  if (useMockApi) {
    return mockUpdateTicket(ticketId, { status: 'in_progress' });
  }

  const response = await apiClient.post(`/api/v1/queue/${ticketId}/accept`);
  return normalizeTicket(response.data as BackendTicket);
};

export const resolveQueueTicket = async (ticketId: string, resolutionNotes: string): Promise<Ticket> => {
  if (useMockApi) {
    return mockUpdateTicket(ticketId, { status: 'resolved', resolutionNotes });
  }

  const response = await apiClient.post(`/api/v1/queue/${ticketId}/resolve`, {
    resolutionNotes,
  });
  return normalizeTicket(response.data as BackendTicket);
};

export const addTicketNotes = async (ticketId: string, notes: string): Promise<Ticket> => {
  if (useMockApi) {
    return mockUpdateTicket(ticketId, { agentNotes: notes });
  }

  const response = await apiClient.put(`/api/v1/tickets/${ticketId}/notes`, {
    notes,
  });
  return normalizeTicket(response.data as BackendTicket);
};

export const getHandoffContext = async (ticketId: string): Promise<HandoffContext> => {
  if (useMockApi) {
    return mockGetHandoffContext(ticketId);
  }

  const response = await apiClient.get(`/api/v1/tickets/${ticketId}/handoff-context`);
  return response.data as HandoffContext;
};
