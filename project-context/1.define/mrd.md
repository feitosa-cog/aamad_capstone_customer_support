# Market Research Document: Agentic Customer Support System

**Project**: Agentic Customer Support  
**Version**: 1.0  
**Date**: April 27, 2026  
**Owner**: Product Manager  

---

## Executive Summary

### Market Opportunity

The global customer support market is undergoing a significant transformation driven by AI agent technologies. The conversational AI and chatbot market, valued at approximately $10.7 billion in 2024, is projected to reach $32.6 billion by 2030, representing a compound annual growth rate (CAGR) of 24.3% [1]. Within the e-commerce and retail segment specifically, the addressable market for AI-powered support solutions is estimated at $4.2 billion in 2025, with expectations to grow to $12.8 billion by 2030 [2].

The convergence of three market forces creates a compelling opportunity: (1) rising customer expectations for instant, personalized support, (2) escalating labor costs making traditional support models unsustainable, and (3) recent advances in LLM-powered agents making autonomous support feasible at scale. E-commerce and retail businesses spend an average of 1.5-3% of revenue on customer support operations, with top-performing companies allocating even more [3]. The pain point is acute—retailers report that 67% of cart abandonments are influenced by poor support experiences [4].

### Technical Feasibility

Implementation complexity is moderate but manageable. CrewAI framework provides robust multi-agent orchestration capabilities suitable for hybrid support scenarios. Current LLM APIs (Google Gemini 2.5 Pro, Anthropic Claude) demonstrate sufficient reasoning capabilities for handling 70-85% of routine support inquiries without human intervention [5]. The primary technical challenges involve:

- Maintaining context continuity across agent-to-human handoffs
- Ensuring accurate integration with ServiceNow for incident management and KB
- Managing latency requirements for real-time customer interactions

The recommended architecture employs a tiered agent system: Tier 1 autonomous agents handle common inquiries, Tier 2 specialized agents manage complex issues, and human agents intervene only for escalated cases. This approach achieves estimated automation rates of 60-75% while preserving service quality.

### Recommended Approach

Target the mid-market e-commerce segment ($50M-$500M annual revenue) as the initial beachhead. This segment has sufficient support volume to justify AI investment but lacks resources for enterprise-grade solutions. Lead with order tracking, return processing, and product inquiry use cases—these represent 40% of typical support volume and offer clear ROI metrics [6].

**Dual-Market Approach**:

1. **External Support**: Customer-facing support for e-commerce/retail (primary focus)
2. **Internal Support**: IT Service Management for internal applications (secondary focus)

The system handles both external customer inquiries and internal employee-reported incidents, with ServiceNow as the unified incident management platform.

---

## 1. Market Analysis & Opportunity Assessment

### 1.1 Market Size & Growth

| Metric | Value | Source |
|--------|-------|--------|
| Global Conversational AI Market (2024) | $10.7B | Gartner [1] |
| Projected Market Size (2030) | $32.6B | Gartner [1] |
| CAGR | 24.3% | Gartner [1] |
| E-commerce/Retail AI Support Segment (2025) | $4.2B | Grand View Research [2] |
| Projected Retail Segment (2030) | $12.8B | Grand View Research [2] |
| ITSM Market (AI-powered) (2025) | $2.8B | Gartner [1] |
| Average Support Spend (% Revenue) | 1.5-3% | McKinsey [3] |
| Cart Abandonment Rate (Support-Related) | 67% | Baymard Institute [4] |

### 1.2 Growth Drivers

1. **Labor Cost Escalation**: Average customer support agent hourly wages increased 18% from 2021-2025, driving automation economics [7].
2. **Customer Expectation Shifts**: 73% of consumers expect companies to understand their unique needs [8].
3. **24/7 Support Demand**: 64% of consumers say availability is the most important factor in support [9].
4. **Multi-channel Complexity**: Average retail brand manages 8+ support channels, creating operational fragmentation [10].

### 1.3 Target Audience

**Primary Persona: Operations Director at Mid-Market E-commerce**

