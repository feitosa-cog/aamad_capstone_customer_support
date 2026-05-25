# System Architecture Document (SAD): Agentic Customer Support System
## Build Phase (Phase 2) - Enhanced with Role-Based Access Control

**Project**: Agentic Customer & IT Support System  
**Version**: 2.0  
**Date**: May 25, 2026  
**Owner**: System Architect  
**Status**: Build Phase (Phase 2)

---

## 1. Executive Summary

### 1.1 Purpose

This System Architecture Document (SAD) defines the complete architecture for the Agentic Customer Support System—a multi-agent AI platform built on CrewAI that provides autonomous customer support for e-commerce/retail organizations and IT Service Management for internal applications. 

**Phase 2 Enhancement**: This version adds comprehensive role-based access control (RBAC) with three mocked user personas:
- **Requestors** (customers/employees) - Submit support requests
- **Real Agents** (human support staff) - Handle escalations and complex issues
- **Platform Administrators** - Manage system, users, and configuration

### 1.2 Scope

| Scope | Description |
|-------|-------------|
| **Primary** | External customer-facing support for e-commerce/retail (order tracking, returns, product inquiries) |
| **Secondary** | Internal IT Service Management for employee-reported incidents |
| **Platform** | ServiceNow integration for incident management and knowledge base |
| **Access Control** | Role-based frontend rendering, backend authorization, RBAC enforcement |

### 1.3 Key Architectural Decisions

| Decision | Rationale |
|----------|------------|
| Multi-agent architecture (CrewAI) | Domain specialization, scalability, maintainability |
| Tiered agent system | 60-75% automation target with human fallback |
 | FastAPI + React | Python-native CrewAI integration, async support, fast MVP iteration |
| ServiceNow integration | Enterprise incident management standard |
| Role-based access control (RBAC) | Enable multi-persona testing and real-world agent workflows |
| Mocked roles in MVP | Support testing without external identity provider |

---

## 2. Stakeholders and Concerns

### 2.1 Stakeholder Matrix

| Stakeholder | Concerns | Priority |
|-------------|----------|----------|
| Requestor (Customer/Employee) | Easy submission, real-time status, resolution quality | High |
| Real Agent (Support Staff) | Queue management, customer history, escalation tools | High |
| Platform Administrator | User management, system health, configuration | High |
| Operations Director | Ticket deflection, response time, CSAT | High |
| Support Team Lead | Training time, KB freshness, quality consistency | High |
| Development Team | Maintainability, testability, extensibility | High |
| Security Team | Data protection, access control, audit | Critical |
| QA Engineer | Role-based testing scenarios, multi-persona coverage | High |

### 2.2 Architectural Concerns

| ID | Concern | Description |
|----|---------|-------------|
| AC-1 | Automation Rate | Achieve 60-75% autonomous ticket resolution |
| AC-2 | Response Time | First response < 30 seconds for AI-handled queries |
| AC-3 | Context Preservation | Maintain full context during agent-to-agent and agent-to-human handoffs |
| AC-4 | ServiceNow Integration | Deep integration with Incident and KB APIs |
| AC-5 | Scalability | Support 100+ concurrent conversations |
| AC-6 | Reliability | 99.5% uptime for production deployment |
| AC-7 | Analytics Pipeline | Enable analytics data sharing to Databricks |
| AC-8 | Role-Based Access | Enforce authorization per role, test multiple personas |
| AC-9 | Role-Based UI | Differentiated frontend rendering by role |

---

## 3. Role-Based Architecture (MVP Enhancement)

### 3.1 Role Definitions

#### Role 1: Requestor (Customer/Employee)
**Who**: External customers or internal employees submitting support requests

| Attribute | Value |
|-----------|-------|
| **Permissions** | Create tickets, view own tickets, provide feedback |
| **UI Components** | Chat interface, ticket submission form, status tracker |
| **Features** | Conversation history, ticket search (own), feedback form |
| **Data Access** | Own conversations, own tickets only |
| **Limitations** | Cannot view other tickets, no admin features |

**Mocked Login Credentials**:
```
Username: customer@example.com | Password: requestor123
Username: employee@acme.com | Password: requestor123
```

