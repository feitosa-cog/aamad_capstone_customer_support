# System Architecture Document (SAD): Agentic Customer Support System

**Project**: Agentic Customer & IT Support System  
**Version**: 1.0  
**Date**: April 27, 2026  
**Owner**: System Architect  
**Status**: Ready for Build Phase

---

## 1. Executive Summary

### 1.1 Purpose

This System Architecture Document (SAD) defines the high-level architecture for the Agentic Customer Support System—a multi-agent AI platform built on CrewAI that provides autonomous customer support for e-commerce/retail organizations and IT Service Management for internal applications.

### 1.2 Scope

| Scope | Description |
|-------|-------------|
| **Primary** | External customer-facing support for e-commerce/retail (order tracking, returns, product inquiries) |
| **Secondary** | Internal IT Service Management for employee-reported incidents |
| **Platform** | ServiceNow integration for incident management and knowledge base |

### 1.3 Key Architectural Decisions

| Decision | Rationale |
|----------|------------|
| Multi-agent architecture (CrewAI) | Domain specialization, scalability, maintainability |
| Tiered agent system | 60-75% automation target with human fallback |
| Spring Boot + React | Enterprise-grade, LTS versions, strong ecosystem |
| ServiceNow integration | Enterprise incident management standard |

---

## 2. Stakeholders and Concerns

### 2.1 Stakeholder Matrix

| Stakeholder | Concerns | Priority |
|-------------|----------|----------|
| Operations Director (External) | Ticket deflection, response time, CSAT | High |
| Support Team Lead | Training time, KB freshness, quality consistency | High |
| IT Service Manager (Internal) | Incident categorization, L1/L2/L3 prioritization | Medium |
| Development Team | Maintainability, testability, extensibility | High |
| Security Team | Data protection, access control, audit | High |
| Data/Analytics Team | Data lake integration, pipeline reliability | Medium |
| Business Executive | ROI, scalability, competitive differentiation | Medium |

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

---

## 3. Architectural Views

### 3.1 Logical View

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER INTERACTION LAYER                        │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   Web UI    │  │  Mobile UI  │  │   API UI    │  │  Webhook    │  │
│  │  (React)   │  │   (React)   │  │  (REST)     │  │  Handler    │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │
└─────────┼────────────────┼────────────────┼────────────────┼──────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         ORCHESTRATION LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    CrewAI Orchestrator                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │   │
│  │  │ Triage Agent │  │ Self-Service  │  │  Human       │        │   │
│  │  │  (Router)    │  │    Agent      │  │  Handoff     │        │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                      DOMAIN SPECIALIST LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │    Order     │  │   Product    │  │   Returns    │  │  Consumer  │ │
│  │  Specialist  │  │  Specialist  │  │  Specialist   │  │ Specialist │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
│  ┌──────────────┐                                                      │
│  │     IT       │                                                      │
│  │  Specialist  │                                                      │
│  └──────────────┘                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                       INTEGRATION LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ ServiceNow   │  │  E-commerce  │  │   LLM        │                 │
│  │   Client    │  │    API       │  │   Gateway    │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Process View (Runtime Behavior)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        REQUEST PROCESSING FLOW                          │
└─────────────────────────────────────────────────────────────────────────┘

User Query ──► [API Gateway] ──► [Triage Agent]
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
              ┌─────▼─────┐        ┌─────▼─────┐      ┌─────▼─────┐
              │  Order    │        │  Product  │      │   IT      │
              │ Specialist│        │ Specialist│      │Specialist │
              └─────┬─────┘        └─────┬─────┘      └─────┬─────┘
                    │                   │                   │
                    └───────────────────┼───────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
              ┌─────▼─────┐        ┌─────▼─────┐      ┌─────▼─────┐
              │ Resolved  │        │  Escalate │      │  Create   │
              │  (Auto)   │        │  to Human │      │  Incident │
              └───────────┘        └───────────┘      └───────────┘
```

#### Process States

| State | Description | Next State |
|-------|-------------|------------|
| P1: Received | Query received and validated | P2 |
| P2: Triaged | Intent classified, specialist selected | P3 |
| P3: Processing | Specialist resolving with tools | P4 or P5 |
| P4: Resolved | Query answered successfully | P6 |
| P5: Escalated | Human handoff triggered | P6 |
| P6: Completed | Response delivered, logged | End |

### 3.3 Deployment View

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────────┐
                         │    CDN (CloudFront) │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │   Load Balancer    │
                         │   (ALB/AWS)        │
                         └──────────┬──────────┘
                                    │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
    ┌─────────▼─────────┐  ┌─────────▼─────────┐  ┌─────────▼─────────┐
    │   React Frontend  │  │  Spring Boot API   │  │   React Frontend  │
    │   (S3 + CloudFront│  │   (ECS/EKS)       │  │   (S3 + CloudFront│
    └───────────────────┘  └──────────┬─────────┘  └───────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
          ┌─────────▼─────────┐ ┌─────▼─────┐ ┌─────────▼─────────┐
          │   PostgreSQL      │ │   Redis   │ │    ServiceNow     │
          │   (RDS/Aurora)    │ │ (ElastiCache)│ │   (External)      │
          └───────────────────┘ └───────────┘ └───────────────────┘
```

