import React, { useEffect } from 'react';
import Header from '../components/Common/Header';
import ActiveTickets from '../components/Agent/ActiveTickets';
import ContextPanel from '../components/Agent/ContextPanel';
import ResponseEditor from '../components/Agent/ResponseEditor';
import { getQueueTickets } from '../api/ticketApi';
import { useTicketStore } from '../store/ticketStore';
import { useUIStore } from '../store/uiStore';

export const AgentPage: React.FC = () => {
  const { setTickets } = useTicketStore();
  const { addNotification } = useUIStore();

  useEffect(() => {
    const loadQueue = async () => {
      try {
        const queue = await getQueueTickets();
        setTickets(queue);
      } catch (error) {
        console.error('Failed to load queue:', error);
        addNotification({
          type: 'error',
          message: 'Failed to load agent queue',
          duration: 4000,
        });
      }
    };

    loadQueue();
  }, [addNotification, setTickets]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header title="Agent Workspace" />

      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Left: Ticket Queue */}
          <div className="lg:col-span-1">
            <ActiveTickets />
          </div>

          {/* Right: Context and Response */}
          <div className="lg:col-span-2 space-y-6">
            <ContextPanel />
            <ResponseEditor />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPage;
