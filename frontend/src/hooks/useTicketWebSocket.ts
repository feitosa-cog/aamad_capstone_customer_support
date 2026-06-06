import { useEffect } from 'react';
import { useMockApi } from '../api/apiConfig';
import type { EscalationState, SenderType } from '../api/chatApi';

type ConnectionState = 'connecting' | 'live' | 'offline';

interface WebSocketMessagePayload {
  id?: string;
  conversationId?: string;
  conversation_id?: string;
  role?: string;
  senderType?: SenderType;
  sender_type?: SenderType;
  content?: string;
  body?: string;
  timestamp?: string;
  created_at?: string;
  confidence?: number;
}

interface StatusPayload {
  status?: string;
  escalationState?: EscalationState;
  escalation_state?: EscalationState;
}

interface UseTicketWebSocketOptions {
  ticketId: string | null;
  onMessageCreated?: (payload: WebSocketMessagePayload) => void;
  onTyping?: (payload: { senderType: SenderType; isTyping: boolean }) => void;
  onStatusChanged?: (payload: StatusPayload) => void;
  onEscalationRequested?: () => void;
  onEscalationAccepted?: () => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
}

const env = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
const defaultWsBase = 'ws://localhost:8000/api/v1/ws/tickets';

const getStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
    return window.localStorage;
  }

  return {
    getItem: (_key: string) => null,
  };
};

const buildTicketWsUrl = (ticketId: string): string => {
  const configured = env?.VITE_WS_URL || defaultWsBase;
  const base = configured.includes('{ticket_id}')
    ? configured.replace('{ticket_id}', ticketId)
    : `${configured.replace(/\/$/, '')}/${ticketId}`;

  const token = getStorage().getItem('authToken');

  try {
    const url = new URL(base);
    if (token) {
      url.searchParams.set('token', token);
    }
    return url.toString();
  } catch {
    return token ? `${base}${base.includes('?') ? '&' : '?'}token=${token}` : base;
  }
};

export const useTicketWebSocket = ({
  ticketId,
  onMessageCreated,
  onTyping,
  onStatusChanged,
  onEscalationRequested,
  onEscalationAccepted,
  onConnectionStateChange,
}: UseTicketWebSocketOptions) => {
  useEffect(() => {
    if (!ticketId || useMockApi || typeof WebSocket === 'undefined') {
      onConnectionStateChange?.('offline');
      return;
    }

    onConnectionStateChange?.('connecting');
    const socket = new WebSocket(buildTicketWsUrl(ticketId));

    socket.onopen = () => {
      onConnectionStateChange?.('live');
    };

    socket.onclose = () => {
      onConnectionStateChange?.('offline');
    };

    socket.onerror = () => {
      onConnectionStateChange?.('offline');
    };

    socket.onmessage = (event) => {
      let data: any;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      const type = data.type || data.event;
      const payload = data.payload || data.data || data;

      if (type === 'chat.message.created') {
        onMessageCreated?.(payload as WebSocketMessagePayload);
        return;
      }

      if (type === 'chat.typing') {
        const senderType = (payload.sender_type || payload.senderType || 'ai_agent') as SenderType;
        const isTyping = payload.is_typing ?? payload.isTyping ?? true;
        onTyping?.({ senderType, isTyping });
        return;
      }

      if (type === 'ticket.status.changed') {
        onStatusChanged?.(payload as StatusPayload);
        return;
      }

      if (type === 'escalation.requested') {
        onEscalationRequested?.();
        return;
      }

      if (type === 'escalation.accepted') {
        onEscalationAccepted?.();
      }
    };

    return () => {
      socket.close();
    };
  }, [
    ticketId,
    onMessageCreated,
    onTyping,
    onStatusChanged,
    onEscalationRequested,
    onEscalationAccepted,
    onConnectionStateChange,
  ]);
};

export default useTicketWebSocket;