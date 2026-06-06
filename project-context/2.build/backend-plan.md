# Backend Implementation Plan: Agentic Customer Support System

Project: Agentic Customer and IT Support System  
Phase: 2 Build  
Owner: Backend Developer (@backend.eng)  
Primary References: project-context/1.define/prd.md, project-context/2.build/sad.md  
Last Updated: 2026-06-06

---

## 1. Scope Alignment Summary

This plan updates backend delivery for SAD v2.0 highlights:
- CrewAI-based multi-agent support orchestration
- RBAC with mocked personas: REQUESTOR, REAL_AGENT, PLATFORM_ADMIN
- Role-protected API surface for requestor, agent, and admin workflows
- Admin operations for users, system health, and analytics export
- Progress tracking tied to implementation updates

Out-of-scope for this iteration:
- Production identity provider integration
- Real Databricks export pipeline
- Full persistent user/auth tables and migrations

---

## 2. Application Crew Implementation (CrewAI Agents)

### 2.1 Current Crew Shape

Tier 1 Router Agents:
- triage_agent
- handoff_agent

Tier 2 Specialist Agents:
- order_specialist
- product_specialist
- returns_specialist
- consumer_specialist
- it_specialist

### 2.2 Crew Implementation Plan

| Item | Description | Status | Notes |
|---|---|---|---|
| C-1 | Keep 7-agent architecture from PRD/SAD | Complete | Existing crew supports all specialist domains |
| C-2 | Ensure triage output maps to executable specialist tasks | Complete | Category normalization added (consumer->account, refund->returns, technical->it) |
| C-3 | Add role-aware processing context for routing/handoff | Complete | requester_role input added to crew processing |
| C-4 | Preserve fallback behavior when LLM credentials are missing | Complete | Existing mock fallback retained |
| C-5 | Capture assignment metadata in merged specialist output | Complete | agentAssigned propagated in crew merge logic |

### 2.3 Crew Risks and Follow-ups

| Risk | Impact | Mitigation |
|---|---|---|
| LLM response drift in category names | Wrong task routing | Alias normalization in crew |
| Sparse handoff metadata | Human escalations slower | Continue adding structured handoff fields in tasks/output schema |

---

## 3. API Endpoints to Implement

### 3.1 Requestor Endpoints (Role-Based)

| Endpoint | Method | Purpose | Status |
|---|---|---|---|
| /api/v1/tickets | POST | Submit support request/ticket | Complete |
| /api/v1/tickets/mine | GET | List own tickets | Complete |
| /api/v1/tickets/{id} | GET | View ticket with ownership checks | Complete |
| /api/v1/tickets/{id}/feedback | POST | Submit requestor feedback | Complete |

### 3.2 Agent Endpoints (Role-Based)

| Endpoint | Method | Purpose | Status |
|---|---|---|---|
| /api/v1/queue | GET | View escalated queue | Complete |
| /api/v1/queue/{id}/accept | POST | Accept ticket | Complete |
| /api/v1/queue/{id}/resolve | POST | Resolve ticket | Complete |
| /api/v1/customers/{id}/history | GET | View customer conversation history | Complete |
| /api/v1/tickets/{id}/notes | PUT | Add agent notes | Complete |
| /api/v1/tickets/{id}/escalate | POST | Escalate to L3 path | Complete |

### 3.3 Admin Endpoints (Role-Based)

| Endpoint | Method | Purpose | Status |
|---|---|---|---|
| /api/v1/users | GET | List users | Complete |
| /api/v1/users | POST | Create user | Complete |
| /api/v1/users/{id} | PUT | Update user | Complete |
| /api/v1/users/{id} | DELETE | Delete user | Complete |
| /api/v1/audit-logs | GET | Retrieve audit events | Complete |
| /api/v1/system/health | GET | Role-protected system health | Complete |
| /api/v1/config | PUT | Update runtime config | Complete |
| /api/v1/analytics/export | POST | Queue analytics export | Complete |

### 3.4 Frontend Compatibility Endpoints

These keep current frontend API modules functional while RBAC rollout uses v1 endpoints.

| Endpoint | Method | Status |
|---|---|---|
| /users | GET | Complete |
| /users/{id}/role | PUT | Complete |
| /system-health | GET | Complete |
| /analytics/dashboard | GET | Complete |
| /analytics/tickets | GET | Complete |
| /analytics/agents | GET | Complete |

---

## 4. Business Logic Components

| Component | Responsibility | Status |
|---|---|---|
| Role model and permissions map | Role enum and role-to-permissions mapping | Complete |
| Auth token session map | Mock login/verify/refresh token lifecycle | Complete |
| Authorization dependency | Require-role dependency for FastAPI endpoints | Complete |
| Audit log recorder | Append action records for critical operations | Complete |
| System config registry | Mutable in-memory runtime config | Complete |
| Conversation history accessor | Query all conversations for a user | Complete |
| Ticket workflow handlers | accept/resolve/escalate/notes/feedback updates | Complete |

---

## 5. Implementation Approach

### 5.1 Delivery Strategy

1. Read PRD/SAD and identify RBAC delta from current backend.
2. Implement role scaffolding and mocked personas in API app.
3. Add FastAPI dependency-based authorization.
4. Add SAD v2 role-based endpoint groups.
5. Keep existing legacy endpoints intact for compatibility.
6. Add and run tests for RBAC and queue flow.
7. Keep this plan updated with status and outcomes.

### 5.2 Technical Decisions

- Keep FastAPI as backend runtime for MVP speed and CrewAI-native integration.
- Keep in-memory user/token/config stores for MVP and tests.
- Add structured audit logs in-memory as SAD-aligned placeholder.
- Avoid introducing database schema changes for users in this iteration to reduce migration risk.

---

## 6. Status Tracking

### 6.1 Workstream Tracker

| Workstream | Target | Status |
|---|---|---|
| Crew updates | Role-aware and normalized routing | Complete |
| Auth and RBAC | Mocked users plus role dependency checks | Complete |
| Requestor APIs | Ticket submit, mine, detail, feedback | Complete |
| Agent APIs | Queue accept/resolve/history/notes/escalation | Complete |
| Admin APIs | User CRUD, health, config, audit, export | Complete |
| Frontend compat APIs | users, role updates, analytics, health | Complete |
| Automated tests | API RBAC coverage for requestor, agent, admin | Complete |

### 6.2 Progress Log

| Date | Update |
|---|---|
| 2026-06-05 | Reviewed PRD and SAD v2.0. Confirmed RBAC and role-based API expansion as primary backend delta. |
| 2026-06-05 | Updated backend API with mocked personas, role permissions, authorization dependency, and SAD endpoint groups. |
| 2026-06-05 | Updated Crew processing with role context and category alias normalization for stable specialist routing. |
| 2026-06-05 | Added conversation history query support for agent customer history endpoint. |
| 2026-06-05 | Added RBAC-focused API tests for requestor, agent queue, and admin authorization flows. |
| 2026-06-05 | Ran backend tests: 11 passed (crew, services, API including new RBAC scenarios). |
| 2026-06-06 | Re-validated backend implementation in current workspace state: 12 tests passed including end-to-end RBAC flow coverage. |

---

## 7. Exit Criteria

- All role-protected endpoints return expected authorization behavior.
- Existing chat and ticket endpoints remain functional.
- Crew processing returns stable category mapping and response envelope.
- Backend tests pass, including new RBAC coverage.
- Plan document reflects final status and any outstanding gaps.
