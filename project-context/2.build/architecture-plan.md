# Architecture Implementation Plan
## Agentic Customer Support System - Build Phase (Phase 2)

**Project**: Agentic Customer & IT Support System  
**Version**: 1.0  
**Date**: May 25, 2026  
**Owner**: Technical Lead  
**Status**: Ready for Implementation

---

## Executive Summary

| Backend | Python | 3.10+ | Auth, RBAC, audit logs, CrewAI native |
| Framework | FastAPI | 0.104+ | Async, automatic API docs, Uvicorn ASGI |
| AI/Agent | CrewAI | Latest | Multi-agent AI orchestration (native Python) |
| ORM | SQLAlchemy | 2.0+ | Database abstraction, async support |
| Security | python-jose + Passlib | Latest | JWT tokens, password hashing |
| Frontend | React | 18.x | LTS version |
| Database | PostgreSQL | 16 | ACID, JSON support |
| Cache | Redis | 7.4 | Session, caching |
| LLM | Gemini 2.5 Pro | Latest | Cost/performance |
---

## 1. Implementation Timeline

### Overall Effort
- **Duration**: 5 weeks (Weeks 1-5 of Phase 2)
- **Team**: 3-4 engineers (1 backend, 1 frontend, 1 QA, 1 DevOps)
- **Approach**: Waterfall phases with parallel work where possible

### Phase 2A: Authentication (Weeks 1-2)

#### 1A.1: JWT Token Service (Backend)
**Owner**: Backend Engineer  
**Effort**: 40 hours  
**Dependencies**: None  

**Tasks**:
- [ ] Create `JwtService` module using `python-jose` for token generation/validation

**Acceptance Criteria**:

**Related Code**:

```python
# app/services/jwt_service.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional, Dict, Any

class JwtService:
  def __init__(self, secret_key: str, algorithm: str = "HS256"):
    self.secret_key = secret_key
    self.algorithm = algorithm
    self.expiration_hours = 24
    
  def generate_token(self, data: Dict[str, Any]) -> str:
    """Generate JWT token with expiration"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=self.expiration_hours)
    to_encode.update({"exp": expire})
        
    encoded_jwt = jwt.encode(
      to_encode,
      self.secret_key,
      algorithm=self.algorithm
    )
    return encoded_jwt
    
  def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
    """Validate and decode JWT token"""
    try:
      payload = jwt.decode(
        token,
        self.secret_key,
        algorithms=[self.algorithm]
      )
      return payload
    except JWTError:
      return None
    
  def get_role_from_token(self, token: str) -> Optional[str]:
    """Extract role from token"""
    payload = self.validate_token(token)
    return payload.get("role") if payload else None
```
#### 1A.2: Mocked User Database (Backend)
**Owner**: Backend Engineer  
**Effort**: 20 hours  
**Dependencies**: None  

**Tasks**:
- [ ] Create `User` SQLAlchemy model with role and team fields
- [ ] Create `UserRepository` class with CRUD operations
- [ ] Implement in-memory mocked user store (for MVP) or use SQLite
- [ ] Load test users on startup via database seeding

**Acceptance Criteria**:

**Related Code**:

```python
# app/models/user.py
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class User(Base):
  __tablename__ = "users"
    
  id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  email = Column(String(255), unique=True, nullable=False, index=True)
  password_hash = Column(String(255), nullable=False)
  role = Column(String(50), nullable=False)  # REQUESTOR, REAL_AGENT, PLATFORM_ADMIN
  team = Column(String(100), nullable=True)
  created_at = Column(DateTime, default=datetime.utcnow)
  updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# app/repositories/user_repository.py
from sqlalchemy.orm import Session
from typing import Optional

class UserRepository:
  def __init__(self, session: Session):
    self.session = session
    
  def get_by_email(self, email: str) -> Optional[User]:
    return self.session.query(User).filter(User.email == email).first()
    
  def create(self, email: str, password_hash: str, role: str, team: str = None) -> User:
    user = User(email=email, password_hash=password_hash, role=role, team=team)
    self.session.add(user)
    self.session.commit()
    return user
    
  def get_all(self) -> list[User]:
    return self.session.query(User).all()
```
#### 1A.3: Login Endpoint (Backend)
**Owner**: Backend Engineer  
**Effort**: 30 hours  
**Dependencies**: 1A.1, 1A.2  