- **Company Profile**: $50M-$500M annual revenue, 50-500 employees, 2-10 support staff
- **Pain Points**:
  - Support team overwhelmed during peak seasons (holidays, sales events)
  - Inconsistent response quality across agents
  - High agent turnover (40% annual rate in retail support) [11]
  - Difficulty scaling support during growth phases
- **Willingness to Pay**: $500-$5,000/month for AI-powered support solutions
- **Decision Timeline**: 30-90 days for evaluation and procurement

**Secondary Persona: Support Team Lead**

- **Pain Points**: Training new agents takes 4-8 weeks
- - Knowledge base becomes outdated quickly
- - Difficulty maintaining service quality during absences
- **Success Metrics**: Reduced ticket handle time, improved CSAT scores

**Tertiary Persona: IT Service Manager (Internal Support)**

- **Company Profile**: Mid-to-large enterprise with 500+ employees, internal IT department
- **Pain Points**:
  - High volume of internal application issues (ERP, CRM, internal tools)
  - Lack of unified incident management across internal applications
  - Difficulty prioritizing L1 vs L2 vs L3 issues
  - Manual KB maintenance for internal systems
- **Willingness to Pay**: $2,000-$10,000/month for enterprise IT support automation
- **Decision Timeline**: 60-120 days for enterprise procurement
- **Use Cases**:
  - Employees reporting issues with internal applications
  - IT team managing incidents across all internal systems
  - Auto-generation of KB articles from resolved IT incidents
  - L3 escalation for complex technical issues

### 1.4 Competitive Landscape

| Competitor | Target | Key Feature | Pricing | Market Share |
|------------|--------|-------------|---------|---------------|
| Intercom | Enterprise | AI Assistant + Automation | $74+/mo | 18% |
| Zendesk | Enterprise | Answer Bot + Agent Workspace | $20+/agent | 22% |
| Freshdesk | Mid-market | Freddy AI | $15+/agent | 12% |
| **ServiceNow** | Enterprise | Incident Management + KB | $100+/agent | 15% |
| Gorgias | E-commerce | Order Management AI | $90+/mo | 8% |
| Ada | Enterprise | Autonomous Agent | Custom | 6% |
| Kustomer | Mid-market | AI Platform | $49+/agent | 5% |

**Market Gaps Identified**:

1. **Integration Depth**: Existing solutions offer surface-level CRM connections but lack deep operational integration with enterprise systems like ServiceNow
2. **Hybrid Support**: Few solutions effectively blend self-service and agent-assisted workflows
3. **Vertical Specificity**: Generic platforms require extensive customization for retail workflows
4. **Affordability Gap**: Enterprise solutions are inaccessible to growing mid-market retailers

### 1.5 Business Case & ROI

| ROI Factor | Conservative | Optimistic |
|------------|--------------|------------|
| Ticket Deflection Rate | 40% | 65% |
| Agent Productivity Gain | 25% | 45% |
| First-Response Time Reduction | 80% | 95% |
| Customer Satisfaction Impact | +5 pts | +15 pts |
| Annual Cost Savings (100 tickets/day) | $36K | $84K |
| Payback Period | 8 months | 4 months |

---

## 2. Technical Feasibility & Requirements Analysis

### 2.1 CrewAI Capabilities Assessment

**Strengths for This Use Case**:

- Multi-agent orchestration with defined roles and workflows [12]
- Tool integration framework for connecting to external APIs [13]
- Handoff mechanisms between agents
- Memory and context management
- Async task execution for scalability

**Current Limitations**:

- Real-time streaming responses require additional implementation
- No native voice/phone integration (requires third-party)
- Limited built-in analytics and reporting
- Requires engineering effort for production monitoring

### 2.2 Agent Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    Customer Interaction Layer               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Triage Agent │  │  Self-Service │  │  Human Handoff │    │
│  │  (Intent      │  │  Agent        │  │  Agent         │    │
│  │   Classification)│  │(Autonomous)  │  │(Escalation)    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    Domain Specialist Layer                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Order        │  │ Product      │  │ Returns &    │    │
│  │ Specialist   │  │ Specialist   │  │ Refunds      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐                                          │
│  │ Consumer     │                                          │
│  │ Specialist   │                                          │
│  └──────────────┘                                          │
├─────────────────────────────────────────────────────────────┤
│                    Integration Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ E-commerce   │  │ ServiceNow   │  │ Knowledge    │    │
│  │ Platform    │  │ (Incident+KB)│  │ Base (Auto) │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Integration Requirements

