from fastapi import Depends, FastAPI, Header, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import uuid
from enum import Enum
from datetime import datetime

from agentic_customer_support.crew import AgenticCustomerSupport
from agentic_customer_support.services.ticket_service import TicketService
from agentic_customer_support.services.conversation_service import ConversationService
from agentic_customer_support.services.servicenow_service import ServiceNowService

app = FastAPI(title="Agentic Customer Support API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services
crew = AgenticCustomerSupport()
ticket_service = TicketService()
conversation_service = ConversationService()
servicenow = ServiceNowService()

USE_MOCK_CREW = os.getenv('OPENAI_API_KEY') is None

if USE_MOCK_CREW:
    print('WARNING: OPENAI_API_KEY is not set. Running Crew API in mock fallback mode.')

AUTHORIZED_USERS = {
    'customer@example.com': {
        'id': 'requestor-customer-1',
        'email': 'customer@example.com',
        'role': 'REQUESTOR',
        'name': 'Customer Requestor',
        'password': 'requestor123',
        'team': None,
    },
    'employee@acme.com': {
        'id': 'requestor-employee-1',
        'email': 'employee@acme.com',
        'role': 'REQUESTOR',
        'name': 'Employee Requestor',
        'password': 'requestor123',
        'team': None,
    },
    'agent1@company.com': {
        'id': 'agent-1',
        'email': 'agent1@company.com',
        'role': 'REAL_AGENT',
        'name': 'Tier 2 Agent One',
        'password': 'agent123',
        'team': 'tier2_support',
    },
    'agent2@company.com': {
        'id': 'agent-2',
        'email': 'agent2@company.com',
        'role': 'REAL_AGENT',
        'name': 'Tier 2 Agent Two',
        'password': 'agent123',
        'team': 'tier2_support',
    },
    'admin@company.com': {
        'id': 'admin-1',
        'email': 'admin@company.com',
        'role': 'PLATFORM_ADMIN',
        'name': 'Platform Administrator',
        'password': 'admin123',
        'team': 'platform_ops',
    },
}

auth_tokens: Dict[str, Dict[str, Any]] = {}
audit_logs: List[Dict[str, Any]] = []
system_config: Dict[str, Any] = {
    'maintenanceMode': False,
    'maxConcurrentConversations': 100,
    'analyticsExportTarget': 'databricks',
}


class UserRole(str, Enum):
    REQUESTOR = 'REQUESTOR'
    REAL_AGENT = 'REAL_AGENT'
    PLATFORM_ADMIN = 'PLATFORM_ADMIN'


class TicketState(str, Enum):
    OPEN = 'OPEN'
    ESCALATION_REQUESTED = 'ESCALATION_REQUESTED'
    ESCALATION_QUEUED = 'ESCALATION_QUEUED'
    HUMAN_ACTIVE = 'HUMAN_ACTIVE'
    HUMAN_RESOLVED = 'HUMAN_RESOLVED'
    CLOSED = 'CLOSED'


ROLE_PERMISSIONS: Dict[UserRole, List[str]] = {
    UserRole.REQUESTOR: ['create_ticket', 'view_own_tickets', 'feedback'],
    UserRole.REAL_AGENT: ['view_queue', 'accept_ticket', 'resolve_ticket', 'escalate'],
    UserRole.PLATFORM_ADMIN: ['manage_users', 'view_all_tickets', 'system_config', 'audit'],
}


def _log_audit(action: str, actor: Optional[Dict[str, Any]] = None, target: Optional[str] = None, details: Optional[Dict[str, Any]] = None) -> None:
    audit_logs.append({
        'id': str(uuid.uuid4()),
        'timestamp': datetime.utcnow().isoformat(),
        'action': action,
        'actor': actor.get('email') if actor else 'system',
        'target': target,
        'details': details or {},
    })


def _public_user_record(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'id': user['id'],
        'email': user['email'],
        'role': user['role'],
        'name': user['name'],
        'team': user.get('team'),
        'status': 'active',
        'permissions': ROLE_PERMISSIONS.get(UserRole(user['role']), []),
    }


def _find_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    for user in AUTHORIZED_USERS.values():
        if user['id'] == user_id:
            return user
    return None


def _find_ticket_or_404(ticket_id: str) -> Dict[str, Any]:
    ticket = ticket_service.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail='Ticket not found')
    return ticket


