// Chat API — calls the real backend. Sends multipart/form-data when files
// are attached, plain JSON otherwise. Returns the same { markdown, routing }
// shape either way, so AssistantMessage/RoutingTrace need zero changes.
//
// NOTE for whoever owns the backend: the /api/chat endpoint needs to accept
// BOTH request shapes below. This file only sends the request — it doesn't
// implement how the backend reads it.

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * @param {string} prompt
 * @param {File[]} [files]
 * @returns {Promise<{ markdown: string, routing: object }>}
 */
export async function getChatResponse(prompt, files = []) {
  let res;

  if (files.length > 0) {
    // multipart/form-data — required to send binary file content.
    // Expected backend fields: "prompt" (text) + one or more "files" entries.
    const formData = new FormData();
    formData.append('prompt', prompt);
    files.forEach((f) => formData.append('files', f));

    res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      // Do NOT set Content-Type manually here — the browser sets the
      // multipart boundary itself. Setting it by hand breaks the request.
      body: formData,
    });
  } else {
    res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
  }

  if (!res.ok) {
    throw new Error(`Backend returned ${res.status}`);
  }

  return res.json(); // { markdown, routing }
}

/**
 * Stream a chat response using Server-Sent Events (SSE) so the UI can
 * render incoming tokens as they arrive.
 *
 * @param {string} prompt
 * @param {(text: string) => void} [onToken]
 * @param {(result: { markdown: string, routing?: object }) => void} [onComplete]
 */
export async function getChatResponseStream(prompt, onToken, onComplete) {
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    throw new Error(`Backend returned ${res.status}`);
  }

  if (!res.body) {
    throw new Error('Streaming response body is unavailable.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const messages = buffer.split('\n\n');
    buffer = messages.pop() || '';

    for (const message of messages) {
      const dataLine = message
        .split('\n')
        .find((line) => line.startsWith('data: '));

      if (!dataLine) continue;

      const payload = dataLine.slice('data: '.length).trim();
      if (!payload) continue;

      const event = JSON.parse(payload);

      if (event.type === 'token') {
        onToken?.(event.text || '');
      } else if (event.type === 'complete') {
        onComplete?.({
          markdown: event.markdown || '',
          routing: event.routing || null,
        });
        return;
      } else if (event.type === 'error') {
        throw new Error(event.message || 'Stream failed.');
      }
    }
  }

  onComplete?.({ markdown: '', routing: null });
}