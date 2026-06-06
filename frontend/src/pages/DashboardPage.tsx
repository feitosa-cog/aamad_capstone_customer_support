import React, { useState } from 'react';
import Header from '../components/Common/Header';
import TicketTable from '../components/Dashboard/TicketTable';
import TicketDetail from '../components/Dashboard/TicketDetail';
import Analytics from '../components/Dashboard/Analytics';
import { useAuthStore } from '../store/authStore';
import clsx from 'clsx';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const canViewAnalytics = user?.role !== 'REQUESTOR';
  const [activeTab, setActiveTab] = useState<'tickets' | 'analytics'>('tickets');
  const pageTitle = user?.role === 'REQUESTOR' ? 'My Tickets' : 'Dashboard';

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header title={pageTitle} />

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6">
          <nav className="flex gap-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('tickets')}
              className={clsx(
                'px-1 py-4 border-b-2 font-medium text-sm transition',
                {
                  'border-blue-600 text-blue-600': activeTab === 'tickets',
                  'border-transparent text-gray-600 hover:text-gray-900':
                    activeTab !== 'tickets',
                }
              )}
            >
              Tickets
            </button>
            {canViewAnalytics && (
              <button
                onClick={() => setActiveTab('analytics')}
                className={clsx(
                  'px-1 py-4 border-b-2 font-medium text-sm transition',
                  {
                    'border-blue-600 text-blue-600': activeTab === 'analytics',
                    'border-transparent text-gray-600 hover:text-gray-900':
                      activeTab !== 'analytics',
                  }
                )}
              >
                Analytics
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex gap-6 p-6">
          <div className="flex-1 overflow-auto">
            {activeTab === 'tickets' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <TicketTable />
              </div>
            )}
            {activeTab === 'analytics' && canViewAnalytics && (
              <div>
                <Analytics />
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {activeTab === 'tickets' && (
            <div className="w-96 hidden lg:flex flex-col">
              <TicketDetail />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