**Tasks**:
- [ ] Create `AuthRouter` in FastAPI with POST `/api/v1/auth/login`

**Acceptance Criteria**:

**Related Code**:

```python
# app/routes/auth.py
from fastapi import APIRouter, HTTPException, status, Response
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from passlib.context import CryptContext

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class LoginRequest(BaseModel):
  email: str
  password: str

class LoginResponse(BaseModel):
  email: str
  role: str
  team: Optional[str] = None

@router.post("/login", response_model=LoginResponse)
async def login(
  request: LoginRequest,
  response: Response,
  db: Session = Depends(get_db),
  jwt_service: JwtService = Depends(get_jwt_service)
):
  # Query user by email
  user = UserRepository(db).get_by_email(request.email)
    
  if not user or not pwd_context.verify(request.password, user.password_hash):
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Invalid email or password"
    )
    
  # Generate JWT token
  token = jwt_service.generate_token({
    "sub": user.email,
    "role": user.role,
    "permissions": get_permissions_for_role(user.role)
  })
    
  # Set HttpOnly cookie
  response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,
    secure=True,
    samesite="strict",
    max_age=86400  # 24 hours
  )
    
  return LoginResponse(email=user.email, role=user.role, team=user.team)
```
#### 1A.4: JWT Filter & Security Configuration (Backend)
**Owner**: Backend Engineer  
**Effort**: 35 hours  
**Dependencies**: 1A.1  

**Tasks**:
- [ ] Create `JwtAuthMiddleware` to extract JWT from cookies
- [ ] Create `get_current_user` dependency for token validation
- [ ] Configure CORS and middleware in FastAPI app

**Acceptance Criteria**:

**Related Code**:

```python
# app/middleware/jwt_middleware.py
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from jose import JWTError

class JwtAuthMiddleware(BaseHTTPMiddleware):
  async def dispatch(self, request: Request, call_next):
    # Extract JWT from HttpOnly cookie
    token = request.cookies.get("access_token")
        
    # Public endpoints that don't require auth
    public_paths = ["/api/v1/auth/login", "/api/v1/health"]
        
    if request.url.path not in public_paths and not token:
      raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing authentication token"
      )
        
    if token:
      try:
        # Validate token
        jwt_service = JwtService(settings.JWT_SECRET)
        payload = jwt_service.validate_token(token)
                
        if not payload:
          raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
          )
                
        # Attach user info to request state
        request.state.user_email = payload.get("sub")
        request.state.user_role = payload.get("role")
        request.state.user_permissions = payload.get("permissions", [])
                
      except JWTError:
        raise HTTPException(
          status_code=status.HTTP_401_UNAUTHORIZED,
          detail="Invalid token"
        )
        
    response = await call_next(request)
    return response

# app/dependencies.py
async def get_current_user(request: Request) -> Dict[str, Any]:
  if not hasattr(request.state, "user_email"):
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Not authenticated"
    )
    
  return {
    "email": request.state.user_email,
    "role": request.state.user_role,
    "permissions": request.state.user_permissions
  }

# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Agentic Support API", version="2.0")

# Add middleware
app.add_middleware(JwtAuthMiddleware)

# CORS configuration
app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:3000"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)
```
### Phase 2B: Frontend RBAC (Weeks 2-3)

#### 1B.1: Login UI Component (Frontend)
**Owner**: Frontend Engineer  
**Effort**: 25 hours  
**Dependencies**: 1A.3  

**Tasks**:
- [ ] Create `<LoginPage>` React component
- [ ] Add email/password input fields
- [ ] Add "Login" button with loading state
- [ ] Call POST `/api/v1/auth/login` on submit
- [ ] Handle login errors (display error message)
- [ ] On success, store role in Zustand store
- [ ] Redirect to role-specific dashboard
- [ ] Add "forgot password" placeholder (future feature)
- [ ] Responsive design for mobile/desktop
- [ ] Unit tests: form validation, API call
- [ ] E2E tests: login flow, redirect

