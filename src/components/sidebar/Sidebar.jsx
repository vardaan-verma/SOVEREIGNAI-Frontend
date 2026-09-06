import { useState } from 'react';
import { PiLogo } from '../ui/PiLogo';
import { ChatItem } from './ChatItem';

const RECENT_CHATS = [
  { id: 1, title: 'Warm Lighting and Lamp Replacement', preview: 'How to choose 2700K vs 3000K warm lighting for living spaces...' },
  { id: 2, title: 'Remove Fedora Dual Boot in Windows', preview: 'Safely deleting Linux EFI partitions and updating Windows bootloader...' },
  { id: 3, title: 'Convert Image to Dithered GIF', preview: 'Command line ffmpeg and imagemagick palettes for floyd-steinberg dithering...' },
  { id: 4, title: 'Retro-Futurist YouTube Gaming Banner', preview: 'Mid-90s synthwave neon layout with cyber grid gradients...' },
  { id: 5, title: 'Project Report Image Generation', preview: 'Prompts for clean minimal architectural diagrams...' },
  { id: 6, title: 'Branch • Project Report Image Generat...', preview: 'Branch version testing different lighting schemes...' },
];

export function Sidebar({ isOpen, activeId, onSelectChat, onNewChat }) {
  const [search, setSearch] = useState('');

  const filtered = RECENT_CHATS.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside
      style={{
        width: isOpen ? '280px' : '0px',
        minWidth: isOpen ? '280px' : '0px',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        transition: 'width 0.3s ease, min-width 0.3s ease, opacity 0.3s ease',
        overflow: 'hidden',
        zIndex: 40,
        fontSize: '13px',
        color: 'var(--text-main)',
        flexShrink: 0,
      }}
    >
      {/* ── Brand & Collapse ─────────────────────────────── */}
      <div style={{ padding: '12px 12px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PiLogo size="sm" />
            <span style={{ fontWeight: 500, fontSize: '15px', letterSpacing: '-0.01em' }}>SOVA</span>
          </div>
        </div>

        {/* New Chat / SOVA pill */}
        <div style={{ paddingTop: '4px', marginTop: '4px' }}>
          <button
            onClick={onNewChat}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '9999px',
              background: 'var(--sidebar-hover)',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-main)',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <PiLogo size="sm" />
            <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '-0.01em' }}>SOVA</span>
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginTop: '8px' }}>
          <svg
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--text-muted)', pointerEvents: 'none' }}
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="text"
            placeholder="Search chats"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderRadius: '12px',
              padding: '8px 12px 8px 36px',
              fontSize: '12px',
              color: 'var(--text-main)',
              outline: 'none',
              transition: 'background 0.15s',
            }}
            onFocus={(e) => (e.currentTarget.style.background = 'var(--sidebar-hover)')}
            onBlur={(e) => (e.currentTarget.style.background = 'transparent')}
          />
        </div>
      </div>

      {/* ── Recent Chats ─────────────────────────────────── */}
      <div className="sidebar-scroll" style={{ flex: 1, overflowY: 'auto', padding: '4px 12px' }}>
        <div style={{
          padding: '8px 12px 6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          opacity: 0.8,
        }}>
          <span>Recent</span>
          <span style={{
            fontSize: '10px',
            fontWeight: 400,
            textTransform: 'lowercase',
            letterSpacing: 0,
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(56,189,248,0.8)',
          }}>
            {RECENT_CHATS.length} chats
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {filtered.map((chat) => (
            <ChatItem
              key={chat.id}
              title={chat.title}
              isActive={activeId === chat.id}
              onClick={() => onSelectChat(chat)}
            />
          ))}
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────── */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--sidebar-border)' }}>
        <a
          href="#"
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '8px 12px', borderRadius: '12px',
            color: 'var(--text-muted)', fontSize: '12px',
            textDecoration: 'none', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = 'var(--text-main)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>Settings</span>
        </a>
        <a
          href="#"
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '8px 12px', borderRadius: '12px',
            color: 'var(--text-muted)', fontSize: '12px',
            textDecoration: 'none', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = 'var(--text-main)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" x2="12.01" y1="17" y2="17" />
          </svg>
          <span>Help &amp; Activity</span>
        </a>
        {/* Version badge */}
        <div style={{
          padding: '8px 12px 4px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '11px', color: 'var(--text-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', display: 'inline-block' }} />
            <span>SOVA Advanced</span>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', opacity: 0.75 }}>1.5 Pro</span>
        </div>
      </div>
    </aside>
  );
}