def _can_access_ticket(ticket: Dict[str, Any], current_user: Dict[str, Any]) -> bool:
    role = current_user.get('role')
    if role == UserRole.PLATFORM_ADMIN.value:
        return True
    if role == UserRole.REQUESTOR.value:
        return ticket.get('user_id') == current_user.get('id')
    if role == UserRole.REAL_AGENT.value:
        if ticket.get('agentAssigned') == current_user.get('id'):
            return True
        # Agents can inspect escalated queue tickets before acceptance.
        return ticket.get('conversationState') in {TicketState.ESCALATION_QUEUED.value, TicketState.HUMAN_ACTIVE.value}
    return False


def _sender_type_for_role(role: str) -> str:
    if role == UserRole.REQUESTOR.value:
        return 'requestor'
    if role == UserRole.REAL_AGENT.value:
        return 'real_agent'
    if role == UserRole.PLATFORM_ADMIN.value:
        return 'system'
    return 'system'


class TicketWebSocketManager:
    def __init__(self):
        self._connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, ticket_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.setdefault(ticket_id, []).append(websocket)

    def disconnect(self, ticket_id: str, websocket: WebSocket) -> None:
        connections = self._connections.get(ticket_id, [])
        if websocket in connections:
            connections.remove(websocket)
        if not connections and ticket_id in self._connections:
            self._connections.pop(ticket_id, None)

    async def broadcast(self, ticket_id: str, event: Dict[str, Any]) -> None:
        connections = list(self._connections.get(ticket_id, []))
        for websocket in connections:
            try:
                await websocket.send_json(event)
            except Exception:
                self.disconnect(ticket_id, websocket)


ws_manager = TicketWebSocketManager()


async def get_current_user(authorization: Optional[str] = Header(None, alias='Authorization')) -> Dict[str, Any]:
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing or invalid token')
    token = authorization.split(' ', 1)[1]
    user = auth_tokens.get(token)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')
    return user


def require_role(*roles: UserRole):
    async def _checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        if current_user.get('role') not in {r.value for r in roles}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Insufficient permissions')
        return current_user
    return _checker


def _mock_crew_response(query: str, conversation_context: Optional[str] = None) -> Dict[str, Any]:
    normalized = query.strip().lower()
    if any(keyword in normalized for keyword in ['order', 'tracking', 'shipment', 'shipping']):
        return {
            'response': 'Your order is on the way and should arrive within 2 business days.',
            'category': 'order',
            'urgency': 3,
            'requires_escalation': False,
            'confidence': 0.9,
            'agentAssigned': None,
            'handoff_notes': '',
        }
    if any(keyword in normalized for keyword in ['return', 'refund', 'exchange', 'return policy']):
        return {
            'response': 'I can help with your return. Please provide your order number and reason for return.',
            'category': 'returns',
            'urgency': 3,
            'requires_escalation': False,
            'confidence': 0.9,
            'agentAssigned': None,
            'handoff_notes': '',
        }
    if any(keyword in normalized for keyword in ['product', 'spec', 'specs', 'availability', 'stock', 'price', 'detail']):
        return {
            'response': 'Here are the product details you requested. Let me know if you want a comparison or availability check.',
            'category': 'product',
            'urgency': 2,
            'requires_escalation': False,
            'confidence': 0.85,
            'agentAssigned': None,
            'handoff_notes': '',
        }
    if any(keyword in normalized for keyword in ['account', 'login', 'password', 'billing', 'subscription', 'profile', 'cancel my subscription']):
        return {
            'response': 'I can help with your account issue. Please describe the login or billing problem in more detail.',
            'category': 'account',
            'urgency': 3,
            'requires_escalation': False,
            'confidence': 0.85,
            'agentAssigned': None,
            'handoff_notes': '',
        }
    if any(keyword in normalized for keyword in ['portal', 'timesheet', 'internal', 'system', 'app', 'error', 'it issue', 'service now', 'servicenow']):
        return {
            'response': 'I have detected an internal IT issue. I am escalating this to the IT support team for review.',
            'category': 'it',
            'urgency': 4,
            'requires_escalation': True,
            'confidence': 0.75,
            'agentAssigned': None,
            'handoff_notes': 'Internal IT issue detected; prepare incident details.',
        }
    if any(keyword in normalized for keyword in ['agent', 'human', 'handoff']):
        return {
            'response': 'I am connecting you to a human agent now.',
            'category': 'general',
            'urgency': 4,
            'requires_escalation': True,
            'confidence': 0.8,
            'agentAssigned': None,
            'handoff_notes': 'Manual handoff requested by customer.',
        }
    return {
        'response': 'Thanks for your message. I am reviewing your request and will respond shortly.',
        'category': 'general',
        'urgency': 3,
        'requires_escalation': False,
        'confidence': 0.8,
        'agentAssigned': None,
        'handoff_notes': '',
    }


