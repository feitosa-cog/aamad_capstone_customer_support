import React, { useEffect, useState } from 'react';
import { AlertTriangle, History, ListChecks, UserCircle } from 'lucide-react';
import { getHandoffContext, type HandoffContext } from '../../api/ticketApi';

interface HandoffDataPaneProps {
  ticketId: string;
}

export const HandoffDataPane: React.FC<HandoffDataPaneProps> = ({ ticketId }) => {
  const [context, setContext] = useState<HandoffContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContext = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getHandoffContext(ticketId);
        setContext(response);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load handoff context';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    void loadContext();
  }, [ticketId]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <p className="text-sm text-gray-500">Loading handoff context...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <p className="text-sm text-gray-500">No handoff context available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Handoff Data</h2>
        <p className="text-xs text-gray-500 mt-1">Ticket {context.ticket_id}</p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
          <AlertTriangle size={16} />
          Escalation
        </h3>
        <div className="mt-2 space-y-1 text-sm text-amber-900">
          <p>Reason: {context.escalation.reason}</p>
          <p>Priority: {context.escalation.priority}</p>
          <p>Requested: {new Date(context.escalation.requested_at).toLocaleString()}</p>
          <p>Queue wait: {context.escalation.queue_wait_seconds}s</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <ListChecks size={16} />
          AI Summary
        </h3>
        <div className="mt-2 space-y-2 text-sm text-gray-700">
          <p>Intent: {context.ai_summary.intent}</p>
          <p>Resolution attempts: {context.ai_summary.resolution_attempts}</p>
          <p>Last AI message: {context.ai_summary.last_ai_message}</p>
          <div>
            <p className="font-medium text-gray-900">Attempted actions</p>
            <ul className="mt-1 list-disc list-inside">
              {context.ai_summary.attempted_actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <UserCircle size={16} />
          Customer Context
        </h3>
        <div className="mt-2 space-y-1 text-sm text-gray-700">
          <p>User ID: {context.customer_context.user_id}</p>
          <p>Open tickets: {context.customer_context.open_ticket_count}</p>
          <div>
            <p className="font-medium text-gray-900">Recent tickets</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {context.customer_context.recent_ticket_ids.map((ticket) => (
                <span
                  key={ticket}
                  className="inline-flex items-center rounded-full bg-white border border-gray-300 px-2 py-0.5 text-xs"
                >
                  <History size={12} className="mr-1" />
                  {ticket}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandoffDataPane;