#### Role 2: Real Agent (Support Staff)
**Who**: Human support staff handling escalations and complex issues

| Attribute | Value |
|-----------|-------|
| **Permissions** | View queued tickets, accept assignments, resolve, reassign |
| **UI Components** | Ticket queue, customer history, resolution form, KB search |
| **Features** | Agent dashboard, ticket search (all), team metrics, KB editor |
| **Data Access** | All assigned/team tickets, conversation history, customer notes |
| **Escalation Rights** | Escalate to L3, create incidents in ServiceNow |

**Mocked Login Credentials**:
```
Username: agent1@company.com | Password: agent123
Username: agent2@company.com | Password: agent123
```

#### Role 3: Platform Administrator
**Who**: System administrators managing users, configuration, and operations

| Attribute | Value |
|-----------|-------|
| **Permissions** | Full system access, user management, configuration |
| **UI Components** | Admin dashboard, user management, system settings, monitoring |
| **Features** | User CRUD, role management, system health, analytics export |
| **Data Access** | All data in system, audit logs, analytics |
| **Capabilities** | Create users, modify config, reset passwords, view all analytics |

**Mocked Login Credentials**:
```
Username: admin@company.com | Password: admin123
```

---

## 4. Authentication and Authorization Architecture

### 4.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

User Login Page
        │
        ▼
┌──────────────────┐      ┌────────────────────┐
│  React Login UI  │─────►│ Auth Service API   │
│  (Email/Pass)    │      │ (FastAPI)          │
└──────────────────┘      └─────────┬──────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              ┌─────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐
              │  Mocked    │  │  JWT Token │  │  User Role │
              │  User DB   │  │  Generator │  │  Lookup    │
              └────────────┘  └─────┬──────┘  └────────────┘
                                    │
                        ┌───────────▼───────────┐
                        │  Store JWT in Secure  │
                        │  HttpOnly Cookie      │
                        └───────────┬───────────┘
                                    │
                        ┌───────────▼───────────┐
                        │  Redirect to Role-   │
                        │  Based Dashboard     │
                        └───────────────────────┘
```

### 4.2 JWT Token Structure (Mocked)

```json
{
  "sub": "agent1@company.com",
  "role": "REAL_AGENT",
  "team": "tier2_support",
  "permissions": ["view_queue", "accept_ticket", "resolve_ticket"],
  "iat": 1653561600,
  "exp": 1653648000
}
```

### 4.3 Authorization Middleware

**Implementation**: Spring Security with custom role-based authorization


**Implementation**: FastAPI with custom role-based authorization using dependency injection

```python
# Authorization decorator for role-based checks
from fastapi import Depends, HTTPException, status
from enum import Enum

class UserRole(str, Enum):
  REQUESTOR = "REQUESTOR"
  REAL_AGENT = "REAL_AGENT"
  PLATFORM_ADMIN = "PLATFORM_ADMIN"

async def require_role(*roles: UserRole):
  """Dependency injection for role-based authorization"""
  async def check_role(current_user: User = Depends(get_current_user)):
    if current_user.role not in roles:
      raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient permissions"
      )
    return current_user
  return check_role

# Usage in FastAPI endpoints
@app.post("/api/v1/queue/{ticket_id}/accept")
async def accept_ticket(
  ticket_id: str,
  current_user: User = Depends(require_role(UserRole.REAL_AGENT))
):
  """Only Real Agents can accept tickets"""
  # Implementation
  pass

@app.get("/api/v1/system/health")
async def get_system_health(
  current_user: User = Depends(require_role(UserRole.PLATFORM_ADMIN))
):
  """Only Admins can view system health"""
  # Implementation
  pass
