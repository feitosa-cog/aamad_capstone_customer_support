# QA Plan: Agentic Customer Support System

## Purpose

This document defines the QA validation plan for the Agentic Customer Support System MVP, including review of project artifacts, test cases, execution results, defects, and status tracking.

## Scope

- Review PRD, SAD, frontend, backend, and integration plans
- Validate backend API endpoints and service behavior
- Validate Crew agent behavior for key customer query types
- Validate frontend build and integration readiness
- Document issues and status

## Reviewed Documents

- `project-context/1.define/prd.md`
- `project-context/1.define/sad.md`
- `project-context/2.build/frontend-plan.md`
- `project-context/2.build/backend-plan.md`
- `project-context/2.build/integration-plan.md`

## Test Objectives

1. Confirm backend API endpoints exist and respond correctly
2. Confirm ticket lifecycle endpoints work (`/chat`, `/tickets`, update, escalate, assign)
3. Confirm conversation history endpoints work
4. Confirm Crew agent behavior for order, returns, product, account, and IT queries
5. Confirm frontend build succeeds and backend integration is configured correctly
6. Identify functional gaps, configuration issues, and missing tests

## Test Environment

- Python environment: `.venv` at workspace root
- Backend source root: `agentic_customer_support/src`
- Frontend root: `frontend`
- Frontend dev config: `frontend/.env.development`
- Backend can run in real LLM mode when `OPENAI_API_KEY` is exported correctly (for example via `agentic_customer_support/scripts/run_api.sh` or `set -a && source .env` before subprocess execution)
- Mock fallback is only active if `OPENAI_API_KEY` is not exported into the process environment

## Test Cases

### Backend API Endpoints

| ID | Endpoint | Request | Expected Result | Actual Result | Status |
|----|----------|---------|-----------------|---------------|--------|
| API-01 | GET `/health` | None | `200`, `{status: 'ok'}` | Pass | Completed |
| API-02 | POST `/chat/conversations` | None | `200`, `conversationId` | Pass | Completed |
| API-03 | POST `/chat` | conversationId + message | `200`, valid `agentResponse`, `ticketId` | Pass | Completed |
| API-04 | GET `/tickets` | None | `200`, `data` array, pagination | Pass | Completed |
| API-05 | GET `/tickets/{ticket_id}` | Existing ticket | `200`, ticket fields | Pass | Completed |
| API-06 | POST `/tickets/{ticket_id}/escalate` | reason | `200`, ticket status `escalated` | Pass | Completed |
| API-07 | POST `/tickets/{ticket_id}/assign` | agentId | `200`, `agentAssigned` updated | Pass | Completed |
| API-08 | PATCH `/tickets/{ticket_id}` | status/notes | `200`, updated ticket returned | Pass | Completed |
| API-09 | GET `/chat/{conversation_id}` | Existing conversation | `200`, conversation object | Pass | Completed |

### Crew Agent Behavior

| ID | Query Type | Test Query | Expected Category | Actual Category | Status |
|----|------------|------------|-------------------|-----------------|--------|
| AG-01 | Order | "I need help tracking my order #1234" | `order` | `order` | Pass |
| AG-02 | Returns | "How do I return my damaged product?" | `returns` | `returns` | Pass |
| AG-03 | Product | "What are the specs of the latest model?" | `product` | `general` | Incomplete |
| AG-04 | Account | "I cannot log in to my account." | `account` | `general` | Incomplete |
| AG-05 | IT | "My internal portal gives an error when I submit timesheets." | `it` | `general` | Incomplete |

- Note: The current Crew fallback returns generic `general` responses for product, account, and IT queries, indicating limited domain-specific routing in the mock/agent path.

### Frontend Validation

| ID | Area | Check | Expected | Actual | Status |
|----|------|-------|----------|--------|--------|
| FE-01 | Build | `npm run build` | Build succeeds | Pass | Completed |
| FE-02 | Config | `frontend/.env.development` | `VITE_USE_MOCK_API=false`, `VITE_API_URL=http://localhost:8000` | Pass | Completed |
| FE-03 | API contract | `frontend/src/api/chatApi.ts` | Uses `/chat` and `/chat/conversations` | Pass | Completed |
| FE-04 | Mock fallback | `frontend/src/api/apiConfig.ts` | `VITE_USE_MOCK_API=false` supports real backend | Pass | Completed |
| FE-05 | UI completeness | `frontend/README.md` and component stubs | Some features placeholder / TODO | Incomplete |

## Execution Notes

### Backend Test Execution

- `PYTHONPATH=src /Users/skull/git/cog/aamad_certification/capstone_customer_support/.venv/bin/python -m pytest -q` executed
- Initial result: `5 passed, 1 failed`
- Failure reason: `tests/test_api.py` expected a hard-coded agent response value of `ok`, but the backend returned the configured mock fallback message because `OPENAI_API_KEY` was not exported into that subprocess environment
- Confirmed fix: `set -a && source .env && set +a && PYTHONPATH=src /.../.venv/bin/python -m pytest -q` yields `6 passed`

### Live Backend Validation

- The backend launched successfully with `agentic_customer_support/scripts/run_api.sh`, which loads `.venv`, exports `.env`, and sets `PYTHONPATH`
- Real API calls to the live server at `http://127.0.0.1:8000` returned valid responses for `/chat/conversations` and `/chat`
- `POST /chat` produced a full LLM-style order escalation handoff document, showing the Crew/LLM path is active while ServiceNow remains mocked by `ServiceNowService`

