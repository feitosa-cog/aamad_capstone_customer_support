import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface UIState {
  notifications: Notification[];
  sidebarOpen: boolean;
  
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  notifications: [],
  sidebarOpen: true,
  
  addNotification: (notification) =>
    set((state) => {
      const id = Math.random().toString(36).substr(2, 9);
      const fullNotification = { ...notification, id };
      
      if (notification.duration) {
        setTimeout(() => {
          set((s) => ({
            notifications: s.notifications.filter((n) => n.id !== id),
          }));
        }, notification.duration);
      }
      
      return {
        notifications: [...state.notifications, fullNotification],
      };
    }),
  
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  
  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
