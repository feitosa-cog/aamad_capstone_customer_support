import React from 'react';
import Header from '../components/Common/Header';
import ActiveTickets from '../components/Agent/ActiveTickets';
import ContextPanel from '../components/Agent/ContextPanel';
import ResponseEditor from '../components/Agent/ResponseEditor';

export const AgentPage: React.FC = () => {
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
