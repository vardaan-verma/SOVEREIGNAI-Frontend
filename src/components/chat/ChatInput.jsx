import { useRef, useState } from 'react';
import { AttachmentChip } from './AttachmentChip';
const ACCEPTED_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/*';
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_FILES = 6;

export function ChatInput({ onSend, isStreaming }) {
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  function addFiles(fileList) {
    const incoming = Array.from(fileList);
    const accepted = [];
    let rejectionReason = '';
 
    for (const f of incoming) {
      if (f.size > MAX_FILE_SIZE) {
        rejectionReason = `"${f.name}" is over the 25 MB limit.`;
        continue;
      }
      accepted.push(f);
    }
 
    setFiles((prev) => {
      const combined = [...prev, ...accepted];
      if (combined.length > MAX_FILES) {
        rejectionReason = `Only up to ${MAX_FILES} files at a time.`;
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
 
    setError(rejectionReason);
    if (rejectionReason) {
      setTimeout(() => setError(''), 3500);
    }
  }
  
   function handleFileInputChange(e) {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = ''; // allow re-selecting the same file later
  }
 
  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }
 
  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const val = inputRef.current?.value.trim();
    if (!val || isStreaming) return;
    inputRef.current.value = '';
    onSend(val);
  }

  return (
    <footer style={{ width: '100%', padding: '0 24px 16px', maxWidth: '1100px', margin: '0 auto' }}>
      <form
        onSubmit={handleSubmit}
        style={{ position: 'relative' }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Hidden native file input, triggered by the attach button */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
 
        {/* Error toast */}
        {error && (
          <div style={{
            position: 'absolute', bottom: '100%', left: 0, marginBottom: '8px',
            fontSize: '11px', color: '#fca5a5', background: 'rgba(127,29,29,0.25)',
            border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px',
            padding: '6px 10px',
          }}>
            {error}
          </div>
        )}
 
        {/* Attachment previews */}
        {files.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {files.map((f, i) => (
              <AttachmentChip key={`${f.name}-${i}`} file={f} onRemove={() => removeFile(i)} />
            ))}
          </div>
        )}
 
        {/* Glow halo behind input */}
        <div
          style={{
            position: 'absolute',
            inset: '-2px',
            background: 'linear-gradient(to right, #3b82f6, #6366f1, #38bdf8)',
            opacity: focused || dragOver ? 0.6 : 0.15,
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
            border: dragOver ? '1px solid rgba(56,189,248,0.6)' : '1px solid var(--input-border)',
            backdropFilter: 'blur(20px)',
            padding: '10px 12px',
            borderRadius: '9999px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            transition: 'border-color 0.2s',
          }}
        >
          {/* Attach button */}
          <button
            type="button"
            title="Attach file"
            onClick={() => fileInputRef.current?.click()}
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
            placeholder={files.length > 0 ? 'Add a message (optional)...' : 'Ask SOVA, explore thoughts, or prompt local AI...'}
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
 