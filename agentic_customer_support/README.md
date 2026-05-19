# AgenticCustomerSupport Crew

Welcome to the AgenticCustomerSupport Crew project, powered by [crewAI](https://crewai.com). This template is designed to help you set up a multi-agent AI system with ease, leveraging the powerful and flexible framework provided by crewAI. Our goal is to enable your agents to collaborate effectively on complex tasks, maximizing their collective intelligence and capabilities.

## Installation

Ensure you have Python >=3.10 <3.14 installed on your system. This project uses [UV](https://docs.astral.sh/uv/) for dependency management and package handling, offering a seamless setup and execution experience.

First, if you haven't already, install uv:

```bash
pip install uv
```

Next, navigate to your project directory and install the dependencies:

(Optional) Lock the dependencies and install them by using the CLI command:
```bash
crewai install
```
### Customizing

**Add your `OPENAI_API_KEY` into the `.env` file**

- Modify `src/agentic_customer_support/config/agents.yaml` to define your agents
- Modify `src/agentic_customer_support/config/tasks.yaml` to define your tasks
- Modify `src/agentic_customer_support/crew.py` to add your own logic, tools and specific args
- Modify `src/agentic_customer_support/main.py` to add custom inputs for your agents and tasks

## Running the Project

To kickstart your crew of AI agents and begin task execution, run this from the root folder of your project:

```bash
$ crewai run
```

This command initializes the agentic_customer_support Crew, assembling the agents and assigning them tasks as defined in your configuration.

This example, unmodified, will run the create a `report.md` file with the output of a research on LLMs in the root folder.

## Understanding Your Crew

The agentic_customer_support Crew is composed of multiple AI agents, each with unique roles, goals, and tools. These agents collaborate on a series of tasks, defined in `config/tasks.yaml`, leveraging their collective skills to achieve complex objectives. The `config/agents.yaml` file outlines the capabilities and configurations of each agent in your crew.

## Support

For support, questions, or feedback regarding the AgenticCustomerSupport Crew or crewAI.
- Visit our [documentation](https://docs.crewai.com)
- Reach out to us through our [GitHub repository](https://github.com/joaomdmoura/crewai)
- [Join our Discord](https://discord.com/invite/X4JWnZnxPb)
- [Chat with our docs](https://chatg.pt/DWjSBZn)

Let's create wonders together with the power and simplicity of crewAI.

---

## Backend API and Run Script

This repository also includes a small FastAPI-based backend for the CrewAI crew.

Quick start (backend API - local development):

1. From the repository root, create and activate a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

2. Install Python dependencies (from repository root):

```bash
pip install -e agentic_customer_support
pip install uvicorn[standard] fastapi SQLAlchemy pydantic
```

3. Start the API using the helper script:

```bash
bash agentic_customer_support/scripts/run_api.sh
```

Or run the server directly:

```bash
PYTHONPATH=agentic_customer_support/src .venv/bin/uvicorn agentic_customer_support.api.app:app --host 127.0.0.1 --port 8000 --reload
```

The API exposes the following endpoints:

- `POST /chat` — send a message to the crew (creates conversation if needed)
- `POST /escalate` — request human escalation
- `GET /chat/{conversation_id}` — retrieve conversation history
- `GET /tickets` — list tickets
- `GET /tickets/{ticket_id}` — get ticket details
- `GET /health` — health check

The ServiceNow integration in this MVP is mocked via `ServiceNowService` and writes events to `servicenow_mock.log` in the repository root.
