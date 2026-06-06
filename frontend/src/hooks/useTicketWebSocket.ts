import { useCallback, useEffect, useRef, useState } from 'react';
import { useMockApi } from '../api/apiConfig';
import { getConversationHistory } from '../api/chatApi';
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
  state?: EscalationState;
}

interface UseTicketWebSocketOptions {
  ticketId: string | null;
  onMessageCreated?: (payload: WebSocketMessagePayload) => void;
  onTyping?: (payload: { senderType: SenderType; isTyping: boolean }) => void;
  onStatusChanged?: (payload: StatusPayload) => void;
  onEscalationRequested?: () => void;
  onEscalationAccepted?: () => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
  onTicketMissing?: () => void;
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
  onTicketMissing,
}: UseTicketWebSocketOptions) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('offline');
  const hasSyncedLiveRef = useRef(false);
  const missingTicketRef = useRef(false);

  useEffect(() => {
    missingTicketRef.current = false;
  }, [ticketId]);

  const syncHistory = useCallback(async () => {
    if (!ticketId || missingTicketRef.current) {
      return;
    }

    try {
      const history = await getConversationHistory(ticketId);
      history.forEach((message) => {
        onMessageCreated?.({
          id: message.id,
          conversationId: message.conversationId,
          sender_type: message.senderType,
          content: message.content,
          created_at: message.timestamp,
        });
      });
    } catch (error: any) {
      const statusCode = error?.response?.status;
      if (statusCode === 404 || statusCode === 403) {
        missingTicketRef.current = true;
        setConnectionState('offline');
        onConnectionStateChange?.('offline');
        onTicketMissing?.();
        return;
      }
      // Keep the UI responsive when catch-up fails; the next poll/reconnect will retry.
    }
  }, [ticketId, onMessageCreated, onConnectionStateChange, onTicketMissing]);

  useEffect(() => {
    if (!ticketId || useMockApi || typeof WebSocket === 'undefined') {
      setConnectionState('offline');
      onConnectionStateChange?.('offline');
      return;
    }

    hasSyncedLiveRef.current = false;
    setConnectionState('connecting');
    onConnectionStateChange?.('connecting');
    const socket = new WebSocket(buildTicketWsUrl(ticketId));

    socket.onopen = () => {
      setConnectionState('live');
      onConnectionStateChange?.('live');
      socket.send(
        JSON.stringify({
          type: 'subscribe',
          ticket_id: ticketId,
        })
      );
    };

    socket.onclose = () => {
      setConnectionState('offline');
      onConnectionStateChange?.('offline');
    };

    socket.onerror = () => {
      setConnectionState('offline');
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
        const messagePayload = (payload as any).message || payload;
        onMessageCreated?.(messagePayload as WebSocketMessagePayload);
        return;
      }

      if (type === 'chat.typing') {
        const senderType = (payload.sender_type || payload.senderType || 'ai_agent') as SenderType;
        const isTyping = payload.is_typing ?? payload.isTyping ?? true;
        onTyping?.({ senderType, isTyping });
        return;
      }

      if (type === 'ticket.status.changed') {
        const statusPayload = payload as StatusPayload;
        onStatusChanged?.({
          ...statusPayload,
          escalationState: statusPayload.escalationState || statusPayload.escalation_state || statusPayload.state,
          escalation_state: statusPayload.escalation_state || statusPayload.escalationState || statusPayload.state,
        });
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

  useEffect(() => {
    if (useMockApi || !ticketId) {
      return;
    }

    if (missingTicketRef.current) {
      return;
    }

    if (connectionState === 'live' && !hasSyncedLiveRef.current) {
      hasSyncedLiveRef.current = true;
      void syncHistory();
      return;
    }

    if (connectionState !== 'offline') {
      return;
    }

    const poller = window.setInterval(() => {
      void syncHistory();
    }, 5000);

    return () => {
      window.clearInterval(poller);
    };
  }, [connectionState, ticketId, syncHistory]);
};

export default useTicketWebSocket;