type UserRole = 'admin' | 'agent' | 'viewer';

type ConversationMessage = {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
};

type TicketStatus = 'open' | 'resolved' | 'escalated';

type MockTicket = {
  id: string;
  customerId: string;
  conversationId: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  transcript: ConversationMessage[];
  agentNotes: string;
  priority: 1 | 2 | 3 | 4 | 5;
  category: string;
  resolutionNotes?: string;
  agentAssigned?: string;
};

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

const generateId = (prefix = 'id') => `${prefix}_${Math.random().toString(36).substring(2, 10)}`;

const mockUser: { id: string; email: string; role: UserRole; name: string } = {
  id: 'user-1',
  email: 'admin@example.com',
  role: 'admin',
  name: 'Admin User',
};

let currentConversationId = generateId('conv');
const conversations: Record<string, ConversationMessage[]> = {};

const tickets: MockTicket[] = [
  {
    id: 'ticket-001',
    customerId: 'customer-42',
    conversationId: 'conv-abc123',
    status: 'open',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    transcript: [
      {
        id: generateId('msg'),
        conversationId: 'conv-abc123',
        role: 'user',
        content: 'My order has not arrived.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: generateId('msg'),
        conversationId: 'conv-abc123',
        role: 'assistant',
        content: 'I am checking your delivery status now.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
      },
    ],
    agentNotes: 'Waiting on courier update',
    priority: 3,
    category: 'Order',
    resolutionNotes: '',
    agentAssigned: 'Emma Rogers',
  },
  {
    id: 'ticket-002',
    customerId: 'customer-88',
    conversationId: 'conv-def456',
    status: 'resolved',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    transcript: [
      {
        id: generateId('msg'),
        conversationId: 'conv-def456',
        role: 'user',
        content: 'I need to return an item.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      },
      {
        id: generateId('msg'),
        conversationId: 'conv-def456',
        role: 'assistant',
        content: 'Please follow the return link we sent to your email.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5.5).toISOString(),
      },
    ],
    agentNotes: 'Return label issued',
    priority: 2,
    category: 'Returns',
    resolutionNotes: 'Return completed by customer',
    agentAssigned: 'Luis Martinez',
  },
  {
    id: 'ticket-003',
    customerId: 'customer-11',
    conversationId: 'conv-ghi789',
    status: 'escalated',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    transcript: [
      {
        id: generateId('msg'),
        conversationId: 'conv-ghi789',
        role: 'user',
        content: 'The product is damaged.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        id: generateId('msg'),
        conversationId: 'conv-ghi789',
        role: 'assistant',
        content: 'I am transferring this ticket to our specialist team.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
      },
    ],
    agentNotes: 'Escalated to L2 support',
    priority: 1,
    category: 'Product',
    resolutionNotes: '',
    agentAssigned: 'Priya Singh',
  },
];

export const login = async (email: string, password: string) => {
  await delay();

  if (email === 'admin@example.com' && password === 'password123') {
    const token = 'mock-jwt-token-12345';
    localStorage.setItem('authToken', token);
    return {
      token,
      user: mockUser,
    };
  }

  throw new Error('Invalid email or password');
};

export const logout = async () => {
  await delay(200);
  localStorage.removeItem('authToken');
  return { message: 'Logged out' };
};

export const verifyToken = async (): Promise<{ valid: boolean; user?: { id: string; email: string; role: UserRole; name: string } }> => {
  await delay();
  const token = localStorage.getItem('authToken');
  if (token === 'mock-jwt-token-12345') {
    return { valid: true, user: mockUser };
  }
  return { valid: false };
};

export const refreshToken = async (): Promise<{ token: string; user: { id: string; email: string; role: UserRole; name: string } }> => {
  await delay();
  const token = 'mock-jwt-token-12345';
  localStorage.setItem('authToken', token);
  return { token, user: mockUser };
};

export const createConversation = async () => {
  await delay();
  currentConversationId = generateId('conv');
  conversations[currentConversationId] = [];
  return { conversationId: currentConversationId };
};

export const getConversationHistory = async (conversationId: string) => {
  await delay();
  return conversations[conversationId] || [];
};

export const sendMessage = async (
  conversationId: string,
  message: string
) => {
  await delay(600);
  const normalized = message.toLowerCase();

  const responseText = normalized.includes('agent')
    ? 'I am connecting you to a live agent now.'
    : normalized.includes('return')
    ? 'I can help with that return. Please share your order number.'
    : normalized.includes('order')
    ? 'Your order is on its way. It should arrive within 2 business days.'
    : 'Thanks for your message. I am reviewing your request and will respond shortly.';

  const response = {
    id: generateId('msg'),
    conversationId,
    agentResponse: responseText,
    status: (normalized.includes('agent') ? 'escalated' : 'resolved') as 'resolved' | 'escalated',
    confidence: 0.93,
    ticketId: normalized.includes('order') ? 'ticket-001' : 'ticket-002',
    agentAssigned: normalized.includes('agent') ? 'Live Support Agent' : undefined,
  };

  const messageRecord: ConversationMessage = {
    id: generateId('msg'),
    conversationId,
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
  };

  const assistantRecord: ConversationMessage = {
    id: response.id,
    conversationId,
    role: 'assistant',
    content: responseText,
    timestamp: new Date().toISOString(),
  };

  conversations[conversationId] = [...(conversations[conversationId] || []), messageRecord, assistantRecord];
  return response;
};

export const getTickets = async (page = 1, limit = 20, status?: string) => {
  await delay();
  const filtered = status ? tickets.filter((ticket) => ticket.status === status) : tickets;
  const start = (page - 1) * limit;
  return {
    data: filtered.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total: filtered.length,
    },
  };
};

