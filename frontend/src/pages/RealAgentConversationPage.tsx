import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Common/Header';
import HandoffDataPane from '../components/Agent/HandoffDataPane';
import MessageList from '../components/ChatWidget/MessageList';
import InputBox from '../components/ChatWidget/InputBox';
import EscalationBanner from '../components/ChatWidget/EscalationBanner';
import { getConversationHistory, sendTicketMessage, type ChatMessage, type EscalationState } from '../api/chatApi';
import { resolveQueueTicket } from '../api/ticketApi';
import { useTicketWebSocket } from '../hooks/useTicketWebSocket';
import { useTicketStore } from '../store/ticketStore';
import { useUIStore } from '../store/uiStore';

export const RealAgentConversationPage: React.FC = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { updateTicket } = useTicketStore();
  const { addNotification } = useUIStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [escalationState, setEscalationState] = useState<EscalationState>('HUMAN_ACTIVE');
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'live' | 'offline'>('offline');

  useEffect(() => {
    if (!ticketId) {
      return;
    }

    const loadHistory = async () => {
      setIsLoadingMessages(true);
      try {
        const history = await getConversationHistory(ticketId);
        setMessages(history);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load conversation history';
        addNotification({ type: 'error', message, duration: 4000 });
      } finally {
        setIsLoadingMessages(false);
      }
    };

    void loadHistory();
  }, [ticketId, addNotification]);

  const appendUniqueMessage = (message: ChatMessage) => {
    setMessages((current) => {
      if (current.some((entry) => entry.id === message.id)) {
        return current;
      }

      return [...current, message].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });
  };

  useTicketWebSocket({
    ticketId: ticketId || null,
    onConnectionStateChange: setConnectionState,
    onTicketMissing: () => {
      addNotification({
        type: 'error',
        message: 'This ticket no longer exists. Returning to the agent queue.',
        duration: 4000,
      });
      navigate('/agent');
    },
    onMessageCreated: (payload) => {
      if (!ticketId) {
        return;
      }

      const senderType = payload.sender_type || payload.senderType || 'ai_agent';
      const message: ChatMessage = {
        id: payload.id || Math.random().toString(36).slice(2, 11),
        conversationId: ticketId,
        role:
          senderType === 'requestor'
            ? 'user'
            : senderType === 'real_agent'
            ? 'real_agent'
            : senderType === 'ai_agent'
            ? 'assistant'
            : 'system',
        senderType,
        content: payload.content || payload.body || '',
        timestamp: payload.timestamp || payload.created_at || new Date().toISOString(),
        confidence: payload.confidence,
      };

      appendUniqueMessage(message);
    },
    onTyping: ({ senderType, isTyping }) => {
      if (senderType === 'real_agent') {
        return;
      }
      setRemoteTyping(isTyping);
    },
    onStatusChanged: (payload) => {
      const nextState = payload.escalation_state || payload.escalationState;
      if (nextState) {
        setEscalationState(nextState);
      }
    },
    onEscalationRequested: () => setEscalationState('ESCALATION_REQUESTED'),
    onEscalationAccepted: () => setEscalationState('HUMAN_ACTIVE'),
  });

  const handleSend = async (text: string) => {
    if (!ticketId) {
      return;
    }

    setIsSending(true);
    try {
      const sentMessage = await sendTicketMessage(ticketId, text, 'real_agent');
      appendUniqueMessage(sentMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message';
      addNotification({ type: 'error', message, duration: 4000 });
    } finally {
      setIsSending(false);
    }
  };

  const handleResolve = async () => {
    if (!ticketId || !resolutionNotes.trim()) {
      return;
    }

    setIsResolving(true);
    try {
      const resolved = await resolveQueueTicket(ticketId, resolutionNotes.trim());
      updateTicket(ticketId, resolved);
      setEscalationState('HUMAN_RESOLVED');
      addNotification({
        type: 'success',
        message: `Resolved ticket ${ticketId.slice(0, 8)}`,
        duration: 3500,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resolve ticket';
      addNotification({ type: 'error', message, duration: 4000 });
    } finally {
      setIsResolving(false);
    }
  };

  const connectionLabel = useMemo(() => {
    if (connectionState === 'live') {
      return 'Live updates connected';
    }
    if (connectionState === 'connecting') {
      return 'Connecting...';
    }
    return 'Offline fallback active';
  }, [connectionState]);

  if (!ticketId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        Missing ticket id.
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header title={`Real Agent Session: ${ticketId}`} />

      <div className="px-6 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <p className="text-sm text-gray-600">{connectionLabel}</p>
        <button
          onClick={() => navigate('/agent')}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back to Queue
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-hidden">
        <div className="lg:col-span-1 overflow-auto">
          <HandoffDataPane ticketId={ticketId} />
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <EscalationBanner escalationState={escalationState} />

          <MessageList
            messages={messages}
            isLoading={isLoadingMessages || isSending || remoteTyping}
            typingLabel={remoteTyping ? 'Requestor is typing...' : 'Loading conversation...'}
          />

          <div className="border-t border-gray-200 p-4 space-y-3">
            <InputBox onSend={handleSend} isLoading={isSending} />

            <textarea
              value={resolutionNotes}
              onChange={(event) => setResolutionNotes(event.target.value)}
              rows={2}
              placeholder="Resolution notes (required to resolve)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            />
            <button
              onClick={handleResolve}
              disabled={!resolutionNotes.trim() || isResolving}
              className="w-full px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 disabled:bg-gray-300"
            >
              {isResolving ? 'Resolving...' : 'Resolve Ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealAgentConversationPage;