def _mock_escalation_response(query: str, conversation_history: List[Dict[str, Any]]) -> Dict[str, Any]:
    return {
        'escalation_id': str(uuid.uuid4()),
        'handoff_summary': f'Mock escalation for query: {query}',
        'status': 'escalated',
        'message': 'A human agent will be assigned once the system is configured.',
    }


# ---- Pydantic models ----
class ConversationCreateOut(BaseModel):
    conversationId: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    role: str
    name: str
    team: Optional[str] = None
    status: str = 'active'
    permissions: List[str] = []


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class VerifyResponse(BaseModel):
    valid: bool
    user: Optional[UserOut] = None


class SendMessageIn(BaseModel):
    conversationId: Optional[str] = None
    message: str
    userId: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ChatResponseOut(BaseModel):
    id: str
    conversationId: str
    agentResponse: str
    status: str
    confidence: Optional[float] = None
    ticketId: Optional[str] = None
    agentAssigned: Optional[str] = None


class EscalationIn(BaseModel):
    conversation_id: str
    reason: Optional[str] = None
    recent_messages: Optional[List[Dict[str, Any]]] = None


class TicketOut(BaseModel):
    id: str
    conversation_id: Optional[str]
    user_id: str
    status: Optional[str]


class TicketUpdateIn(BaseModel):
    status: Optional[str] = None
    agentNotes: Optional[str] = None
    priority: Optional[int] = None
    resolutionNotes: Optional[str] = None
    agentAssigned: Optional[str] = None


class EscalateTicketIn(BaseModel):
    reason: Optional[str] = None


class AssignTicketIn(BaseModel):
    agentId: str


class TicketSubmitIn(BaseModel):
    message: str
    userId: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class TicketFeedbackIn(BaseModel):
    rating: int
    comment: Optional[str] = None


class TicketNotesIn(BaseModel):
    notes: str


class QueueResolveIn(BaseModel):
    resolutionNotes: str


class TicketMessageIn(BaseModel):
    sender_type: Optional[str] = None
    body: str
    metadata: Optional[Dict[str, Any]] = None


class TicketTypingIn(BaseModel):
    is_typing: bool


class AdminUserCreateIn(BaseModel):
    email: str
    name: str
    role: UserRole
    password: str
    team: Optional[str] = None


class AdminUserUpdateIn(BaseModel):
    name: Optional[str] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None
    team: Optional[str] = None


class AdminRoleUpdateIn(BaseModel):
    role: UserRole


class ConfigUpdateIn(BaseModel):
    maintenanceMode: Optional[bool] = None
    maxConcurrentConversations: Optional[int] = None
    analyticsExportTarget: Optional[str] = None


class AnalyticsExportIn(BaseModel):
    destination: Optional[str] = 'databricks'
    format: Optional[str] = 'json'


# ---- Endpoints ----
@app.post('/auth/login', response_model=AuthResponse)
async def auth_login(request: LoginRequest):
    user = AUTHORIZED_USERS.get(request.email)
    if not user or user.get('password') != request.password:
        raise HTTPException(status_code=401, detail='Invalid email or password')

    token = str(uuid.uuid4())
    auth_tokens[token] = {
        'id': user['id'],
        'email': user['email'],
        'role': user['role'],
        'name': user['name'],
        'team': user.get('team'),
        'permissions': ROLE_PERMISSIONS.get(UserRole(user['role']), []),
    }

    _log_audit('auth.login', actor=auth_tokens[token])

    return {
        'token': token,
        'user': auth_tokens[token],
    }


@app.get('/auth/verify', response_model=VerifyResponse)
async def auth_verify(authorization: Optional[str] = Header(None, alias='Authorization')):
    if not authorization or not authorization.startswith('Bearer '):
        return {'valid': False}
    token = authorization.split(' ', 1)[1]
    user = auth_tokens.get(token)
    if not user:
        return {'valid': False}
    return {'valid': True, 'user': user}


@app.post('/auth/refresh', response_model=AuthResponse)
async def auth_refresh(authorization: Optional[str] = Header(None, alias='Authorization')):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Invalid token')
    token = authorization.split(' ', 1)[1]
    user = auth_tokens.get(token)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid token')

    new_token = str(uuid.uuid4())
    auth_tokens[new_token] = user
    return {
        'token': new_token,
        'user': user,
    }


