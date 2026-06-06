import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect
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


def _login(client: TestClient, email: str, password: str) -> str:
    response = client.post('/auth/login', json={'email': email, 'password': password})
    assert response.status_code == 200
    return response.json()['token']


def test_rbac_requestor_and_admin_endpoints(monkeypatch):
    client = TestClient(app)

    monkeypatch.setattr(
        appmod.crew,
        'process_customer_query',
        lambda query, conversation_context=None, requester_role=None: {
            'response': 'ticket created',
            'category': 'order',
            'urgency': 2,
            'requires_escalation': False,
            'handoff_notes': '',
        },
    )

    requestor_token = _login(client, 'customer@example.com', 'requestor123')
    admin_token = _login(client, 'admin@company.com', 'admin123')

    req_headers = {'Authorization': f'Bearer {requestor_token}'}
    admin_headers = {'Authorization': f'Bearer {admin_token}'}

    submit = client.post('/api/v1/tickets', json={'message': 'Need order status'}, headers=req_headers)
    assert submit.status_code == 200
    ticket_id = submit.json()['id']

    mine = client.get('/api/v1/tickets/mine', headers=req_headers)
    assert mine.status_code == 200
    assert len(mine.json()) >= 1

    forbidden = client.get('/api/v1/users', headers=req_headers)
    assert forbidden.status_code == 403

    users = client.get('/api/v1/users', headers=admin_headers)
    assert users.status_code == 200
    assert any(u['email'] == 'admin@company.com' for u in users.json())

    feedback = client.post(
        f'/api/v1/tickets/{ticket_id}/feedback',
        json={'rating': 5, 'comment': 'Great support'},
        headers=req_headers,
    )
    assert feedback.status_code == 200
    assert feedback.json()['feedback']['rating'] == 5


def test_agent_queue_flow(monkeypatch):
    client = TestClient(app)

    monkeypatch.setattr(
        appmod.crew,
        'process_customer_query',
        lambda query, conversation_context=None, requester_role=None: {
            'response': 'Needs escalation',
            'category': 'it',
            'urgency': 4,
            'requires_escalation': True,
            'handoff_notes': 'Escalate to human',
        },
    )

    requestor_token = _login(client, 'employee@acme.com', 'requestor123')
    agent_token = _login(client, 'agent1@company.com', 'agent123')

    req_headers = {'Authorization': f'Bearer {requestor_token}'}
    agent_headers = {'Authorization': f'Bearer {agent_token}'}

    submit = client.post('/api/v1/tickets', json={'message': 'Internal app outage'}, headers=req_headers)
    assert submit.status_code == 200
    ticket_id = submit.json()['id']

    queue = client.get('/api/v1/queue', headers=agent_headers)
    assert queue.status_code == 200
    assert any(t['id'] == ticket_id for t in queue.json())

    accept = client.post(f'/api/v1/queue/{ticket_id}/accept', headers=agent_headers)
    assert accept.status_code == 200
    assert accept.json()['status'] == 'in_progress'

    resolve = client.post(
        f'/api/v1/queue/{ticket_id}/resolve',
        json={'resolutionNotes': 'Restarted service and validated health'},
        headers=agent_headers,
    )
    assert resolve.status_code == 200
    assert resolve.json()['status'] == 'resolved'


