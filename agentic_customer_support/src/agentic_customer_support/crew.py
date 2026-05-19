from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import Optional
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
        inputs = {
            'customer_query': query,
            'conversation_context': conversation_context or 'No prior context',
            'current_timestamp': str(self._get_timestamp())
        }
        
        try:
            result = self.crew().kickoff(inputs=inputs)
            return self._parse_crew_output(result)
        except Exception as e:
            return {
                'error': str(e),
                'requires_escalation': True,
                'response': 'I encountered an issue processing your request. A human agent will assist you shortly.'
            }

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
        try:
            # Try to parse as JSON if the crew output is JSON formatted
            parsed = json.loads(crew_output)
            return {
                'response': parsed.get('response', crew_output),
                'category': parsed.get('category', 'unknown'),
                'urgency': parsed.get('urgency', 3),
                'requires_escalation': parsed.get('requires_escalation', False),
                'handoff_notes': parsed.get('handoff_notes', '')
            }
        except (json.JSONDecodeError, TypeError):
            # If not JSON, treat the entire output as the response
            return {
                'response': str(crew_output),
                'category': 'unknown',
                'urgency': 3,
                'requires_escalation': False,
                'handoff_notes': ''
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