| Integration | Priority | Complexity | Estimated Effort |
|-------------|----------|------------|------------------|
| ServiceNow API (Incident Management) | High | High | 3-4 weeks |
| ServiceNow KB API (Knowledge Base) | High | High | 2-3 weeks |

> **Note**: For MVP, the system will use ServiceNow as the single source of truth for incident management and knowledge base. E-commerce platform data (orders, products) will be fetched via direct API calls or mocked responses.

### 2.4 Scalability Considerations

- **Concurrent Conversations**: Design for 50-500 simultaneous conversations
- **API Rate Limits**: Implement caching and rate limiting for external APIs
- **LLM Cost Management**: Use token optimization and fallback models
- **Database**: PostgreSQL for structured data, Redis for session state

### 2.5 Domain Specialist Responsibilities

| Specialist | Responsibilities | Query Examples |
|------------|------------------|----------------|
| **Order Specialist** | Order status, tracking, shipping delays, modification requests | "Where is my order?", "Can I change the address?" |
| **Product Specialist** | Product details, availability, specifications, comparisons | "Does this come in blue?", "Is this waterproof?" |
| **Returns & Refunds Specialist** | Return policy, refund status, warranty claims, damaged items | "How do I return this?", "When will I get my refund?" |
| **Consumer Specialist** | Account issues, login problems, profile management, subscription billing | "I can't log in", "Cancel my subscription", "Update my address" |

### 2.5 Technical Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LLM Hallucinations | High | Medium | RAG with verified knowledge base, output validation |
| Integration Failures | Medium | High | Graceful degradation, fallback to human agents |
| Latency Issues | Medium | Medium | Async processing, response streaming |
| Data Privacy | Low | High | PII filtering, data minimization |

---

## 3. User Experience & Workflow Analysis

### 3.1 User Journey Mapping

**Scenario A: Customer Self-Service**

```
1. Customer visits website → Chat widget appears
         ↓
2. Customer asks "Where is my order?"
         ↓
3. Triage Agent identifies intent → Routes to Order Specialist
         ↓
4. Order Agent retrieves order status via API
         ↓
5. Agent provides tracking info with expected delivery
         ↓
6. Customer confirms resolution → Conversation ends
         ↓
7. Post-interaction survey (optional)
```

**Scenario B: Hybrid Support (Human Handoff)**

```
1. Customer asks complex return policy question
         ↓
2. Triage Agent attempts resolution with knowledge base
         ↓
3. Customer needs clarification on warranty claim
         ↓
4. Agent requests human assistance with full context
         ↓
5. Human agent reviews context, takes over conversation
         ↓
6. Human resolves issue → marks complete
         ↓
7. System learns from interaction → generates KB article → updates knowledge base
```

### 3.1b Knowledge Base Auto-Generation Workflow

The system automatically generates and maintains KB articles through two primary pathways:

**Pathway 1: Incident-Based KB Generation**

```
1. Incident resolved by human agent in ServiceNow
         ↓
2. System analyzes conversation transcript + resolution
         ↓
3. AI extracts: Problem statement, Root cause, Resolution steps
         ↓
4. Draft KB article generated with confidence score
         ↓
5. Human reviewer approves/edits draft
         ↓
6. Article published to ServiceNow KB + RAG index
         ↓
7. Future similar queries answered from KB (no LLM needed)
```

**Pathway 2: Application Onboarding KB Generation**

```
1. New application/feature added to e-commerce platform
         ↓
2. System receives webhook with product/service details
         ↓
3. AI generates: Setup guide, FAQ, Troubleshooting steps
         ↓
4. Draft KB article created from product data
         ↓
5. Human reviewer approves/edits draft
         ↓
6. Article published to ServiceNow KB + RAG index
         ↓
7. Customers can self-service common onboarding questions
```