@app.post('/api/v1/tickets')
async def submit_ticket(
    req: TicketSubmitIn,
    current_user: Dict[str, Any] = Depends(require_role(UserRole.REQUESTOR, UserRole.REAL_AGENT, UserRole.PLATFORM_ADMIN)),
):
    user_id = req.userId or current_user['id']
    conv = conversation_service.create_conversation(user_id=user_id)
    conversation_service.add_message(
        conversation_id=conv['id'],
        sender_type='user',
        sender_id=user_id,
        content=req.message,
        metadata=str(req.metadata) if req.metadata else None,
    )

    result = crew.process_customer_query(
        query=req.message,
        conversation_context=None,
        requester_role=current_user.get('role'),
    )
    if 'error' in result:
        raise HTTPException(status_code=500, detail=result['error'])

    ticket = ticket_service.create_ticket(conversation_id=conv['id'], user_id=user_id, payload=result)
    ticket_service.add_message(
        ticket_id=ticket['id'],
        sender_id=user_id,
        sender_role=current_user['role'],
        sender_type='requestor',
        body=req.message,
        metadata=req.metadata,
    )
    ticket_service.add_message(
        ticket_id=ticket['id'],
        sender_id='ai-agent',
        sender_role='SYSTEM',
        sender_type='ai_agent',
        body=result.get('response', ''),
        metadata={'confidence': result.get('confidence')},
    )
    _log_audit('ticket.submit', actor=current_user, target=ticket['id'])
    return ticket


@app.get('/api/v1/tickets/mine')
async def list_my_tickets(current_user: Dict[str, Any] = Depends(require_role(UserRole.REQUESTOR))):
    return ticket_service.list_tickets(user_id=current_user['id'])


@app.get('/api/v1/tickets/{ticket_id}')
async def get_ticket_v1(
    ticket_id: str,
    current_user: Dict[str, Any] = Depends(require_role(UserRole.REQUESTOR, UserRole.REAL_AGENT, UserRole.PLATFORM_ADMIN)),
):
    ticket = _find_ticket_or_404(ticket_id)
    if current_user['role'] == UserRole.REQUESTOR.value and ticket.get('user_id') != current_user['id']:
        raise HTTPException(status_code=403, detail='Insufficient permissions')
    return ticket


@app.post('/api/v1/tickets/{ticket_id}/feedback')
async def submit_feedback(
    ticket_id: str,
    feedback: TicketFeedbackIn,
    current_user: Dict[str, Any] = Depends(require_role(UserRole.REQUESTOR)),
):
    ticket = _find_ticket_or_404(ticket_id)
    if ticket.get('user_id') != current_user['id']:
        raise HTTPException(status_code=403, detail='Insufficient permissions')
    updated = ticket_service.update_ticket(ticket_id, {'feedback': feedback.dict()})
    _log_audit('ticket.feedback', actor=current_user, target=ticket_id, details=feedback.dict())
    return updated


@app.get('/api/v1/queue')
async def get_queue(current_user: Dict[str, Any] = Depends(require_role(UserRole.REAL_AGENT, UserRole.PLATFORM_ADMIN))):
    tickets = ticket_service.list_tickets(status='escalated')
    _log_audit('queue.view', actor=current_user, details={'count': len(tickets)})
    return tickets


@app.post('/api/v1/queue/{ticket_id}/accept')
async def accept_queue_ticket(
    ticket_id: str,
    current_user: Dict[str, Any] = Depends(require_role(UserRole.REAL_AGENT)),
):
    ticket = _find_ticket_or_404(ticket_id)
    updated = ticket_service.accept_escalation(ticket_id=ticket_id, agent_id=current_user['id'])
    if not updated:
        raise HTTPException(status_code=404, detail='Ticket not found')
    status_event = {
        'type': 'escalation.accepted',
        'ticket_id': ticket_id,
        'state': updated.get('conversationState'),
        'accepted_by': current_user['id'],
        'accepted_at': updated.get('acceptedAt'),
    }
    await ws_manager.broadcast(ticket_id, status_event)
    _log_audit('queue.accept', actor=current_user, target=ticket.get('id'))
    return updated


