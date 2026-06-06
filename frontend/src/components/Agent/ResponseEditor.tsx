import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { acceptQueueTicket, resolveQueueTicket } from '../../api/ticketApi';
import { useTicketStore } from '../../store/ticketStore';
import { useUIStore } from '../../store/uiStore';

export const ResponseEditor: React.FC = () => {
  const [response, setResponse] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { selectedTicket, updateTicket } = useTicketStore();
  const { addNotification } = useUIStore();

  const handleSend = async () => {
    if (!selectedTicket || !response.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      if (selectedTicket.status === 'escalated') {
        const accepted = await acceptQueueTicket(selectedTicket.id);
        updateTicket(selectedTicket.id, accepted);
      }

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
          disabled
        >
          Quick Reply
        </button>
        <button
          onClick={handleSend}
          disabled={!selectedTicket || !response.trim() || isSaving}
          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
        >
          <Send size={16} />
          {isSaving ? 'Sending...' : 'Send'}
        </button>
      </div>

      <button className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-left" disabled>
        🤖 Suggest Response
      </button>
    </div>
  );
};

export default ResponseEditor;
