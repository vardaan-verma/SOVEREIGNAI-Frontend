import { AttachmentChip } from './AttachmentChip';

// User message bubble (right-aligned)
export function MessageBubble({ text, files = [] }) {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
      <div
        style={{
          maxWidth: '75%',
          borderRadius: '16px',
          borderTopRightRadius: '4px',
          background: 'rgba(37,99,235,0.20)',
          border: '1px solid rgba(59,130,246,0.30)',
          padding: '12px 16px',
          fontSize: '0.875rem',
          color: 'var(--text-main)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {files.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: text ? '10px' : 0, justifyContent: 'flex-end' }}>
            {files.map((f, i) => (
              <AttachmentChip key={`${f.name}-${i}`} file={f} removable={false} />
            ))}
          </div>
        )}
        {text && (
          <p style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</p>
        )}
        <div style={{ fontSize: '10px', color: 'rgba(56,189,248,0.6)', textAlign: 'right', marginTop: '4px', fontFamily: "'JetBrains Mono', monospace" }}>
          Just now
        </div>
      </div>
    </div>
  );
}