@app.post('/api/v1/queue/{ticket_id}/resolve')
async def resolve_queue_ticket(
    ticket_id: str,
    req: QueueResolveIn,
    current_user: Dict[str, Any] = Depends(require_role(UserRole.REAL_AGENT, UserRole.PLATFORM_ADMIN)),
):
    ticket = _find_ticket_or_404(ticket_id)
    updated = ticket_service.resolve_human_ticket(ticket_id=ticket_id, resolver_id=current_user['id'], resolution_notes=req.resolutionNotes)
    if not updated:
        raise HTTPException(status_code=404, detail='Ticket not found')
    status_event = {
        'type': 'ticket.status.changed',
        'ticket_id': ticket_id,
        'state': updated.get('conversationState'),
        'status': updated.get('status'),
    }
    await ws_manager.broadcast(ticket_id, status_event)
    _log_audit('queue.resolve', actor=current_user, target=ticket.get('id'))
    return updated


@app.get('/api/v1/customers/{customer_id}/history')
async def customer_history(
    customer_id: str,
    current_user: Dict[str, Any] = Depends(require_role(UserRole.REAL_AGENT, UserRole.PLATFORM_ADMIN)),
):
    history = conversation_service.get_user_conversations(customer_id)
    _log_audit('customer.history', actor=current_user, target=customer_id, details={'conversations': len(history)})
    return {'customerId': customer_id, 'conversations': history}


@app.put('/api/v1/tickets/{ticket_id}/notes')
async def add_ticket_notes(
    ticket_id: str,
    req: TicketNotesIn,
    current_user: Dict[str, Any] = Depends(require_role(UserRole.REAL_AGENT, UserRole.PLATFORM_ADMIN)),
):
    ticket = _find_ticket_or_404(ticket_id)
    updated = ticket_service.update_ticket(ticket_id, {'agentNotes': req.notes})
    _log_audit('ticket.notes', actor=current_user, target=ticket.get('id'))
    return updated


@app.post('/api/v1/tickets/{ticket_id}/escalate')
async def escalate_ticket_v1(
    ticket_id: str,
    escalation: EscalateTicketIn,
    current_user: Dict[str, Any] = Depends(require_role(UserRole.REAL_AGENT, UserRole.PLATFORM_ADMIN)),
):
    ticket = _find_ticket_or_404(ticket_id)
    escalation_session = ticket_service.request_escalation(
        ticket_id=ticket_id,
        reason=escalation.reason or 'manual_escalation',
        priority=ticket.get('priority', 3),
        ai_summary={
            'intent': ticket.get('category', 'general'),
            'attempted_actions': [],
            'resolution_attempts': 1,
            'last_ai_message': ticket.get('payload', {}).get('response', ''),
        },
    )
    updated = ticket_service.update_ticket(ticket_id, {
        'status': 'escalated',
        'conversationState': TicketState.ESCALATION_QUEUED.value,
        'agentNotes': escalation.reason,
        'escalatedBy': current_user['id'],
    })
    await ws_manager.broadcast(ticket_id, {
        'type': 'escalation.requested',
        'ticket_id': ticket_id,
        'state': TicketState.ESCALATION_QUEUED.value,
        'requested_at': escalation_session.get('requested_at') if escalation_session else None,
    })
    _log_audit('ticket.escalate', actor=current_user, target=ticket.get('id'))
    return updated


@app.get('/api/v1/tickets/{ticket_id}/handoff-context')
async def get_handoff_context(
    ticket_id: str,
    current_user: Dict[str, Any] = Depends(require_role(UserRole.REAL_AGENT, UserRole.PLATFORM_ADMIN)),
):
    ticket = _find_ticket_or_404(ticket_id)
    if current_user['role'] == UserRole.REAL_AGENT.value and ticket.get('agentAssigned') not in {None, current_user['id']}:
        raise HTTPException(status_code=403, detail='Insufficient permissions')

    handoff_context = ticket_service.get_handoff_context(ticket_id)
    if not handoff_context:
        raise HTTPException(status_code=404, detail='Handoff context not found')
    return handoff_context


@app.get('/api/v1/tickets/{ticket_id}/messages')
async def list_ticket_messages(
    ticket_id: str,
    current_user: Dict[str, Any] = Depends(require_role(UserRole.REQUESTOR, UserRole.REAL_AGENT, UserRole.PLATFORM_ADMIN)),
):
    ticket = _find_ticket_or_404(ticket_id)
    if not _can_access_ticket(ticket, current_user):
        raise HTTPException(status_code=403, detail='Insufficient permissions')
    return ticket_service.list_messages(ticket_id)


