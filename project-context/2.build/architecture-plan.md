# Architecture Implementation Plan

Project: Agentic Customer and IT Support System  
Version: 2.0  
Date: 2026-06-06  
Owner: System Architect / Technical Lead  
Status: Active Build Planning

Related SAD: project-context/2.build/sad.md

---

## 1. Plan Purpose

This plan defines the implementation approach and progress tracking model for Phase 2 architecture delivery, with special focus on escalated real-agent live chat after AI handoff.

It is designed for future review after backend, frontend, and QA execution.

---

## 2. Scope and Outcomes

### 2.1 In Scope

- Role-based access (REQUESTOR, REAL_AGENT, PLATFORM_ADMIN).
- AI-to-human escalation workflow.
- Real-agent live chat in the same requestor conversation thread.
- Mock ServiceNow incident and KB integration.
- Observability and auditability for escalation lifecycle.

### 2.2 Out of Scope (Current Phase)

- SSO and enterprise identity federation.
- Omnichannel support (voice/SMS/email).
- Advanced policy engine (ABAC).
- Multi-region deployment.

---

## 3. Delivery Approach

### 3.1 Workstreams

1. Backend workstream
- Domain model and state machine for escalation lifecycle.
- Role-based API enforcement.
- Live chat event transport and message persistence.

2. Frontend workstream
- Role-aware UI updates.
- Escalation queue and acceptance UX for REAL_AGENT.
- Shared conversation timeline with requestor and real-agent participation.

3. QA workstream
- End-to-end validation of escalation path.
- Security and authorization validation by role.
- Performance and reliability validation under mock fault scenarios.

4. Platform/DevOps workstream
- CI gates for backend/frontend/contracts.
- Metrics and alerting for escalation SLA.
- Environment parity between local, QA, and production pathways.

### 3.2 Delivery Cadence

- Weekly integration checkpoints.
- Mid-week cross-stream dependency review.
- End-of-week demo with architecture acceptance checklist.

---

## 4. Milestones and Status

Legend:
- Not Started
- In Progress
- Blocked
- Complete

### Milestone M1: Architecture Baseline Alignment

Goal:
- Align all teams to updated SAD and requirements.

Tasks:
- Publish updated SAD and walk through critical changes.
- Confirm API/event contracts for escalation live chat.
- Confirm QA acceptance criteria and test matrix.

Status: Complete
Target Date: 2026-06-06

### Milestone M2: Backend Escalation and Live Chat Core

Goal:
- Implement server-side behavior for queue acceptance and human-active chat.

Tasks:
- Add escalation_sessions and messages models.
- Implement state transitions OPEN -> ESCALATION_REQUESTED -> ESCALATION_QUEUED -> HUMAN_ACTIVE -> HUMAN_RESOLVED -> CLOSED.
- Implement message authorization and ticket participant checks.
- Implement REST + event channel for message delivery.

Status: Not Started
Target Date: 2026-06-20

### Milestone M3: Frontend Role-Aware Escalation UX

Goal:
- Provide complete user and agent interface for escalated chat.

Tasks:
- Requestor: show escalation state, agent-joined indicator, same-thread chat continuity.
- REAL_AGENT: queue view with SLA timers, accept action, and Real Agent conversation session page.
- REAL_AGENT conversation session page must include:
  - Handoff data panel (escalation reason, AI summary, attempted actions, priority, customer context).
  - Live chat panel for direct two-way messaging with requestor.
- PLATFORM_ADMIN: escalation dashboard widgets and policy controls.

Status: Not Started
Target Date: 2026-06-24

### Milestone M4: QA End-to-End and Security Validation

Goal:
- Validate functional correctness, access control, and resilience.

Tasks:
- Execute requestor -> AI -> escalation -> human -> resolved E2E scenarios.
- Execute role access denial tests for all privileged endpoints.
- Execute fault-injection tests (mock ServiceNow latency and failures).

Status: Not Started
Target Date: 2026-06-27

### Milestone M5: Readiness Review

Goal:
- Determine readiness for broader rollout and production hardening.

Tasks:
- Compare actual metrics against targets.
- Review defects and residual risks.
- Approve next-phase backlog for hardening and scale.

Status: Not Started
Target Date: 2026-06-30

---

## 5. Detailed Engineer Action Plan

### 5.1 Backend Engineer Plan

1. Data layer
- Create or extend tables: messages, escalation_sessions, ticket_participants.
- Add indexes for ticket_id + created_at on messages.

2. Service layer
- Implement escalation transition guards.
- Add conversation ownership logic for HUMAN_ACTIVE.
- Preserve AI summary payload for REAL_AGENT context panel.

3. API and event layer
- Add/verify endpoints for escalate, accept, get handoff context, and list/send messages.
- Add and verify WebSocket endpoint contract for ticket sessions (WS /api/v1/ws/tickets/{ticket_id}).
- Add event publication for escalation.accepted, chat.message.created, and chat.typing.

