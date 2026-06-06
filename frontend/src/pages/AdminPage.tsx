import React, { useState } from 'react';
import clsx from 'clsx';
import Header from '../components/Common/Header';
import UserManagement from '../components/Admin/UserManagement';
import SystemHealth from '../components/Admin/SystemHealth';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'health'>('users');

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header title="Admin Console" />

      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex gap-8" aria-label="Admin tabs">
          <button
            onClick={() => setActiveTab('users')}
            className={clsx('px-1 py-4 border-b-2 font-medium text-sm transition', {
              'border-blue-600 text-blue-600': activeTab === 'users',
              'border-transparent text-gray-600 hover:text-gray-900': activeTab !== 'users',
            })}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={clsx('px-1 py-4 border-b-2 font-medium text-sm transition', {
              'border-blue-600 text-blue-600': activeTab === 'health',
              'border-transparent text-gray-600 hover:text-gray-900': activeTab !== 'health',
            })}
          >
            System Health
          </button>
        </nav>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'users' ? <UserManagement /> : <SystemHealth />}
      </div>
    </div>
  );
};

export default AdminPage;