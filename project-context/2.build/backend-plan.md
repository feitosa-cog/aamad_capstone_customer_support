# Backend Implementation Plan: Agentic Customer Support System

Project: Agentic Customer and IT Support System  
Phase: 2 Build  
Owner: Backend Developer (@backend.eng)  
Primary References: project-context/1.define/prd.md, project-context/2.build/sad.md  
Last Updated: 2026-06-06

---

## 1. Scope Alignment Summary

Plan targets the SAD v2.1 backend deltas and highlighted features:
- Escalated human chat state model: OPEN, ESCALATION_REQUESTED, ESCALATION_QUEUED, HUMAN_ACTIVE, HUMAN_RESOLVED, CLOSED
- Same-thread requestor and REAL_AGENT conversation with role-aware access control
- Handoff context retrieval endpoint for Real Agent session
- Role-authorized ticket message APIs plus ticket-scoped WebSocket channel
- CrewAI updates that preserve triage/specialist/handoff and add knowledge support

Out-of-scope in this iteration:
- Production SSO/SCIM integration
- Persistent DB migration for escalation sessions and participants
- Production ServiceNow cutover (mock-first remains default)

---

## 2. Application Crew Implementation (CrewAI Agents)

### 2.1 MVP Crew Shape

Core agents in runtime:
- triage_agent
- order_specialist
- product_specialist
- returns_specialist
- consumer_specialist
- it_specialist
- handoff_agent
- knowledge_agent

### 2.2 Crew Work Breakdown

| Item | Description | Status | Notes |
|---|---|---|---|
| C-1 | Maintain triage -> specialist -> handoff flow | Complete | Existing orchestration preserved |
| C-2 | Keep category normalization for stable specialist routing | Complete | Alias mapping retained in crew |
| C-3 | Keep role-aware request context in processing | Complete | requester_role input remains active |
| C-4 | Add Knowledge Agent configuration + task | Complete | Added knowledge_agent and knowledge_task configs |
| C-5 | Preserve mock fallback when no LLM credentials | Complete | Existing behavior retained |

### 2.3 Crew Risks

| Risk | Impact | Mitigation |
|---|---|---|
| LLM category drift | Wrong specialist route | Category alias normalization |
| Weak KB evidence structure | Lower handoff quality | Knowledge agent prompt/task added for synthesis |

---

## 3. API Endpoints to Implement

### 3.1 Requestor APIs

| Endpoint | Method | Purpose | Status |
|---|---|---|---|
| /api/v1/tickets | POST | Submit support request | Complete |
| /api/v1/tickets/mine | GET | List own tickets | Complete |
| /api/v1/tickets/{id} | GET | View own ticket details | Complete |
| /api/v1/tickets/{id}/feedback | POST | Submit ticket feedback | Complete |
| /api/v1/tickets/{id}/messages | GET | Retrieve same-thread ticket messages | Complete |
| /api/v1/tickets/{id}/messages | POST | Send requestor message in same thread | Complete |

### 3.2 Real Agent APIs

| Endpoint | Method | Purpose | Status |
|---|---|---|---|
| /api/v1/queue | GET | View escalated queue | Complete |
| /api/v1/queue/{id}/accept | POST | Accept escalation and activate human chat | Complete |
| /api/v1/queue/{id}/resolve | POST | Resolve human-handled ticket | Complete |
| /api/v1/tickets/{id}/handoff-context | GET | Fetch handoff pane payload | Complete |
| /api/v1/tickets/{id}/messages | GET | Retrieve live conversation history | Complete |
| /api/v1/tickets/{id}/messages | POST | Send real-agent message | Complete |
| /api/v1/tickets/{id}/escalate | POST | Force escalation path | Complete |

### 3.3 Real-Time Contract

| Endpoint | Method | Purpose | Status |
|---|---|---|---|
| /api/v1/ws/tickets/{ticket_id} | WS | Ticket-scoped live event channel | Complete |