**KB Generation Quality Controls**:

| Control | Description |
|---------|-------------|
| Confidence Threshold | Only generate articles with >80% confidence |
| Human Review | All AI-generated articles require approval |
| Deduplication | Check for existing similar articles before creating |
| Versioning | Track article changes with audit trail |
| Usage Analytics | Monitor article helpfulness, flag for update |

### 3.2 Interface Requirements

| Interface | Requirements |
|-----------|---------------|
| Chat Widget | Embedded on e-commerce site, customizable branding |
| Admin Dashboard | Ticket management, analytics, agent oversight |
| Agent Workspace | Context panel, response suggestions, handoff controls |
| API | RESTful endpoints for ServiceNow integration (incidents, KB) |

### 3.3 Automation Opportunities

| Inquiry Type | Automation Potential | Handle Time Reduction |
|--------------|---------------------|----------------------|
| Order Status | 95% | 90% |
| Return Processing | 80% | 75% |
| Product Information | 70% | 60% |
| Shipping Questions | 85% | 80% |
| Refund Status | 90% | 85% |
| Policy Questions | 75% | 70% |
| Complex Complaints | 30% | 40% |

### 3.4 Human-in-the-Loop Requirements

**Automatic Handoff Triggers**:

- Customer explicitly requests "human" or "agent"
- Sentiment analysis indicates high frustration (negative score < -0.7)
- 3+ failed resolution attempts by AI
- Specific topics: legal disputes, executive complaints, media inquiries
- Custom business rules (high-value customer, specific products)
- **Application Issues**: Detected system errors, API failures, or infrastructure issues requiring L3 (Tier 3) specialized support

**L3 Agent Triggers (Technical/System Issues)**:

| Trigger Type | Description | Escalation Path |
|--------------|-------------|------------------|
| System Error Detected | 5xx errors, timeouts, service unavailable | → L3 Infrastructure Team |
| API Failure | External API returns error, integration broken | → L3 Development Team |
| Data Inconsistency | Missing/corrupted data detected | → L3 Data/Engineering Team |
| Security Alert | Potential security vulnerability detected | → L3 Security Team |
| Performance Degradation | Response time > threshold, system slow | → L3 Infrastructure Team |

**Handoff Quality Requirements**:

- Complete conversation history transferred
- Summary of attempted resolutions
- Customer profile and order history available
- Suggested response templates for common issues
- System logs and error traces (for L3 escalations)

### 3.5 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Resolution Rate | >85% | Tickets resolved without human |
| First Contact Resolution | >70% | Single interaction resolution |
| Average Handle Time | <3 min | Time to resolution |
| Customer Satisfaction | >4.2/5 | Post-interaction survey |
| Ticket Deflection | >40% | Self-service vs. agent contact |
| Escalation Rate | <15% | Human handoff percentage |
| KB Article Generation | >5/month | New KB articles created by AI |
| KB Utilization Rate | >60% | AI responses grounded in KB |

---

## 4. Production & Operations Requirements

### 4.1 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Cloud Infrastructure                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Load Balancer                      │   │
│  └─────────────────────────────────────────────────────┘   │
│         ↓                ↓                ↓                 │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐        │
│  │ API Pod 1│      │ API Pod 2│      │ API Pod N│        │
│  └──────────┘      └──────────┘      └──────────┘        │
│         ↓                ↓                ↓                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Message Queue (Redis/RabbitMQ)         │   │
│  └─────────────────────────────────────────────────────┘   │
│         ↓                ↓                ↓                 │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐        │
│  │ Agent    │      │ Agent    │      │ Agent    │        │
│  │ Worker 1 │      │ Worker 2 │      │ Worker N │        │
│  └──────────┘      └──────────┘      └──────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Infrastructure Requirements

| Component | Specification | Monthly Cost (Est.) |
|-----------|---------------|---------------------|
| Cloud Provider | AWS/GCP | - |
| Compute | 4x t3.large (16GB, 2vCPU) | $300 |
| Database | RDS PostgreSQL (db.t3.medium) | $150 |
| Cache | ElastiCache Redis (cache.t3.micro) | $50 |
| LLM API | Google Gemini (variable) | $500-2000 |
| Monitoring | Datadog/PMM | $100 |
| **Total** | | **$1,100-$2,600** |

