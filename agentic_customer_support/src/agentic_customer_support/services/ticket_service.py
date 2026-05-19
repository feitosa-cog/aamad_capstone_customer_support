import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

class TicketService:
    """Simple in-memory Ticket service for MVP"""

    def __init__(self):
        self._tickets: Dict[str, Dict[str, Any]] = {}

    def create_ticket(self, conversation_id: str, user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        ticket_id = str(uuid.uuid4())
        status = 'escalated' if payload.get('requires_escalation') else 'resolved'
        created_at = datetime.utcnow().isoformat()
        ticket = {
            'id': ticket_id,
            'conversation_id': conversation_id,
            'user_id': user_id,
            'status': status,
            'payload': payload,
            'createdAt': created_at,
            'updatedAt': created_at,
            'transcript': payload.get('transcript', []),
            'agentNotes': payload.get('handoff_notes', ''),
            'priority': payload.get('urgency', 3),
            'category': payload.get('category', 'general'),
            'resolutionNotes': payload.get('resolutionNotes', ''),
            'agentAssigned': payload.get('agentAssigned'),
            'servicenow_id': payload.get('servicenow_id'),
        }
        self._tickets[ticket_id] = ticket
        return ticket

    def get_ticket(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        ticket = self._tickets.get(ticket_id)
        if not ticket:
            return None
        return ticket

    def list_tickets(self, user_id: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        tickets = list(self._tickets.values())
        if user_id:
            tickets = [t for t in tickets if t['user_id'] == user_id]
        if status:
            tickets = [t for t in tickets if t.get('status') == status]
        return tickets

    def update_ticket(self, ticket_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        ticket = self._tickets.get(ticket_id)
        if not ticket:
            return None
        ticket.update(updates)
        ticket['updatedAt'] = datetime.utcnow().isoformat()
        return ticket
