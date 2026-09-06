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