def test_end_to_end_message_to_resolution_flow(monkeypatch):
    client = TestClient(app)

    def fake_process(query, conversation_context=None, requester_role=None):
        return {
            'response': f'Processed: {query}',
            'category': 'it',
            'urgency': 4,
            'requires_escalation': True,
            'handoff_notes': 'Escalate to agent queue',
            'agentAssigned': None,
        }

    monkeypatch.setattr(appmod.crew, 'process_customer_query', fake_process)

    requestor_token = _login(client, 'employee@acme.com', 'requestor123')
    agent_token = _login(client, 'agent1@company.com', 'agent123')

    req_headers = {'Authorization': f'Bearer {requestor_token}'}
    agent_headers = {'Authorization': f'Bearer {agent_token}'}

    submitted = client.post('/api/v1/tickets', json={'message': 'Internal ERP is down'}, headers=req_headers)
    assert submitted.status_code == 200
    ticket_id = submitted.json()['id']
    assert submitted.json()['status'] == 'escalated'

    queue = client.get('/api/v1/queue', headers=agent_headers)
    assert queue.status_code == 200
    assert any(ticket['id'] == ticket_id for ticket in queue.json())

    accepted = client.post(f'/api/v1/queue/{ticket_id}/accept', headers=agent_headers)
    assert accepted.status_code == 200
    assert accepted.json()['status'] == 'in_progress'

    noted = client.put(
        f'/api/v1/tickets/{ticket_id}/notes',
        json={'notes': 'Investigating outage and collecting logs'},
        headers=agent_headers,
    )
    assert noted.status_code == 200
    assert noted.json()['agentNotes'] == 'Investigating outage and collecting logs'

    resolved = client.post(
        f'/api/v1/queue/{ticket_id}/resolve',
        json={'resolutionNotes': 'Service restarted and validated'},
        headers=agent_headers,
    )
    assert resolved.status_code == 200
    assert resolved.json()['status'] == 'resolved'

    ticket_detail = client.get(f'/api/v1/tickets/{ticket_id}', headers=agent_headers)
    assert ticket_detail.status_code == 200
    body = ticket_detail.json()
    assert body['status'] == 'resolved'
    assert body['resolutionNotes'] == 'Service restarted and validated'


def test_handoff_context_and_messages_contract(monkeypatch):
    client = TestClient(app)

    monkeypatch.setattr(
        appmod.crew,
        'process_customer_query',
        lambda query, conversation_context=None, requester_role=None: {
            'response': 'Escalating to human for detailed support',
            'category': 'it',
            'urgency': 5,
            'requires_escalation': True,
            'handoff_notes': 'Need real-agent verification',
            'attempted_actions': ['kb_lookup', 'status_check'],
            'resolution_attempts': 2,
        },
    )

    requestor_token = _login(client, 'employee@acme.com', 'requestor123')
    agent_token = _login(client, 'agent1@company.com', 'agent123')

    req_headers = {'Authorization': f'Bearer {requestor_token}'}
    agent_headers = {'Authorization': f'Bearer {agent_token}'}

    submitted = client.post('/api/v1/tickets', json={'message': 'ERP is down'}, headers=req_headers)
    assert submitted.status_code == 200
    ticket_id = submitted.json()['id']

    accept = client.post(f'/api/v1/queue/{ticket_id}/accept', headers=agent_headers)
    assert accept.status_code == 200
    assert accept.json()['conversationState'] == 'HUMAN_ACTIVE'

    handoff = client.get(f'/api/v1/tickets/{ticket_id}/handoff-context', headers=agent_headers)
    assert handoff.status_code == 200
    handoff_payload = handoff.json()
    assert handoff_payload['ticket_id'] == ticket_id
    assert handoff_payload['escalation']['priority'] == 5
    assert handoff_payload['ai_summary']['intent'] == 'it'

    req_msg = client.post(
        f'/api/v1/tickets/{ticket_id}/messages',
        json={'sender_type': 'requestor', 'body': 'Any updates?'},
        headers=req_headers,
    )
    assert req_msg.status_code == 200
    assert req_msg.json()['sender_type'] == 'requestor'

    agent_msg = client.post(
        f'/api/v1/tickets/{ticket_id}/messages',
        json={'sender_type': 'real_agent', 'body': 'Yes, we are restoring service now.'},
        headers=agent_headers,
    )
    assert agent_msg.status_code == 200
    assert agent_msg.json()['sender_type'] == 'real_agent'

    messages = client.get(f'/api/v1/tickets/{ticket_id}/messages', headers=agent_headers)
    assert messages.status_code == 200
    sender_types = [m['sender_type'] for m in messages.json()]
    assert 'requestor' in sender_types
    assert 'real_agent' in sender_types