### 3.4 Data View

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA MODEL                                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    Conversation │       │     Ticket      │       │    Knowledge    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id: UUID        │       │ id: UUID        │       │ id: UUID        │
│ user_id: UUID   │◄─────│ conversation_id │       │ title: String   │
│ created_at     │       │ user_id: UUID   │       │ content: Text   │
│ status         │       │ status          │       │ category        │
└────────┬────────┘       │ priority       │       │ confidence     │
         │                │ assigned_agent  │       │ created_at     │
         │                └────────┬────────┘       └─────────────────┘
         │                         │
         │                ┌────────▼────────┐
         │                │    Incident    │
         │                ├─────────────────┤
         │                │ id: String      │
         └───────────────►│ ticket_id: UUID │
                          │ servicenow_id   │
                          │ status          │
                          │ resolution      │
                          └─────────────────┘
```

#### Data Stores

| Store | Technology | Purpose | Persistence |
|-------|------------|---------|-------------|
| Conversations | PostgreSQL | Chat history, metadata | 90 days |
| Tickets | PostgreSQL | Ticket state, assignments | 1 year |
| Knowledge | PostgreSQL + ServiceNow KB | RAG content | Indefinite |
| Sessions | Redis | Active conversation state | 24 hours |
| Cache | Redis | LLM response caching | TTL-based |

#### Analytics Data Lake Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ANALYTICS DATA LAKE ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Application│     │   Event     │     │   Spark     │     │ Databricks  │
│  Database   │────►│  Collector  │────►│  Streaming  │────►│   Delta     │
│  (PostgreSQL)     │  (Kafka)    │     │  Pipeline   │     │   Lake      │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                              │                                   │
                              ▼                                   ▼
                    ┌─────────────────┐               ┌─────────────────┐
                    │  Transform &    │               │  Analytics     │
                    │  Aggregate      │               │  Dashboards    │
                    │  (dbt)          │               │  (SQL Editor)  │
                    └─────────────────┘               └─────────────────┘
```

| Component | Technology | Purpose |
|-----------|------------|---------|
| Event Collector | Apache Kafka | Buffer analytics events |
| Stream Processing | Apache Spark | Transform and aggregate data |
| Data Lake | Databricks Delta Lake | ACID storage, time travel |
| Transformation | dbt | Data modeling and versioning |
| Analytics | Databricks SQL | BI queries and dashboards |

**Data Pipeline Flow**:
1. Application emits analytics events (conversation, ticket, agent metrics)
2. Kafka buffers events with exactly-once semantics
3. Spark streaming job enriches and aggregates data
4. Data written to Delta Lake in bronze/silver/gold layers
5. Databricks SQL provides analytics queries for dashboards

---

## 4. Quality Attributes

### 4.1 Quality Attribute Table

| Attribute | Requirement | Priority | Validation |
|-----------|-------------|----------|------------|
| **Availability** | 99.5% uptime | Critical | Monitor uptime |
| **Performance** | < 30s first response | High | Load test |
| **Scalability** | 100+ concurrent users | High | Scale test |
| **Security** | Encryption at rest/transit | Critical | Audit |
| **Maintainability** | Modular agent design | Medium | Code review |
| **Testability** | > 80% unit test coverage | Medium | CI pipeline |

### 4.2 Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Latency** | API response time | < 200ms p95 |
| **Throughput** | Concurrent conversations | 100+ |
| **Reliability** | Error rate | < 0.1% |
| **Recovery** | RTO / RPO | 15 min / 5 min |

---

## 5. Architectural Decisions

### 5.1 AD Decision Log

| ID | Decision | Rationale | Trade-off |
|----|----------|-----------|-----------|
| AD-001 | Multi-agent over single-agent | Domain specialization, maintainability | Higher complexity |
| AD-002 | CrewAI orchestration | Native multi-agent support, tool framework | Learning curve |
| AD-003 | Spring Boot backend | Enterprise-grade, LTS, strong ecosystem | Resource overhead |
| AD-004 | React frontend | Component reusability, strong community | Bundle size |
| AD-005 | PostgreSQL + Redis | ACID compliance + caching | Two systems to manage |
| AD-006 | ServiceNow integration | Enterprise standard for ITSM | External dependency |
| AD-007 | Gemini 2.5 Pro primary | Cost-effective, strong reasoning | Vendor lock-in |
| AD-008 | Tiered agent system | 60-75% automation target | Requires tuning |
| AD-009 | Databricks data lake | Analytics sharing, BI integration | External dependency |

### 5.2 Technology Stack

| Layer | Technology | Version | Justification |
|-------|------------|---------|---------------|
| Backend | Java | 21 (LTS) | Enterprise stability |
| Framework | Spring Boot | 3.3.x | Ecosystem, LTS |
| AI/Agent | Spring AI + CrewAI | Latest | Multi-agent orchestration |
| Frontend | React | 18.x | Component ecosystem |
| Database | PostgreSQL | 16 | ACID, JSON support |
| Cache | Redis | 7.4 | Session, caching |
| Build | Maven | 3.9.x | Java standard |
| LLM | Gemini 2.5 Pro | Latest | Cost/performance |

