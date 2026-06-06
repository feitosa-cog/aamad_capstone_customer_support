import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

class TicketService:
    """Simple in-memory Ticket service for MVP"""

    def __init__(self):
        self._tickets: Dict[str, Dict[str, Any]] = {}
        self._messages: Dict[str, List[Dict[str, Any]]] = {}
        self._message_sequence: Dict[str, int] = {}
        self._escalation_sessions: Dict[str, Dict[str, Any]] = {}
        self._ticket_participants: Dict[str, Dict[str, Dict[str, Any]]] = {}

    def _now(self) -> str:
        return datetime.utcnow().isoformat()

    def _init_ticket_collections(self, ticket_id: str, user_id: str) -> None:
        self._messages.setdefault(ticket_id, [])
        self._message_sequence.setdefault(ticket_id, 0)
        self._ticket_participants.setdefault(ticket_id, {})
        self.add_participant(ticket_id, user_id=user_id, role='REQUESTOR')

    def _next_message_sequence(self, ticket_id: str) -> int:
        next_sequence = self._message_sequence.get(ticket_id, 0) + 1
        self._message_sequence[ticket_id] = next_sequence
        return next_sequence

    def _infer_sender_role(self, sender_type: str) -> str:
        normalized = (sender_type or '').lower()
        if normalized == 'requestor':
            return 'REQUESTOR'
        if normalized == 'real_agent':
            return 'REAL_AGENT'
        if normalized in {'ai_agent', 'agent'}:
            return 'SYSTEM'
        return 'SYSTEM'

    def create_ticket(self, conversation_id: str, user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        ticket_id = str(uuid.uuid4())
        status = 'escalated' if payload.get('requires_escalation') else 'resolved'
        created_at = self._now()
        conversation_state = 'ESCALATION_QUEUED' if payload.get('requires_escalation') else 'OPEN'
        ticket = {
            'id': ticket_id,
            'conversation_id': conversation_id,
            'user_id': user_id,
            'status': status,
            'conversationState': conversation_state,
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
        self._init_ticket_collections(ticket_id, user_id)
        self.add_message(
            ticket_id=ticket_id,
            sender_id='system',
            sender_role='SYSTEM',
            sender_type='system',
            body='Ticket created and routed to AI support.',
            metadata={'event': 'ticket.created'},
        )
        if payload.get('requires_escalation'):
            self.request_escalation(
                ticket_id=ticket_id,
                reason='ai_requested_human_handoff',
                priority=payload.get('urgency', 3),
                ai_summary={
                    'intent': payload.get('category', 'general'),
                    'attempted_actions': payload.get('attempted_actions', []),
                    'resolution_attempts': payload.get('resolution_attempts', 1),
                    'last_ai_message': payload.get('response', ''),
                },
            )
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
        ticket['updatedAt'] = self._now()
        return ticket

    def add_participant(self, ticket_id: str, user_id: str, role: str) -> Optional[Dict[str, Any]]:
        if ticket_id not in self._tickets:
            return None
        participants = self._ticket_participants.setdefault(ticket_id, {})
        existing = participants.get(user_id)
        if existing:
            return existing

        participant = {
            'ticket_id': ticket_id,
            'user_id': user_id,
            'role': role,
            'joined_at': self._now(),
            'left_at': None,
        }
        participants[user_id] = participant
        return participant

    def list_participants(self, ticket_id: str) -> List[Dict[str, Any]]:
        participants = self._ticket_participants.get(ticket_id, {})
        return list(participants.values())

    def request_escalation(
        self,
        ticket_id: str,
        reason: str,
        priority: int,
        ai_summary: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        ticket = self._tickets.get(ticket_id)
        if not ticket:
            return None

        requested_at = self._now()
        escalation = {
            'id': str(uuid.uuid4()),
            'ticket_id': ticket_id,
            'requested_at': requested_at,
            'accepted_at': None,
            'accepted_by': None,
            'queue_wait_seconds': None,
            'status': 'ESCALATION_QUEUED',
            'reason': reason,
            'priority': priority,
            'ai_summary': ai_summary or {},
        }
        self._escalation_sessions[ticket_id] = escalation
        self.update_ticket(ticket_id, {
            'status': 'escalated',
            'conversationState': 'ESCALATION_QUEUED',
        })
        return escalation

    def accept_escalation(self, ticket_id: str, agent_id: str) -> Optional[Dict[str, Any]]:
        ticket = self._tickets.get(ticket_id)
        if not ticket:
            return None

        escalation = self._escalation_sessions.get(ticket_id)
        accepted_at = self._now()
        if escalation:
            requested_at = datetime.fromisoformat(escalation['requested_at'])
            accepted_dt = datetime.fromisoformat(accepted_at)
            escalation['accepted_at'] = accepted_at
            escalation['accepted_by'] = agent_id
            escalation['queue_wait_seconds'] = max(int((accepted_dt - requested_at).total_seconds()), 0)
            escalation['status'] = 'HUMAN_ACTIVE'

        self.add_participant(ticket_id, user_id=agent_id, role='REAL_AGENT')
        return self.update_ticket(ticket_id, {
            'status': 'in_progress',
            'conversationState': 'HUMAN_ACTIVE',
            'agentAssigned': agent_id,
            'acceptedAt': accepted_at,
        })

    def resolve_human_ticket(self, ticket_id: str, resolver_id: str, resolution_notes: str) -> Optional[Dict[str, Any]]:
        ticket = self._tickets.get(ticket_id)
        if not ticket:
            return None

        escalation = self._escalation_sessions.get(ticket_id)
        if escalation:
            escalation['status'] = 'HUMAN_RESOLVED'

        return self.update_ticket(ticket_id, {
            'status': 'resolved',
            'conversationState': 'HUMAN_RESOLVED',
            'resolutionNotes': resolution_notes,
            'resolvedBy': resolver_id,
            'resolvedAt': self._now(),
        })

    def close_ticket(self, ticket_id: str, closed_by: str) -> Optional[Dict[str, Any]]:
        ticket = self._tickets.get(ticket_id)
        if not ticket:
            return None
        return self.update_ticket(ticket_id, {
            'conversationState': 'CLOSED',
            'closedBy': closed_by,
            'closedAt': self._now(),
        })

    def add_message(
        self,
        ticket_id: str,
        sender_id: str,
        sender_role: str,
        sender_type: str,
        body: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        if ticket_id not in self._tickets:
            return None

        created_at = self._now()
        message = {
            'id': str(uuid.uuid4()),
            'ticket_id': ticket_id,
            'sequence': self._next_message_sequence(ticket_id),
            'sender_id': sender_id,
            'sender_role': sender_role,
            'sender_type': sender_type,
            'body': body,
            'created_at': created_at,
            'metadata': metadata or {},
        }
        self._messages.setdefault(ticket_id, []).append(message)
        self.add_participant(ticket_id, user_id=sender_id, role=self._infer_sender_role(sender_type))
        self.update_ticket(ticket_id, {'lastMessageAt': created_at})
        return message

    def list_messages(self, ticket_id: str) -> List[Dict[str, Any]]:
        messages = self._messages.get(ticket_id, [])
        return sorted(messages, key=lambda m: (m['created_at'], m['sequence']))

    def get_escalation_session(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        return self._escalation_sessions.get(ticket_id)

    def get_handoff_context(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        ticket = self._tickets.get(ticket_id)
        if not ticket:
            return None

        escalation = self._escalation_sessions.get(ticket_id) or {
            'requested_at': None,
            'reason': ticket.get('agentNotes') or 'manual_escalation',
            'priority': ticket.get('priority', 3),
            'queue_wait_seconds': None,
        }
        payload = ticket.get('payload', {})
        ai_summary = (escalation.get('ai_summary') or {
            'intent': payload.get('category', 'general'),
            'attempted_actions': payload.get('attempted_actions', []),
            'resolution_attempts': payload.get('resolution_attempts', 0),
            'last_ai_message': payload.get('response', ''),
        })

        user_id = ticket.get('user_id')
        customer_tickets = [
            t['id']
            for t in self.list_tickets(user_id=user_id)
            if t['id'] != ticket_id
        ]
        customer_tickets = customer_tickets[-5:]

        return {
            'ticket_id': ticket_id,
            'escalation': {
                'requested_at': escalation.get('requested_at'),
                'reason': escalation.get('reason') or 'manual_escalation',
                'priority': escalation.get('priority', ticket.get('priority', 3)),
                'queue_wait_seconds': escalation.get('queue_wait_seconds'),
            },
            'ai_summary': {
                'intent': ai_summary.get('intent', payload.get('category', 'general')),
                'attempted_actions': ai_summary.get('attempted_actions', []),
                'resolution_attempts': ai_summary.get('resolution_attempts', 0),
                'last_ai_message': ai_summary.get('last_ai_message', payload.get('response', '')),
            },
            'customer_context': {
                'user_id': user_id,
                'open_ticket_count': len([t for t in self.list_tickets(user_id=user_id) if t.get('status') != 'resolved']),
                'recent_ticket_ids': customer_tickets,
            },
        }