@app.post('/api/v1/tickets/{ticket_id}/messages')
async def create_ticket_message(
    ticket_id: str,
    req: TicketMessageIn,
    current_user: Dict[str, Any] = Depends(require_role(UserRole.REQUESTOR, UserRole.REAL_AGENT, UserRole.PLATFORM_ADMIN)),
):
    ticket = _find_ticket_or_404(ticket_id)
    if not _can_access_ticket(ticket, current_user):
        raise HTTPException(status_code=403, detail='Insufficient permissions')

    sender_type = _sender_type_for_role(current_user['role'])
    message = ticket_service.add_message(
        ticket_id=ticket_id,
        sender_id=current_user['id'],
        sender_role=current_user['role'],
        sender_type=sender_type,
        body=req.body,
        metadata=req.metadata,
    )
    if not message:
        raise HTTPException(status_code=404, detail='Ticket not found')

    event = {
        'type': 'chat.message.created',
        'ticket_id': ticket_id,
        'message': message,
    }
    await ws_manager.broadcast(ticket_id, event)
    return message


@app.websocket('/api/v1/ws/tickets/{ticket_id}')
async def ticket_chat_socket(ticket_id: str, websocket: WebSocket, token: str = Query(...)):
    user = auth_tokens.get(token)
    if not user:
        await websocket.close(code=1008)
        return

    ticket = ticket_service.get_ticket(ticket_id)
    if not ticket or not _can_access_ticket(ticket, user):
        await websocket.close(code=1008)
        return

    await ws_manager.connect(ticket_id, websocket)
    try:
        await websocket.send_json({
            'type': 'ticket.status.changed',
            'ticket_id': ticket_id,
            'state': ticket.get('conversationState', TicketState.OPEN.value),
            'status': ticket.get('status'),
        })

        while True:
            payload = await websocket.receive_json()
            event_type = payload.get('type')
            if event_type == 'chat.typing':
                await ws_manager.broadcast(ticket_id, {
                    'type': 'chat.typing',
                    'ticket_id': ticket_id,
                    'sender_type': _sender_type_for_role(user['role']),
                    'is_typing': bool(payload.get('is_typing', False)),
                })
            elif event_type == 'subscribe':
                await websocket.send_json({
                    'type': 'subscribed',
                    'ticket_id': ticket_id,
                    'role': user['role'],
                })
            elif event_type == 'ping':
                await websocket.send_json({'type': 'pong'})
    except WebSocketDisconnect:
        ws_manager.disconnect(ticket_id, websocket)
    except Exception:
        ws_manager.disconnect(ticket_id, websocket)
        try:
            await websocket.close(code=1011)
        except Exception:
            pass


@app.get('/api/v1/users')
async def list_users_v1(current_user: Dict[str, Any] = Depends(require_role(UserRole.PLATFORM_ADMIN))):
    users = [_public_user_record(user) for user in AUTHORIZED_USERS.values()]
    _log_audit('users.list', actor=current_user, details={'count': len(users)})
    return users


@app.post('/api/v1/users', response_model=UserOut)
async def create_user_v1(
    req: AdminUserCreateIn,
    current_user: Dict[str, Any] = Depends(require_role(UserRole.PLATFORM_ADMIN)),
):
    if req.email in AUTHORIZED_USERS:
        raise HTTPException(status_code=400, detail='User already exists')

    new_user = {
        'id': str(uuid.uuid4()),
        'email': req.email,
        'name': req.name,
        'role': req.role.value,
        'password': req.password,
        'team': req.team,
    }
    AUTHORIZED_USERS[req.email] = new_user
    _log_audit('users.create', actor=current_user, target=new_user['id'])
    return _public_user_record(new_user)


@app.put('/api/v1/users/{user_id}', response_model=UserOut)
async def update_user_v1(
    user_id: str,
    req: AdminUserUpdateIn,
    current_user: Dict[str, Any] = Depends(require_role(UserRole.PLATFORM_ADMIN)),
):
    user = _find_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    updates = req.dict(exclude_none=True)
    if 'role' in updates:
        updates['role'] = updates['role'].value
    user.update(updates)
    _log_audit('users.update', actor=current_user, target=user_id, details=updates)
    return _public_user_record(user)


@app.delete('/api/v1/users/{user_id}')
async def delete_user_v1(
    user_id: str,
    current_user: Dict[str, Any] = Depends(require_role(UserRole.PLATFORM_ADMIN)),
):
    user = _find_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    if user['email'] == current_user['email']:
        raise HTTPException(status_code=400, detail='Cannot delete currently logged-in admin')

    AUTHORIZED_USERS.pop(user['email'])
    _log_audit('users.delete', actor=current_user, target=user_id)
    return {'deleted': True, 'id': user_id}


