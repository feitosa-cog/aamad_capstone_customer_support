import { create } from 'zustand';
import { Ticket } from '../api/ticketApi';

export interface TicketState {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: string;
    page: number;
    limit: number;
  };
  
  setTickets: (tickets: Ticket[]) => void;
  addTicket: (ticket: Ticket) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  selectTicket: (ticket: Ticket | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<TicketState['filters']>) => void;
}

export const useTicketStore = create<TicketState>((set) => ({
  tickets: [],
  selectedTicket: null,
  isLoading: false,
  error: null,
  filters: {
    status: undefined,
    page: 1,
    limit: 20,
  },
  
  setTickets: (tickets) => set({ tickets }),
  
  addTicket: (ticket) =>
    set((state) => ({
      tickets: [ticket, ...state.tickets],
    })),
  
  updateTicket: (id, updates) =>
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
      selectedTicket: state.selectedTicket?.id === id
        ? { ...state.selectedTicket, ...updates }
        : state.selectedTicket,
    })),
  
  selectTicket: (ticket) => set({ selectedTicket: ticket }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
}));
