# Integration Plan: Agentic Customer Support System

**Date**: June 6, 2026
**Owner**: Integration Engineer
**Status**: In Progress (MVP baseline complete, contract hardening in progress)

---

## 1. Purpose

This plan describes the integration of the Agentic Customer Support frontend and backend, the API contract, external service connections, configuration requirements, and the testing approach needed to verify end-to-end data flow.

## 2. Scope

- Frontend chat UI and ticket dashboard integration with backend API
- Backend REST API route alignment with frontend expectations
- ServiceNow mock integration for escalation incidents
- Configuration of local development endpoints and CORS
- End-to-end validation of chat messages, ticket creation, escalation, and ticket retrieval

## 3. Frontend-Backend Integration

### 3.0 Reviewed Feature Deltas (PRD + SAD + Frontend/Backend Plans)

Highlighted new features validated and integrated in this update:

- RBAC alignment for `REQUESTOR`, `REAL_AGENT`, and `PLATFORM_ADMIN`
- Role-aware route access and UI rendering in frontend
- Agent queue workflow via role-protected `/api/v1/queue` endpoints
- Requestor "My Tickets" flow via `/api/v1/tickets/mine`
- Backend/Frontend ticket payload normalization for consistent rendering

### 3.1 Current Frontend Expectations

The frontend application expects the following backend endpoints:

- `POST /chat/conversations` — create or initialize a chat conversation
- `POST /chat` — send a chat message and receive AI response metadata
- `GET /chat/{conversationId}` — fetch conversation history
- `GET /tickets` — list tickets with pagination and optional status filters
- `GET /tickets/{ticketId}` — get ticket details
- `PATCH /tickets/{ticketId}` — update ticket fields
- `POST /tickets/{ticketId}/escalate` — escalate a ticket
- `POST /tickets/{ticketId}/assign` — assign a ticket to an agent

### 3.2 Backend API Changes Applied

- Added `POST /chat/conversations` to create conversations
- Updated `POST /chat` to accept `conversationId`, `message`, `userId`, and optional metadata
- Added CORS middleware for local frontend access
- Added ticket pagination and filtering support
- Added ticket update, escalate, and assign endpoints
- Adjusted response format to provide `agentResponse`, `status`, `ticketId`, and `agentAssigned`
- Added and consumed role-based endpoints for queue operations and notes updates:
	- `GET /api/v1/queue`
	- `POST /api/v1/queue/{ticket_id}/accept`
	- `POST /api/v1/queue/{ticket_id}/resolve`
	- `PUT /api/v1/tickets/{ticket_id}/notes`

## 4. API Connection Setup

### 4.1 Local Development

- Frontend default API host: `http://localhost:8000`
- Backend server host: `http://localhost:8000`
- Frontend may override via `VITE_API_URL`

### 4.2 API Client Behavior

- `frontend/src/api/client.ts` now defaults to `http://localhost:8000`
- Authentication headers are passed automatically from localStorage when present
- Backend is configured with permissive CORS for development use
- Frontend ticket API now normalizes backend snake_case and payload-enriched ticket shapes into UI-consumable camelCase fields

## 5. External Service Integrations

### 5.1 ServiceNow

- The backend uses `agentic_customer_support.services.servicenow_service.ServiceNowService`
- This is currently a development mock implementation
- Incident creation is invoked during escalations
- Mock incidents are stored in-memory and written to `servicenow_mock.log`

### 5.2 AI / CrewAI

- The backend continues to use `AgenticCustomerSupport` in `agentic_customer_support.crew`
- `crew.process_customer_query(...)` is the primary interface for message processing
- Human escalation flows call `crew.escalate_to_human(...)`

## 6. Configuration Needed

### Backend

- No production ServiceNow credentials are required for the mock
- Local startup uses the existing Python virtual environment
- Ensure backend is started via `uvicorn agentic_customer_support.api.app:app --reload`

### Frontend

- Use `npm install` in `/frontend` if dependencies are not installed
- Start with `npm run dev`
- Optional override: `VITE_API_URL=http://localhost:8000`

## 7. Testing Approach

### 7.1 Automated Tests

- Run existing backend tests with `pytest` in `agentic_customer_support`
- Confirm API endpoint surface and ticket flows are working
- Added explicit end-to-end API integration coverage for requestor-to-agent flow (submit -> queue -> accept -> notes -> resolve)

### 7.2 Manual Integration Validation

- Launch backend on `http://localhost:8000`
- Launch frontend and open the chat widget
- Send a message, confirm agent response appears
- Confirm ticket notification appears when chat resolves or escalates
- Inspect backend logs and `servicenow_mock.log` for incident creation
- Use the dashboard to load ticket list and ticket detail views

### 7.3 Recommended Smoke Tests

- `POST /chat/conversations` returns a new `conversationId`
- `POST /chat` returns `agentResponse` and `ticketId`
- `GET /tickets` returns paginated ticket list
- `GET /tickets/{ticketId}` returns ticket metadata
- `PATCH /tickets/{ticketId}` updates ticket fields
- `POST /tickets/{ticketId}/escalate` marks ticket escalated

## 8. Status Tracking

