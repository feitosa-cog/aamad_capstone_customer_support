from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from agentic_customer_support.crew import AgenticCustomerSupport
from agentic_customer_support.services.ticket_service import TicketService
from agentic_customer_support.services.conversation_service import ConversationService
from agentic_customer_support.services.servicenow_service import ServiceNowService

app = FastAPI(title="Agentic Customer Support API")

# Services
crew = AgenticCustomerSupport()
ticket_service = TicketService()
conversation_service = ConversationService()
servicenow = ServiceNowService()


# ---- Pydantic models ----
class MessageIn(BaseModel):
    user_id: str
    content: str
    conversation_id: Optional[str] = None


class MessageOut(BaseModel):
    response: str
    category: Optional[str]
    urgency: Optional[int]
    requires_escalation: Optional[bool]
    handoff_notes: Optional[str]


class EscalationIn(BaseModel):
    conversation_id: str
    reason: Optional[str] = None
    recent_messages: Optional[List[MessageIn]] = None


class TicketOut(BaseModel):
    id: str
    conversation_id: Optional[str]
    user_id: str
    status: Optional[str]


# ---- Endpoints ----
@app.post('/chat', response_model=MessageOut)
async def send_message(msg: MessageIn):
    try:
        # Ensure conversation exists
        conv_id = msg.conversation_id
        if not conv_id:
            conv = conversation_service.create_conversation(user_id=msg.user_id)
            conv_id = conv['id']

        # Store incoming message
        conversation_service.add_message(conversation_id=conv_id, sender_type='user', sender_id=msg.user_id, content=msg.content)

        # Process via crew
        result = crew.process_customer_query(query=msg.content, conversation_context=None)
        if 'error' in result:
            raise HTTPException(status_code=500, detail=result['error'])

        # Optionally create a ticket if escalated
        if result.get('requires_escalation'):
            ticket = ticket_service.create_ticket(conversation_id=conv_id, user_id=msg.user_id, payload=result)
            # create a ServiceNow incident stub
            incident = servicenow.create_incident(short_description=f"Escalation for {ticket['id']}", description=str(result), urgency=result.get('urgency', 3))
            ticket_service.update_ticket(ticket['id'], {'servicenow_id': incident['incident_id']})

        return MessageOut(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/escalate')
async def escalate(req: EscalationIn):
    try:
        history = []
        if req.recent_messages:
            for m in req.recent_messages:
                history.append({'sender': m.user_id, 'content': m.content})
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


@app.get('/tickets', response_model=List[TicketOut])
async def list_tickets(user_id: Optional[str] = None):
    tickets = ticket_service.list_tickets(user_id=user_id)
    return tickets


@app.get('/tickets/{ticket_id}', response_model=TicketOut)
async def get_ticket(ticket_id: str):
    t = ticket_service.get_ticket(ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail='Ticket not found')
    return t


@app.get('/health')
async def health():
    return {'status': 'ok'}
