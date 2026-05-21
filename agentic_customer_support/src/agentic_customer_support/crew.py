import os
from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import Optional, Callable, Tuple
import json


@CrewBase
class AgenticCustomerSupport():
    """Agentic Customer Support System - Multi-agent crew for handling customer inquiries"""

    agents: list[BaseAgent]
    tasks: list[Task]

    # ==================== TIER 1: ROUTER AGENTS ====================
    
    @agent
    def triage_agent(self) -> Agent:
        """Routes incoming customer queries to appropriate specialist"""
        return Agent(
            config=self.agents_config['triage_agent'],  # type: ignore[index]
            verbose=True
        )

    @agent
    def handoff_agent(self) -> Agent:
        """Handles escalation to human support with context preservation"""
        return Agent(
            config=self.agents_config['handoff_agent'],  # type: ignore[index]
            verbose=True
        )

    # ==================== TIER 2: DOMAIN SPECIALISTS ====================
    
    @agent
    def order_specialist(self) -> Agent:
        """Handles order-related inquiries"""
        return Agent(
            config=self.agents_config['order_specialist'],  # type: ignore[index]
            verbose=True
        )

    @agent
    def product_specialist(self) -> Agent:
        """Handles product information requests"""
        return Agent(
            config=self.agents_config['product_specialist'],  # type: ignore[index]
            verbose=True
        )

    @agent
    def returns_specialist(self) -> Agent:
        """Handles returns and refund processing"""
        return Agent(
            config=self.agents_config['returns_specialist'],  # type: ignore[index]
            verbose=True
        )

    @agent
    def consumer_specialist(self) -> Agent:
        """Handles account and billing issues"""
        return Agent(
            config=self.agents_config['consumer_specialist'],  # type: ignore[index]
            verbose=True
        )

    @agent
    def it_specialist(self) -> Agent:
        """Handles internal IT incidents"""
        return Agent(
            config=self.agents_config['it_specialist'],  # type: ignore[index]
            verbose=True
        )

    # ==================== TASKS ====================
    
    @task
    def triage_task(self) -> Task:
        """Classify and route incoming customer query"""
        return Task(
            config=self.tasks_config['triage_task'],  # type: ignore[index]
            agent=self.triage_agent()
        )

    @task
    def order_task(self) -> Task:
        """Handle order-related inquiry"""
        return Task(
            config=self.tasks_config['order_task'],  # type: ignore[index]
            agent=self.order_specialist()
        )

    @task
    def product_task(self) -> Task:
        """Handle product information request"""
        return Task(
            config=self.tasks_config['product_task'],  # type: ignore[index]
            agent=self.product_specialist()
        )

    @task
    def returns_task(self) -> Task:
        """Handle returns and refund request"""
        return Task(
            config=self.tasks_config['returns_task'],  # type: ignore[index]
            agent=self.returns_specialist()
        )

    @task
    def account_task(self) -> Task:
        """Handle account and billing inquiry"""
        return Task(
            config=self.tasks_config['account_task'],  # type: ignore[index]
            agent=self.consumer_specialist()
        )

    @task
    def it_task(self) -> Task:
        """Handle IT incident"""
        return Task(
            config=self.tasks_config['it_task'],  # type: ignore[index]
            agent=self.it_specialist()
        )

    @task
    def handoff_task(self) -> Task:
        """Prepare escalation to human support"""
        return Task(
            config=self.tasks_config['handoff_task'],  # type: ignore[index]
            agent=self.handoff_agent()
        )

    # ==================== CREW CONFIGURATION ====================

    @crew
    def crew(self) -> Crew:
        """Creates the Agentic Customer Support crew"""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )

    # ==================== PUBLIC INTERFACE ====================

    def process_customer_query(self, query: str, conversation_context: Optional[str] = None) -> dict:
        """
        Process a customer query through the support system.
        
        Args:
            query: Customer's input message
            conversation_context: Previous conversation history (optional)
            
        Returns:
            dict with:
            - response: AI-generated response
            - category: Issue category (order, product, returns, account, it)
            - urgency: Urgency level (1-5)
            - requires_escalation: Boolean indicating if human handoff needed
            - handoff_notes: Notes for human agent if escalated
        """
        if not self._has_llm_credentials():
            return self._mock_process_customer_query(query)

        inputs = {
            'customer_query': query,
            'conversation_context': conversation_context or 'No prior context',
            'current_timestamp': str(self._get_timestamp())
        }

        try:
            classification_result = self.triage_agent().execute_task(self.triage_task(), inputs)
            classification = self._parse_crew_output(classification_result)
            category = classification.get('category', 'general')

            if classification.get('requires_escalation'):
                return self._process_handoff(inputs, classification)

            specialist_result = self._execute_specialist_task(category, inputs)
            if specialist_result is not None:
                specialist_output = self._parse_crew_output(specialist_result)
                return self._merge_classification_with_specialist(classification, specialist_output)

            return {
                'response': classification.get('response') or self._build_general_response(query),
                'category': 'general',
                'urgency': classification.get('urgency', 3),
                'requires_escalation': False,
                'handoff_notes': classification.get('handoff_notes', ''),
            }
        except Exception as e:
            return {
                'error': str(e),
                'requires_escalation': True,
                'response': 'I encountered an issue processing your request. A human agent will assist you shortly.'
            }

    def _specialist_task_map(self) -> dict[str, Tuple[Callable[[], BaseAgent], Callable[[], Task]]]:
        return {
            'order': (self.order_specialist, self.order_task),
            'product': (self.product_specialist, self.product_task),
            'returns': (self.returns_specialist, self.returns_task),
            'account': (self.consumer_specialist, self.account_task),
            'it': (self.it_specialist, self.it_task),
        }

    def _execute_specialist_task(self, category: str, inputs: dict) -> Optional[str]:
        mapping = self._specialist_task_map()
        if category not in mapping:
            return None

        agent_callable, task_callable = mapping[category]
        return agent_callable().execute_task(task_callable(), inputs)

    def _process_handoff(self, inputs: dict, classification: dict) -> dict:
        try:
            handoff_result = self.handoff_agent().execute_task(self.handoff_task(), inputs)
            parsed_handoff = self._parse_crew_output(handoff_result)
            merged = self._merge_classification_with_specialist(classification, parsed_handoff)
            merged['requires_escalation'] = True
            return merged
        except Exception as e:
            return {
                'error': str(e),
                'requires_escalation': True,
                'response': 'I encountered an issue preparing the handoff. A human agent will assist you shortly.',
            }

    def _merge_classification_with_specialist(self, classification: dict, specialist_output: dict) -> dict:
        return {
            'response': specialist_output.get('response') or classification.get('response') or self._build_general_response(''),
            'category': specialist_output.get('category', classification.get('category', 'unknown')),
            'urgency': specialist_output.get('urgency', classification.get('urgency', 3)),
            'requires_escalation': specialist_output.get('requires_escalation', classification.get('requires_escalation', False)),
            'handoff_notes': specialist_output.get('handoff_notes', classification.get('handoff_notes', '')),
        }

    def _build_general_response(self, query: str) -> str:
        return (
            'I can help with order tracking, product information, returns, account support, '
            'and internal IT issues. Please tell me how I can assist you.'
        )

    def escalate_to_human(self, query: str, conversation_history: list) -> dict:
        """
        Directly escalate a query to human support with full context.
        
        Args:
            query: Current customer query
            conversation_history: List of previous messages
            
        Returns:
            dict with escalation summary and handoff notes
        """
        context = self._format_conversation_history(conversation_history)
        inputs = {
            'customer_query': query,
            'conversation_context': context,
            'escalation_reason': 'Direct escalation to human support'
        }
        
        try:
            result = self.handoff_agent().execute_task(self.handoff_task(), inputs)
            return {
                'escalation_id': self._generate_escalation_id(),
                'handoff_summary': result,
                'status': 'escalated',
                'message': 'Your request has been escalated to a human agent.'
            }
        except Exception as e:
            return {
                'error': str(e),
                'status': 'escalation_failed',
                'message': 'We encountered an issue. Please contact support directly.'
            }

    # ==================== PRIVATE HELPER METHODS ====================

    def _parse_crew_output(self, crew_output: str) -> dict:
        """Parse crew output into structured response"""
        # If the crew returned a dict-like object already, use it directly
        if isinstance(crew_output, dict):
            parsed = crew_output
        else:
            try:
                parsed = json.loads(crew_output)
            except (json.JSONDecodeError, TypeError):
                # Fall back to treating the entire output as a plain text response
                return {
                    'response': str(crew_output),
                    'category': 'unknown',
                    'urgency': 3,
                    'requires_escalation': False,
                    'handoff_notes': ''
                }

        # Normalize parsed structure and provide safe defaults
        return {
            'response': parsed.get('response') if isinstance(parsed, dict) else str(parsed),
            'category': parsed.get('category', 'unknown'),
            'urgency': parsed.get('urgency', 3),
            'requires_escalation': parsed.get('requires_escalation', False),
            'handoff_notes': parsed.get('handoff_notes', '')
        }

    def _has_llm_credentials(self) -> bool:
        """Return True if an LLM provider key is configured."""
        return bool(os.getenv('OPENAI_API_KEY'))

    def _mock_process_customer_query(self, query: str) -> dict:
        """Fallback response when the external LLM key is not configured."""
        normalized = query.strip().lower()
        if any(keyword in normalized for keyword in ['order', 'tracking', 'shipment', 'shipping']):
            return {
                'response': 'Your order is on the way and should arrive within 2 business days.',
                'category': 'order',
                'urgency': 3,
                'requires_escalation': False,
                'handoff_notes': '',
            }
        if any(keyword in normalized for keyword in ['return', 'refund', 'exchange', 'return policy']):
            return {
                'response': 'I can help with your return. Please provide your order number and reason for return.',
                'category': 'returns',
                'urgency': 3,
                'requires_escalation': False,
                'handoff_notes': '',
            }
        if any(keyword in normalized for keyword in ['product', 'spec', 'specs', 'availability', 'stock', 'price', 'detail']):
            return {
                'response': 'Here are the product details you requested. Let me know if you want a comparison or availability check.',
                'category': 'product',
                'urgency': 2,
                'requires_escalation': False,
                'handoff_notes': '',
            }
        if any(keyword in normalized for keyword in ['account', 'login', 'password', 'billing', 'subscription', 'profile', 'cancel my subscription']):
            return {
                'response': 'I can help with your account issue. Please describe the login or billing problem in more detail.',
                'category': 'account',
                'urgency': 3,
                'requires_escalation': False,
                'handoff_notes': '',
            }
        if any(keyword in normalized for keyword in ['portal', 'timesheet', 'internal', 'system', 'app', 'error', 'it issue', 'service now', 'servicenow']):
            return {
                'response': 'I have detected an internal IT issue. I am escalating this to the IT support team for review.',
                'category': 'it',
                'urgency': 4,
                'requires_escalation': True,
                'handoff_notes': 'Internal IT issue detected; prepare incident details.',
            }
        if any(keyword in normalized for keyword in ['agent', 'human', 'handoff']):
            return {
                'response': 'I am connecting you to a human agent now.',
                'category': 'general',
                'urgency': 4,
                'requires_escalation': True,
                'handoff_notes': 'Manual handoff requested by customer.',
            }
        return {
            'response': 'Thanks for your message. I am reviewing your request and will respond shortly.',
            'category': 'general',
            'urgency': 3,
            'requires_escalation': False,
            'handoff_notes': '',
        }

    def _format_conversation_history(self, conversation_history: list) -> str:
        """Format conversation history for context"""
        if not conversation_history:
            return "No prior conversation history"
        
        formatted = []
        for msg in conversation_history:
            sender = msg.get('sender', 'Unknown')
            content = msg.get('content', '')
            formatted.append(f"{sender}: {content}")
        
        return "\n".join(formatted)

    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()

    def _generate_escalation_id(self) -> str:
        """Generate escalation ID"""
        import uuid
        return str(uuid.uuid4())[:8].upper()
