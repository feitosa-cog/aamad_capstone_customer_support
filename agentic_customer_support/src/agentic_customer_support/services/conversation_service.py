import uuid
from typing import List, Dict, Any, Optional
from .db import SessionLocal, init_db
from .models import Conversation, Message

init_db()

class ConversationService:
    def __init__(self):
        self._Session = SessionLocal

    def create_conversation(self, user_id: str, title: Optional[str] = None) -> Dict[str, Any]:
        session = self._Session()
        conv_id = str(uuid.uuid4())
        conv = Conversation(id=conv_id, user_id=user_id, title=title or '', status='active')
        session.add(conv)
        session.commit()
        session.refresh(conv)
        session.close()
        return {'id': conv.id, 'user_id': conv.user_id, 'title': conv.title}

    def add_message(self, conversation_id: str, sender_type: str, sender_id: str, content: str, metadata: Optional[str] = None) -> Dict[str, Any]:
        session = self._Session()
        msg = Message(id=str(uuid.uuid4()), conversation_id=conversation_id, sender_type=sender_type, sender_id=sender_id, content=content, metadata=metadata)
        session.add(msg)
        session.commit()
        session.refresh(msg)
        session.close()
        return {'id': msg.id, 'conversation_id': msg.conversation_id, 'content': msg.content}

    def get_conversation(self, conversation_id: str) -> Dict[str, Any]:
        session = self._Session()
        conv = session.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv:
            session.close()
            return {}
        messages = [ {'id': m.id, 'sender_type': m.sender_type.name, 'sender_id': m.sender_id, 'content': m.content, 'created_at': m.created_at.isoformat()} for m in conv.messages ]
        session.close()
        return {'id': conv.id, 'user_id': conv.user_id, 'title': conv.title, 'messages': messages}