| Task | Status | Notes |
|------|--------|-------|
| Align frontend API host | Completed | Default host updated to `localhost:8000` |
| Add `/chat/conversations` endpoint | Completed | Backend now supports conversation initialization |
| Align `/chat` request/response contract | Completed | Backend now matches frontend shape |
| Add ticket pagination and filters | Completed | Supports `page`, `limit`, `status` |
| Add ticket update/escalation/assignment endpoints | Completed | Backend supports full ticket lifecycle API |
| Add backend CORS for local dev | Completed | Permissive CORS enabled |
| Normalize backend ticket payloads in frontend | Completed | `ticketApi` now maps snake_case and payload fields to UI contract |
| Wire requestor "My Tickets" route and data source | Completed | `/dashboard` now role-allowed for requestor and uses `/api/v1/tickets/mine` |
| Wire agent queue actions to RBAC endpoints | Completed | Agent workspace uses `/api/v1/queue`, accept, resolve, and notes endpoints |
| Add end-to-end API flow test | Completed | New backend test covers submit -> queue -> accept -> notes -> resolve |
| Fix WebSocket event parsing for live chat | Completed | `chat.message.created` now correctly reads nested `message` payload |
| Add explicit ticket WS subscribe handshake | Completed | Frontend sends `subscribe` on socket open per SAD contract |
| Normalize status transitions from WS events | Completed | Handles `state`, `escalation_state`, and `escalationState` consistently |
| Normalize ticket message body/content shapes | Completed | Frontend now maps both `content` and `body` fields for message rendering |
| Document integration plan | Completed | Created `project-context/2.build/integration-plan.md` |
| Run backend integration tests | Completed | `18 passed` |
| Run frontend validation | Completed | `npm test -- --run` passed and production build succeeded |

## 9. Progress Summary

- Core API contract has been aligned from frontend to backend
- Backend now supports the complete chat and ticket endpoint surface required by the React UI
- ServiceNow escalation flow is available via the mocked ServiceNow service
- Local integration configuration and CORS are in place for end-to-end testing
- RBAC and role-specific workflows are fully wired for requestor, agent, and admin MVP paths
- Agent workspace now drives role-protected queue lifecycle endpoints end-to-end

---

## 10. Next Steps

1. Add browser-level E2E tests (Playwright/Cypress) for role journeys and UI assertions
2. Replace in-memory auth/ticket stores with persistent data layer for non-MVP environments
3. Add CI gates for frontend build + frontend tests + backend tests on integration branch

---

### Verification Log (May 19, 2026)

- Action: Updated frontend `.env.development` to point to `http://localhost:8000` and set `VITE_USE_MOCK_API=false`.
- Action: Started backend (uvicorn) and frontend (Vite dev server).
- Smoke test commands run (local):

```
curl http://127.0.0.1:8000/health
curl -X POST http://127.0.0.1:8000/chat/conversations -H 'Content-Type: application/json' -d '{}'
curl -X POST http://127.0.0.1:8000/chat -H 'Content-Type: application/json' -d '{"conversationId":"<id>","message":"E2E test message","userId":"e2e-user"}'
curl http://127.0.0.1:8000/tickets
```

- Result: Backend responded to `/health` and `/chat/conversations`; `/chat` and `/tickets` flows completed using CrewAI mock fallback (no `OPENAI_API_KEY` set), producing `agentResponse` and creating a ticket.
- Observations: Initial lack of backend activity during user's first run was due to frontend running in mock mode (`VITE_USE_MOCK_API=true`) — switching that to `false` caused network requests to reach the backend as expected.

**Status:** Verification completed (E2E smoke test passed with mock LLM fallback). Recommend opening browser DevTools to inspect network calls during manual UI validation.

### Verification Log (June 5, 2026)

- Action: Reviewed PRD, SAD, frontend plan, and backend plan with focus on highlighted RBAC features and role-based workflows.
- Action: Updated frontend integration layer to normalize backend ticket payloads and field naming differences.
- Action: Wired requestor dashboard access to role-appropriate "My Tickets" behavior.
- Action: Wired agent workspace to role-protected queue endpoints for queue load, accept, notes, and resolve operations.
- Action: Added backend end-to-end API flow test in `agentic_customer_support/tests/test_api.py`.
- Validation:
	- Frontend tests: `npm test -- --run` -> **3 files, 9 tests passed**
	- Frontend build: `npm run build` -> **passed**
	- Backend tests: `pytest tests -q` -> **12 passed**

**Status:** Integration plan execution completed for MVP baseline. End-to-end data flow is validated at API and app integration level with role-based workflows.

### Verification Log (June 6, 2026)

- Action: Reviewed PRD and SAD deltas against current integration code with focus on escalated human chat contract and WebSocket event compatibility.
- Action: Fixed frontend WebSocket consumption to correctly parse backend `chat.message.created` events with nested `message` payload.
- Action: Added frontend ticket WebSocket subscribe event on connection open to align with session contract.
- Action: Hardened status mapping so UI handles `state`, `escalation_state`, and `escalationState` payloads.
- Action: Updated chat message normalization to map both `content` and `body` fields from backend message APIs.
- Validation:
	- Backend tests: `/Users/skull/git/cog/aamad_certification/capstone_customer_support/.venv/bin/python -m pytest tests -q` -> **18 passed**
	- Frontend tests: `npm test -- --run` -> **3 files, 9 tests passed**
	- Frontend build: `npm run build` -> **passed**

**Status:** Integration hardening update completed. End-to-end data flow and live event wiring are verified for current MVP contracts.
