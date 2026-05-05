# Frontend Development Guide

## Getting Started

### Installation

```bash
cd frontend
npm install
```

### Running Locally

```bash
# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Project Structure

```
frontend/
├── public/                          # Static files
│   └── index.html
│
├── src/
│   ├── api/                         # API clients
│   │   ├── client.ts                # Base axios instance
│   │   ├── authApi.ts               # Authentication endpoints
│   │   ├── chatApi.ts               # Chat endpoints
│   │   ├── ticketApi.ts             # Ticket endpoints
│   │   └── analyticsApi.ts          # Analytics endpoints
│   │
│   ├── components/                  # React components
│   │   ├── ChatWidget/
│   │   │   ├── ChatContainer.tsx    # Main chat wrapper
│   │   │   ├── MessageList.tsx      # Conversation display
│   │   │   ├── MessageBubble.tsx    # Single message
│   │   │   ├── InputBox.tsx         # Message input
│   │   │   └── TypingIndicator.tsx  # "typing..." animation
│   │   │
│   │   ├── Dashboard/
│   │   │   ├── TicketTable.tsx      # Ticket list
│   │   │   ├── TicketDetail.tsx     # Ticket details panel
│   │   │   └── Analytics.tsx        # Metrics dashboard
│   │   │
│   │   ├── Agent/
│   │   │   ├── ActiveTickets.tsx    # Ticket queue
│   │   │   ├── ContextPanel.tsx     # Context and KB
│   │   │   └── ResponseEditor.tsx   # Response composer
│   │   │
│   │   └── Common/
│   │       ├── Header.tsx           # Page header
│   │       ├── Sidebar.tsx          # Navigation menu
│   │       ├── NotificationList.tsx # Toast notifications
│   │       ├── ErrorBoundary.tsx    # Error handling
│   │       └── Skeleton.tsx         # Loading placeholders
│   │
│   ├── pages/                       # Page components
│   │   ├── ChatPage.tsx             # /chat route
│   │   ├── DashboardPage.tsx        # /dashboard route
│   │   ├── AgentPage.tsx            # /agent route
│   │   └── LoginPage.tsx            # /login route
│   │
│   ├── store/                       # Zustand stores
│   │   ├── authStore.ts             # Auth state
│   │   ├── chatStore.ts             # Chat state
│   │   ├── ticketStore.ts           # Ticket state
│   │   └── uiStore.ts               # UI state
│   │
│   ├── App.tsx                      # Main app with routes
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Global styles
│
├── .env.development                 # Dev environment
├── .env.production                  # Prod environment
├── .gitignore
├── .eslintrc.config.js
├── eslint.config.js
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── package.json
└── README.md
```

## Creating New Components

### Component Template

```typescript
// src/components/MyComponent/MyComponent.tsx
import React from 'react';

export interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

/**
 * MyComponent description
 * @example
 * <MyComponent title="Hello" />
 */
export const MyComponent: React.FC<MyComponentProps> = ({ title, onClick }) => {
  return (
    <div onClick={onClick}>
      {title}
    </div>
  );
};

export default MyComponent;
```

## Using State Management

### Auth Store

```typescript
import { useAuthStore } from '../store/authStore';

function MyComponent() {
  const { user, token, login, logout } = useAuthStore();
  
  return (
    <div>
      <p>{user?.name}</p>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}
```

### Chat Store

```typescript
import { useChatStore } from '../store/chatStore';

function ChatComponent() {
  const { messages, conversationId, addMessage, setLoading } = useChatStore();
  
  return (
    <div>
      {messages.map((msg) => (
        <p key={msg.id}>{msg.content}</p>
      ))}
    </div>
  );
}
```

### UI Store

```typescript
import { useUIStore } from '../store/uiStore';

function NotifyComponent() {
  const { addNotification } = useUIStore();
  
  const handleClick = () => {
    addNotification({
      type: 'success',
      message: 'Action completed!',
      duration: 3000,
    });
  };
  
  return <button onClick={handleClick}>Show Notification</button>;
}
```

## API Integration

### Making API Calls

```typescript
import { sendMessage } from '../api/chatApi';

async function sendUserMessage(text: string) {
  try {
    const response = await sendMessage(conversationId, text);
    console.log('Response:', response);
  } catch (error) {
    console.error('Failed:', error);
  }
}
```

### Authentication

```typescript
import { login, logout } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

async function handleLogin(email: string, password: string) {
  const response = await login(email, password);
  const { token, user } = useAuthStore();
  useAuthStore().login(response.token, response.user);
}
```

## Styling with Tailwind

### Common Classes

```typescript
// Colors
'bg-blue-600', 'text-gray-900', 'border-gray-200'

// Spacing
'px-4', 'py-2', 'mb-4', 'gap-2'

// Responsive
'md:grid-cols-2', 'lg:flex', 'hidden lg:block'

// Hover/Active
'hover:bg-gray-100', 'focus:ring-2', 'disabled:opacity-50'

// Animations
'animate-pulse', 'animate-bounce', 'animate-slide-up'
```

## Error Handling

### Global Error Boundary

```typescript
import ErrorBoundary from '../components/Common/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### Local Error Handling

```typescript
const [error, setError] = useState<string | null>(null);

try {
  await someApiCall();
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unknown error');
}
```

## Loading States

### Skeleton Loaders

```typescript
import { Skeleton, SkeletonTable } from '../components/Common/Skeleton';

<Skeleton className="h-10 w-full" />
<SkeletonTable />
```

### Conditional Rendering

```typescript
if (isLoading) {
  return <Skeleton className="h-96" />;
}

if (error) {
  return <div className="text-red-600">{error}</div>;
}

return <YourContent />;
```

## Debugging

### React DevTools

1. Install React Developer Tools browser extension
2. Open DevTools (F12)
3. Go to React tab to inspect components and state

### Console Logging

```typescript
console.log('Component props:', { title, onClick });
console.error('API error:', error);
```

## Performance Tips

### Component Optimization

```typescript
// Use React.memo for expensive renders
export const MyComponent = React.memo(({ title }: Props) => {
  return <div>{title}</div>;
});

// Use useCallback for stable function refs
const handleClick = useCallback(() => {
  doSomething();
}, [dependency]);
```

### Code Splitting

```typescript
// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Skeleton />}>
  <HeavyComponent />
</Suspense>
```

## Testing

### Running Tests

```bash
npm run test              # Watch mode
npm run test:ui          # Test UI
npm run test -- --coverage
```

### Test Example

```typescript
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render title', () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Deployment

### Build for Production

```bash
npm run build
# Output: dist/
```

### Docker Build

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

### Deployment Steps

1. `npm run build` — Create production bundle
2. Push `dist/` to CDN or server
3. Configure backend proxy for `/api` routes
4. Set production environment variables
5. Monitor and debug with browser DevTools

## Common Issues

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

### API Connection Failed

1. Check backend is running on port 8080
2. Verify VITE_API_URL in .env.development
3. Check browser console for CORS errors
4. Test with curl: `curl http://localhost:8080/api/health`

### Build Size Too Large

```bash
# Analyze bundle
npm install --save-dev rollup-plugin-visualizer
# Update vite.config.ts to use plugin
npm run build
# Open stats.html
```

## Resources

- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Vite Guide](https://vitejs.dev/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated**: May 4, 2026
