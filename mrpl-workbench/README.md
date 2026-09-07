# MRPL Sovereign AI Workbench — MCP Server

> **On-premises. Air-gapped. Zero external API calls.**

---

## Architecture — 3-Tier Separation

```
┌──────────────────────────────────────────────────────┐
│  PRESENTATION TIER  (Client)                         │
│  vLLM Agent — Qwen 3 4B                             │
│                                                      │
│  • Decides WHICH tools to call                       │
│  • Sends JSON requests to MCP Server via HTTP        │
│  • NEVER touches the database directly               │
│  • NEVER accesses files directly                     │
└──────────────────┬───────────────────────────────────┘
                   │  HTTP REST  (localhost:8000)
                   │  POST /initialize
                   │  POST /call_tool
                   │  GET  /tools
                   │  GET  /status
                   │  GET  /execution_log
                   ▼
┌──────────────────────────────────────────────────────┐
│  APPLICATION TIER  (MCP Server — this codebase)      │
│  Python FastAPI                                      │
│                                                      │
│  • Validates every request                           │
│  • Dispatches to the correct tool handler            │
│  • Enforces path security (output dir only)          │
│  • Logs every execution in the audit trail           │
│  • Returns structured JSON to the client             │
│                                                      │
│  Tools:                                              │
│    vision_read_pdf / vision_read_image               │
│    file_read / file_write / docx_write               │
│    kb_search                                         │
│    execute_python / execute_bash                     │
│    xlsx_read / xlsx_write                            │
│    extract_structured                                │
│    chain_tools / get_execution_log                   │
└──────────────────┬───────────────────────────────────┘
                   │  Internal connections only
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
┌─────────────────┐  ┌─────────────────────────┐
│  DATA TIER      │  │  SANDBOX TIER            │
│  PostgreSQL +   │  │  Docker containers       │
│  pgvector       │  │  (execute_python,        │
│                 │  │   execute_bash)          │
│  • SOPs         │  │  • network_mode=none     │
│  • KB docs      │  │  • restricted user       │
│  • Embeddings   │  │  • timeout enforced      │
│                 │  │                          │
│  Only MCP       │  │  Only MCP server         │
│  server can     │  │  can spawn these         │
│  connect        │  │  containers              │
└─────────────────┘  └─────────────────────────┘

 ══ The CLIENT (vLLM agent) has NO path to Data or Sandbox tiers ══
```

**Key principle:** The client only speaks HTTP to the MCP Server. All database
queries, file reads/writes, and code sandbox execution are handled exclusively
by the MCP Server's application logic. The data tier is completely hidden.

---

## Project Structure

```
mrpl-workbench/
├── mcp_server/
│   ├── main.py                  # FastAPI app + 5 endpoints
│   ├── config.py                # Environment-driven config
│   ├── models.py                # Pydantic request/response schemas
│   ├── tool_registry.py         # Central dispatch table (12 tools)
│   ├── tools/
│   │   ├── vision.py            # vision_read_pdf, vision_read_image
│   │   ├── file_io.py           # file_read, file_write, docx_write
│   │   ├── knowledge_base.py    # kb_search (pgvector)
│   │   ├── code_execution.py    # execute_python, execute_bash
│   │   ├── spreadsheet.py       # xlsx_read, xlsx_write
│   │   ├── extraction.py        # extract_structured
│   │   └── orchestration.py     # chain_tools, get_execution_log
│   └── utils/
│       ├── audit_logger.py      # In-memory audit trail
│       ├── validation.py        # Path security enforcement
│       ├── docker_manager.py    # Sandbox container lifecycle
│       └── error_handler.py     # Structured error responses
├── sandbox/
│   ├── Dockerfile               # Isolated Python sandbox image
│   └── requirements.txt
├── tests/
│   ├── test_endpoints.py        # All 5 HTTP endpoints
│   ├── test_tools.py            # Each of the 12 tools
│   └── test_sovereignty.py      # Verify network_calls_total = 0
├── requirements.txt
├── docker-compose.yml           # PostgreSQL + pgvector
└── README.md
```

