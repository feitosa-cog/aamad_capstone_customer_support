type UserRole = 'REQUESTOR' | 'REAL_AGENT' | 'PLATFORM_ADMIN';

type ConversationMessage = {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'real_agent';
  senderType: 'requestor' | 'ai_agent' | 'real_agent' | 'system';
  content: string;
  timestamp: string;
};

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'escalated';

type MockTicket = {
  id: string;
  customerId: string;
  conversationId: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  escalationRequestedAt?: string;
  queueWaitSeconds?: number;
  transcript: ConversationMessage[];
  agentNotes: string;
  priority: 1 | 2 | 3 | 4 | 5;
  category: string;
  resolutionNotes?: string;
  agentAssigned?: string;
};

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

const generateId = (prefix = 'id') => `${prefix}_${Math.random().toString(36).substring(2, 10)}`;

type MockUser = { id: string; email: string; role: UserRole; name: string; password: string };

const mockUsers: MockUser[] = [
  {
    id: 'req-customer-1',
    email: 'customer@example.com',
    role: 'REQUESTOR',
    name: 'Customer Requestor',
    password: 'requestor123',
  },
  {
    id: 'req-employee-1',
    email: 'employee@acme.com',
    role: 'REQUESTOR',
    name: 'Employee Requestor',
    password: 'requestor123',
  },
  {
    id: 'agent-1',
    email: 'agent1@company.com',
    role: 'REAL_AGENT',
    name: 'Agent One',
    password: 'agent123',
  },
  {
    id: 'agent-2',
    email: 'agent2@company.com',
    role: 'REAL_AGENT',
    name: 'Agent Two',
    password: 'agent123',
  },
  {
    id: 'admin-1',
    email: 'admin@company.com',
    role: 'PLATFORM_ADMIN',
    name: 'Platform Administrator',
    password: 'admin123',
  },
  {
    id: 'admin-legacy-1',
    email: 'admin@example.com',
    role: 'PLATFORM_ADMIN',
    name: 'Admin User',
    password: 'password123',
  },
];

const getSanitizedUser = (user: MockUser) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  name: user.name,
});

const getCurrentUser = () => {
  const email = localStorage.getItem('mockAuthEmail');
  if (!email) {
    return null;
  }

  return mockUsers.find((user) => user.email === email) || null;
};

