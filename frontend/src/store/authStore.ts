import { create } from 'zustand';

export interface AuthState {
  token: string | null;
  user: { id: string; email: string; role: string; name: string } | null;
  isLoading: boolean;
  error: string | null;
  login: (token: string, user: any) => void;
  logout: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('authToken'),
  user: null,
  isLoading: false,
  error: null,
  
  login: (token, user) => {
    localStorage.setItem('authToken', token);
    set({ token, user, error: null });
  },
  
  logout: () => {
    localStorage.removeItem('authToken');
    set({ token: null, user: null });
  },
  
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
