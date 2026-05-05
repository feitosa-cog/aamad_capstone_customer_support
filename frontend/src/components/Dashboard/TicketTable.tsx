import React, { useEffect } from 'react';
import { SkeletonTable } from '../Common/Skeleton';
import { useTicketStore } from '../../store/ticketStore';
import { getTickets } from '../../api/ticketApi';
import clsx from 'clsx';

export const TicketTable: React.FC = () => {
  const { tickets, isLoading, filters, setTickets, selectTicket, setLoading } = useTicketStore();

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const response = await getTickets(filters.page, filters.limit, filters.status);
        setTickets(response.data);
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [filters, setTickets, setLoading]);

  if (isLoading) {
    return <SkeletonTable />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-600">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-900 font-semibold">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition"
              onClick={() => selectTicket(ticket)}
            >
              <td className="px-4 py-3 font-mono text-xs">{ticket.id.slice(0, 8)}</td>
              <td className="px-4 py-3">{ticket.customerId}</td>
              <td className="px-4 py-3">{ticket.category}</td>
              <td className="px-4 py-3">
                <span
                  className={clsx('px-2 py-1 rounded-full text-xs font-semibold', {
                    'bg-green-100 text-green-800': ticket.status === 'resolved',
                    'bg-yellow-100 text-yellow-800': ticket.status === 'open',
                    'bg-red-100 text-red-800': ticket.status === 'escalated',
                  })}
                >
                  {ticket.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={clsx('px-2 py-1 rounded-full text-xs font-semibold', {
                    'bg-red-100 text-red-800': ticket.priority <= 2,
                    'bg-yellow-100 text-yellow-800': ticket.priority === 3,
                    'bg-green-100 text-green-800': ticket.priority >= 4,
                  })}
                >
                  P{ticket.priority}
                </span>
              </td>
              <td className="px-4 py-3 text-xs">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    selectTicket(ticket);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {tickets.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <p>No tickets found</p>
        </div>
      )}
    </div>
  );
};

export default TicketTable;