Event coverage implemented:
- escalation.requested
- escalation.accepted
- chat.message.created
- chat.typing
- ticket.status.changed

### 3.4 Admin and Compatibility APIs

| Endpoint Group | Purpose | Status |
|---|---|---|
| /api/v1/users, /api/v1/audit-logs, /api/v1/system/health, /api/v1/config, /api/v1/analytics/export | Role-protected admin operations | Complete |
| /users, /users/{id}/role, /system-health, /analytics/* | Frontend compatibility during rollout | Complete |

---

## 4. Business Logic Components

| Component | Responsibility | Status |
|---|---|---|
| Ticket state model | Maintain SAD v2.1 conversation state transitions | Complete |
| Escalation session tracker | requested_at, accepted_at, accepted_by, queue_wait_seconds | Complete |
| Ticket participant tracker | role-aware participants per ticket | Complete |
| Ticket message store | Ordered, persisted ticket chat timeline | Complete |
| WS broadcast manager | Deliver ticket-scoped live events | Complete |
| Role access guard | Requestor ownership and real-agent/admin authorization | Complete |
| Handoff context builder | Build escalation, AI summary, customer context payload | Complete |

---

## 5. Implementation Approach

1. Review PRD and SAD v2.1 delta to identify backend gaps.
2. Add missing CrewAI config for Knowledge Agent.
3. Extend ticket business layer with state machine and escalation metadata.
4. Implement handoff-context and ticket message APIs with RBAC checks.
5. Implement WS ticket channel and required event types.
6. Keep existing endpoint compatibility and avoid breaking current UI flows.
7. Add tests for new contracts and rerun full backend suite.
8. Update this plan as progress changes.

Technical choices for MVP:
- FastAPI and in-memory stores preserved for delivery speed and testability.
- WebSocket authorization uses existing auth token map (mock auth).
- Message ordering uses created_at plus monotonic sequence in ticket service.

---

## 6. Status Tracking

### 6.1 Workstream Tracker

| Workstream | Target | Status |
|---|---|---|
| Crew updates | Include knowledge agent/task and preserve role-aware routing | Complete |
| Escalation state model | Add SAD v2.1 conversation states and transitions | Complete |
| Handoff contract | Implement /handoff-context endpoint and payload | Complete |
| Ticket chat contract | Implement role-aware GET/POST /messages | Complete |
| WebSocket transport | Implement WS /api/v1/ws/tickets/{id} event stream | Complete |
| Regression safety | Preserve legacy routes and existing backend flows | Complete |
| Automated tests | Add contract tests and run full backend suite | Complete |

### 6.2 Progress Log

| Date | Update |
|---|---|
| 2026-06-06 | Reviewed PRD and SAD v2.1 highlighted features (human escalation state model, same-thread chat continuity, new API/WS contract). |
| 2026-06-06 | Updated CrewAI implementation with Knowledge Agent and knowledge task configuration. |
| 2026-06-06 | Extended ticket business logic with escalation sessions, participants, ordered message persistence, and handoff-context generation. |
| 2026-06-06 | Implemented new endpoints: GET /api/v1/tickets/{id}/handoff-context, GET/POST /api/v1/tickets/{id}/messages, WS /api/v1/ws/tickets/{id}. |
| 2026-06-06 | Added state/event transitions for escalation.requested, escalation.accepted, chat.message.created, chat.typing, ticket.status.changed. |
| 2026-06-06 | Added API tests for handoff context, ticket messaging, and WebSocket typing events. |
| 2026-06-06 | Executed backend tests: 14 passed. |

---

## 7. Exit Criteria

- CrewAI agents and configs include triage, specialists, handoff, and knowledge support.
- SAD v2.1 handoff context and ticket messaging APIs are implemented and role-protected.
- Ticket WebSocket channel emits required real-time contract events.
- Conversation state transitions are tracked for escalation and human resolution.
- Backend test suite passes with coverage for new contracts.
