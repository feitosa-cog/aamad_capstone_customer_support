# Frontend - Agentic Support System

React 18.x + Vite web application for the Agentic Customer Support System.

## Features

- **Chat Widget** — Customer-facing support interface
- **Admin Dashboard** — Ticket management and analytics
- **Agent Workspace** — Interface for human agents
- **Settings Page** — User preferences and security
- **Mock API Mode** — Fully functional frontend without backend
- **Real-time Updates** — WebSocket support for live conversations
- **Responsive Design** — Mobile-first Tailwind CSS styling

## Quick Start

### Prerequisites

- Node.js 20 (LTS)
- npm 10+

### Installation

```bash
# Install dependencies
npm install

# Start development server (localhost:3000)
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint

> Note: The frontend lint command has been fixed to support the current Vite + TypeScript setup.
```

## Environment Configuration

The frontend includes a **mock API mode** for development and testing without a running backend server.

### Mock API Toggle

Set `VITE_USE_MOCK_API` in environment files:

```bash
# Development (.env.development)
VITE_USE_MOCK_API=true        # ✅ Use mock responses
VITE_API_URL=http://localhost:8080/api

# Production (.env.production)
VITE_USE_MOCK_API=false       # ✅ Use real API
VITE_API_URL=https://api.agentic.support/api
```

### Login Credentials (Mock Mode)

- **Email**: `admin@example.com`
- **Password**: `password123`

## Project Structure

```
src/
├── api/
│   ├── client.ts          # Axios HTTP client
│   ├── authApi.ts         # Auth endpoints
│   ├── chatApi.ts         # Chat endpoints
│   ├── ticketApi.ts       # Ticket endpoints
│   ├── analyticsApi.ts    # Analytics endpoints
│   ├── mockApi.ts         # Mock responses
│   └── apiConfig.ts       # Mock API toggle
├── components/
│   ├── ChatWidget/        # Chat interface
│   ├── Dashboard/         # Ticket management
│   ├── Agent/             # Agent workspace
│   └── Common/            # Reusable components
├── pages/
│   ├── LoginPage.tsx      # Authentication
│   ├── ChatPage.tsx       # Chat interface
│   ├── DashboardPage.tsx  # Ticket dashboard
│   ├── AgentPage.tsx      # Agent workspace
│   └── SettingsPage.tsx   # Settings & preferences
├── store/                 # Zustand state management
├── App.tsx                # Routes and app wrapper
└── main.tsx               # Entry point
```

## API Integration

The frontend uses a mock-by-default pattern for development:

### API Modules

- **authApi.ts** — Login, logout, token verification
- **chatApi.ts** — Send messages, create conversations
- **ticketApi.ts** — Fetch, update, escalate tickets
- **analyticsApi.ts** — Dashboard metrics and analytics
- **mockApi.ts** — Mock implementations
- **apiConfig.ts** — `useMockApi` toggle and env config

### Switching Between Mock and Real API

Each API function checks `useMockApi` flag:

```typescript
// src/api/authApi.ts example
export const login = async (email: string, password: string) => {
  if (useMockApi) {
    return mockLogin(email, password);  // Mock response
  }
  // Real API call
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};
```

### Backend Endpoints (Real API Mode)

When backend is available, frontend calls these endpoints:

```
POST   /api/auth/login              → { token, user }
GET    /api/auth/verify             → { valid, user? }
POST   /api/chat/conversations      → { conversationId }
POST   /api/chat                    → { agentResponse, status }
GET    /api/chat/{id}               → ChatMessage[]
GET    /api/tickets                 → { data: Ticket[], pagination }
GET    /api/tickets/{id}            → Ticket
PATCH  /api/tickets/{id}            → Ticket
POST   /api/tickets/{id}/escalate   → Ticket
POST   /api/tickets/{id}/assign     → Ticket
GET    /api/analytics/dashboard     → DashboardMetrics
```

## State Management

Using Zustand for lightweight, reactive state:

- `authStore` — User token, auth status, login/logout
- `chatStore` — Conversations, messages, UI state
- `ticketStore` — Ticket list, selected ticket, filters
- `uiStore` — Notifications, sidebar state

## Pages

| Route | Component | Purpose |
|-------|-----------|----------|
| `/login` | LoginPage | User authentication |
| `/dashboard` | DashboardPage | Ticket list & analytics |
| `/chat` | ChatPage | Customer chat interface |
| `/agent` | AgentPage | Agent workspace |
| `/settings` | SettingsPage | User preferences & security |

## UI Status Badge

A small "Mock API" badge appears in the top-right header when `VITE_USE_MOCK_API=true`, indicating mock mode is active.

## Development Workflow

1. Create feature branch: `git checkout -b feature/component-name`
2. Start dev server: `npm run dev`
3. Implement component with tests
4. Run linter: `npm run lint`
5. Create PR with description

### Mock API Development

When developing features:
1. Use mock API by default (`VITE_USE_MOCK_API=true`)
2. Define mock responses in `src/api/mockApi.ts`
3. Test frontend UI/UX independently
4. Integrate with real backend later by toggling the flag

## Testing

```bash
# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Generate coverage
npm run test -- --coverage
```

## Performance Targets

- Bundle size: <250KB (gzipped) ✅
- Lighthouse score: >80
- Chat widget: <50KB
- Mock API response time: <1s

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Deployment

```bash
# Build for production
npm run build

# Output in dist/
# Deploy to CDN or server
```

## Troubleshooting

### Mock API Not Working

Verify `VITE_USE_MOCK_API` is set in `.env.development`:
```bash
echo $VITE_USE_MOCK_API  # Should show 'true'
```

### API Connection Issues

Check that the backend is running on port 8080:
```bash
# Update .env.development if needed
VITE_API_URL=http://localhost:8080/api
VITE_USE_MOCK_API=false
```

### Build Errors

Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Not Loading

Ensure the file is `.env.development` or `.env.production` (not `.env`).
Vite only loads files matching the current environment.

## Next Steps

1. ✅ Setup React + Vite
2. ✅ Implement chat widget
3. ✅ Build dashboard
4. ✅ Create agent workspace
5. ✅ Add Settings page
6. ✅ Mock API integration with toggle
7. **TODO**: Connect to real backend API
8. **TODO**: Add WebSocket support
9. **TODO**: Deploy to staging

## Documentation

- [Quick Start Guide](./QUICKSTART.md) — Development quickstart
- [Frontend Plan](../frontend-plan.md) — Development roadmap
- [PRD](../../1.define/prd.md) — Product requirements
- [SAD](../../1.define/sad.md) — System architecture

---

**Status**: MVP Complete with Mock API  
**Last Updated**: May 5, 2026
