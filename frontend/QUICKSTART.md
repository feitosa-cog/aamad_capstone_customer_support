# Quick Start Guide - Frontend Development

## 🚀 Start Here

### Installation (5 minutes)
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Default Mode: Mock API ✅

The frontend runs in **mock API mode** by default. No backend server needed!

- All API calls return realistic mock data
- Chat, tickets, and analytics fully functional
- No network delays or errors
- UI badge shows "Mock API" status

### Login
- Email: `admin@example.com`
- Password: `password123`

### Demo Pages
1. **Chat** (`/chat`) — Test the chat widget
2. **Dashboard** (`/dashboard`) — View tickets and analytics
3. **Agent** (`/agent`) — Agent workspace
4. **Settings** (`/settings`) — User preferences

---

## 🔧 Mock API Configuration

### Enable/Disable Mock Mode

Edit `.env.development`:

```bash
# Use mock API (default)
VITE_USE_MOCK_API=true

# Use real backend API
VITE_USE_MOCK_API=false
VITE_API_URL=http://localhost:8080/api
```

Restart dev server for changes: `Ctrl+C` then `npm run dev`

### Mock Data

The mock API includes:
- 3 sample tickets (open, resolved, escalated)
- 1 authenticated admin user
- Simulated chat responses with smart routing
- Analytics dashboard with realistic metrics

---

## 📁 File Structure (Quick Reference)

```
src/
├── api/
│   ├── mockApi.ts         ⭐ Mock responses (default)
│   ├── authApi.ts         🔀 Routes between mock/real
│   ├── chatApi.ts         🔀 Routes between mock/real
│   ├── ticketApi.ts       🔀 Routes between mock/real
│   ├── analyticsApi.ts    🔀 Routes between mock/real
│   └── apiConfig.ts       🎛️  VITE_USE_MOCK_API toggle
├── components/
│   ├── ChatWidget/        Chat interface
│   ├── Dashboard/         Ticket management
│   ├── Agent/             Agent workspace
│   └── Common/            Shared components
├── pages/
│   ├── LoginPage.tsx      🔐 Auth
│   ├── ChatPage.tsx       Chat interface
│   ├── DashboardPage.tsx  Tickets & analytics
│   ├── AgentPage.tsx      Agent workspace
│   └── SettingsPage.tsx   ⭐ Preferences & security
├── store/                 Zustand state
├── App.tsx                Routes
└── main.tsx               Entry point
```

---

## 💻 Common Tasks

### Add a New Feature (with Mock Support)

1. **Create component** in `src/components/`
2. **Create mock function** in `src/api/mockApi.ts`
3. **Create API wrapper** in `src/api/*Api.ts` with toggle logic
4. **Test with mock** — works immediately
5. **Test with real backend** — toggle `VITE_USE_MOCK_API=false`

### Example: New Ticket Status API

```typescript
// 1. Mock implementation (src/api/mockApi.ts)
export const getTicketStatus = async (ticketId: string) => {
  await delay();
  const ticket = tickets.find(t => t.id === ticketId);
  return ticket?.status || 'unknown';
};

// 2. API wrapper (src/api/ticketApi.ts)
import { getTicketStatus as mockGetTicketStatus } from './mockApi';
import { useMockApi } from './apiConfig';

export const getTicketStatus = async (ticketId: string) => {
  if (useMockApi) {
    return mockGetTicketStatus(ticketId);
  }
  const response = await apiClient.get(`/tickets/${ticketId}/status`);
  return response.data.status;
};

// 3. Use in component
import { getTicketStatus } from '../api/ticketApi';

function MyComponent() {
  const [status, setStatus] = useState('');
  
  useEffect(() => {
    getTicketStatus('ticket-001').then(setStatus);
  }, []);
  
  return <div>Status: {status}</div>;
}
```

### Use State Management

```typescript
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';

function MyPage() {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  
  const handleClick = () => {
    addNotification({
      type: 'success',
      message: 'Done!',
      duration: 3000,
    });
  };
  
  return <button onClick={handleClick}>Click me</button>;
}
```

### Add Tailwind Styling

```typescript
// Use utility classes
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-sm">
  <h2 className="text-lg font-semibold text-gray-900">Title</h2>
  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Click
  </button>
</div>
```