4. Observability
- Emit structured metrics for queue wait and first human response.

Status: Not Started

### 5.2 Frontend Engineer Plan

1. Requestor flow
- Keep one chat thread across AI and human phases.
- Render system banners for escalation and agent join.

2. Agent flow
- Queue table with SLA aging indicators.
- Accept button transitions ticket into human-active workspace.
- Human-active workspace must surface handoff context panel and live chat composer in the same session view.

3. Shared chat components
- Support sender_type rendering: ai_agent, real_agent, requestor, system.
- Add typing/presence display for real-agent sessions.
- Use WebSocket as primary channel for real-time updates in Real Agent conversation sessions, with polling fallback.

4. State management and resiliency
- Reconcile optimistic updates with server events.
- Recover on reconnect with message replay.

Status: Not Started

### 5.3 QA Engineer Plan

1. Functional suite
- Validate escalation initiation and acceptance behavior.
- Validate no context loss in handoff.
- Validate REAL_AGENT session page displays handoff data fields before first reply.
- Validate REAL_AGENT can send/receive live messages with requestor from same session page.

2. Security suite
- Validate role-based denials for read/write on other users' tickets.
- Validate admin-only capabilities.

3. Reliability suite
- Validate behavior under event transport interruptions.
- Validate fallback polling if real-time channel drops.
- Validate WebSocket connect, reconnect, and catch-up behavior for active ticket sessions.

4. Reporting
- Publish defect classification by severity and area.
- Publish sign-off checklist and residual-risk notes.

Status: Not Started

---

## 6. Dependencies and Risks

### 6.1 Key Dependencies

- Stable auth claims in JWT tokens.
- Agreement on chat event contract between backend and frontend.
- Mock ServiceNow availability in QA environment.

### 6.2 Risks and Mitigations

1. Risk: Queue growth without sufficient agents
- Mitigation: SLA alerts, admin dashboard visibility, overflow routing policy.

2. Risk: Message ordering inconsistencies in real-time transport
- Mitigation: sequence metadata + deterministic client-side ordering.

3. Risk: Authorization regressions during endpoint expansion
- Mitigation: mandatory authorization unit tests and contract checks in CI.

---

## 7. Review Checklist for Future Assessment

Use this section during post-implementation review.

- Backend
  - Escalation states implemented and audited.
  - Message authorization verified.
  - Metrics emitted and queryable.

- Frontend
  - Same-thread continuity validated for escalated chat.
  - Agent queue and acceptance UX complete.
  - Reconnect and fallback behavior validated.

- QA
  - E2E escalation suite passed.
  - Security suite passed.
  - Performance thresholds met or variance documented.

- Overall
  - SAD traceability maintained.
  - Open issues triaged with owners and due dates.

---

## 8. Current Status Snapshot

Overall Program Status: In Progress (Planning Complete, Implementation Pending)

| Area | Status | Notes |
|---|---|---|
| Architecture documentation | Complete | SAD and implementation plan updated |
| Backend implementation | Not Started | Awaiting sprint execution |
| Frontend implementation | Not Started | Awaiting sprint execution |
| QA execution | Not Started | Test assets to be prepared after M2/M3 |
| Release readiness | Not Started | Depends on milestone completion |

---

## 9. Definition of Done: Real Agent Conversation Session

This checklist is the completion gate for escalation handoff-context plus live chat delivery.

### 9.1 Backend DoD

- GET /api/v1/tickets/{ticket_id}/handoff-context returns required handoff payload for authorized users.
- WS /api/v1/ws/tickets/{ticket_id} is implemented with role-aware subscription authorization.
- Message write path persists data before broadcast and emits chat.message.created.
- chat.typing and escalation.accepted events are emitted with ticket-scoped payloads.
- Reconnect catch-up path is supported via message fetch with deterministic ordering.

### 9.2 Frontend DoD

- Real Agent conversation session page includes Handoff Data pane and Live Chat pane.
- Handoff data renders before first reply action is enabled.
- WebSocket is primary real-time transport for the session page.
- Polling fallback activates automatically on WebSocket failure.
- Reconnect flow rehydrates missed events/messages without duplicates.

### 9.3 QA DoD

- End-to-end scenario passes: requestor -> AI -> escalation -> real agent live chat -> resolved.
- Role-based authorization tests pass for REST and WebSocket session access.
- Reconnect/catch-up tests pass under simulated network interruption.
- Polling fallback tests pass with no missing or duplicated messages.
- Audit and analytics events are present for escalation and human chat transitions.

### 9.4 Sign-Off Gate

- Backend Lead: Approved
- Frontend Lead: Approved
- QA Lead: Approved
- Architecture Owner: Approved

Status: Pending

---

Last Updated: 2026-06-06