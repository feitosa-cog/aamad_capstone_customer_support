import React from 'react';
import { LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useMockApi } from '../../api/apiConfig';

export interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          {useMockApi && (
            <span className="inline-flex items-center px-2 py-1 mt-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.18em] bg-yellow-100 text-yellow-800">
              Mock API
            </span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