---

## 6. Agent Specifications

### 6.1 Agent Hierarchy

```
                    ┌─────────────────┐
                    │  CrewAI Crew   │
                    │  (Orchestrator)│
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
    │  Triage   │      │  Domain   │      │  Handoff  │
    │  Agent    │─────►│ Specialists│◄─────│  Agent    │
    │ (Router)  │      │  (6 max)  │      │ (Escalate)│
    └───────────┘      └───────────┘      └───────────┘
```

### 6.2 Agent Definitions

| Agent | Role | Tools | Delegation |
|-------|------|-------|------------|
| Triage | Intent classification, routing | intent_classifier, sentiment_analyzer, priority_calculator | All specialists, handoff |
| Order | Order status, tracking, modifications | order_lookup, tracking_lookup, address_modifier | Handoff |
| Product | Product info, availability, specs | product_lookup, inventory_checker, specification_finder | Handoff |
| Returns | Returns, refunds, warranties | return_eligibility_checker, refund_status_lookup, warranty_checker | Handoff |
| Consumer | Account, login, profile | account_lookup, login_assister, profile_updater | Handoff |
| IT | Internal app support, incidents | incident_classifier, kb_lookup, system_status_checker | Handoff |
| Handoff | Human escalation, context transfer | context_compiler, summary_generator, ticket_creator | None |

---

## 7. Integration Specifications

### 7.1 External Integrations

| Integration | Type | Protocol | Priority |
|-------------|------|----------|----------|
| ServiceNow Incident API | REST | HTTPS | High |
| ServiceNow KB API | REST | HTTPS | High |
| E-commerce Mock API | REST | HTTPS | Medium |
| Google Gemini API | REST | HTTPS | High |
| Anthropic Claude API | REST | HTTPS | Medium |
| Databricks Data Lake | Spark/Delta Lake | JDBC/ADLS | Medium |

### 7.2 Integration Patterns

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      INTEGRATION PATTERNS                                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────►│   Backend   │────►│  ServiceNow │
│   (React)   │     │  (Spring)   │     │   (REST)    │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                    ┌─────▼─────┐
                    │  LLM      │
                    │ Gateway   │
                    └───────────┘
```

---

## 8. Risks and Mitigations

### 8.1 Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-001 | LLM hallucination | Medium | High | Validate with KB, human review for critical |
| R-002 | ServiceNow downtime | Low | High | Fallback to queue, retry logic |
| R-003 | Context loss on handoff | Medium | High | Structured context preservation protocol |
| R-004 | Latency under load | Medium | Medium | Caching, async processing, auto-scale |
| R-005 | Security vulnerabilities | Low | Critical | SAST, DAST, dependency scanning |
| R-006 | Agent loop/oscillation | Medium | Medium | Max iteration limits, circuit breakers |
| R-007 | Databricks pipeline failure | Low | Medium | Retry logic, dead letter queue |

---

## 9. Traceability

### 9.1 PRD to SAD Mapping

| PRD Section | SAD Section |
|-------------|-------------|
| 3.1 Technical Architecture | 3. Logical View, 5. Architectural Decisions |
| 3.2 Core Agent Definitions | 6. Agent Specifications |
| 3.3 Integration Requirements | 7. Integration Specifications |
| 3.4 Infrastructure | 3.3 Deployment View |
| 4.1-4.5 Functional Requirements | 3.2 Process View |
| 5. Non-Functional | 4. Quality Attributes |

### 9.2 User Story Traceability

| Story ID | Description | SAD Coverage |
|----------|-------------|---------------|
| US-001 | Intent classification | Triage Agent (6.2) |
| US-002 | Autonomous order resolution | Order Specialist (6.2) |
| US-003 | ServiceNow incident creation | Integration Layer (7.1) |
| US-004 | KB lookup and RAG | Integration Layer (7.1) |
| US-005 | Human handoff with context | Handoff Agent (6.2) |

---

## 10. MVP Exclusions

### 10.1 Deferred to Future Phases

| Feature | Reason | Phase |
|---------|--------|-------|
| Voice/phone integration | Third-party dependency | Future |
| Advanced analytics dashboard | Post-MVP value | Future |
| Multi-language support | Scope reduction | Future |
| Real-time sentiment streaming | Performance optimization | Future |
| Enterprise SSO (SAML) | Basic auth sufficient for MVP | Future |

---

## 11. Appendix

### A. Acronyms

| Acronym | Definition |
|---------|------------|
| SAD | System Architecture Document |
| SFS | System Functional Specifications |
| PRD | Product Requirements Document |
| MRD | Market Research Document |
| ITSM | IT Service Management |
| RAG | Retrieval-Augmented Generation |
| LTS | Long Term Support |
| API | Application Programming Interface |
| REST | Representational State Transfer |

### B. References

- MRD: project-context/1.define/mrd.md
- PRD: project-context/1.define/prd.md
- Agent Definition: .github/agents/system-arch.agent.md

---

**Document Control**
- Version: 1.0
- Status: Draft for Review
- Next Review: Build Phase Start