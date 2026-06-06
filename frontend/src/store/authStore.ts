import { create } from 'zustand';
import type { User } from '../api/authApi';

const getStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
    return window.localStorage;
  }

  return {
    getItem: (_key: string) => null,
    setItem: (_key: string, _value: string) => undefined,
    removeItem: (_key: string) => undefined,
  };
};

export interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

const parseStoredUser = (): User | null => {
  const storage = getStorage();
  const stored = storage.getItem('authUser');
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as User;
  } catch {
    storage.removeItem('authUser');
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: getStorage().getItem('authToken'),
  user: parseStoredUser(),
  isLoading: false,
  error: null,
  
  login: (token, user) => {
    const storage = getStorage();
    storage.setItem('authToken', token);
    storage.setItem('authUser', JSON.stringify(user));
    set({ token, user, error: null });
  },
  
  logout: () => {
    const storage = getStorage();
    storage.removeItem('authToken');
    storage.removeItem('authUser');
    set({ token: null, user: null });
  },

  setUser: (user) => {
    const storage = getStorage();
    if (user) {
      storage.setItem('authUser', JSON.stringify(user));
    } else {
      storage.removeItem('authUser');
    }

    set({ user });
  },
  
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
