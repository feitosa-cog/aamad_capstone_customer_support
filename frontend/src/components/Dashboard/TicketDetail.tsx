import React, { useEffect, useState } from 'react';
import { X, Copy, Download } from 'lucide-react';
import { useTicketStore } from '../../store/ticketStore';
import { updateTicket } from '../../api/ticketApi';
import clsx from 'clsx';

export const TicketDetail: React.FC = () => {
  const { selectedTicket, selectTicket, updateTicket: updateStore } = useTicketStore();
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (selectedTicket) {
      setNotes(selectedTicket.agentNotes || '');
    }
  }, [selectedTicket]);

  if (!selectedTicket) {
    return (
      <div className="p-6 text-center text-gray-500">
        Select a ticket to view details
      </div>
    );
  }

  const handleSaveNotes = async () => {
    setIsLoading(true);
    try {
      const updated = await updateTicket(selectedTicket.id, { agentNotes: notes });
      updateStore(selectedTicket.id, updated);
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async () => {
    setIsLoading(true);
    try {
      const updated = await updateTicket(selectedTicket.id, {
        status: 'resolved',
        agentNotes: notes,
      });
      updateStore(selectedTicket.id, updated);
    } catch (error) {
      console.error('Failed to resolve ticket:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Ticket Details</h2>
        <button
          onClick={() => selectTicket(null)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Ticket Info */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Ticket Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Ticket ID:</span>
              <span className="font-mono flex items-center gap-2">
                {selectedTicket.id}
                <Copy size={14} className="cursor-pointer hover:text-blue-600" />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={clsx('px-2 py-1 rounded-full text-xs font-semibold', {
                'bg-green-100 text-green-800': selectedTicket.status === 'resolved',
                'bg-yellow-100 text-yellow-800': selectedTicket.status === 'open',
                'bg-red-100 text-red-800': selectedTicket.status === 'escalated',
              })}>
                {selectedTicket.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Priority:</span>
              <span>P{selectedTicket.priority}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Category:</span>
              <span>{selectedTicket.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span>{new Date(selectedTicket.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Transcript */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Conversation</h3>
          <div className="space-y-2 text-sm bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
            {selectedTicket.transcript.map((msg, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-2 last:border-b-0">
                <span className="font-semibold text-gray-900">{msg.role}:</span>
                <p className="text-gray-700 mt-1">{msg.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Agent Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this ticket..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            rows={4}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={handleSaveNotes}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400"
        >
          Save Notes
        </button>
        <button
          onClick={handleResolve}
          disabled={isLoading || selectedTicket.status === 'resolved'}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          Mark as Resolved
        </button>
        <button
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Download size={18} />
          Export
        </button>
      </div>
    </div>
  );
};

export default TicketDetail;