```
---

## 5. Architectural Views

### 5.1 Logical View (Role-Based)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CUSTOMER INTERACTION LAYER                         │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │
│  │ Requestor UI    │  │  Real Agent UI  │  │  Admin UI       │       │
│  │ (Chat Submit)   │  │ (Ticket Queue)  │  │  (Management)   │       │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘       │
└───────────┼──────────────────────┼──────────────────────┼──────────────┘
            │                      │                      │
            ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    ROLE-BASED API GATEWAY LAYER                         │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Authentication Service (JWT Validation)                        │   │
│  │  Authorization Middleware (Role-Based Access Control)           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
┌─────────────────────┐  ┌──────────────────┐  ┌─────────────────────┐
│  REQUESTOR ROUTES   │  │  AGENT ROUTES    │  │  ADMIN ROUTES       │
├─────────────────────┤  ├──────────────────┤  ├─────────────────────┤
│ POST /chat/submit   │  │ GET /queue       │  │ GET /users          │
│ GET /tickets/mine   │  │ POST /accept     │  │ POST /users         │
│ GET /status/{id}    │  │ POST /resolve    │  │ DELETE /users/{id}  │
│ POST /feedback      │  │ GET /customer-   │  │ GET /system-health  │
│                     │  │    history       │  │ GET /analytics      │
│                     │  │ PUT /notes       │  │ PUT /config         │
└─────────────────────┘  └──────────────────┘  └─────────────────────┘
```

### 5.2 Frontend Architecture by Role

```
REQUESTOR VIEW                AGENT VIEW                  ADMIN VIEW
┌──────────────────┐         ┌──────────────────┐        ┌──────────────┐
│  Navigation      │         │  Navigation      │        │  Navigation  │
├──────────────────┤         ├──────────────────┤        ├──────────────┤
│ • Chat Box       │         │ • Ticket Queue   │        │ • Dashboard  │
│ • My Tickets     │         │ • My Assignments │        │ • Users      │
│ • Status         │         │ • Customer View  │        │ • Config     │
│ • Feedback       │         │ • KB Search      │        │ • Monitoring │
│ • Profile        │         │ • Profile        │        │ • Analytics  │
└──────────────────┘         └──────────────────┘        └──────────────┘
     SCREENS:                    SCREENS:                   SCREENS:
  ✓ Chat Interface           ✓ Queue Dashboard           ✓ Admin Dashboard
  ✓ Ticket List (Own)        ✓ Ticket Details            ✓ User Management
  ✓ Status Tracker           ✓ Customer Profile          ✓ System Settings
  ✓ Feedback Form            ✓ Resolution Panel          ✓ Audit Logs
  ✓ Profile Settings         ✓ KB Editor                 ✓ Analytics Export
                             ✓ Escalation Tools          ✓ Health Monitoring
```

### 5.3 Process View (Role-Based Request Flow)

```
                        LOGIN PORTAL
                             │
                    ┌────────┼────────┐
                    │        │        │
          ┌─────────▼─┐  ┌──▼──────┐ ┌▼─────────────┐
          │ Requestor │  │  Agent  │ │  Admin      │
          └─────┬─────┘  └────┬────┘ └──────┬──────┘
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐ ┌─────────┐ ┌────────────┐
        │ CHAT SUBMIT  │ │QUEUE    │ │MANAGEMENT  │
        ├──────────────┤ ├─────────┤ ├────────────┤
        │ 1. Compose   │ │1. View  │ │1. View    │
        │ 2. Submit    │ │2. Accept│ │2. Manage  │
        │ 3. Monitor   │ │3. Work  │ │3. Config  │
        │    status    │ │4. Resolve│ │4. Export  │
        └──────────────┘ └─────────┘ └────────────┘
```

### 5.4 Deployment View (Role-Based)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   DEPLOYMENT WITH RBAC                                  │
└─────────────────────────────────────────────────────────────────────────┘

                  ┌────────────────────────────┐
                  │   AWS/GCP Load Balancer    │
                  └─────────────┬──────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
      ┌───────▼──────┐  ┌─────▼──────┐  ┌──────▼──────┐
                                  │   (S3)       │  │  FastAPI   │  │   FastAPI   │
                                  │              │  │   (Uvicorn)│  │   (Uvicorn) │
      │   Frontend   │  │   Boot API │  │   Service   │
      │   (S3)       │  │   (ECS)    │  │   (Lambda)  │
      └──────────────┘  └─────┬──────┘  └─────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
      ┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
      │  PostgreSQL  │ │  Redis      │ │ ServiceNow  │
      │  (RBAC Data) │ │  (Sessions) │ │ (External)  │
      └──────────────┘ └─────────────┘ └─────────────┘