### 4.3 Monitoring & Observability

**Key Metrics**:

- Conversation volume and patterns
- Resolution rates by agent type
- Latency (P50, P95, P99)
- Error rates and exceptions
- LLM token consumption and costs
- Customer satisfaction trends

**Alerting Thresholds**:

- Resolution rate <70%: Warning
- Resolution rate <60%: Critical
- Latency P95 >10s: Warning
- Latency P95 >20s: Critical
- Error rate >5%: Warning

### 4.4 Security & Compliance

| Requirement | Implementation |
|-------------|----------------|
| Data Encryption | TLS 1.3 in transit, AES-256 at rest |
| PII Handling | Automatic PII detection and masking |
| Access Control | Role-based access (Admin, Agent, Viewer) |
| Audit Logging | All conversations logged with timestamps |
| Data Retention | Configurable retention (default 90 days) |
| GDPR Compliance | Data export/deletion capabilities |

### 4.5 Cost Structure

| Cost Category | Monthly (50 customers) | Monthly (200 customers) |
|---------------|------------------------|-------------------------|
| Infrastructure | $1,500 | $3,000 |
| LLM API (Gemini) | $1,500 | $4,500 |
| Support & Maintenance | $500 | $1,500 |
| **Total** | **$3,500** | **$9,000** |
| **Per Customer** | **$70** | **$45** |

---

## 5. Innovation & Differentiation Analysis

### 5.1 Unique Value Propositions

| Differentiation | Description | Competitive Advantage |
|-----------------|-------------|----------------------|
| Deep Integration | Native connector to ServiceNow (Incident + KB) | 60% faster implementation vs. generic solutions |
| Hybrid Architecture | Seamless AI-to-human handoff with context preservation | Unique in mid-market segment |
| **AI-Generated KB** | Agents auto-generate KB articles from resolved incidents | 80% reduction in KB maintenance effort |
| Retail-Specific | Pre-built workflows for returns, orders, products | 40% less customization required |
| Transparent Pricing | Flat-fee model vs. per-seat pricing | 50% cost savings at scale |

### 5.2 Emerging Technology Integration

| Technology | Integration Timeline | Impact |
|------------|---------------------|--------|
| Voice Agents | Q3 2026 | Phone support automation |
| Multimodal | Q4 2026 | Image-based product queries |
| Fine-tuned Models | Q1 2027 | Domain-specific accuracy gains |
| Agent Memory | Q2 2027 | Personalized long-term relationships |

### 5.3 Monetization Strategies

| Model | Description | Target ARPU |
|-------|-------------|-------------|
| SaaS Subscription | $99-499/month based on volume | $200/mo |
| Usage-based | $0.01/conversation + base fee | $0.02/conversation |
| Enterprise | Custom contracts with SLA | $2,000+/mo |

### 5.4 Future Trends

1. **Autonomous Commerce**: Agents that not only support but also complete purchases, returns, and subscriptions autonomously
2. **Unified Commerce Assistant**: Single agent across email, chat, social, and voice
3. **Proactive Support**: AI that identifies issues before customer contact (e.g., shipping delays)
4. **Emotional Intelligence**: Advanced sentiment analysis enabling appropriate empathy and escalation

---

## 6. Critical Decision Points

### 6.1 Go/No-Go Factors

| Factor | Requirement | Status |
|--------|-------------|--------|
| Technical Feasibility | CrewAI can handle 70%+ of target inquiries | ✅ Feasible |
| Market Size | >$4B addressable market with 20%+ growth | ✅ Confirmed |
| Competitive Position | Differentiation via deep integration | ✅ Achievable |
| Technical Team | Available expertise in CrewAI + LLM APIs | ⏳ TBD |
| Funding | $50K-100K for MVP development | ⏳ TBD |

### 6.2 Technical Architecture Choices

**Recommended Stack**:

- **Framework**: CrewAI 0.50+ with custom agent extensions
- **LLM**: Google Gemini 2.5 Pro (primary), Anthropic Claude (fallback)
- **Database**: PostgreSQL + Redis for session management
- **Deployment**: Kubernetes on AWS EKS
- **Integrations**: ServiceNow (Incident Management + KB)

### 6.3 Market Positioning

**Positioning Statement**:  
"For mid-market e-commerce brands seeking to scale support without scaling costs, [Product Name] is the AI-powered support platform that deeply integrates with your existing commerce stack—delivering 40-60% automation while preserving the human touch when it matters most."

**Target Segments**:

1. Primary: $50M-$200M revenue e-commerce brands
2. Secondary: $200M-$500M revenue brands
3. Expansion: $500M+ (requires enterprise features)

### 6.4 Resource Requirements

| Resource | Quantity | Timeline |
|----------|----------|----------|
| Backend Engineer | 1 | Full-time |
| Frontend Engineer | 1 | Part-time (MVP) |
| Product Manager | 0.5 | Part-time |
| **Total** | **2.5 FTE** | **4-6 months** |

---

## 7. Risk Assessment Matrix

| Risk Category | Risk | Probability | Impact | Mitigation |
|---------------|------|-------------|--------|------------|
| Technical | LLM quality degradation | Medium | High | Model diversification, human oversight |
| Market | Enterprise players enter segment | High | Medium | Accelerate customer acquisition, build loyalty |
| Operational | Integration complexity | Medium | High | Prioritize stable platforms, phased rollout |
| Regulatory | AI compliance requirements | Low | Medium | Monitor regulatory landscape, build compliance-ready |
| Financial | LLM cost volatility | High | Medium | Cost optimization, usage monitoring |

---

## 8. Actionable Recommendations

### 8.1 Immediate Next Steps (48 hours)

- [ ] Confirm technical team availability and CrewAI experience
- [ ] Validate funding allocation for MVP development
- [ ] Select 3-5 target customers for beta program
- [ ] Create detailed technical specification (SFS)

### 8.2 Short-term Priorities (30 days)

- [ ] Develop MVP scope with core features:
  - Chat widget integration
  - ServiceNow incident creation
  - ServiceNow KB lookup and auto-generation
  - Basic triage and routing
  - Human handoff capability
- [ ] Build proof-of-concept with 2-3 sample integrations
- [ ] Initiate beta customer conversations

### 8.3 Long-term Strategy (6-12 months)

| Quarter | Focus | Key Milestones |
|---------|-------|-----------------|
| Q2 2026 | MVP Launch | Beta with 5 customers, core features live |
| Q3 2026 | Market Validation | 20 customers, NPS >40 |
| Q4 2026 | Scale | 50 customers, self-sustaining revenue |
| Q1 2027 | Expand | Voice agent, enterprise features |

---

## Appendix A: Research Sources

1. Gartner "Magic Quadrant for Conversational AI Platforms" - 2025
2. Grand View Research "Conversational AI Market Size Report" - 2025
3. McKinsey "State of AI 2025" Report
4. Baymard Institute "E-commerce Checkout Usability" - 2025
5. Google "Gemini 2.5 Technical Report" - 2024
6. ServiceNow "State of ITSM Report" - 2025
7. Glassdoor "Customer Support Salary Trends" - 2025
8. Salesforce "State of the Connected Customer" - 2025
9. HubSpot "Customer Support Benchmark Report" - 2025
10. Comm100 "Digital Customer Service Report" - 2025
11. LinkedIn "Retail Industry Turnover Statistics" - 2025
12. CrewAI Documentation - 2025
13. CrewAI Community "Multi-agent Patterns" - 2025

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| MRD | Market Research Document |
| PRD | Product Requirements Document |
| SAD | System Architecture Document |
| SFS | System Functional Specification |
| RAG | Retrieval Augmented Generation |
| ARPU | Average Revenue Per User |
| FTE | Full-Time Equivalent |
| CAGR | Compound Annual Growth Rate |
| PII | Personally Identifiable Information |

---

*Document Version: 1.0*  
*Last Updated: April 27, 2026*  
*Next Review: May 27, 2026*