@app.get('/api/v1/audit-logs')
async def get_audit_logs_v1(current_user: Dict[str, Any] = Depends(require_role(UserRole.PLATFORM_ADMIN))):
    return audit_logs[-200:]


@app.get('/api/v1/system/health')
async def get_system_health_v1(current_user: Dict[str, Any] = Depends(require_role(UserRole.PLATFORM_ADMIN))):
    return {
        'api': 'healthy',
        'orchestration': 'healthy',
        'database': 'healthy',
        'queue': 'healthy',
        'lastUpdated': datetime.utcnow().isoformat(),
        'config': system_config,
    }


@app.put('/api/v1/config')
async def update_config_v1(
    req: ConfigUpdateIn,
    current_user: Dict[str, Any] = Depends(require_role(UserRole.PLATFORM_ADMIN)),
):
    updates = req.dict(exclude_none=True)
    system_config.update(updates)
    _log_audit('config.update', actor=current_user, details=updates)
    return system_config


@app.post('/api/v1/analytics/export')
async def export_analytics_v1(
    req: AnalyticsExportIn,
    current_user: Dict[str, Any] = Depends(require_role(UserRole.PLATFORM_ADMIN)),
):
    payload = {
        'exportedAt': datetime.utcnow().isoformat(),
        'destination': req.destination,
        'format': req.format,
        'recordCount': len(ticket_service.list_tickets()),
        'status': 'queued',
    }
    _log_audit('analytics.export', actor=current_user, details=payload)
    return payload


@app.get('/users')
async def list_users_compat(current_user: Dict[str, Any] = Depends(require_role(UserRole.PLATFORM_ADMIN))):
    return [_public_user_record(user) for user in AUTHORIZED_USERS.values()]


@app.put('/users/{user_id}/role')
async def update_user_role_compat(
    user_id: str,
    update: AdminRoleUpdateIn,
    current_user: Dict[str, Any] = Depends(require_role(UserRole.PLATFORM_ADMIN)),
):
    user = _find_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    user['role'] = update.role.value
    _log_audit('users.role.update', actor=current_user, target=user_id, details={'role': update.role.value})
    return _public_user_record(user)


@app.get('/system-health')
async def system_health_compat(current_user: Dict[str, Any] = Depends(require_role(UserRole.PLATFORM_ADMIN, UserRole.REAL_AGENT))):
    return {
        'api': 'healthy',
        'orchestration': 'healthy',
        'database': 'healthy',
        'queue': 'healthy',
        'lastUpdated': datetime.utcnow().isoformat(),
    }


@app.get('/analytics/dashboard')
async def analytics_dashboard(current_user: Dict[str, Any] = Depends(require_role(UserRole.PLATFORM_ADMIN, UserRole.REAL_AGENT))):
    tickets = ticket_service.list_tickets()
    resolved = [t for t in tickets if t.get('status') == 'resolved']
    escalated = [t for t in tickets if t.get('status') == 'escalated']
    return {
        'ticketMetrics': {
            'total': len(tickets),
            'resolved': len(resolved),
            'escalated': len(escalated),
            'avgResolutionTime': 12,
        },
        'agentMetrics': {
            'activeAgents': len([u for u in AUTHORIZED_USERS.values() if u.get('role') == UserRole.REAL_AGENT.value]),
            'avgHandleTime': 8,
            'csat': 4.3,
        },
        'trends': {
            'ticketsPerHour': [1, 2, 3, 2, 4, 5],
            'resolutionRatePerDay': [70, 72, 75, 74, 78, 79, 81],
        },
    }


@app.get('/analytics/tickets')
async def analytics_tickets(current_user: Dict[str, Any] = Depends(require_role(UserRole.PLATFORM_ADMIN, UserRole.REAL_AGENT))):
    return {
        'byStatus': {
            'resolved': len([t for t in ticket_service.list_tickets() if t.get('status') == 'resolved']),
            'escalated': len([t for t in ticket_service.list_tickets() if t.get('status') == 'escalated']),
            'in_progress': len([t for t in ticket_service.list_tickets() if t.get('status') == 'in_progress']),
        }
    }


