# SSE streaming for SOVA chat

This app now supports token-by-token streaming over Server-Sent Events for the chat response path.

## Frontend

- `src/api/chat.js`
  - `getChatResponseStream(prompt, onToken, onComplete)` opens a POST request to `/api/chat/stream`.
  - It consumes `text/event-stream` chunks and emits each token to the UI.
- `src/pages/HomePage.jsx`
  - The `handleSend` flow now uses streaming for normal text prompts.
  - The assistant message updates incrementally while the model is thinking.

## Backend

- `mrpl-workbench/mcp_server/main.py`
  - Added `POST /api/chat/stream` and `POST /chat/stream` endpoints.
  - The stream endpoint calls the local OpenAI-compatible vLLM endpoint via `LOCAL_LLM_URL` and forwards tokens as SSE events.

## Expected event stream

Each SSE event is formatted as:

```text
data: {"type":"token","text":"..."}

```

Then the stream ends with:

```text
data: {"type":"complete","markdown":"...","routing":{"model":"local_llm",...}}

```

## Notes

- The old non-streaming `/api/chat` endpoint still works.
- For streaming to work in your local setup, make sure `LOCAL_LLM_URL` points to your local vLLM/OpenAI-compatible server.
- The frontend expects the backend to return `Content-Type: text/event-stream`.