**Acceptance Criteria**:
- Login form accepts email/password
- Calls backend auth endpoint
- Stores role in application state
- Redirects to correct dashboard
- Displays error messages clearly

**Related Code**:
```typescript
export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { setUser, setRole } = useAuthStore();
  
  const handleLogin = async () => {
    // Call /api/v1/auth/login
    // Store role in Zustand
    // Redirect to dashboard/{role}
  };
};
```

#### 1B.2: Role-Based Store & Context (Frontend)
**Owner**: Frontend Engineer  
**Effort**: 20 hours  
**Dependencies**: None  

**Tasks**:
- [ ] Create Zustand store for auth state: `useAuthStore`
- [ ] Add state: `user`, `role`, `permissions`, `isAuthenticated`
- [ ] Add actions: `setUser()`, `setRole()`, `logout()`
- [ ] Add selectors: `selectRole()`, `selectPermissions()`
- [ ] Implement token validation on app startup
- [ ] Handle token expiration (redirect to login)
- [ ] Persist auth state to localStorage (optional)
- [ ] Unit tests: store actions, selectors

**Acceptance Criteria**:
- Auth state is centralized in Zustand
- Role and permissions accessible throughout app
- Token validation on app load
- Logout clears auth state

**Related Code**:
```typescript
interface AuthState {
  user: User | null;
  role: UserRole | null;
  permissions: string[];
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setRole: (role: UserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  permissions: [],
  // Implementation
}));
```

#### 1B.3: Role-Based Navigation (Frontend)
**Owner**: Frontend Engineer  
**Effort**: 30 hours  
**Dependencies**: 1B.2  

**Tasks**:
- [ ] Create `<RoleBasedNav>` component
- [ ] Implement role-specific menu items:
  - Requestor: Chat, My Tickets, Status, Feedback, Profile
  - Agent: Queue, My Assignments, Customer View, KB, Profile
  - Admin: Dashboard, Users, Config, Audit Logs, Analytics
- [ ] Hide/show nav items based on role
- [ ] Add active route indicator
- [ ] Responsive design (mobile hamburger menu)
- [ ] Unit tests: nav item visibility per role
- [ ] E2E tests: navigation flow per role

**Acceptance Criteria**:
- Navigation displays correct items per role
- Nav items link to role-specific pages
- Hidden items are not accessible via URL
- Mobile navigation works

**Related Code**:
```typescript
export const RoleBasedNav: React.FC = () => {
  const { role } = useAuthStore();
  
  const navItems = {
    REQUESTOR: [
      { label: 'Chat', path: '/chat' },
      { label: 'My Tickets', path: '/tickets' },
      // ...
    ],
    REAL_AGENT: [
      { label: 'Queue', path: '/queue' },
      // ...
    ],
    PLATFORM_ADMIN: [
      { label: 'Dashboard', path: '/admin' },
      // ...
    ]
  };
  
  return <nav>{navItems[role]?.map(...)}</nav>;
};
```

#### 1B.4: Role-Based Dashboards (Frontend)
**Owner**: Frontend Engineer  
**Effort**: 60 hours  
**Dependencies**: 1B.2, 1B.3  

**Tasks**:

**Requestor Dashboard**:
- [ ] Chat box component (main feature)
- [ ] My Tickets list (table with status, priority)
- [ ] Ticket status tracker (timeline)
- [ ] Feedback form component
- [ ] Profile settings page
- [ ] Unit tests: component rendering
- [ ] E2E tests: requestor workflow

**Real Agent Dashboard**:
- [ ] Ticket queue table (status, age, priority)
- [ ] Accept ticket button + modal
- [ ] Ticket detail view with customer history
- [ ] Notes editor for ticket resolution
- [ ] Escalate button for L3 handoff
- [ ] KB search component
- [ ] Unit tests: queue display, accept flow
- [ ] E2E tests: agent workflow

**Admin Dashboard**:
- [ ] System health metrics (uptime, users, errors)
- [ ] User management table (CRUD)
- [ ] System settings form
- [ ] Audit logs viewer
- [ ] Analytics export button
- [ ] Unit tests: admin features
- [ ] E2E tests: admin workflow

**Acceptance Criteria**:
- All role dashboards render correctly
- Dashboards are not accessible to other roles
- All components are functional (CRUD, navigation)
- Responsive design for all dashboards

