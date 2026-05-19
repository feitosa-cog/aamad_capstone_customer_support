# Backend Implementation Plan: Agentic Customer Support System

**Date**: May 18, 2026  
**Status**: In Progress  
**Owner**: Backend Developer  

---

## 1. Project Overview

Build a multi-agent customer support system using **CrewAI** with **FastAPI** for REST endpoints.  
Target: 60-75% automation with seamless human handoff.

### Key Requirements (from PRD/SAD)
- Multi-agent architecture (Triage → Domain Specialists → Handoff/Resolution)
- <30 second response time
- 100+ concurrent conversations
- ServiceNow integration (Incident Management + KB)
- PostgreSQL + Redis backend
- 99.5% uptime

---

## 2. Architecture

### 2.1 Application Layers

```
API Layer (FastAPI)
    ↓
Orchestration Layer (CrewAI Crew)
    ↓
Domain Specialist Agents (7 agents)
    ↓
Business Logic Services
    ↓
Integration Layer (ServiceNow, Email, Chat)
    ↓
Data Layer (PostgreSQL, Redis)
```

### 2.2 Agent Structure

#### Tier 1: Router Agents
- **Triage Agent**: Intent classification & routing
- **Handoff Agent**: Human escalation & context preservation

#### Tier 2: Domain Specialists
- **Order Specialist**: Order tracking, modifications, cancellations
- **Product Specialist**: Product info, availability, comparisons
- **Returns Specialist**: Return/refund processing
- **Consumer Specialist**: Account, billing, general inquiries
- **IT Specialist**: Internal incident management

---

## 3. Implementation Tasks

### Phase A: CrewAI Agent Framework

| Task | Description | Status | Priority |
|------|-------------|--------|----------|
| A1 | Update agents.yaml with 7 agent definitions | Completed | HIGH |
| A2 | Update tasks.yaml with agent tasks | Completed | HIGH |
| A3 | Implement crew.py with full Crew configuration | Completed | HIGH |
| A4 | Create ToolRegistry for agent tools | Not Started | HIGH |
| A5 | Implement ConversationContext for memory | Not Started | MEDIUM |
| A6 | Add error handling & retry logic | Not Started | MEDIUM |

### Phase B: Business Logic Services

| Task | Description | Status | Priority |
|------|-------------|--------|----------|
| B1 | TicketService (create, update, retrieve) | Completed | HIGH |
| B2 | ConversationService (manage chat history) | Completed | HIGH |
| B3 | RoutingService (delegate to specialists) | Not Started | HIGH |
| B4 | EscalationService (human handoff) | Not Started | HIGH |
| B5 | ServiceNowService (incident sync) | Completed | MEDIUM |
| B6 | NotificationService (email/chat alerts) | Not Started | MEDIUM |

### Phase C: REST API Endpoints (FastAPI)

| Endpoint | Method | Description | Status | Priority |
|----------|--------|-------------|--------|----------|
| C1 | POST `/chat` | Send message to support | Completed | HIGH |
| C2 | GET `/chat/{conversation_id}` | Get conversation history | Completed | HIGH |
| C3 | POST `/escalate` | Escalate to human agent | Completed | HIGH |
| C4 | GET `/tickets` | List user tickets | Completed | HIGH |
| C5 | GET `/tickets/{ticket_id}` | Get ticket details | Completed | MEDIUM |
| C6 | POST `/tickets/{ticket_id}/feedback` | Ticket feedback | Not Started | MEDIUM |
| C7 | GET `/health` | Health check | Completed | LOW |

### Phase D: Data Models & Database

| Task | Description | Status | Priority |
|------|-------------|--------|----------|
| D1 | Define SQLAlchemy models (Conversation, Ticket, etc.) | Completed | HIGH |
| D2 | Create database migrations | Not Started | HIGH |
| D3 | Implement session management with Redis | Not Started | MEDIUM |
| D4 | Add database schema documentation | Not Started | LOW |

### Phase E: Integration & Testing