```

### 5.5 Data Model with Role-Based Access

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA MODEL                                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│      Users      │       │   Conversations  │       │     Tickets     │
├─────────────────┤       ├──────────────────┤       ├─────────────────┤
│ id: UUID        │       │ id: UUID         │       │ id: UUID        │
│ email: String   │       │ user_id: FK      │       │ user_id: FK     │
│ role: Enum      │───┐   │ agent_id: FK     │       │ agent_id: FK    │
│ team: String    │   │   │ created_at       │       │ status          │
│ permissions:[]  │   │   │ last_message     │       │ priority        │
│ created_at      │   │   │ status           │       │ assigned_team   │
└─────────────────┘   │   └──────────────────┘       └─────────────────┘
                      │
                      └──────────────┬──────────────┐
                                    │              │
                           ┌────────▼───────┐   ┌──▼──────────────┐
                           │   Incidents    │   │  KB Articles    │
                           ├────────────────┤   ├─────────────────┤
                           │ id: String     │   │ id: UUID        │
                           │ ticket_id: FK  │   │ title: String   │
                           │ sn_incident_id │   │ content: Text   │
                           │ status         │   │ role_access:[]  │
                           │ resolution     │   │ confidence      │
                           │ resolved_by    │   │ created_at      │
                           │ resolved_at    │   └─────────────────┘
                           └────────────────┘

┌──────────────────┐
│   Audit Logs     │  [ADMIN ONLY ACCESS]
├──────────────────┤
│ id: UUID         │
│ user_id: FK      │
│ action: String   │
│ resource: String │
│ timestamp        │
│ details: JSON    │
└──────────────────┘
```

---

## 6. Multi-Role Feature Specifications

### 6.1 Requestor Features

#### F1: Submit Support Ticket
```gherkin
Feature: Customer/Employee submits support request

Scenario: Requestor opens chat and submits issue
  Given a requestor is logged in to the chat interface
  When they type their issue
  And click "Submit Request"
  Then the request is captured
  And they see a confirmation ticket ID
  And can track status in real-time

Scenario: Requestor provides feedback
  Given a ticket is resolved
  When requestor views the resolution
  And completes the feedback form
  Then feedback is recorded for analytics
  And agent performance metrics are updated
```

#### F2: View Own Tickets
```gherkin
Feature: Requestor views ticket status

Scenario: Requestor searches personal tickets
  Given a requestor is logged in
  When they navigate to "My Tickets"
  Then they see only their own tickets
  And can filter by status (Open, Pending, Resolved)
  And cannot view other users' tickets

Scenario: Requestor sees real-time updates
  Given a ticket is open
  When an agent accepts it
  Then requestor sees status change immediately
  And receives notification
```

### 6.2 Real Agent Features

#### F3: Ticket Queue Management
```gherkin
Feature: Agent manages ticket queue

Scenario: Agent views assigned queue
  Given an agent is logged in
  When they navigate to "My Queue"
  Then they see tickets assigned to them
  And can filter by priority, age, status
  And can accept new tickets from pool

Scenario: Agent resolves ticket
  Given agent is working on a ticket
  When they complete their work
  And click "Resolve"
  And fill in resolution details
  Then ticket is marked resolved
  And customer is notified
  And KB article generation is triggered
```

#### F4: Customer Context and History
```gherkin
Feature: Agent accesses customer context

Scenario: Agent views full customer history
  Given agent opens a ticket
  When they click "Customer Profile"
  Then they see customer's conversation history
  And previous tickets
  And unresolved issues
  And account status

Scenario: Agent notes customer information
  Given agent is resolving a ticket
  When they add a note in the resolution details
  Then the note is stored with agent attribution
  And visible to future agents handling same customer
  And can reference in similar issues
```

#### F5: Escalation and L3 Handoff
```gherkin
Feature: Agent escalates complex issues

Scenario: Agent escalates to L3
  Given agent determines issue requires L3 support
  When they click "Escalate to L3"
  And fill escalation details
  Then incident is created in ServiceNow
  And L3 team is notified
  And customer sees status update
```

