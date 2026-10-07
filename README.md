# TripAI

TripAI is a web-based travel planning assistant that turns a trip request into flight guidance, hotel suggestions, weather details, and an itinerary. It combines a LangGraph workflow with MCP-connected travel services, Groq-powered language models, and MongoDB Atlas checkpoint persistence.

## Features

- Generate a structured travel plan from a natural-language request.
- Provide flight guidance using AviationStack airport and airline data.
- Research hotel options with Tavily search.
- Include current weather and forecast information from OpenWeather.
- Retain LangGraph conversation state in MongoDB Atlas using a thread ID.
- View, copy, and download the generated plan as a PDF in the web interface.

## Tech Stack

- Python, FastAPI, and Uvicorn
- LangGraph and LangChain Core
- Groq through `langchain-groq` (`openai/gpt-oss-20b`)
- Model Context Protocol (MCP) with `langchain-mcp-adapters`
- MongoDB Atlas, PyMongo, and `langgraph-checkpoint-mongodb`
- Tavily, AviationStack, and OpenWeather
- HTML, CSS, JavaScript, Jinja2, and Pydantic

## Architecture

```text
User
  → FastAPI web UI or API
  → LangGraph travel workflow
  → Flight, hotel, weather, itinerary, and final-response agents
  → MCP tools for AviationStack, Tavily, and OpenWeather
  → MongoDB Atlas checkpoint persistence by thread ID
  → Final travel plan
```

The FastAPI application accepts the trip request and invokes the compiled LangGraph workflow. LangGraph passes shared trip state through each agent and saves workflow checkpoints to MongoDB Atlas. Groq supports destination extraction and generates flight guidance, the itinerary, and the final response.

## MCP Integration

- **AviationStack:** A local stdio MCP server, started with `uvx aviationstack-mcp`, supplies airport and airline information used to produce flight guidance.
- **Tavily:** A remote MCP endpoint provides hotel-related web search.
- **OpenWeather:** A custom local MCP server exposes current-weather and forecast tools backed by the OpenWeather API.

The MCP client initializes each service independently so a failure connecting to one service does not prevent the others from loading.

## Project Structure

```text
.
├── app.py                       # FastAPI application and HTTP endpoints
├── backend.py                   # LangGraph state and travel-agent workflow
├── mcp_client.py                # Tavily, AviationStack, and weather MCP clients
├── custom_weather_mcp_server.py # OpenWeather-backed MCP tools
├── mongodb.py                   # MongoDB Atlas connection helper
├── requirements.txt             # Python dependencies
├── templates/
│   └── index.html               # Trip planner page
├── static/
│   ├── script.js                # Browser interactions and API requests
│   └── style.css                # Interface styling
├── tools/
│   ├── __init__.py
│   └── flight_tool.py           # Flight lookup utility
├── excalidraw_files/            # Architecture and MCP diagrams
├── .env.example                 # Environment variable template
├── .gitignore
├── .dockerignore
├── Dockerfile
└── LICENSE
```

## How It Works

1. A user submits a trip request through the planner page or the travel API.
2. The flight agent asks AviationStack MCP for airport and airline information and uses Groq to produce flight guidance.
3. The hotel agent searches for hotel suggestions through Tavily MCP.
4. The weather agent uses Groq to identify the destination, then requests current conditions and forecast data through the custom OpenWeather MCP server.
5. The itinerary agent combines the request and gathered information into a practical itinerary.
6. The final-response agent formats the results into a complete travel plan.
7. LangGraph checkpoints the workflow state in MongoDB Atlas under the request's thread ID.

## Setup

Use Python 3.10 or newer and make sure `uvx` is available for the AviationStack MCP server. Create a virtual environment and install the project dependencies:

```bash
python -m venv .venv
```

Activate it, then install requirements:

```bash
# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS or Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in the required values. Configure MongoDB Atlas network access and database credentials for your environment.

## Run Locally

With the virtual environment active and `.env` configured, run:

```bash
python app.py
```

Open the planner at <http://127.0.0.1:8000/>.

## Environment Variables

Set these variable names in `.env`; replace placeholders with your own values:

```env
MONGODB_URI=<mongodb-atlas-connection-string>
MONGODB_DATABASE=tripmate
GROQ_API_KEY=<groq-api-key>
TAVILY_API_KEY=<tavily-api-key>
AVIATIONSTACK_API_KEY=<aviationstack-api-key>
OPENWEATHER_API_KEY=<openweather-api-key>
DEFAULT_ORIGIN_IATA=DAC
```

`DEFAULT_ORIGIN_IATA` is used by the flight lookup utility. The active LangGraph flight agent currently obtains airport and airline data through AviationStack MCP.

## API Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | Serves the TripAI planner interface. |
| `GET` | `/health` | Returns the application health status. |
| `POST` | `/api/travel` | Generates a travel plan from a JSON request. |

Example request:

```json
{
  "message": "Plan a 3-day trip to Tokyo with a budget of $1200",
  "thread_id": "optional-existing-thread"
}
```

`thread_id` is optional. When omitted, the application creates a new thread ID.

## Key Learning / Implementation

- Designed a multi-agent travel workflow with shared state.
- Orchestrated sequential agent execution and checkpointing with LangGraph.
- Connected remote and local MCP tools for travel research and weather data.
- Persisted agent checkpoints in MongoDB Atlas.
- Integrated Groq models through LangChain for destination extraction and plan generation.
- Coordinated external travel, search, and weather APIs through MCP.