#### 1B.5: Role Gates & Protected Routes (Frontend)
**Owner**: Frontend Engineer  
**Effort**: 25 hours  
**Dependencies**: 1B.2  

**Tasks**:
- [ ] Create `<ProtectedRoute>` component
- [ ] Create `<RoleGate>` component for conditional rendering
- [ ] Implement route guards: redirect to dashboard if role mismatch
- [ ] Handle unauthorized access (403 error page)
- [ ] Test protected routes with wrong role
- [ ] Unit tests: route guards, role checks
- [ ] E2E tests: unauthorized access attempts

**Acceptance Criteria**:
- Protected routes require valid JWT
- Role mismatch redirects to appropriate dashboard
- Conditional components render/hide correctly
- Error pages are user-friendly

**Related Code**:
```typescript
export const ProtectedRoute: React.FC<{role: UserRole}> = ({role}) => {
  const authRole = useAuthStore(s => s.role);
  
  if (authRole !== role) {
    return <Navigate to={`/dashboard/${authRole}`} />;
  }
  return <Outlet />;
};
```

### Phase 2C: Backend Authorization (Weeks 3-4)

#### 1C.1: Role-Based API Endpoints (Backend)
**Owner**: Backend Engineer  
**Effort**: 80 hours  
**Dependencies**: 1A.4  

**Tasks**:

**Requestor Endpoints**:
- [ ] POST `/api/v1/tickets` - Create new ticket
- [ ] GET `/api/v1/tickets/mine` - List own tickets
- [ ] GET `/api/v1/tickets/{id}` - View own ticket (auth check)
- [ ] POST `/api/v1/tickets/{id}/feedback` - Submit feedback
- [ ] Unit tests: happy path, authorization errors
- [ ] Integration tests: full flow from frontend

**Real Agent Endpoints**:
- [ ] GET `/api/v1/queue` - Get assigned/available tickets
- [ ] POST `/api/v1/queue/{id}/accept` - Accept ticket
- [ ] POST `/api/v1/queue/{id}/resolve` - Mark resolved
- [ ] GET `/api/v1/customers/{id}/history` - Customer history
- [ ] PUT `/api/v1/tickets/{id}/notes` - Add agent notes
- [ ] POST `/api/v1/tickets/{id}/escalate` - Escalate to L3
- [ ] Unit tests: authorization, business logic
- [ ] Integration tests: agent workflow

**Admin Endpoints**:
- [ ] GET `/api/v1/users` - List all users
- [ ] POST `/api/v1/users` - Create user
- [ ] PUT `/api/v1/users/{id}` - Update user
- [ ] DELETE `/api/v1/users/{id}` - Delete user
- [ ] GET `/api/v1/audit-logs` - Get audit logs
- [ ] GET `/api/v1/system/health` - System health metrics
- [ ] PUT `/api/v1/config` - Update settings
- [ ] POST `/api/v1/analytics/export` - Export to Databricks
- [ ] Unit tests: CRUD operations, authorization
- [ ] Integration tests: admin workflow

**Acceptance Criteria**:
- All endpoints exist and are functional
- Authorization is enforced per role
- Error responses are consistent (401, 403)
- All endpoints have unit tests
- Integration tests cover happy paths

#### 1C.2: Authorization Annotations & Interceptor (Backend)
**Owner**: Backend Engineer  
**Effort**: 35 hours  
**Dependencies**: 1A.4  

**Tasks**:
- [ ] Use Spring `@PreAuthorize` for role checks
- [ ] Create custom authorization annotations (optional)
- [ ] Implement authorization interceptor
- [ ] Log unauthorized access attempts
- [ ] Handle authorization failures gracefully
- [ ] Return 403 Forbidden for unauthorized requests
- [ ] Unit tests: authorization checks
- [ ] Integration tests: unauthorized access

**Acceptance Criteria**:
- @PreAuthorize annotations enforce role access
- Unauthorized requests return 403
- Authorization failures are logged
- Tests cover all role combinations

**Related Code**:
```java
@RestController
@RequestMapping("/api/v1/queue")
public class QueueController {
    
    @GetMapping
    @PreAuthorize("hasRole('REAL_AGENT')")
    public ResponseEntity<?> getQueue() {
        // Implementation
    }
}
```