### 6.3 Admin Features

#### F6: User Management
```gherkin
Feature: Admin manages users and roles

Scenario: Admin creates new agent account
  Given admin navigates to "User Management"
  When they click "Create User"
  And fill in user details (email, name, role, team)
  And assign permissions
  Then user account is created
  And temporary password is generated
  And welcome email is sent

Scenario: Admin modifies user role
  Given admin views user list
  When they select a user
  And change their role (REQUESTOR → REAL_AGENT)
  Then role change takes effect immediately
  And user's permissions are updated
  And audit log entry is created
```

#### F7: System Configuration
```gherkin
Feature: Admin configures system settings

Scenario: Admin updates SLA settings
  Given admin navigates to "Settings"
  When they modify first response time SLA
  And update priority calculation rules
  Then changes apply to new tickets
  And system alerts agents of SLA violations

Scenario: Admin exports analytics
  Given admin navigates to "Analytics Export"
  When they select date range
  And click "Export to Databricks"
  Then data is exported asynchronously
  And admin receives notification when complete
```

#### F8: System Monitoring and Health
```gherkin
Feature: Admin monitors system health

Scenario: Admin views system dashboard
  Given admin navigates to "Dashboard"
  Then they see:
    - Uptime percentage
    - Current concurrent users
    - Error rates per agent
    - Queue depth and age
    - API latency metrics
    - Agent performance rankings

Scenario: Admin views audit logs
  Given admin navigates to "Audit Logs"
  When they filter by user/action/date
  Then they see all system changes
  And who made changes
  And when they were made
  And what data was affected
```

---

## 7. Implementation Highlights for Engineering Teams

### 7.1 Frontend Engineer Changes

#### New Components to Build
| Component | Purpose | Impacted Screens |
|-----------|---------|------------------|
| `<RoleBasedNav />` | Dynamic navigation by role | All pages |
| `<RoleGate />` | Conditional component rendering | Dashboard, settings |
| `<TicketQueue />` | Agent ticket queue table | Agent dashboard |
| `<AdminPanel />` | System management interface | Admin section |
| `<UserManagement />` | CRUD for users | Admin users page |
| `<CustomerProfile />` | Agent view customer history | Ticket detail view |
| `<AuditLog />` | Display audit logs | Admin page |
| `<HealthDashboard />` | System metrics display | Admin dashboard |

#### Screen Changes Required
| Screen | Current State | New Requirement |
|--------|---------------|-----------------|
| Login | Single form | Multi-role form with role indicator |
| Dashboard | Generic | Three role-specific dashboards |
| Ticket Detail | Customer view | Agent view + customer history + notes |
| Settings | N/A | Admin-only configuration UI |
| Navigation | Requestor-focused | Role-based menu items |

#### State Management Updates
- Add `userRole` to Zustand store
- Add `permissions[]` array to auth state
- Implement role-based navigation guards
- Add `auditLog` selector for admin views

### 7.2 Backend Engineer Changes

#### New API Endpoints (Role-Based)

**Requestor Endpoints**:
```
POST   /api/v1/tickets                  # Submit new ticket
GET    /api/v1/tickets/mine             # List own tickets
GET    /api/v1/tickets/{id}             # View own ticket (authorization check)
POST   /api/v1/tickets/{id}/feedback    # Submit feedback
```

**Agent Endpoints**:
```
GET    /api/v1/queue                    # Get assigned tickets
POST   /api/v1/queue/{id}/accept        # Accept ticket
POST   /api/v1/queue/{id}/resolve       # Mark resolved
GET    /api/v1/customers/{id}/history   # Get customer history
PUT    /api/v1/tickets/{id}/notes       # Add agent notes
POST   /api/v1/tickets/{id}/escalate    # Escalate to L3
```

**Admin Endpoints**:
```
GET    /api/v1/users                    # List all users
POST   /api/v1/users                    # Create user
PUT    /api/v1/users/{id}               # Update user
DELETE /api/v1/users/{id}               # Delete user
GET    /api/v1/audit-logs               # Get audit logs
GET    /api/v1/system/health            # System health
PUT    /api/v1/config                   # Update settings
POST   /api/v1/analytics/export         # Export to Databricks
```

