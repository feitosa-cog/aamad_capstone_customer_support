import uuid
from typing import Dict, Any

class TicketService:
    """Simple in-memory Ticket service for MVP"""

    def __init__(self):
        self._tickets: Dict[str, Dict[str, Any]] = {}

    def create_ticket(self, conversation_id: str, user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        ticket_id = str(uuid.uuid4())
        ticket = {
            'id': ticket_id,
            'conversation_id': conversation_id,
            'user_id': user_id,
            'status': 'open',
            'payload': payload
        }
        self._tickets[ticket_id] = ticket
        return ticket

    def get_ticket(self, ticket_id: str) -> Dict[str, Any]:
        return self._tickets.get(ticket_id)

    def list_tickets(self, user_id: str = None):
        if user_id:
            return [t for t in self._tickets.values() if t['user_id'] == user_id]
        return list(self._tickets.values())

    def update_ticket(self, ticket_id: str, updates: Dict[str, Any]):
        if ticket_id not in self._tickets:
            return None
        self._tickets[ticket_id].update(updates)
        return self._tickets[ticket_id]