| Task | Description | Status | Priority |
|------|-------------|--------|----------|
| E1 | ServiceNow API client implementation | Completed | MEDIUM |
| E2 | Chat API mock implementation | Completed | MEDIUM |
| E3 | Unit tests for services | Completed | MEDIUM |
| E4 | Integration tests for API endpoints | Completed | MEDIUM |
| E5 | Load testing (100+ concurrent) | Not Started | LOW |

---

## 4. Technical Stack

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| Agent Framework | CrewAI | 1.14.2 | Multi-agent orchestration |
| API Framework | FastAPI | Latest | REST API endpoints |
| Web Server | Uvicorn | Latest | ASGI server |
| Database | PostgreSQL | 16 | Primary data store |
| Cache | Redis | 7.4 | Session & conversation cache |
| ORM | SQLAlchemy | 2.x | Database abstraction |
| LLM Gateway | OpenAI | Latest | GPT-4 API |
| Task Queue | Celery | Optional | Async task processing |

---

## 5. Data Models

### Conversation
```
id: UUID (PK)
user_id: UUID (FK)
title: String
status: Enum [active, resolved, escalated]
created_at: Timestamp
updated_at: Timestamp
assigned_agent: String (agent name)
priority: Int (1-5)
```

### Ticket
```
id: UUID (PK)
conversation_id: UUID (FK)
user_id: UUID (FK)
type: Enum [order, product, returns, account, it]
status: Enum [open, in_progress, resolved, escalated]
created_at: Timestamp
updated_at: Timestamp
assigned_to: String (human agent)
servicenow_id: String (external)
resolution: Text
automation_score: Float (0-100)
```

### Message
```
id: UUID (PK)
conversation_id: UUID (FK)
sender_type: Enum [user, agent, system]
sender_id: String
content: Text
metadata: JSON
created_at: Timestamp
```

---

## 6. Agent Tool Categories

### Information Retrieval
- `lookup_order` — Order details by ID
- `lookup_product` — Product info & availability
- `lookup_customer` — Customer account details
- `search_kb` — Knowledge base search

### Actions
- `create_ticket` — Create support ticket
- `update_ticket` — Update ticket status
- `process_refund` — Process refund
- `schedule_callback` — Schedule human callback

### Escalation
- `escalate_to_human` — Handoff to support agent
- `create_incident` — Create ServiceNow incident
- `send_notification` — Alert customer/agent

---

## 7. Workflow: Message → Resolution

```
1. Message Received (API)
   └─> Validate & store in Conversation
   
2. Triage Agent
   └─> Classify intent → Determine category
   
3. Route to Specialist
   ├─> Order Specialist
   ├─> Product Specialist
   ├─> Returns Specialist
   ├─> Consumer Specialist
   └─> IT Specialist
   
4. Specialist Processing
   ├─> Gather information (tools)
   ├─> Generate response
   └─> Determine resolution or escalation
   
5. Resolution/Escalation
   ├─> Auto-Resolved: Return response to user
   └─> Escalation: Handoff Agent routes to human
   
6. Completion
   └─> Update Ticket, Log metrics, Send notification
```

---

## 8. Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Automation Rate | 60-75% | TBD | Tracking |
| Avg Response Time | <30s | TBD | Tracking |
| CSAT Score | >4.0/5.0 | TBD | Tracking |
| Ticket Resolution Rate | >85% | TBD | Tracking |
| System Uptime | 99.5% | TBD | Tracking |
| Concurrent Users | 100+ | TBD | Tracking |

---

## 9. Implementation Order

1. **Week 1-2**: CrewAI agents & tasks configuration
2. **Week 2-3**: Business logic services & data models
3. **Week 3-4**: FastAPI endpoints & integration
4. **Week 4-5**: Testing & optimization
5. **Week 5**: Deployment & monitoring

---

## 10. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| LLM token limits | Conversation context loss | Implement conversation summarization |
| Agent hallucination | Incorrect responses | Add validation & guardrails |
| ServiceNow API rate limits | Integration failures | Implement caching & retry logic |
| Database performance | Slow response times | Add indexing & query optimization |
| Concurrent user handling | System crashes | Load testing & auto-scaling |

