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
