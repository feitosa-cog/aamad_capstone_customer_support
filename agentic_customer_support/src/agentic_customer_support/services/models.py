from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, Enum
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
import enum

Base = declarative_base()

class ConversationStatus(enum.Enum):
    active = "active"
    resolved = "resolved"
    escalated = "escalated"

class TicketStatus(enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    escalated = "escalated"

class MessageSender(enum.Enum):
    user = "user"
    agent = "agent"
    system = "system"

class Conversation(Base):
    __tablename__ = 'conversations'
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), nullable=False)
    title = Column(String(255))
    status = Column(Enum(ConversationStatus), default=ConversationStatus.active)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    messages = relationship('Message', back_populates='conversation')
    tickets = relationship('Ticket', back_populates='conversation')

class Ticket(Base):
    __tablename__ = 'tickets'
    id = Column(String(36), primary_key=True)
    conversation_id = Column(String(36), ForeignKey('conversations.id'))
    user_id = Column(String(36), nullable=False)
    type = Column(String(50))
    status = Column(Enum(TicketStatus), default=TicketStatus.open)
    servicenow_id = Column(String(100))
    resolution = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    conversation = relationship('Conversation', back_populates='tickets')

class Message(Base):
    __tablename__ = 'messages'
    id = Column(String(36), primary_key=True)
    conversation_id = Column(String(36), ForeignKey('conversations.id'))
    sender_type = Column(Enum(MessageSender))
    sender_id = Column(String(100))
    content = Column(Text)
    metadata_text = Column('metadata', Text)
    created_at = Column(DateTime, server_default=func.now())
    conversation = relationship('Conversation', back_populates='messages')
