from fastapi.testclient import TestClient
import agentic_customer_support.api.app as appmod
from agentic_customer_support.api.app import app


def test_health():
    client = TestClient(app)
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_chat_and_ticket(monkeypatch):
    client = TestClient(app)

    def fake_process(query, conversation_context=None):
        return {
            "response": "ok",
            "category": "order",
            "urgency": 3,
            "requires_escalation": True,
            "handoff_notes": "notes",
            "agentAssigned": "Agent Smith",
        }

    monkeypatch.setattr(appmod.crew, "process_customer_query", fake_process)

    # Create a new conversation
    r0 = client.post("/chat/conversations")
    assert r0.status_code == 200
    conversation_id = r0.json()["conversationId"]
    assert conversation_id

    data = {"conversationId": conversation_id, "message": "Where is my order?", "userId": "u1"}
    r = client.post("/chat", json=data)
    assert r.status_code == 200
    body = r.json()
    assert body["agentResponse"] == "ok"
    assert body["status"] == "escalated"
    assert body["ticketId"]

    # list tickets
    r2 = client.get("/tickets")
    assert r2.status_code == 200
    body2 = r2.json()
    assert isinstance(body2, dict)
    assert "data" in body2 and "pagination" in body2
    assert isinstance(body2["data"], list)
    assert body2["pagination"]["total"] >= 1