#### Authentication & Authorization

**Spring Security Configuration**:
```java
@Configuration
public class SecurityConfig {
    
    // JWT validation filter
    // Role-based authorization checks
    // CORS configuration
    // API rate limiting per role
}
```

**Role Enum**:
```java
public enum UserRole {
    REQUESTOR("ROLE_REQUESTOR", 
        "create_ticket", "view_own_tickets", "feedback"),
    REAL_AGENT("ROLE_REAL_AGENT", 
        "view_queue", "accept_ticket", "resolve_ticket", "escalate"),
    PLATFORM_ADMIN("ROLE_PLATFORM_ADMIN", 
        "manage_users", "view_all_tickets", "system_config", "audit");
    
    private final String roleCode;
    private final List<String> permissions;
}
```

**FastAPI Configuration**:
```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from enum import Enum
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

app = FastAPI(title="Agentic Support API", version="2.0")

# CORS Configuration
app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:3000"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

# Role Enum
class UserRole(str, Enum):
  REQUESTOR = "REQUESTOR"
  REAL_AGENT = "REAL_AGENT"
  PLATFORM_ADMIN = "PLATFORM_ADMIN"

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
JWT_SECRET = "your-256-bit-secret-key"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
```
#### New Database Models

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,  -- REQUESTOR, REAL_AGENT, PLATFORM_ADMIN
    team VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by_admin_id UUID
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    changes JSONB,
    timestamp TIMESTAMP,
    ip_address VARCHAR(45)
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    jwt_token_hash VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    login_at TIMESTAMP,
    last_activity TIMESTAMP,
    logout_at TIMESTAMP
);
```

**SQLAlchemy ORM Models** (Python equivalent):
```python
from sqlalchemy import Column, String, DateTime, ForeignKey, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base
import uuid
from datetime import datetime

Base = declarative_base()

class User(Base):
  __tablename__ = "users"
    
  id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  email = Column(String(255), unique=True, nullable=False)
  password_hash = Column(String(255), nullable=False)
  role = Column(String(50), nullable=False)  # REQUESTOR, REAL_AGENT, PLATFORM_ADMIN
  team = Column(String(100), nullable=True)
  created_at = Column(DateTime, default=datetime.utcnow)
  updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
  created_by_admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

class AuditLog(Base):
  __tablename__ = "audit_logs"
    
  id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
  action = Column(String(100), nullable=False)
  resource_type = Column(String(50), nullable=True)
  resource_id = Column(String(100), nullable=True)
  changes = Column(JSONB, nullable=True)
  timestamp = Column(DateTime, default=datetime.utcnow)
  ip_address = Column(String(45), nullable=True)

class UserSession(Base):
  __tablename__ = "user_sessions"
    
  id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
  user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
  jwt_token_hash = Column(String(255), nullable=True)
  ip_address = Column(String(45), nullable=True)
  user_agent = Column(String(500), nullable=True)
  login_at = Column(DateTime, default=datetime.utcnow)
  last_activity = Column(DateTime, default=datetime.utcnow)
  logout_at = Column(DateTime, nullable=True)
```
#### Authorization Interceptor

```java
@Component
public class RoleBasedAuthorizationInterceptor extends HandlerInterceptorAdapter {
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                           HttpServletResponse response, 
                           Object handler) {
        // Extract JWT token
        // Validate user role
        // Check endpoint permissions
        // Log audit trail
        // Return 403 if unauthorized
    }
}
```

**FastAPI Authorization Middleware**:
```python
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)

class RoleBasedAuthorizationMiddleware(BaseHTTPMiddleware):
  async def dispatch(self, request: Request, call_next):
    # Extract JWT token from cookies
    token = request.cookies.get("access_token")
        
    if not token:
      raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing authentication token"
      )
        
    try:
      # Validate token and extract user info
      payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
      user_email = payload.get("sub")
      user_role = payload.get("role")
            
      # Attach user info to request
      request.state.user_email = user_email
      request.state.user_role = user_role
            
      # Log authorization check
      logger.info(f"User {user_email} ({user_role}) accessed {request.url.path}")
            
    except JWTError:
      raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication token"
      )
        
    response = await call_next(request)
    return response

