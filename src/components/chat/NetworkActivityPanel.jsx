import { useNetworkLog } from '../../hooks/useNetworkLog';

// Live list of every network request THIS FRONTEND has made. This proves
// the frontend's own claim of zero external calls — it cannot see the
// backend, agent, MCP tool calls, or database queries, since those run in
// a separate process. Say so explicitly if presenting this on demo day;
// don't let it imply full-stack coverage it doesn't have.
export function NetworkActivityPanel({ onClose, shiftLeft = false }) {
  const log = useNetworkLog();
  const externalCount = log.filter((e) => e.classification === 'external').length;

  return (
    <div
      style={{
        position: 'fixed',
        top: 64,
        right: shiftLeft ? 376 : 24,
        width: 340,
        maxHeight: '70vh',
        overflowY: 'auto',
        background: 'rgba(15,20,31,0.92)',
        border: `1px solid ${externalCount > 0 ? 'rgba(244,63,94,0.35)' : 'rgba(16,185,129,0.25)'}`,
        borderRadius: '12px',
        boxShadow: '0 20px 50px -10px rgba(0,0,0,0.7)',
        zIndex: 50,
        padding: '14px',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
          Network activity — this frontend
        </span>
        <button
          onClick={onClose}
          aria-label="Close network activity"
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}
        >
          &times;
        </button>
      </div>

      <div style={{ fontSize: '10px', color: 'var(--text-subtle)', marginBottom: '10px', lineHeight: 1.5 }}>
        Every fetch() call made by this browser tab. Does not cover the backend,
        agent, MCP tools, or database — those need a separate, server-side audit.
      </div>

      {externalCount > 0 && (
        <div style={{
          padding: '8px 10px', borderRadius: '8px', marginBottom: '10px',
          background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.35)',
          color: '#fda4af', fontSize: '11px',
        }}>
          {externalCount} request{externalCount === 1 ? '' : 's'} resolved to a non-local host.
        </div>
      )}

      {log.length === 0 ? (
        <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
          No requests yet — send a message or log in to see activity here.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {log.map((e) => (
            <div
              key={e.id}
              style={{
                fontSize: '11px',
                borderLeft: `2px solid ${e.classification === 'local' ? '#10b981' : '#f43f5e'}`,
                paddingLeft: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#7dd3fc', fontFamily: "'JetBrains Mono', monospace" }}>{e.time}</span>
                <span style={{
                  fontSize: '9px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px',
                  background: e.classification === 'local' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.20)',
                  color: e.classification === 'local' ? '#6ee7b7' : '#fda4af',
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {e.classification}
                </span>
              </div>
              <div style={{ color: 'var(--text-main)', fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all' }}>
                {e.method} {e.hostname}
              </div>
              <div style={{ color: 'var(--text-muted)' }}>{e.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}