#### 1C.3: Audit Logging (Backend)
**Owner**: Backend Engineer  
**Effort**: 40 hours  
**Dependencies**: 1C.1, 1C.2  

**Tasks**:
- [ ] Create `AuditLog` entity and repository
- [ ] Implement audit logging interceptor
- [ ] Log all mutating operations (POST, PUT, DELETE)
- [ ] Capture: user, action, resource, changes, timestamp, IP
- [ ] Create `AuditLogController` for admin queries
- [ ] Add filtering: by user, action, date range
- [ ] Implement export to CSV (for analytics)
- [ ] Unit tests: audit log creation, queries
- [ ] Integration tests: logging flow

**Acceptance Criteria**:
- All user actions are logged
- Logs include sufficient detail for auditing
- Admins can query logs with filtering
- Logs are immutable (no updates/deletes)

**Related Code**:
```java
@Entity
public class AuditLog {
    private UUID id;
    private UUID userId;
    private String action;
    private String resourceType;
    private String resourceId;
    private Map<String, Object> changes;
    private LocalDateTime timestamp;
    private String ipAddress;
}

@Aspect
@Component
public class AuditLoggingAspect {
    @Around("execution(* com.example.api..*(..))")
    public Object logAudit(ProceedingJoinPoint joinPoint) {
        // Log before execution
        // Execute method
        // Log after execution with changes
    }
}
```

#### 1C.4: Database Migrations (Backend)
**Owner**: Backend Engineer  
**Effort**: 20 hours  
**Dependencies**: 1C.3  

**Tasks**:
- [ ] Create Flyway migration scripts:
  - `V1__Create_users_table.sql`
  - `V2__Create_user_roles_table.sql`
  - `V3__Create_audit_logs_table.sql`
  - `V4__Create_user_sessions_table.sql`
  - `V5__Create_initial_mocked_users.sql`
- [ ] Test migrations on fresh database
- [ ] Verify data integrity
- [ ] Document migration scripts
- [ ] Create rollback scripts (optional)

**Acceptance Criteria**:
- All tables are created correctly
- Mocked users are seeded
- Migrations are idempotent
- Database schema matches design

### Phase 2D: QA Testing (Weeks 4-5)

#### 1D.1: Unit Tests (Backend & Frontend)
**Owner**: QA Engineer  
**Effort**: 60 hours  
**Dependencies**: All implementation tasks  

**Backend Tests**:
- [ ] JWT token generation and validation
- [ ] User authentication flow
- [ ] Authorization checks per endpoint
- [ ] Audit log creation and querying
- [ ] Role-based access enforcement
- **Coverage Target**: > 80%

**Frontend Tests**:
- [ ] Login component rendering and submission
- [ ] Role-based navigation visibility
- [ ] Protected route guards
- [ ] Role gates for conditional rendering
- [ ] Zustand store actions and selectors
- **Coverage Target**: > 80%

**Acceptance Criteria**:
- All units have tests
- > 80% code coverage
- Tests are automated in CI/CD
- Test results are reproducible

#### 1D.2: Integration Tests
**Owner**: QA Engineer  
**Effort**: 60 hours  
**Dependencies**: All implementation tasks  

**Scenarios**:
- [ ] Complete login flow (frontend → backend)
- [ ] Requestor workflow: submit ticket, view status
- [ ] Agent workflow: view queue, accept, resolve
- [ ] Admin workflow: manage users, view audit logs
- [ ] Token expiration and re-authentication
- [ ] Unauthorized access attempts
- [ ] Role change takes effect immediately
- [ ] Cross-browser compatibility

**Test Tools**: Jest (frontend), JUnit (backend), Selenium/Cypress (E2E)

**Acceptance Criteria**:
- All workflows work end-to-end
- Error cases handled gracefully
- All browsers supported
- Tests are automated

#### 1D.3: Security Testing
**Owner**: QA Engineer  
**Effort**: 40 hours  
**Dependencies**: All implementation tasks  