@app.get('/analytics/agents')
async def analytics_agents(agentId: Optional[str] = None, current_user: Dict[str, Any] = Depends(require_role(UserRole.PLATFORM_ADMIN, UserRole.REAL_AGENT))):
    all_tickets = ticket_service.list_tickets()
    if agentId:
        all_tickets = [t for t in all_tickets if t.get('agentAssigned') == agentId]
    return {
        'agentId': agentId,
        'ticketsHandled': len(all_tickets),
        'avgHandleTime': 8,
        'csat': 4.2,
    }


@app.post('/chat/conversations', response_model=ConversationCreateOut)
async def create_conversation(user_id: Optional[str] = None):
    conv = conversation_service.create_conversation(user_id=user_id or 'guest')
    return {'conversationId': conv['id']}


@app.post('/chat', response_model=ChatResponseOut)
async def send_message(msg: SendMessageIn):
    try:
        # Ensure conversation exists
        conv_id = msg.conversationId
        if not conv_id:
            conv = conversation_service.create_conversation(user_id=msg.userId or 'guest')
            conv_id = conv['id']

        user_id = msg.userId or 'guest'
        conversation_service.add_message(
            conversation_id=conv_id,
            sender_type='user',
            sender_id=user_id,
            content=msg.message,
            metadata=str(msg.metadata) if msg.metadata else None,
        )

        # Process via crew; AgenticCustomerSupport handles mock fallback when no LLM key is configured
        result = crew.process_customer_query(query=msg.message, conversation_context=None)
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])

        ticket_status = 'escalated' if result.get('requires_escalation') else 'resolved'
        ticket = ticket_service.create_ticket(conversation_id=conv_id, user_id=user_id, payload=result)
        if result.get('requires_escalation'):
            incident = servicenow.create_incident(
                short_description=f"Escalation for {ticket['id']}",
                description=str(result),
                urgency=result.get('urgency', 3),
                caller=user_id,
            )
            ticket_service.update_ticket(ticket['id'], {'servicenow_id': incident['incident_id']})

        return ChatResponseOut(
            id=str(uuid.uuid4()),
            conversationId=conv_id,
            agentResponse=result.get('response', 'No response available'),
            status=ticket_status,
            confidence=result.get('confidence'),
            ticketId=ticket['id'],
            agentAssigned=result.get('agentAssigned'),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/escalate')
async def escalate(req: EscalationIn):
    try:
        history = []
        if req.recent_messages:
            for m in req.recent_messages:
                history.append({'sender': m.get('sender', 'user'), 'content': m.get('content', '')})
        if USE_MOCK_CREW:
            result = _mock_escalation_response(query=history[-1]['content'] if history else '', conversation_history=history)
        else:
            result = crew.escalate_to_human(query=history[-1]['content'] if history else '', conversation_history=history)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/chat/{conversation_id}')
async def get_conversation(conversation_id: str):
    conv = conversation_service.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail='Conversation not found')
    return conv


@app.get('/tickets')
async def list_tickets(page: int = 1, limit: int = 20, status: Optional[str] = None, user_id: Optional[str] = None):
    tickets = ticket_service.list_tickets(user_id=user_id, status=status)
    total = len(tickets)
    start = (page - 1) * limit
    end = start + limit
    return {
        'data': tickets[start:end],
        'pagination': {
            'page': page,
            'limit': limit,
            'total': total,
        },
    }


@app.get('/tickets/{ticket_id}', response_model=TicketOut)
async def get_ticket(ticket_id: str):
    t = ticket_service.get_ticket(ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail='Ticket not found')
    return t


@app.patch('/tickets/{ticket_id}')
async def update_ticket(ticket_id: str, updates: TicketUpdateIn):
    ticket = ticket_service.update_ticket(ticket_id, updates.dict(exclude_none=True))
    if not ticket:
        raise HTTPException(status_code=404, detail='Ticket not found')
    return ticket


@app.post('/tickets/{ticket_id}/escalate')
async def escalate_ticket(ticket_id: str, escalation: EscalateTicketIn):
    ticket = ticket_service.update_ticket(ticket_id, {
        'status': 'escalated',
        'agentNotes': escalation.reason,
    })
    if not ticket:
        raise HTTPException(status_code=404, detail='Ticket not found')
    return ticket


@app.post('/tickets/{ticket_id}/assign')
async def assign_ticket(ticket_id: str, assignment: AssignTicketIn):
    ticket = ticket_service.update_ticket(ticket_id, {'agentAssigned': assignment.agentId})
    if not ticket:
        raise HTTPException(status_code=404, detail='Ticket not found')
    return ticket


@app.get('/health')
async def health():
    return {'status': 'ok'}
