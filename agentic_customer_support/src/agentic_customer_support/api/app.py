from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import uuid

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
    'admin@example.com': {
        'id': 'admin-1',
        'email': 'admin@example.com',
        'role': 'admin',
        'name': 'Admin User',
        'password': 'password123',
    }
}

auth_tokens: Dict[str, Dict[str, Any]] = {}


def _mock_crew_response(query: str, conversation_context: Optional[str] = None) -> Dict[str, Any]:
    return {
        'response': 'This is a mock response because OPENAI_API_KEY is not configured.',
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
    }

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

        # Process via crew
        if USE_MOCK_CREW:
            result = _mock_crew_response(query=msg.message, conversation_context=None)
        else:
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