**Security Scenarios**:
- [ ] SQL injection attempts on login
- [ ] XSS attack on feedback forms
- [ ] CSRF attacks on state-changing endpoints
- [ ] Token tampering (modify JWT payload)
- [ ] Direct URL access without proper role
- [ ] Session hijacking attempts
- [ ] Rate limiting on login endpoint
- [ ] Password stored as hash (not plaintext)

**Tools**: OWASP ZAP, Postman security tests

**Acceptance Criteria**:
- No high/critical vulnerabilities
- All OWASP Top 10 risks mitigated
- Security tests pass
- Results documented

#### 1D.4: Test Data & Fixtures
**Owner**: QA Engineer  
**Effort**: 30 hours  
**Dependencies**: None (parallel)  

**Tasks**:
- [ ] Create mocked user test data
- [ ] Create sample tickets/conversations
- [ ] Create audit log fixtures
- [ ] Create test SQL scripts
- [ ] Document test data setup procedure
- [ ] Create Postman collection for API tests

**Test Data**:
```
Requestor: customer@example.com / requestor123
Agent: agent1@company.com / agent123
Admin: admin@company.com / admin123
```

**Acceptance Criteria**:
- Test data is easily reproducible
- Test data covers all roles
- Documentation is clear

#### 1D.5: Performance Testing
**Owner**: QA Engineer  
**Effort**: 30 hours  
**Dependencies**: All implementation tasks  

**Scenarios**:
- [ ] 100 concurrent login requests
- [ ] 100 concurrent ticket submissions
- [ ] Agent queue load (1000 tickets)
- [ ] JWT validation latency (< 5ms)
- [ ] Audit log query performance
- [ ] Memory usage under load

**Tools**: JMeter, Gatling, Chrome DevTools

**Acceptance Criteria**:
- Response times < 200ms p95
- No memory leaks
- Supports 100+ concurrent users
- Results documented

---

## 2. Team Roles and Responsibilities

### Backend Engineer
**Weeks 1-4** (Primary ownership):
- Implement JWT service, mocked users, login endpoint
- Implement Spring Security configuration
- Implement all role-based API endpoints
- Implement authorization checks
- Implement audit logging
- Create database migrations
- Write backend unit tests

**Deliverables**:
- Authentication & authorization service
- All API endpoints with role-based access
- Database schema and migrations
- Backend test suite (> 80% coverage)

### Frontend Engineer
**Weeks 2-4** (Primary ownership):
- Implement login UI component
- Implement auth state management (Zustand)
- Implement role-based navigation
- Implement role-specific dashboards
- Implement protected routes and role gates
- Write frontend unit tests
- Conduct responsive design testing

**Deliverables**:
- Complete React frontend with role-based UI
- All role-specific pages and components
- Frontend test suite (> 80% coverage)
- Responsive design verification

### QA Engineer
**Weeks 2-5** (Primary ownership):
- Create comprehensive test scenarios
- Implement unit tests (frontend & backend)
- Implement integration tests
- Conduct security testing
- Conduct performance testing
- Create test data and fixtures
- Document testing results

**Deliverables**:
- Test suite with > 80% coverage
- Integration tests covering all workflows
- Security test report
- Performance test report
- Test data documentation

### DevOps Engineer
**Weeks 1-5** (Support):
- Configure CI/CD pipeline
- Set up testing environment
- Set up staging environment
- Monitor deployment
- Document deployment procedures

**Deliverables**:
- CI/CD pipeline configuration
- Deployment documentation
- Environment setup scripts

---

## 3. Risk Assessment and Mitigation

### Risk 1: Token Security
**Risk**: JWT tokens could be exposed or tampered with  
**Likelihood**: Medium  
**Impact**: Critical (unauthorized access)  

**Mitigation**:
- Use HttpOnly cookies (not localStorage)
- Implement token expiration (24 hours)
- Implement token rotation on refresh
- Validate token signature on every request
- Monitor token usage for anomalies

**Owner**: Backend Engineer  
**Status**: Not Started

### Risk 2: Role Escalation
**Risk**: User could escalate their role via API tampering  
**Likelihood**: Low  
**Impact**: Critical (unauthorized access)  

**Mitigation**:
- Never trust role from client request
- Always validate role from token/session
- Use @PreAuthorize annotations
- Log all role-related API calls
- Monitor for suspicious patterns