---

## Quick Start

### 1. Install dependencies

```bash
cd mrpl-workbench
pip install -r requirements.txt
```

### 2. Start the data tier (PostgreSQL + pgvector)

```bash
docker-compose up -d
```

### 3. (Optional) Build the sandbox image

```bash
docker build -t mrpl-sandbox:latest ./sandbox/
```

### 4. Start the MCP Server

```bash
python -m mcp_server.main
# Server: http://localhost:8000
# Docs:   http://localhost:8000/docs
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_HOST` | `0.0.0.0` | Server bind address |
| `MCP_PORT` | `8000` | Server port |
| `MRPL_OUTPUT_DIR` | `~/.mrpl_workbench/output` | Where output files are saved |
| `KB_DSN` | `postgresql://postgres:mrpl_secret@localhost:5432/mrpl_kb` | Database connection |
| `OCR_BACKEND` | `auto` | `paddleocr` \| `tesseract` \| `auto` |
| `LOCAL_LLM_URL` | _(empty)_ | Local vLLM endpoint for `extract_structured` |
| `SANDBOX_IMAGE` | `mrpl-sandbox:latest` | Docker image for code execution |

---

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/initialize` | Agent handshake — returns full tool catalogue |
| `POST` | `/call_tool` | Execute a named tool |
| `GET` | `/tools` | List all tool definitions |
| `GET` | `/status` | Health check + sovereignty proof |
| `GET` | `/execution_log` | Full audit trail |

---

## Tools Reference (12 tools)

| Tool | Category | Description |
|------|----------|-------------|
| `vision_read_pdf` | Vision | OCR scanned PDFs |
| `vision_read_image` | Vision | OCR images + detect diagrams |
| `file_read` | File I/O | Read TXT / JSON / CSV |
| `file_write` | File I/O | Write to output directory |
| `docx_write` | File I/O | Create formatted Word documents |
| `kb_search` | Knowledge Base | Semantic search via pgvector |
| `execute_python` | Code Exec | Run Python in Docker sandbox |
| `execute_bash` | Code Exec | Run bash in Docker sandbox |
| `xlsx_read` | Spreadsheet | Read Excel files |
| `xlsx_write` | Spreadsheet | Write Excel files |
| `extract_structured` | Extraction | Parse text into JSON schema |
| `chain_tools` | Orchestration | Multi-step tool workflows |
| `get_execution_log` | Orchestration | Audit trail query |

---

## Quick Test

```bash
# Verify server is running
curl http://localhost:8000/status

# Initialize (get tool list)
curl -X POST http://localhost:8000/initialize \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "qwen-3-4b"}'

# Write a file
curl -X POST http://localhost:8000/call_tool \
  -H "Content-Type: application/json" \
  -d '{"tool_name": "file_write", "params": {"file_path": "hello.txt", "content": "Hello MRPL"}, "execution_id": "exec_1"}'

# Verify zero external calls (SOVEREIGNTY PROOF)
curl http://localhost:8000/status
# → "network_calls_total": 0

# Full audit trail
curl "http://localhost:8000/execution_log?limit=10"
```

---

## Run Tests

```bash
# All tests
pytest tests/ -v

# Sovereignty only
pytest tests/test_sovereignty.py -v

# Endpoints only
pytest tests/test_endpoints.py -v
```

---

## Sovereignty Guarantee

Every tool execution sets `network_calls_made = 0` in the audit log.
The `GET /status` endpoint exposes `network_calls_total` — this counter
is **always 0**, proving that the system operates entirely on-premises
with no external API calls of any kind.

The data tier (PostgreSQL/pgvector) is accessed **only** by the MCP Server
application. The client (vLLM agent) has no database credentials and no
network path to the data tier — it only speaks HTTP to the MCP Server.
