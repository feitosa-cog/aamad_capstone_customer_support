import React, { useEffect, useRef, useState } from 'react';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import MessageList from './MessageList';
import InputBox from './InputBox';
import EscalationBanner from './EscalationBanner';
import { useChatStore } from '../../store/chatStore';
import { useUIStore } from '../../store/uiStore';
import { sendMessage, createConversation, ChatMessage, EscalationState } from '../../api/chatApi';
import { useTicketWebSocket } from '../../hooks/useTicketWebSocket';

export interface ChatContainerProps {
  position?: 'bottom-right' | 'bottom-left';
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  position = 'bottom-right',
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [escalationState, setEscalationState] = useState<EscalationState>('OPEN');
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'live' | 'offline'>('offline');
  const {
    conversationId,
    messages,
    isLoading,
    error,
    setConversationId,
    addMessage,
    setLoading,
    setError,
  } = useChatStore();
  const { addNotification } = useUIStore();
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const appendUniqueMessage = (message: ChatMessage) => {
    if (messagesRef.current.some((item) => item.id === message.id)) {
      return;
    }

    messagesRef.current = [...messagesRef.current, message];
    addMessage(message);
  };

  useTicketWebSocket({
    ticketId: conversationId,
    onConnectionStateChange: setConnectionState,
    onMessageCreated: (payload) => {
      if (!conversationId) {
        return;
      }

      const senderType = payload.sender_type || payload.senderType || 'ai_agent';
      const message: ChatMessage = {
        id: payload.id || Math.random().toString(36).substr(2, 9),
        conversationId,
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
      if (senderType === 'requestor') {
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
    onEscalationRequested: () => {
      if (!conversationId) {
        return;
      }

      setEscalationState('ESCALATION_REQUESTED');
      appendUniqueMessage({
        id: `sys_escalation_requested_${Date.now()}`,
        conversationId,
        role: 'system',
        senderType: 'system',
        content: 'Escalation requested. A real agent will join shortly.',
        timestamp: new Date().toISOString(),
      });
    },
    onEscalationAccepted: () => {
      if (!conversationId) {
        return;
      }

      setEscalationState('HUMAN_ACTIVE');
      appendUniqueMessage({
        id: `sys_escalation_accepted_${Date.now()}`,
        conversationId,
        role: 'system',
        senderType: 'system',
        content: 'A real agent joined your chat.',
        timestamp: new Date().toISOString(),
      });
    },
  });

  // Initialize conversation on mount
  useEffect(() => {
    const initConversation = async () => {
      try {
        if (!conversationId) {
          const { conversationId: newId } = await createConversation();
          setConversationId(newId);
        }
      } catch (err) {
        console.error('Failed to create conversation:', err);
        setError('Failed to start chat. Please refresh.');
      }
    };

    initConversation();
  }, [conversationId, setConversationId, setError]);

  const handleSendMessage = async (text: string) => {
    if (!conversationId) {
      setError('Chat not initialized');
      return;
    }

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      conversationId,
      role: 'user',
      senderType: 'requestor',
      content: text,
      timestamp: new Date().toISOString(),
    };
    appendUniqueMessage(userMessage);

    setLoading(true);
    setError(null);

    try {
      const response = await sendMessage(conversationId, text, { source: 'widget' });

      // Add agent response
      const assistantMessage: ChatMessage = {
        id: response.id,
        conversationId,
        role: response.senderType === 'real_agent' ? 'real_agent' : 'assistant',
        senderType: response.senderType || 'ai_agent',
        content: response.agentResponse,
        timestamp: new Date().toISOString(),
        confidence: response.confidence,
      };
      appendUniqueMessage(assistantMessage);

      const nextEscalationState = response.escalationState || (response.status === 'escalated' ? 'ESCALATION_QUEUED' : 'OPEN');
      setEscalationState(nextEscalationState);

      if (nextEscalationState === 'ESCALATION_REQUESTED' || nextEscalationState === 'ESCALATION_QUEUED') {
        appendUniqueMessage({
          id: Math.random().toString(36).substr(2, 9),
          conversationId,
          role: 'system',
          senderType: 'system',
          content: 'Escalation requested. A real agent will join shortly.',
          timestamp: new Date().toISOString(),
        });
      }

      if (nextEscalationState === 'HUMAN_ACTIVE') {
        appendUniqueMessage({
          id: Math.random().toString(36).substr(2, 9),
          conversationId,
          role: 'system',
          senderType: 'system',
          content: 'A real agent joined your chat.',
          timestamp: new Date().toISOString(),
        });
      }

      if (nextEscalationState === 'HUMAN_RESOLVED') {
        appendUniqueMessage({
          id: Math.random().toString(36).substr(2, 9),
          conversationId,
          role: 'system',
          senderType: 'system',
          content: 'Your ticket was resolved by a real agent.',
          timestamp: new Date().toISOString(),
        });
      }

      // Handle status changes
      if (response.status === 'escalated') {
        addNotification({
          type: 'info',
          message: 'Your chat has been escalated to a human agent.',
          duration: 5000,
        });
      } else if (response.status === 'resolved') {
        addNotification({
          type: 'success',
          message: `Ticket #${response.ticketId} created.`,
          duration: 5000,
        });
      }

      if (response.agentAssigned) {
        const systemMessage: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          conversationId,
          role: 'system',
          senderType: 'system',
          content: `You are now chatting with ${response.agentAssigned}`,
          timestamp: new Date().toISOString(),
        };
        appendUniqueMessage(systemMessage);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center"
      >
        <span className="text-2xl">💬</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed ${
        position === 'bottom-right' ? 'bottom-4 right-4' : 'bottom-4 left-4'
      } w-96 max-w-[calc(100vw-32px)] h-96 bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200 z-50`}
    >
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Support Assistant</h3>
          <p className="text-xs text-blue-100">
            {isLoading
              ? 'Processing...'
              : connectionState === 'live'
              ? 'Live updates connected'
              : 'Online'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-blue-700 p-1 rounded"
          >
            {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-blue-700 p-1 rounded"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-2">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Messages and Input */}
      {!isMinimized && (
        <>
          <EscalationBanner escalationState={escalationState} />
          <MessageList
            messages={messages}
            isLoading={isLoading || remoteTyping}
            typingLabel={
              remoteTyping && escalationState === 'HUMAN_ACTIVE'
                ? 'Real agent is typing...'
                : remoteTyping
                ? 'Agent is typing...'
                : 'AI assistant is typing...'
            }
          />
          <InputBox onSend={handleSendMessage} isLoading={isLoading} />
        </>
      )}
    </div>
  );
};

export default ChatContainer;
