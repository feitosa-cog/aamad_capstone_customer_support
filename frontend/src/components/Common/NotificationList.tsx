import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { X } from 'lucide-react';

export const NotificationList: React.FC = () => {
  const { notifications, removeNotification } = useUIStore();

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white max-w-xs flex items-start justify-between gap-2 ${
            {
              success: 'bg-green-600',
              error: 'bg-red-600',
              warning: 'bg-amber-600',
              info: 'bg-blue-600',
            }[notification.type]
          }`}
        >
          <p className="text-sm">{notification.message}</p>
          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 mt-0.5"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationList;