export const getTicketDetail = async (ticketId: string) => {
  await delay();
  const ticket = tickets.find((item) => item.id === ticketId);
  if (!ticket) {
    throw new Error('Ticket not found');
  }
  return ticket;
};

export const updateTicket = async (ticketId: string, updates: Record<string, any>) => {
  await delay();
  const index = tickets.findIndex((item) => item.id === ticketId);
  if (index < 0) {
    throw new Error('Ticket not found');
  }
  tickets[index] = {
    ...tickets[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return tickets[index];
};

export const escalateTicket = async (ticketId: string, reason: string) => {
  await delay();
  return updateTicket(ticketId, { status: 'escalated', agentNotes: reason });
};

export const assignTicket = async (ticketId: string, agentId: string) => {
  await delay();
  return updateTicket(ticketId, { agentAssigned: agentId });
};

export const getDashboardMetrics = async () => {
  await delay();
  return {
    ticketMetrics: {
      total: tickets.length,
      resolved: tickets.filter((ticket) => ticket.status === 'resolved').length,
      escalated: tickets.filter((ticket) => ticket.status === 'escalated').length,
      avgResolutionTime: 24,
    },
    agentMetrics: {
      activeAgents: 5,
      avgHandleTime: 12,
      csat: 4.7,
    },
    trends: {
      ticketsPerHour: [8, 12, 15, 10, 7, 5, 11, 14],
      resolutionRatePerDay: [0.8, 0.85, 0.9, 0.75, 0.95],
    },
  };
};

export const getTicketMetrics = async (_startDate: string, _endDate: string) => {
  await delay();
  return {
    total: tickets.length,
    resolved: tickets.filter((ticket) => ticket.status === 'resolved').length,
    escalated: tickets.filter((ticket) => ticket.status === 'escalated').length,
  };
};

export const getAgentMetrics = async (agentId?: string) => {
  await delay();
  return {
    agentId: agentId || 'all',
    activeAgents: 5,
    avgHandleTime: 12,
    csat: 4.7,
  };
};
