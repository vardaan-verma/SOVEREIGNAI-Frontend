import { useEffect, useRef, useState } from 'react';
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
  const [isRecording, setIsRecording] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    const filesToSend = files;
    inputRef.current.value = '';
    setFiles([]);
    if (isRecording) setIsRecording(false);
    onSend(val, filesToSend);
  }

  function toggleRecording() {
    setIsRecording((prev) => !prev);
  }

  return (
    <footer style={{ width: '100%', padding: '0 24px 16px', maxWidth: '1100px', margin: '0 auto' }}>
      <style>{`
        @keyframes soundWaveBar {
          0%, 100% { transform: scaleY(0.25); }
          50% { transform: scaleY(1); }
        }
        @keyframes micPulseRing {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(192, 132, 252, 0.6); }
          70% { transform: scale(1.15); box-shadow: 0 0 0 10px rgba(192, 132, 252, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(192, 132, 252, 0); }
        }
        @keyframes purpleGlowPulse {
          0%, 100% { opacity: 0.55; filter: blur(12px); }
          50% { opacity: 0.9; filter: blur(18px); }
        }
        @keyframes purplePulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
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
            background: isRecording
              ? 'linear-gradient(to right, #a855f7, #c084fc, #6366f1)'
              : 'linear-gradient(to right, #3b82f6, #6366f1, #38bdf8)',
            opacity: isRecording ? 0.85 : focused || dragOver ? 0.12 : 0.04,
            filter: 'blur(10px)',
            borderRadius: '9999px',
            transition: 'opacity 0.4s, background 0.4s',
            pointerEvents: 'none',
            animation: isRecording ? 'purpleGlowPulse 1.8s infinite ease-in-out' : 'none',
          }}
        />
        {/* Input bar */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: isRecording ? 'rgba(20, 14, 30, 0.85)' : 'var(--input-bg)',
            border: isRecording
              ? '1px solid rgba(192, 132, 252, 0.5)'
              : dragOver
              ? '1px solid rgba(56,189,248,0.6)'
              : '1px solid var(--input-border)',
            backdropFilter: 'blur(20px)',
            padding: '10px 14px',
            borderRadius: '9999px',
            boxShadow: isRecording
              ? '0 8px 32px rgba(168, 85, 247, 0.25)'
              : '0 8px 32px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease',
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
 
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, gap: '8px' }}>
            {/* Text input or active recording status */}
            <input
              ref={inputRef}
              type="text"
              autoComplete="off"
              placeholder={
                isRecording
                  ? 'Listening... Speak now'
                  : files.length > 0
                  ? 'Add a message (optional)...'
                  : isMobile
                  ? 'Ask SOVA'
                  : 'Ask SOVA, explore thoughts, or prompt local AI...'
              }
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              disabled={isStreaming}
              style={{
                flex: 1,
                minWidth: 0,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: isRecording ? '#e9d5ff' : 'var(--text-main)',
                fontSize: '0.875rem',
                fontWeight: isRecording ? 400 : 300,
                padding: '4px 0',
              }}
            />

            {/* Soundwave Animation & Recording Indicator while recording */}
            {isRecording && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#c084fc',
                      display: 'inline-block',
                      animation: 'purplePulseDot 1.2s infinite ease-in-out',
                      boxShadow: '0 0 8px #c084fc',
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#e9d5ff', fontWeight: 500, letterSpacing: '0.5px' }}>
                    REC
                  </span>
                </div>
                {/* Audio visualizer equalizer bars */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '18px' }}>
                  {[0.4, 0.7, 0.3, 0.9, 0.5, 0.8, 0.4].map((delay, idx) => (
                    <span
                      key={idx}
                      style={{
                        width: '3px',
                        height: '100%',
                        borderRadius: '3px',
                        background: 'linear-gradient(to top, #a855f7, #c084fc)',
                        animation: `soundWaveBar 0.8s ease-in-out ${delay}s infinite`,
                        transformOrigin: 'bottom',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '6px' }}>
            {/* Mic / Stop Recording Toggle Button */}
            <button
              type="button"
              title={isRecording ? 'Stop recording' : 'Voice input'}
              onClick={toggleRecording}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: isRecording ? '#f43f5e' : 'transparent',
                color: isRecording ? '#ffffff' : 'var(--text-muted)',
                border: isRecording ? 'none' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: isRecording ? 'micPulseRing 1.5s infinite ease-in-out' : 'none',
                boxShadow: isRecording ? '0 0 12px rgba(192, 132, 252, 0.5)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isRecording) {
                  e.currentTarget.style.color = '#38bdf8';
                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
                } else {
                  e.currentTarget.style.background = '#e11d48';
                }
              }}
              onMouseLeave={(e) => {
                if (!isRecording) {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'transparent';
                } else {
                  e.currentTarget.style.background = '#f43f5e';
                }
              }}
            >
              {isRecording ? (
                /* Muted Rose Stop Icon */
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="4" y="4" width="16" height="16" rx="3" />
                </svg>
              ) : (
                /* Mic Icon */
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              )}
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

 