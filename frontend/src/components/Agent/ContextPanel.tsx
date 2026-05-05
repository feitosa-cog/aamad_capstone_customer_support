import React from 'react';
import { useTicketStore } from '../../store/ticketStore';
import { BookOpen } from 'lucide-react';

export const ContextPanel: React.FC = () => {
  const { selectedTicket } = useTicketStore();

  if (!selectedTicket) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center text-gray-500">
        Select a ticket to view context
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Customer Info</h3>
        <div className="space-y-1 text-sm">
          <p>
            <span className="text-gray-600">ID:</span> {selectedTicket.customerId}
          </p>
          <p>
            <span className="text-gray-600">Category:</span> {selectedTicket.category}
          </p>
          <p>
            <span className="text-gray-600">Created:</span>{' '}
            {new Date(selectedTicket.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="font-semibold text-gray-900 mb-2">Conversation</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {selectedTicket.transcript.map((msg, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg text-sm ${
                msg.role === 'customer' ? 'bg-blue-50' : 'bg-gray-50'
              }`}
            >
              <p className="font-semibold text-xs text-gray-600 mb-1 capitalize">
                {msg.role}
              </p>
              <p className="text-gray-900 break-words">{msg.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KB Suggestions */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <BookOpen size={16} />
          Suggested KB Articles
        </h3>
        <div className="space-y-2">
          <button className="w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-700 transition">
            📖 How to track your order
          </button>
          <button className="w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-700 transition">
            📖 Return policy and process
          </button>
          <button className="w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-700 transition">
            📖 Refund status check
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContextPanel;
