import { PiLogo } from '../ui/PiLogo';

// A single chat item in the sidebar
export function ChatItem({ title, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`sidebar-chat-row ${isActive ? 'active-chat-item' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        backgroundColor: isActive ? undefined : 'transparent',
        position: 'relative',
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)'; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
        {/* Active indicator dot */}
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            flexShrink: 0,
            background: isActive ? '#38bdf8' : 'transparent',
            boxShadow: isActive ? '0 0 8px #38bdf8' : 'none',
            transition: 'all 0.2s',
          }}
        />
        <span
          style={{
            fontSize: '13px',
            fontWeight: isActive ? 500 : 400,
            color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'color 0.15s',
          }}
        >
          {title}
        </span>
      </div>

      {/* Options kebab button (visible on hover) */}
      <button
        onClick={(e) => e.stopPropagation()}
        title="Options"
        className="sidebar-chat-kebab"
        style={{
          opacity: 0,
          padding: '4px',
          color: 'var(--text-muted)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '4px',
          transition: 'opacity 0.15s',
          display: 'flex',
        }}
      >
        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
        </svg>
      </button>
    </div>
  );
}