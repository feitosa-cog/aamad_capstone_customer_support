import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useTicketStore } from '../../store/ticketStore';

export const ActiveTickets: React.FC = () => {
  const { tickets, selectedTicket, selectTicket } = useTicketStore();

  const openTickets = tickets.filter((t) => t.status === 'open');
  const escalatedTickets = tickets.filter((t) => t.status === 'escalated');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock size={20} className="text-blue-600" />
        Active Queue
      </h2>

      <div className="space-y-2">
        {escalatedTickets.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
              <AlertCircle size={16} />
              Escalated ({escalatedTickets.length})
            </h3>
            <div className="space-y-1 mb-4 border-b border-gray-200 pb-4">
              {escalatedTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => selectTicket(ticket)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    selectedTicket?.id === ticket.id
                      ? 'bg-red-100 text-red-900 font-semibold'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="font-medium truncate">
                    {ticket.category} - {ticket.customerId}
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(ticket.createdAt).toLocaleTimeString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <Clock size={16} />
          Open ({openTickets.length})
        </h3>
        <div className="space-y-1">
          {openTickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => selectTicket(ticket)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                selectedTicket?.id === ticket.id
                  ? 'bg-blue-100 text-blue-900 font-semibold'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="font-medium truncate">
                {ticket.category} - {ticket.customerId}
              </div>
              <div className="text-xs text-gray-600">
                P{ticket.priority} • {new Date(ticket.createdAt).toLocaleTimeString()}
              </div>
            </button>
          ))}
        </div>

        {openTickets.length === 0 && escalatedTickets.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-green-500" />
            <p className="text-sm">No pending tickets</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveTickets;