# Register middleware
app.add_middleware(RoleBasedAuthorizationMiddleware)
```
### 7.3 QA Engineer Test Scenarios

#### Test Suite: Role-Based Access Control

**Scenario 1: Requestor Cannot Access Agent Features**
```gherkin
Given a requestor is logged in
When they try to access /queue endpoint (via direct URL)
Then they receive 403 Forbidden
And redirected to requestor dashboard
And action is logged in audit log
```

**Scenario 2: Agent Cannot Access Admin Settings**
```gherkin
Given a real agent is logged in
When they try to access /config endpoint (via direct URL)
Then they receive 403 Forbidden
And cannot see "Settings" in navigation
```

**Scenario 3: Admin Can Access All Features**
```gherkin
Given an admin is logged in
When they navigate to any feature
Then all components render correctly
And they can perform all CRUD operations
And all actions are logged in audit logs
```

**Scenario 4: Token Expiration and Re-auth**
```gherkin
Given a user's JWT token has expired
When they try to make an API request
Then they receive 401 Unauthorized
And frontend redirects to login
And previous ticket draft is preserved (sessionStorage)
```

**Scenario 5: Role Change Takes Effect Immediately**
```gherkin
Given an agent is logged in as REAL_AGENT
When admin changes their role to PLATFORM_ADMIN
And agent refreshes the page (or next action)
Then they see admin interface
And have access to admin features
And old agent features are hidden
```

#### Test Coverage Matrix

| Role | Feature | Test Type | Status |
|------|---------|-----------|--------|
| REQUESTOR | Submit ticket | Unit + E2E | ⏳ Pending |
| REQUESTOR | View own tickets | Unit + E2E | ⏳ Pending |
| REQUESTOR | Cannot access queue | Security | ⏳ Pending |
| REAL_AGENT | View queue | Unit + E2E | ⏳ Pending |
| REAL_AGENT | Accept/resolve | Unit + E2E | ⏳ Pending |
| REAL_AGENT | Cannot access admin | Security | ⏳ Pending |
| ADMIN | User management | Unit + E2E | ⏳ Pending |
| ADMIN | System config | Unit + E2E | ⏳ Pending |
| ADMIN | Audit logs | Unit + E2E | ⏳ Pending |
| ALL | Token expiration | Security | ⏳ Pending |
| ALL | Role-based UI | UI/UX | ⏳ Pending |

#### Mocked User Scenarios for Testing

```javascript
// Test data for QA
const testUsers = [
  {
    id: 'requestor-1',
    email: 'customer@example.com',
    password: 'requestor123',
    role: 'REQUESTOR',
    name: 'John Customer',
    status: 'active'
  },
  {
    id: 'agent-1',
    email: 'agent1@company.com',
    password: 'agent123',
    role: 'REAL_AGENT',
    team: 'tier2_support',
    status: 'active'
  },
  {
    id: 'admin-1',
    email: 'admin@company.com',
    password: 'admin123',
    role: 'PLATFORM_ADMIN',
    status: 'active'
  }
];
```

---

## 8. Technology Stack (Updated for MVP)

| Layer | Technology | Version | Role Context |
|-------|------------|---------|--------------|
| Backend | Python | 3.10+ | Auth, RBAC, audit logs, CrewAI integration |
| Framework | FastAPI | 0.104+ | Async support, automatic API docs |
| Security | python-jose + Passlib | Latest | JWT, role-based authorization |
| Agent Orchestration | CrewAI | Latest | Multi-agent AI coordination |
| Frontend | React | 18.x | Role-based component rendering |
| Database | PostgreSQL | 16 | User/role/audit tables |
| Cache | Redis | 7.4 | Session storage, token blacklist |
| LLM | Google Gemini 2.5 Pro | Latest | Adaptive responses per role |
| Analytics | Databricks | Latest | Role-based data access |

---

## 9. Quality Attributes (Updated)

| Attribute | Requirement | Priority |
|-----------|-------------|----------|
| **Availability** | 99.5% uptime | Critical |
| **Performance** | < 30s first response | High |
| **Security** | Role-based access enforced | Critical |
| **Scalability** | 100+ concurrent users | High |
| **Auditability** | All actions logged | Critical |
| **Testability** | > 80% unit test coverage | High |

---

## 10. Risks and Mitigations

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R-001 | LLM hallucination | Medium | High | Validate with KB, human review |
| R-002 | Unauthorized access via token theft | Medium | Critical | HTTPS, HttpOnly cookies, token rotation |
| R-003 | Role escalation exploit | Low | Critical | Authorization checks at each endpoint |
| R-004 | Audit log tampering | Low | High | Immutable audit store, checksums |
| R-005 | Mocked users in production | High | Critical | Remove test users before production |

---

## 11. MVP Exclusions and Future Work

### 11.1 Deferred Features
| Feature | Reason | Phase |
|---------|--------|-------|
| SAML/OAuth SSO | Complexity, test with mocks first | Phase 3 |
| Advanced RBAC (attribute-based) | Scope expansion | Future |
| Real-time role sync | External identity provider needed | Future |
| Two-factor authentication (2FA) | MVP focus on single mocks | Future |
| Role-based encryption | Complex key management | Future |

### 11.2 Testing Assumptions
- **Mocked Users Only**: No real identity provider integrated
- **JWT in HttpOnly Cookies**: Secure, not vulnerable to XSS
- **No API Key auth**: Only JWT token-based auth for MVP
- **Single-server deployment**: No distributed session concerns

---

## 12. Implementation Roadmap

### Phase 2A: Authentication (Weeks 1-2)
- [ ] Implement JWT token generation
- [ ] Create user/role database models
- [ ] Build login endpoint with mocked user DB
- [ ] Create auth middleware for Spring Boot

### Phase 2B: Frontend RBAC (Weeks 2-3)
- [ ] Build role-based navigation component
- [ ] Create role-specific dashboards
- [ ] Implement role gates for components
- [ ] Update app routing for role-based access

### Phase 2C: Backend Authorization (Weeks 3-4)
- [ ] Implement @PreAuthorize annotations
- [ ] Create authorization interceptor
- [ ] Build role-based API endpoints
- [ ] Add audit logging for all actions

### Phase 2D: QA Testing (Weeks 4-5)
- [ ] Create role-based test scenarios
- [ ] Test unauthorized access attempts
- [ ] Verify audit logs
- [ ] Performance testing with concurrent users

---

## 13. Document Control and Approvals

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Apr 27, 2026 | System Architect | Initial SAD |
| 2.0 | May 25, 2026 | System Architect | Added RBAC, role-based UI, implementation details |

**Status**: Ready for Build Phase (Phase 2)  
**Next Review**: After backend implementation (Week 4)

---

## 14. Appendix: Quick Reference

### A. Role Comparison Matrix

| Feature | Requestor | Real Agent | Admin |
|---------|-----------|-----------|-------|
| Submit tickets | ✅ | ✅ | ❌ |
| View own tickets | ✅ | ✅ | ✅ (all) |
| Access queue | ❌ | ✅ | ✅ (view) |
| Resolve tickets | ❌ | ✅ | ❌ |
| Escalate to L3 | ❌ | ✅ | ❌ |
| Manage users | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ✅ |
| Configure system | ❌ | ❌ | ✅ |
| Export analytics | ❌ | ❌ | ✅ |

### B. Login Credentials (Mocked for MVP)

```
Requestor:
  Email: customer@example.com | Pass: requestor123
  Email: employee@acme.com    | Pass: requestor123

Real Agent:
  Email: agent1@company.com   | Pass: agent123
  Email: agent2@company.com   | Pass: agent123

Admin:
  Email: admin@company.com    | Pass: admin123
```

### C. Related Documents
- [PRD](../1.define/prd.md) - Product requirements
- [MRD](../1.define/mrd.md) - Market research
- [Architecture Plan](./architecture-plan.md) - Implementation plan