const adminUsers: Array<{ id: string; email: string; name: string; role: UserRole; status: 'active' | 'disabled' }> = [
  { id: 'u-1', email: 'customer@example.com', name: 'Customer Requestor', role: 'REQUESTOR', status: 'active' },
  { id: 'u-2', email: 'employee@acme.com', name: 'Employee Requestor', role: 'REQUESTOR', status: 'active' },
  { id: 'u-3', email: 'agent1@company.com', name: 'Agent One', role: 'REAL_AGENT', status: 'active' },
  { id: 'u-4', email: 'agent2@company.com', name: 'Agent Two', role: 'REAL_AGENT', status: 'active' },
  { id: 'u-5', email: 'admin@company.com', name: 'Platform Administrator', role: 'PLATFORM_ADMIN', status: 'active' },
];

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
        senderType: 'requestor',
        content: 'My order has not arrived.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: generateId('msg'),
        conversationId: 'conv-abc123',
        role: 'assistant',
        senderType: 'ai_agent',
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
        senderType: 'requestor',
        content: 'I need to return an item.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      },
      {
        id: generateId('msg'),
        conversationId: 'conv-def456',
        role: 'assistant',
        senderType: 'ai_agent',
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
    escalationRequestedAt: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    queueWaitSeconds: 420,
    transcript: [
      {
        id: generateId('msg'),
        conversationId: 'conv-ghi789',
        role: 'user',
        senderType: 'requestor',
        content: 'The product is damaged.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        id: generateId('msg'),
        conversationId: 'conv-ghi789',
        role: 'assistant',
        senderType: 'ai_agent',
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

  const user = mockUsers.find((candidate) => candidate.email === email && candidate.password === password);

  if (user) {
    const token = 'mock-jwt-token-12345';
    localStorage.setItem('authToken', token);
    localStorage.setItem('mockAuthEmail', user.email);
    return {
      token,
      user: getSanitizedUser(user),
    };
  }

  throw new Error('Invalid email or password');
};

export const logout = async () => {
  await delay(200);
  localStorage.removeItem('authToken');
  localStorage.removeItem('mockAuthEmail');
  return { message: 'Logged out' };
};

export const verifyToken = async (): Promise<{ valid: boolean; user?: { id: string; email: string; role: UserRole; name: string } }> => {
  await delay();
  const token = localStorage.getItem('authToken');
  const user = getCurrentUser();
  if (token === 'mock-jwt-token-12345' && user) {
    return { valid: true, user: getSanitizedUser(user) };
  }
  return { valid: false };
};

export const refreshToken = async (): Promise<{ token: string; user: { id: string; email: string; role: UserRole; name: string } }> => {
  await delay();
  const user = getCurrentUser() || mockUsers[4];
  const token = 'mock-jwt-token-12345';
  localStorage.setItem('authToken', token);
  return { token, user: getSanitizedUser(user) };
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
  const wantsHuman = normalized.includes('agent') || normalized.includes('human');

  const responseText = wantsHuman
    ? 'I have requested a real agent. You can continue typing while they join.'
    : normalized.includes('return')
    ? 'I can help with that return. Please share your order number.'
    : normalized.includes('order')
    ? 'Your order is on its way. It should arrive within 2 business days.'
    : 'Thanks for your message. I am reviewing your request and will respond shortly.';

  const response = {
    id: generateId('msg'),
    conversationId,
    agentResponse: responseText,
    status: (wantsHuman ? 'escalated' : 'resolved') as 'resolved' | 'escalated',
    escalationState: (wantsHuman ? 'HUMAN_ACTIVE' : 'OPEN') as 'HUMAN_ACTIVE' | 'OPEN',
    senderType: (wantsHuman ? 'real_agent' : 'ai_agent') as 'real_agent' | 'ai_agent',
    liveAgentOnline: wantsHuman,
    confidence: 0.93,
    ticketId: normalized.includes('order') ? 'ticket-001' : 'ticket-002',
    agentAssigned: wantsHuman ? 'Live Support Agent' : undefined,
  };

  const messageRecord: ConversationMessage = {
    id: generateId('msg'),
    conversationId,
    role: 'user',
    senderType: 'requestor',
    content: message,
    timestamp: new Date().toISOString(),
  };

  const assistantRecord: ConversationMessage = {
    id: response.id,
    conversationId,
    role: wantsHuman ? 'real_agent' : 'assistant',
    senderType: wantsHuman ? 'real_agent' : 'ai_agent',
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

export const getUsers = async () => {
  await delay();
  return [...adminUsers];
};

export const updateUserRole = async (userId: string, role: UserRole) => {
  await delay();
  const user = adminUsers.find((entry) => entry.id === userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.role = role;
  return { ...user };
};

export const getSystemHealth = async () => {
  await delay();
  return {
    api: 'healthy' as const,
    orchestration: 'healthy' as const,
    database: 'degraded' as const,
    queue: 'healthy' as const,
    lastUpdated: new Date().toISOString(),
  };
};

export const getHandoffContext = async (ticketId: string) => {
  await delay();
  const ticket = tickets.find((item) => item.id === ticketId);

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  const attemptedActions = ['intent_classifier', 'order_lookup', 'refund_policy_check'];
  const priority: 'low' | 'medium' | 'high' =
    ticket.priority <= 2 ? 'high' : ticket.priority === 3 ? 'medium' : 'low';
  const aiMessage = [...ticket.transcript]
    .reverse()
    .find((entry) => entry.senderType === 'ai_agent' || entry.senderType === 'system');

  return {
    ticket_id: ticket.id,
    escalation: {
      requested_at: ticket.escalationRequestedAt || ticket.createdAt,
      reason: ticket.agentNotes || 'customer_requested_human',
      priority,
      queue_wait_seconds: ticket.queueWaitSeconds || 0,
    },
    ai_summary: {
      intent: ticket.category.toLowerCase().replace(/\s+/g, '_'),
      attempted_actions: attemptedActions,
      resolution_attempts: 2,
      last_ai_message: aiMessage?.content || 'Escalated after repeated unsuccessful attempts.',
    },
    customer_context: {
      user_id: ticket.customerId,
      open_ticket_count: tickets.filter((item) => item.customerId === ticket.customerId && item.status !== 'resolved').length,
      recent_ticket_ids: tickets
        .filter((item) => item.customerId === ticket.customerId)
        .slice(0, 3)
        .map((item) => item.id),
    },
  };
};
