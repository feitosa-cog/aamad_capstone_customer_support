import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  BarChart3,
  Users,
  Settings,
  X,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import clsx from 'clsx';

export const Sidebar: React.FC = () => {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const location = useLocation();

  const menuItems = [
    { icon: MessageSquare, label: 'Chat', href: '/chat' },
    { icon: BarChart3, label: 'Dashboard', href: '/dashboard' },
    { icon: Users, label: 'Agents', href: '/agent' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white z-40 transform transition-transform duration-200 lg:static lg:transform-none',
          {
            'translate-x-0': sidebarOpen,
            '-translate-x-full': !sidebarOpen,
          }
        )}
      >
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold">Agentic Support</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-gray-800 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map(({ icon: Icon, label, href }) => {
            const isActive = location.pathname === href;
            return (
              <Link
                key={href}
                to={href}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition',
                  {
                    'bg-blue-600 text-white': isActive,
                    'text-gray-300 hover:bg-gray-800': !isActive,
                  }
                )}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
          <p className="text-xs text-gray-400">
            © 2026 Agentic Support
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
