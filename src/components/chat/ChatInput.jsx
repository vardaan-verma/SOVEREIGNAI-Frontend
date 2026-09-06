import { useRef, useState } from 'react';

export function ChatInput({ onSend, isStreaming }) {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const val = inputRef.current?.value.trim();
    if (!val || isStreaming) return;
    inputRef.current.value = '';
    onSend(val);
  }

  return (
    <footer style={{ width: '100%', padding: '0 24px 16px', maxWidth: '1100px', margin: '0 auto' }}>
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        {/* Glow halo behind input */}
        <div
          style={{
            position: 'absolute',
            inset: '-2px',
            background: 'linear-gradient(to right, #3b82f6, #6366f1, #38bdf8)',
            opacity: focused ? 0.6 : 0.15,
            filter: 'blur(10px)',
            borderRadius: '9999px',
            transition: 'opacity 0.4s',
            pointerEvents: 'none',
          }}
        />
        {/* Input bar */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'var(--input-bg)',
            border: '1px solid var(--input-border)',
            backdropFilter: 'blur(20px)',
            padding: '10px 12px',
            borderRadius: '9999px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          {/* Attach button */}
          <button
            type="button"
            title="Attach file"
            style={{
              padding: '8px', color: 'var(--text-muted)', background: 'none', border: 'none',
              cursor: 'pointer', borderRadius: '8px', flexShrink: 0, display: 'flex',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.background = 'rgba(148,163,184,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            placeholder="Ask SOVA, explore thoughts, or prompt local AI..."
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={isStreaming}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '0.875rem',
              fontWeight: 300,
              padding: '4px 12px',
            }}
          />

          {/* Right action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            {/* Refresh/reset */}
            <button
              type="button"
              title="Refresh"
              style={{
                padding: '8px', color: 'var(--text-muted)', background: 'none', border: 'none',
                cursor: 'pointer', borderRadius: '8px', display: 'flex', transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f59e0b')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
            {/* Mic */}
            <button
              type="button"
              title="Voice input"
              style={{
                padding: '8px', color: 'var(--text-muted)', background: 'none', border: 'none',
                cursor: 'pointer', borderRadius: '8px', display: 'flex', transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
            {/* Send */}
            <button
              type="submit"
              aria-label="Send message"
              disabled={isStreaming}
              style={{
                width: 32, height: 32, borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                border: 'none', cursor: isStreaming ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', boxShadow: '0 4px 12px rgba(56,189,248,0.3)',
                opacity: isStreaming ? 0.5 : 1,
                transition: 'opacity 0.2s, transform 0.1s',
              }}
              onMouseEnter={(e) => { if (!isStreaming) e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" style={{ transform: 'translateX(1px)' }}>
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </footer>
  );
}