**Owner**: Backend Engineer  
**Status**: Not Started

### Risk 3: Authorization Bypass
**Risk**: Frontend role-based UI could be bypassed via direct URL access  
**Likelihood**: Medium  
**Impact**: High (information disclosure)  

**Mitigation**:
- Implement backend authorization checks (not just frontend)
- Return 403 for unauthorized requests
- Log unauthorized access attempts
- Test all endpoints with wrong roles
- Never depend on frontend-only authorization

**Owner**: Backend Engineer  
**Status**: Not Started

### Risk 4: Test Coverage Gaps
**Risk**: Role-based scenarios not fully tested  
**Likelihood**: High  
**Impact**: Medium (bugs discovered in production)  

**Mitigation**:
- Create comprehensive test matrix (all role combinations)
- Automated tests in CI/CD
- Manual testing of critical flows
- Test coverage > 80% requirement
- Code review for uncovered paths

**Owner**: QA Engineer  
**Status**: Not Started

### Risk 5: Schedule Slippage
**Risk**: Implementation takes longer than estimated  
**Likelihood**: Medium  
**Impact**: High (delay Phase 2 completion)  

**Mitigation**:
- Break tasks into small 8-hour chunks
- Daily standup to track progress
- Parallel work where possible
- Pre-plan database migrations
- Have backup plan (reduce scope if needed)

**Owner**: Technical Lead  
**Status**: Not Started

---

## 4. Dependencies and Critical Path

### Dependency Diagram

```
1A.1 JWT Service
    ├── 1A.3 Login Endpoint
    │   └── 1A.4 JWT Filter
    │       ├── 1C.1 Role-Based Endpoints
    │       │   └── 1C.3 Audit Logging
    │       └── 1B.2 Auth Store
    │           ├── 1B.3 Navigation
    │           ├── 1B.4 Dashboards
    │           └── 1B.5 Role Gates
    │
    └── 1A.2 Mocked Users
        └── 1A.3 Login Endpoint

1C.2 Authorization Annotations
    └── 1C.1 Role-Based Endpoints

1D.1-1D.5 Testing
    └── All implementation complete
```

### Critical Path

**Weeks 1-2**: 1A.1, 1A.2, 1A.3, 1A.4 (4 tasks in parallel)  
**Weeks 2-3**: 1B.1, 1B.2, 1B.3, 1B.4, 1B.5 (5 tasks in parallel)  
**Weeks 3-4**: 1C.1, 1C.2, 1C.3, 1C.4 (4 tasks in parallel)  
**Weeks 4-5**: 1D.1-1D.5 (5 tasks in parallel)  

**Total Duration**: 5 weeks  
**Critical Path**: JWT Service → Login → JWT Filter → Role-Based Endpoints → Testing

---

## 5. Success Criteria

### Phase 2A (Authentication)
- [ ] JWT tokens are generated and validated
- [ ] Mocked users are loaded on startup
- [ ] Login endpoint accepts email/password
- [ ] JWT is set in secure HttpOnly cookie
- [ ] All unit tests pass
- [ ] Code coverage > 80%

### Phase 2B (Frontend RBAC)
- [ ] Login page is functional
- [ ] Auth state is centralized in Zustand
- [ ] Navigation is role-specific
- [ ] All three dashboards render correctly
- [ ] Protected routes prevent unauthorized access
- [ ] All unit tests pass
- [ ] Responsive design verified

### Phase 2C (Backend Authorization)
- [ ] All role-based endpoints exist
- [ ] Authorization is enforced per endpoint
- [ ] Unauthorized requests return 403
- [ ] Audit logs are created for all actions
- [ ] Database migrations work
- [ ] All unit tests pass

### Phase 2D (QA Testing)
- [ ] Unit test coverage > 80%
- [ ] All integration tests pass
- [ ] Security tests pass (no critical vulnerabilities)
- [ ] Performance tests pass (< 200ms p95)
- [ ] All test scenarios documented
- [ ] Test data is reproducible

### Phase 2 Overall
- [ ] All 4 implementations complete
- [ ] All 5 engineering tasks complete
- [ ] Code review approved
- [ ] Deployment to staging environment
- [ ] Ready for Phase 3 (Deliver)

