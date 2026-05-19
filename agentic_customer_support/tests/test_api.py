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
        return {"response": "ok", "category": "order", "urgency": 3, "requires_escalation": True, "handoff_notes": "notes"}

    monkeypatch.setattr(appmod.crew, "process_customer_query", fake_process)

    data = {"user_id": "u1", "content": "Where is my order?"}
    r = client.post("/chat", json=data)
    assert r.status_code == 200
    body = r.json()
    assert body["response"] == "ok"

    # list tickets
    r2 = client.get("/tickets")
    assert r2.status_code == 200
    assert isinstance(r2.json(), list)