def test_ticket_websocket_typing_event(monkeypatch):
    client = TestClient(app)

    monkeypatch.setattr(
        appmod.crew,
        'process_customer_query',
        lambda query, conversation_context=None, requester_role=None: {
            'response': 'Escalated due to complexity',
            'category': 'it',
            'urgency': 4,
            'requires_escalation': True,
            'handoff_notes': 'Need human validation',
        },
    )

    requestor_token = _login(client, 'employee@acme.com', 'requestor123')
    req_headers = {'Authorization': f'Bearer {requestor_token}'}

    submitted = client.post('/api/v1/tickets', json={'message': 'Need help with ERP issue'}, headers=req_headers)
    assert submitted.status_code == 200
    ticket_id = submitted.json()['id']

    with client.websocket_connect(f'/api/v1/ws/tickets/{ticket_id}?token={requestor_token}') as ws:
        initial = ws.receive_json()
        assert initial['type'] == 'ticket.status.changed'
        ws.send_json({'type': 'subscribe', 'ticket_id': ticket_id, 'role': 'REQUESTOR'})
        subscribed = ws.receive_json()
        assert subscribed['type'] == 'subscribed'

        ws.send_json({'type': 'chat.typing', 'is_typing': True})
        typing_event = ws.receive_json()
        assert typing_event['type'] == 'chat.typing'
        assert typing_event['is_typing'] is True


def test_handoff_context_forbidden_for_unassigned_agent(monkeypatch):
    client = TestClient(app)

    monkeypatch.setattr(
        appmod.crew,
        'process_customer_query',
        lambda query, conversation_context=None, requester_role=None: {
            'response': 'Escalated to human queue',
            'category': 'it',
            'urgency': 4,
            'requires_escalation': True,
            'handoff_notes': 'Needs human follow-up',
        },
    )

    requestor_token = _login(client, 'employee@acme.com', 'requestor123')
    agent1_token = _login(client, 'agent1@company.com', 'agent123')
    agent2_token = _login(client, 'agent2@company.com', 'agent123')

    req_headers = {'Authorization': f'Bearer {requestor_token}'}
    agent1_headers = {'Authorization': f'Bearer {agent1_token}'}
    agent2_headers = {'Authorization': f'Bearer {agent2_token}'}

    submit = client.post('/api/v1/tickets', json={'message': 'Critical internal outage'}, headers=req_headers)
    assert submit.status_code == 200
    ticket_id = submit.json()['id']

    accept = client.post(f'/api/v1/queue/{ticket_id}/accept', headers=agent1_headers)
    assert accept.status_code == 200

    denied = client.get(f'/api/v1/tickets/{ticket_id}/handoff-context', headers=agent2_headers)
    assert denied.status_code == 403


def test_handoff_context_missing_ticket_returns_404():
    client = TestClient(app)

    agent_token = _login(client, 'agent1@company.com', 'agent123')
    agent_headers = {'Authorization': f'Bearer {agent_token}'}

    missing = client.get('/api/v1/tickets/does-not-exist/handoff-context', headers=agent_headers)
    assert missing.status_code == 404


def test_ticket_websocket_rejects_invalid_token(monkeypatch):
    client = TestClient(app)

    monkeypatch.setattr(
        appmod.crew,
        'process_customer_query',
        lambda query, conversation_context=None, requester_role=None: {
            'response': 'Escalated to queue',
            'category': 'it',
            'urgency': 4,
            'requires_escalation': True,
            'handoff_notes': 'Needs human help',
        },
    )

    requestor_token = _login(client, 'employee@acme.com', 'requestor123')
    req_headers = {'Authorization': f'Bearer {requestor_token}'}
    submitted = client.post('/api/v1/tickets', json={'message': 'ERP issue'}, headers=req_headers)
    assert submitted.status_code == 200
    ticket_id = submitted.json()['id']

    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(f'/api/v1/ws/tickets/{ticket_id}?token=invalid-token'):
            pass


def test_ticket_websocket_rejects_non_owner_requestor(monkeypatch):
    client = TestClient(app)

    monkeypatch.setattr(
        appmod.crew,
        'process_customer_query',
        lambda query, conversation_context=None, requester_role=None: {
            'response': 'Escalated to queue',
            'category': 'it',
            'urgency': 4,
            'requires_escalation': True,
            'handoff_notes': 'Needs human help',
        },
    )

    owner_token = _login(client, 'employee@acme.com', 'requestor123')
    other_requestor_token = _login(client, 'customer@example.com', 'requestor123')

    owner_headers = {'Authorization': f'Bearer {owner_token}'}
    submitted = client.post('/api/v1/tickets', json={'message': 'Payroll app issue'}, headers=owner_headers)
    assert submitted.status_code == 200
    ticket_id = submitted.json()['id']

    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(f'/api/v1/ws/tickets/{ticket_id}?token={other_requestor_token}'):
            pass