---

## 6. Monitoring and Reporting

### Weekly Status Report
**Format**: Every Friday EOD  
**Owner**: Technical Lead  

**Contents**:
- % Complete per task
- Blockers and resolutions
- Risk updates
- Upcoming week's priorities
- Test results summary
- Code coverage trend

### Daily Standup
**Time**: 9 AM PT  
**Duration**: 15 minutes  
**Attendees**: Backend, Frontend, QA, DevOps, Technical Lead  

**Topics**:
- What did you complete yesterday?
- What are you working on today?
- Any blockers?

### Code Quality Metrics
**Tracked Weekly**:
- Code coverage (target > 80%)
- Code review turn-around time (target < 24h)
- Defect density (target < 2 per 1000 LOC)
- Test failure rate (target 0%)

---

## 7. Appendix: Reference Documents

### A. Mocked User Credentials

```
REQUESTOR:
  Email: customer@example.com
  Password: requestor123
  
  Email: employee@acme.com
  Password: requestor123

REAL_AGENT:
  Email: agent1@company.com
  Password: agent123
  
  Email: agent2@company.com
  Password: agent123

PLATFORM_ADMIN:
  Email: admin@company.com
  Password: admin123
```

### B. Environment Variables (MVP)

```bash
# JWT Configuration
JWT_SECRET=your-256-bit-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agentic_support
DB_ECHO=false

# Security
SECURE_COOKIES=true
CORS_ORIGINS=["http://localhost:3000"]

# Mock ServiceNow (MVP)
SERVICENOW_MOCK_ENABLED=true
SERVICENOW_MOCK_HOST=http://localhost:3001

# LLM
GEMINI_API_KEY=your-api-key

# FastAPI / Uvicorn
FASTAPI_ENV=development
DEBUG=true
LOG_LEVEL=info
HOST=0.0.0.0
PORT=8000

# CrewAI
CREWAI_VERBOSE=true
CREWAI_ASYNC_EXECUTION=true
```

### C. CrewAI Integration Points

FastAPI integrates natively with CrewAI since both are Python. Each agent specialization is called directly from API route handlers:

| API Layer | CrewAI Component | Integration Pattern |
|-----------|-----------------|---------------------|
| POST /api/v1/tickets | Triage Agent + Crew | Direct `await crew.kickoff_async()` |
| GET /api/v1/queue/{id}/resolve | Domain Specialist Crew | Async task result |
| POST /api/v1/tickets/{id}/escalate | Handoff Agent | Synchronous task execution |

```python
# Example: FastAPI route calling CrewAI
from crewai import Agent, Task, Crew

@router.post("/api/v1/tickets")
async def submit_ticket(
    ticket: TicketRequest,
    current_user = Depends(get_current_user)
):
    triage_agent = Agent(role="Triage Agent", ...)
    task = Task(description=ticket.message, agent=triage_agent, ...)
    crew = Crew(agents=[triage_agent], tasks=[task])
    result = await crew.kickoff_async()
    return {"ticket_id": str(uuid4()), "routed_to": result.assigned_agent}
```

---

### D. Testing Tools & Libraries

**Backend**:
- pytest for unit and integration tests
- pytest-asyncio for async test support
- httpx + FastAPI TestClient for HTTP tests
- pytest-mock for mocking
- SQLite in-memory database for isolated tests

**Frontend**:
- Jest for unit tests
- React Testing Library for component tests
- Cypress for E2E tests
- MSW (Mock Service Worker) for API mocking

**QA**:
- OWASP ZAP for security testing
- JMeter for load testing
- Postman for API testing

### D. Deployment Checklist

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Security tests pass
- [ ] Code coverage > 80%
- [ ] Code review approved
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Monitoring configured
- [ ] Backup plan in place
- [ ] Deployment runbook reviewed

---

## 8. Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 25, 2026 | Technical Lead | Initial implementation plan |

**Status**: Ready for Implementation  
**Next Review**: End of Week 2 (Project Kickoff + Progress Check)  
**Final Review**: End of Week 5 (Phase 2 Completion)

---

**Approved By**: Technical Lead, Engineering Team Leads  
**Contact**: technical-lead@company.com
