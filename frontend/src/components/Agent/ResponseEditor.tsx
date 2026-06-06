import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { acceptQueueTicket, resolveQueueTicket } from '../../api/ticketApi';
import { useTicketStore } from '../../store/ticketStore';
import { useUIStore } from '../../store/uiStore';

export const ResponseEditor: React.FC = () => {
  const navigate = useNavigate();
  const [response, setResponse] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { selectedTicket, updateTicket } = useTicketStore();
  const { addNotification } = useUIStore();

  const openConversationSession = () => {
    if (!selectedTicket) {
      return;
    }

    navigate(`/agent/conversation/${selectedTicket.id}`);
  };

  const handleAcceptAndOpen = async () => {
    if (!selectedTicket || selectedTicket.status !== 'escalated') {
      return;
    }

    setIsSaving(true);
    try {
      const accepted = await acceptQueueTicket(selectedTicket.id);
      updateTicket(selectedTicket.id, accepted);
      addNotification({
        type: 'success',
        message: `Accepted escalation ${selectedTicket.id.slice(0, 8)}`,
        duration: 3000,
      });
      navigate(`/agent/conversation/${selectedTicket.id}`);
    } catch (error) {
      console.error('Failed to accept escalation:', error);
      addNotification({
        type: 'error',
        message: 'Failed to accept escalation',
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async () => {
    if (!selectedTicket || !response.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const resolved = await resolveQueueTicket(selectedTicket.id, response);
      updateTicket(selectedTicket.id, resolved);
      addNotification({
        type: 'success',
        message: `Resolved ticket ${selectedTicket.id.slice(0, 8)}`,
        duration: 3500,
      });
      setResponse('');
    } catch (error) {
      console.error('Failed to resolve ticket:', error);
      addNotification({
        type: 'error',
        message: 'Failed to send resolution response',
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      <h3 className="font-semibold text-gray-900">Compose Response</h3>
      
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Type your response to the customer..."
        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
        rows={4}
        disabled={!selectedTicket || isSaving}
      />

      <div className="flex gap-2">
        <button
          className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
          onClick={openConversationSession}
          disabled={!selectedTicket || selectedTicket.status === 'resolved'}
        >
          Open Session
        </button>
        <button
          onClick={handleSend}
          disabled={!selectedTicket || !response.trim() || isSaving || selectedTicket.status === 'escalated'}
          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
        >
          <Send size={16} />
          {isSaving ? 'Sending...' : 'Send'}
        </button>
      </div>

      <button
        onClick={handleAcceptAndOpen}
        disabled={!selectedTicket || selectedTicket.status !== 'escalated' || isSaving}
        className="w-full px-4 py-2 text-sm border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300"
      >
        Accept Escalation And Open Live Session
      </button>

      <button className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-left" disabled>
        🤖 Suggest Response
      </button>
    </div>
  );
};

export default ResponseEditor;
