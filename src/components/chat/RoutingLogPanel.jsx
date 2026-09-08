// Log of every routing decision made in the CURRENT chat. Derived from the
// active message list in HomePage, so switching or starting a new chat
// clears it automatically — this deliberately does not persist across chats.
export function RoutingLogPanel({ entries, onClose, onMouseEnter, onMouseLeave }) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        top: 64,
        right: 24,
        width: 320,
        maxHeight: '70vh',
        overflowY: 'auto',
        background: 'rgba(15,20,31,0.92)',
        border: '1px solid rgba(56,189,248,0.25)',
        borderRadius: '12px',
        boxShadow: '0 20px 50px -10px rgba(0,0,0,0.7)',
        zIndex: 50,
        padding: '14px',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
          Routing log — this chat
        </span>
        <button
          onClick={onClose}
          aria-label="Close routing log"
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}
        >
          &times;
        </button>
      </div>
 
      {entries.length === 0 ? (
        <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
          No routing decisions yet — send a message.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {entries.map((e) => (
            <div key={e.id} style={{ fontSize: '11px', borderLeft: '2px solid #38bdf8', paddingLeft: '8px' }}>
              <div style={{ color: '#7dd3fc', fontFamily: "'JetBrains Mono', monospace" }}>{e.time}</div>
              <div style={{ color: 'var(--text-main)' }}>{e.model}</div>
              <div style={{ color: 'var(--text-muted)' }}>
                {e.taskType} &middot; {e.externalCalls} local {e.externalCalls === 1 ? 'call' : 'calls'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}