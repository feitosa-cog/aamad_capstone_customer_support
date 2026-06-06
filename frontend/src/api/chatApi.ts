import apiClient from './client';
import {
  createConversation as mockCreateConversation,
  getConversationHistory as mockGetConversationHistory,
  sendMessage as mockSendMessage,
} from './mockApi';
import { useMockApi } from './apiConfig';

export type SenderType = 'requestor' | 'ai_agent' | 'real_agent' | 'system';

export type EscalationState =
  | 'OPEN'
  | 'ESCALATION_REQUESTED'
  | 'ESCALATION_QUEUED'
  | 'HUMAN_ACTIVE'
  | 'HUMAN_RESOLVED'
  | 'CLOSED';

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'real_agent';
  senderType: SenderType;
  content: string;
  timestamp: string;
  confidence?: number;
}

interface SendTicketMessageResponse {
  id?: string;
  conversationId?: string;
  conversation_id?: string;
  role?: string;
  sender_type?: SenderType;
  content?: string;
  body?: string;
  timestamp?: string;
  created_at?: string;
}

export interface ChatResponse {
  id: string;
  conversationId: string;
  agentResponse: string;
  status: 'resolved' | 'escalated' | 'in-progress';
  escalationState?: EscalationState;
  senderType?: SenderType;
  liveAgentOnline?: boolean;
  confidence?: number;
  ticketId?: string;
  agentAssigned?: string;
}

type BackendMessage = {
  id?: string;
  conversationId?: string;
  conversation_id?: string;
  role?: string;
  sender_type?: SenderType;
  content?: string;
  timestamp?: string;
  created_at?: string;
  confidence?: number;
};

type BackendChatResponse = {
  id?: string;
  conversationId?: string;
  conversation_id?: string;
  agentResponse?: string;
  response?: string;
  status?: string;
  escalation_state?: EscalationState;
  sender_type?: SenderType;
  live_agent_online?: boolean;
  confidence?: number;
  ticketId?: string;
  ticket_id?: string;
  agentAssigned?: string;
  agent_assigned?: string;
};

const normalizeSenderType = (senderType?: string, role?: string): SenderType => {
  if (senderType === 'requestor' || senderType === 'ai_agent' || senderType === 'real_agent' || senderType === 'system') {
    return senderType;
  }

  if (role === 'user') {
    return 'requestor';
  }

  if (role === 'real_agent') {
    return 'real_agent';
  }

  if (role === 'assistant') {
    return 'ai_agent';
  }

  return 'system';
};

const normalizeRole = (senderType: SenderType, role?: string): ChatMessage['role'] => {
  if (role === 'user' || role === 'assistant' || role === 'system' || role === 'real_agent') {
    return role;
  }

  if (senderType === 'requestor') {
    return 'user';
  }

  if (senderType === 'real_agent') {
    return 'real_agent';
  }

  if (senderType === 'ai_agent') {
    return 'assistant';
  }

  return 'system';
};

const normalizeMessage = (conversationId: string, message: BackendMessage): ChatMessage => {
  const senderType = normalizeSenderType(message.sender_type, message.role);
  return {
    id: message.id || Math.random().toString(36).slice(2, 11),
    conversationId: message.conversationId || message.conversation_id || conversationId,
    senderType,
    role: normalizeRole(senderType, message.role),
    content: message.content || '',
    timestamp: message.timestamp || message.created_at || new Date().toISOString(),
    confidence: message.confidence,
  };
};

const normalizeResponse = (conversationId: string, response: BackendChatResponse): ChatResponse => ({
  id: response.id || Math.random().toString(36).slice(2, 11),
  conversationId: response.conversationId || response.conversation_id || conversationId,
  agentResponse: response.agentResponse || response.response || '',
  status: (response.status || 'in-progress') as ChatResponse['status'],
  escalationState: response.escalation_state,
  senderType: response.sender_type,
  liveAgentOnline: response.live_agent_online,
  confidence: response.confidence,
  ticketId: response.ticketId || response.ticket_id,
  agentAssigned: response.agentAssigned || response.agent_assigned,
});

export const sendMessage = async (
  conversationId: string,
  message: string,
  metadata?: Record<string, any>
): Promise<ChatResponse> => {
  if (metadata) {
    // metadata is accepted for compatibility with the UI layer.
  }

  if (useMockApi) {
    return mockSendMessage(conversationId, message);
  }

  try {
    const response = await apiClient.post(`/api/v1/tickets/${conversationId}/messages`, {
      message,
      body: message,
      sender_type: 'requestor',
      metadata,
    });
    return normalizeResponse(conversationId, response.data as BackendChatResponse);
  } catch {
    const response = await apiClient.post('/chat', {
      conversationId,
      message,
      metadata,
    });
    return normalizeResponse(conversationId, response.data as BackendChatResponse);
  }
};

export const getConversationHistory = async (
  conversationId: string
): Promise<ChatMessage[]> => {
  if (useMockApi) {
    return mockGetConversationHistory(conversationId);
  }

  try {
    const response = await apiClient.get(`/api/v1/tickets/${conversationId}/messages`);
    return (response.data as BackendMessage[])
      .map((item) => normalizeMessage(conversationId, item))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch {
    const response = await apiClient.get(`/chat/${conversationId}`);
    return (response.data as BackendMessage[])
      .map((item) => normalizeMessage(conversationId, item))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
};

export const sendTicketMessage = async (
  ticketId: string,
  body: string,
  senderType: SenderType = 'requestor'
): Promise<ChatMessage> => {
  if (useMockApi) {
    const timestamp = new Date().toISOString();
    return {
      id: Math.random().toString(36).slice(2, 11),
      conversationId: ticketId,
      role: senderType === 'requestor' ? 'user' : senderType === 'real_agent' ? 'real_agent' : 'assistant',
      senderType,
      content: body,
      timestamp,
    };
  }

  const response = await apiClient.post(`/api/v1/tickets/${ticketId}/messages`, {
    sender_type: senderType,
    body,
  });

  const payload = response.data as SendTicketMessageResponse;
  const normalizedSenderType = normalizeSenderType(payload.sender_type, payload.role || 'real_agent');

  return {
    id: payload.id || Math.random().toString(36).slice(2, 11),
    conversationId: payload.conversationId || payload.conversation_id || ticketId,
    role: normalizeRole(normalizedSenderType, payload.role),
    senderType: normalizedSenderType,
    content: payload.content || payload.body || body,
    timestamp: payload.timestamp || payload.created_at || new Date().toISOString(),
  };
};

export const createConversation = async (): Promise<{ conversationId: string }> => {
  if (useMockApi) {
    return mockCreateConversation();
  }

  try {
    const response = await apiClient.post('/api/v1/tickets', {
      subject: 'Support request',
      channel: 'chat',
    });
    return {
      conversationId: response.data.ticket_id || response.data.id,
    };
  } catch {
    const response = await apiClient.post('/chat/conversations');
    return response.data;
  }
};
