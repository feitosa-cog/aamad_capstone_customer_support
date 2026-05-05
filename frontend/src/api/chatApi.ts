import apiClient from './client';
import {
  createConversation as mockCreateConversation,
  getConversationHistory as mockGetConversationHistory,
  sendMessage as mockSendMessage,
} from './mockApi';
import { useMockApi } from './apiConfig';

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  confidence?: number;
}

export interface ChatResponse {
  id: string;
  conversationId: string;
  agentResponse: string;
  status: 'resolved' | 'escalated' | 'in-progress';
  confidence?: number;
  ticketId?: string;
  agentAssigned?: string;
}

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

  const response = await apiClient.post('/chat', {
    conversationId,
    message,
    metadata,
  });
  return response.data;
};

export const getConversationHistory = async (
  conversationId: string
): Promise<ChatMessage[]> => {
  if (useMockApi) {
    return mockGetConversationHistory(conversationId);
  }

  const response = await apiClient.get(`/chat/${conversationId}`);
  return response.data;
};

export const createConversation = async (): Promise<{ conversationId: string }> => {
  if (useMockApi) {
    return mockCreateConversation();
  }

  const response = await apiClient.post('/chat/conversations');
  return response.data;
};