---

## 🔗 Backend Integration (When Ready)

When backend is deployed, switch modes:

```bash
# .env.development
VITE_USE_MOCK_API=false
VITE_API_URL=http://localhost:8080/api
```

No code changes needed! The toggle handles routing.

### Backend Endpoints Expected

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

---

## 🐛 Debugging

### Check Mock API is Active

Open browser console (F12):
```javascript
// In Console tab:
import.meta.env.VITE_USE_MOCK_API  // Should show 'true'
```

Look for **"Mock API" badge** in top-right header.

### Check Component State
1. Open DevTools (F12)
2. Go to "React" tab
3. Inspect component props and state

### API Errors
Check browser console:
- Network tab → Click request → Response/Preview tab
- Console tab → Any error messages

### Common Issues
- **Mock not working?** — Check `.env.development` has `VITE_USE_MOCK_API=true`
- **Blank page?** — Clear cache: `Ctrl+Shift+Del` → Cached images/files
- **Component not rendering?** — Check React DevTools for errors

### Clear Cache
```bash
# Hard refresh browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Or clear node_modules
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## ⚡ Quick Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code quality
npm run test         # Run tests
npm run test:ui      # Open test UI
```

---

## 📚 Key Files to Know

| File | Purpose |
|------|---------|
| `src/App.tsx` | Routes and app structure |
| `src/api/mockApi.ts` | Mock data & responses |
| `src/api/apiConfig.ts` | VITE_USE_MOCK_API toggle |
| `src/store/` | State management (read/modify here) |
| `src/components/Common/Header.tsx` | Shows "Mock API" badge |
| `tailwind.config.ts` | Tailwind theme customization |
| `vite.config.ts` | Build configuration |
| `.env.development` | Dev environment vars |
| `.env.production` | Prod environment vars |

---

## ✅ What's Included

- ✅ Full React + Vite setup
- ✅ All UI pages (Chat, Dashboard, Agent, Settings)
- ✅ Mock API with realistic data
- ✅ Toggle for backend integration
- ✅ State management (Zustand)
- ✅ Responsive design (Tailwind)
- ✅ Type safety (TypeScript)
- ✅ Linting (ESLint)

---

## 📦 Build & Deploy

### Local Production Build
```bash
npm run build
npm run preview
# Open http://localhost:4173 to test
```

### Production Build (for CI/CD)
```bash
npm run build
# dist/ folder ready for deployment
```

### Docker Build
```bash
docker build -t agentic-frontend:latest .
docker run -p 3000:3000 agentic-frontend:latest
```

---

## 🎨 Component Examples

### Simple Button
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
  Click me
</button>
```

### Card with Title
```tsx
<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
  <h2 className="text-lg font-semibold text-gray-900">Title</h2>
  <p className="text-gray-600 mt-2">Content goes here</p>
</div>
```

### Loading State
```tsx
import { Skeleton } from '../components/Common/Skeleton';

function MyComponent() {
  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }
  
  return <div>Content</div>;
}
```

### Form Input
```tsx
<input
  type="text"
  placeholder="Enter your message..."
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
/>
```

---

## 🔐 Authentication

### Login Flow
1. User enters email/password on `/login`
2. Click "Login" button
3. API call to `POST /api/auth/login`
4. Token stored in localStorage
5. Redirect to `/dashboard`

### Protected Routes
All routes except `/login` require authentication.
Unauthenticated users are redirected to `/login`.

### Token Usage
Token is automatically injected in all API requests.
No manual handling needed.

---

## 🚨 Error Handling

### Display Error to User
```typescript
const { addNotification } = useUIStore();

addNotification({
  type: 'error',
  message: 'Something went wrong',
  duration: 5000,  // 5 seconds
});
```

### Handle API Errors
```typescript
try {
  await someApiCall();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(message);
  // Show to user
}
```

---

**Status**: MVP Complete with Mock API Toggle  
**Last Updated**: May 5, 2026

## 📞 Need Help?

1. Check [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed guide
2. Check [README.md](./README.md) for setup instructions
3. See [frontend-plan.md](../frontend-plan.md) for architecture
4. Check component files for TypeScript interfaces

---

**Last Updated**: May 4, 2026  
**Frontend Status**: ✅ Ready to use
