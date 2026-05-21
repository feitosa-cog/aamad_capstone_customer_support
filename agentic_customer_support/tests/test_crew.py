from agentic_customer_support.crew import AgenticCustomerSupport


class FakeAgent:
    def __init__(self, response):
        self._response = response

    def execute_task(self, task, inputs):
        return self._response


def test_process_customer_query_routes_order_specialist(monkeypatch):
    crew = AgenticCustomerSupport()
    monkeypatch.setattr(AgenticCustomerSupport, "_has_llm_credentials", lambda self: True)
    monkeypatch.setattr(AgenticCustomerSupport, "triage_task", lambda self: object())
    monkeypatch.setattr(
        AgenticCustomerSupport,
        "triage_agent",
        lambda self: FakeAgent('{"category":"order","requires_escalation": false, "urgency": 3}')
    )
    monkeypatch.setattr(AgenticCustomerSupport, "order_task", lambda self: object())
    monkeypatch.setattr(
        AgenticCustomerSupport,
        "order_specialist",
        lambda self: FakeAgent('{"response":"Your order is being processed.","category":"order","urgency":3,"requires_escalation":false,"handoff_notes":""}')
    )

    result = crew.process_customer_query("Where is my order?")

    assert result["category"] == "order"
    assert result["response"] == "Your order is being processed."
    assert result["requires_escalation"] is False


def test_process_customer_query_returns_general_response_for_generic_query(monkeypatch):
    crew = AgenticCustomerSupport()
    monkeypatch.setattr(AgenticCustomerSupport, "_has_llm_credentials", lambda self: True)
    monkeypatch.setattr(AgenticCustomerSupport, "triage_task", lambda self: object())
    monkeypatch.setattr(
        AgenticCustomerSupport,
        "triage_agent",
        lambda self: FakeAgent('{"category":"general","requires_escalation": false, "urgency": 2}')
    )
    monkeypatch.setattr(
        AgenticCustomerSupport,
        "handoff_agent",
        lambda self: FakeAgent('{"response":"This should not be used"}')
    )

    result = crew.process_customer_query("what are the topic that you can discuss?")

    assert result["category"] == "general"
    assert result["requires_escalation"] is False
    assert "I can help" in result["response"]


def test_process_customer_query_sanitizes_internal_specialist_guidance(monkeypatch):
    crew = AgenticCustomerSupport()
    monkeypatch.setattr(AgenticCustomerSupport, "_has_llm_credentials", lambda self: True)
    monkeypatch.setattr(AgenticCustomerSupport, "triage_task", lambda self: object())
    monkeypatch.setattr(
        AgenticCustomerSupport,
        "triage_agent",
        lambda self: FakeAgent('{"category":"account","requires_escalation": false, "urgency": 2}')
    )
    monkeypatch.setattr(AgenticCustomerSupport, "account_task", lambda self: object())
    monkeypatch.setattr(
        AgenticCustomerSupport,
        "consumer_specialist",
        lambda self: FakeAgent({
            'response': 'Category: account (account issues, billing, password reset)\nUrgency Level: 2 (Low to Moderate)\nRecommended Next Steps for Specialist Agent: - Provide step-by-step instructions on how to change the password...',
            'category': 'account',
            'urgency': 2,
            'requires_escalation': False,
            'handoff_notes': ''
        })
    )

    result = crew.process_customer_query("how can I change my password on Microsoft account?")

    assert result["category"] == "account"
    assert result["requires_escalation"] is False
    assert "Category:" not in result["response"]
    assert "Recommended Next Steps" not in result["response"]