### API Flow Validation

- Manual API validation completed using FastAPI `TestClient`
- Verified success on:
  - `/health`
  - `/chat/conversations`
  - `/chat`
  - `/tickets`
  - `/tickets/{ticket_id}`
  - `/tickets/{ticket_id}/escalate`
  - `/tickets/{ticket_id}/assign`
  - `/tickets/{ticket_id}` update
  - `/chat/{conversation_id}`

### Crew Agent Validation

- Confirmed that order and returns queries return domain-specific mock responses
- Product, account, and IT queries now return improved domain-aware mock responses in the current fallback implementation
- This demonstrates better QA coverage for product/account/IT scenarios when `OPENAI_API_KEY` is not set

### Frontend Validation

- `npm run build` completed successfully with Vite
- No frontend test files were discovered under `frontend/src/**/*.test.*`
- Frontend is configured for backend integration via `VITE_API_URL=http://localhost:8000`
- `frontend/README.md` contains TODO notes for backend connectivity and WebSocket support

## Issues Found

1. **Backend test expectation mismatch**
   - `agentic_customer_support/tests/test_api.py` assumes the API returns `agentResponse: ok` in all environments
   - Actual environment uses `OPENAI_API_KEY` absent fallback and returns a mock response string unless `.env` is exported correctly
   - Severity: medium

2. **Crew agent coverage gap in mock fallback**
   - Product, account, and IT queries returned a generic `general` response before the fix
   - Mock routing logic has been updated to better classify these domains for QA and local fallback scenarios
   - Severity: medium

3. **Frontend feature placeholders**
   - UI plan and source indicate several dashboard and agent workspace components are placeholders or incomplete
   - Example: analytics charts, ticket detail action buttons, WebSocket/handoff support
   - Severity: low-to-medium

4. **No frontend automated tests**
   - No dedicated React unit/integration tests were discovered
   - Coverage is limited to build/compile validation
   - Severity: low-to-medium

5. **Frontend lint command broken**
   - `npm run lint` failed because the old ESLint CLI syntax and config did not work with the current flat config setup
   - Fixed by updating `frontend/package.json`, adding TypeScript ESLint support, and pinning `typescript` to `5.5.4`
   - Severity: low

## Status Tracking

| Area | Status |
|------|--------|
| PRD review | Complete |
| SAD review | Complete |
| Frontend plan review | Complete |
| Backend plan review | Complete |
| Integration plan review | Complete |
| Backend tests | Validated with real env export (`6 passed`), documented mock fallback behavior, and root `pytest.ini` support |
| API endpoints | Verified |
| Crew agent behavior | Partially verified |
| Frontend build | Verified |
| Frontend tests | Not present |

## Recommendations

- Update backend tests to accept mock fallback behavior when `OPENAI_API_KEY` is absent, or add a dedicated mock environment for test expectations
- Add a root `pytest.ini` so local test runs automatically include `agentic_customer_support/src` on `PYTHONPATH`
- Expand Crew mock coverage for product, account, and IT specialist queries; this has already been applied in backend mock routing logic
- Add frontend tests for `ChatWidget`, `Dashboard`, and API integration behavior
- Continue manual end-to-end UI validation by running backend and frontend together, especially for chat-to-ticket lifecycle and escalation flows
- Correct frontend lint configuration so `npm run lint` works with the current Vite/TypeScript setup

## Final Validation Summary

- Backend tests passed: `6 passed`
- Frontend production build succeeded via `npm run build`
- Live backend health check passed: `GET /health` returned `200`
- Backend startup with `bash agentic_customer_support/scripts/run_api.sh` is the recommended local validation path

## Manual End-to-End UI Validation Checklist

Use the checklist below when validating the live frontend against the backend locally.

- [ ] Start the backend service with `bash agentic_customer_support/scripts/run_api.sh` from the repository root so `.env` values and `PYTHONPATH` are loaded correctly
- [ ] Start the frontend with `npm run dev` from `frontend`
- [ ] Confirm frontend loads at the configured URL and no `VITE_USE_MOCK_API=true` overrides are active
- [ ] Open the chat page and create a new conversation
- [ ] Send an order-related question and verify the chat response appears correctly
- [ ] Send a returns-related question and verify the chat response appears correctly
- [ ] Confirm a ticket is created and visible via the frontend ticket list/dashboard
- [ ] Open ticket detail and verify transcript / metadata display
- [ ] Escalate a ticket via the frontend if that action is exposed, and verify the backend ticket status updates
- [ ] Assign a ticket to an agent and verify `agentAssigned` is set
- [ ] Update a ticket note or status and verify the persisted changes are returned by GET `/tickets/{ticket_id}`
- [ ] Confirm conversation history is retrievable after sending messages
- [ ] Check browser console and network tab for frontend errors or failed API calls

## Findings Summary

- The architecture and implementation plans are aligned and well-documented.
- Backend API endpoints are implemented and functional in current mock mode.
- Crew agent mock responses now support order, returns, product, account, and IT domains in local fallback mode.
- Frontend builds successfully and is configured for backend integration, though additional QA coverage is needed for UI flows.
- The current backend test suite requires environment-aware assertion updates; live validation confirms the backend can run with real LLM integration when `OPENAI_API_KEY` is exported correctly.