---

## 11. Documentation Requirements

- [ ] API specification (OpenAPI/Swagger)
- [ ] Agent configuration guide
- [ ] Deployment runbook
- [ ] Troubleshooting guide
- [ ] Architecture decision records (ADRs)

---

## Progress Tracking

### Completed
- ✅ Project structure initialized
- ✅ CrewAI template scaffolded
- ✅ Backend plan created
### In Progress
- ✅ Agent definitions (agents.yaml)
- ✅ Task configurations (tasks.yaml)
- ✅ Crew implementation (crew.py)
- ✅ FastAPI endpoints scaffolding (`/chat`, `/escalate`, `/health`, `/tickets`, `/chat/{id}`)
- ✅ TicketService (in-memory MVP)
- ✅ ConversationService (SQLAlchemy/SQLite)
- ✅ ServiceNowService (mocked with rate limiting)
- ✅ Unit & integration tests (all 6 passing)
- ✅ README and run script

### Not Started
- ⏱️ Business logic services (RoutingService, EscalationService, NotificationService)
- ⏱️ Database migrations (Alembic)
- ⏱️ PostgreSQL setup for production
- ⏱️ Real ServiceNow REST integration
- ⏱️ Agent tool registry & implementations
- ⏱️ Conversation summarization & context windowing
- ⏱️ Load testing
- ⏱️ Authentication & authorization

---

**Last Updated**: May 18, 2026  
**Next Steps**: Implement CrewAI agents & update status

---

## 12. MVP Completion Summary

### ✅ Phase 1: CrewAI Crew & Agents (COMPLETE)
- 7 agent definitions: Triage, Order, Product, Returns, Consumer, IT, Handoff
- 7 corresponding task definitions
- Crew orchestrator with `process_customer_query()` and `escalate_to_human()` methods
- Full sequential processing pipeline

### ✅ Phase 2: Backend Services (COMPLETE)
- **TicketService**: In-memory CRUD (create, read, update, list)
- **ConversationService**: SQLAlchemy + SQLite persistence, message tracking
- **ServiceNowService**: Mocked client with rate limiting (600/min), incident logging

### ✅ Phase 3: FastAPI REST API (COMPLETE)
- `POST /chat` — Send message, auto-create conversation, escalate on demand
- `POST /escalate` — Direct human handoff with context preservation
- `GET /chat/{conversation_id}` — Retrieve full conversation history
- `GET /tickets` — List all or filtered tickets
- `GET /tickets/{ticket_id}` — Get ticket details
- `GET /health` — Health status check

### ✅ Phase 4: Data Models & Database (COMPLETE)
- SQLAlchemy models: Conversation, Ticket, Message
- Enums: ConversationStatus, TicketStatus, MessageSender
- SQLite for local development (agentic_support.db)
- Relationships and proper foreign keys

### ✅ Phase 5: Testing (COMPLETE)
- **test_ticket_service.py**: CRUD operations (1 test)
- **test_conversation_service.py**: Create, message, retrieve (1 test)
- **test_servicenow_service.py**: Incident CRUD + rate limiting (2 tests)
- **test_api.py**: Health check, chat flow, tickets (2 tests)
- **Result**: 6/6 tests passing ✅

### ✅ Phase 6: Deployment & Documentation (COMPLETE)
- **README.md**: Updated with backend quickstart
- **scripts/run_api.sh**: Helper script to start the API
- **backend-plan.md**: This document with full tracking

---

## 13. Quick Start Commands

**From repository root:**

1. Activate venv:
```bash
source .venv/bin/activate
```

2. Install dependencies:
```bash
pip install -e agentic_customer_support
pip install uvicorn[standard] fastapi SQLAlchemy pydantic pytest
```

3. Start API server:
```bash
bash agentic_customer_support/scripts/run_api.sh
```

4. Run tests:
```bash
cd agentic_customer_support
PYTHONPATH=src pytest tests/ -v
```

---

**Last Updated**: May 19, 2026  
**Status**: MVP Backend Complete ✅
