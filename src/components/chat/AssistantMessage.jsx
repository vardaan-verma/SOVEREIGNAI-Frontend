import { useState, useEffect, useRef } from 'react';
import { useTypewriter } from '../../hooks/useTypewriter';
import { RoutingTrace } from './RoutingTrace';

// Converts raw markdown text to React elements (simple parser)
function parseMarkdown(text) {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={key++} style={{
          margin: '8px 0', padding: '12px', borderRadius: '12px',
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.10)',
          fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
          color: '#a5f3fc', overflowX: 'auto',
        }}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      i++;
      continue;
    }

    // H3
    if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} style={{ fontSize: '0.875rem', fontWeight: 600, color: '#38bdf8', paddingTop: '4px' }}>{inlineFormat(line.slice(4))}</h3>);
      i++; continue;
    }
    // H2
    if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', paddingTop: '4px' }}>{inlineFormat(line.slice(3))}</h2>);
      i++; continue;
    }
    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={key++} style={{
          borderLeft: '2px solid #38bdf8', paddingLeft: '12px', paddingBlock: '2px',
          fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic',
        }}>
          {inlineFormat(line.slice(2))}
        </blockquote>
      );
      i++; continue;
    }
    // Unordered list
    if (line.startsWith('* ') || line.startsWith('- ')) {
      const bullet = line.startsWith('* ') ? '•' : '–';
      const bulletColor = line.startsWith('* ') ? '#38bdf8' : '#818cf8';
      elements.push(
        <div key={key++} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ color: bulletColor, marginTop: '2px', fontSize: '12px', flexShrink: 0 }}>{bullet}</span>
          <span>{inlineFormat(line.slice(2))}</span>
        </div>
      );
      i++; continue;
    }
    // Numbered list
    if (/^\d+\. /.test(line)) {
      const match = line.match(/^(\d+)\. (.*)/);
      elements.push(
        <div key={key++} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ color: '#818cf8', flexShrink: 0, fontWeight: 600, fontSize: '12px' }}>{match[1]}.</span>
          <span>{inlineFormat(match[2])}</span>
        </div>
      );
      i++; continue;
    }
    // Empty line → spacer
    if (line.trim() === '') {
      elements.push(<div key={key++} style={{ height: '8px' }} />);
      i++; continue;
    }
    // Plain paragraph
    elements.push(<p key={key++} style={{ lineHeight: 1.7 }}>{inlineFormat(line)}</p>);
    i++;
  }
  return elements;
}

function inlineFormat(text) {
  // Bold, inline code — split and render as spans
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 500, color: 'var(--text-main)' }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} style={{
          padding: '2px 6px', borderRadius: '4px',
          background: 'rgba(255,255,255,0.10)', color: '#67e8f9',
          fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
        }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// SOVA response avatar
function SovaAvatar() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '10px', flexShrink: 0, marginTop: '2px',
      background: 'linear-gradient(135deg, rgba(56,189,248,0.20), rgba(192,132,252,0.20))',
      border: '1px solid rgba(56,189,248,0.30)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(56,189,248,0.15)',
    }}>
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" fill="url(#sovaGrad)" />
        <defs>
          <linearGradient id="sovaGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Shimmer thinking skeleton
function ThinkingSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', width: '100%' }} className="animate-fade-in">
      <SovaAvatar />
      <div style={{ flex: 1, paddingTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '12px', color: '#38bdf8', fontWeight: 500 }}>
          <span className="animate-ping" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }} />
          <span className="gemini-text-gradient" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 500 }}>SOVA is thinking...</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['75%', '100%', '83%'].map((w, i) => (
            <div key={i} className="shimmer-bg" style={{ height: '14px', width: w, borderRadius: '6px' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AssistantMessage({ markdown, routing, animate = true, onComplete }) {
  const [phase, setPhase] = useState(animate ? 'thinking' : 'done');
  const [displayed, setDisplayed] = useState(animate ? '' : markdown);
  const [copied, setCopied] = useState(false);
  const stream = useTypewriter();

  useEffect(() => {
    if (!animate) return;
    const thinkTimer = setTimeout(() => {
      setPhase('streaming');
      stream(
        markdown,
        (text) => setDisplayed(text),
        () => { setPhase('done'); onComplete?.(); },
        18
      );
    }, 1100);
    return () => clearTimeout(thinkTimer);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (phase === 'thinking') return <ThinkingSkeleton />;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', width: '100%' }}>
      <SovaAvatar />
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-main)' }}>SOVA</span>
          <span style={{ fontSize: '10px', color: 'rgba(56,189,248,0.8)', fontFamily: "'JetBrains Mono', monospace" }}>
            {routing?.model || 'Local model'}
          </span>
        </div>

        {/* Routing trace — only once the response is fully in, so it doesn't
            pop in mid-stream and distract from the typewriter effect */}
        {phase === 'done' && <RoutingTrace routing={routing} />}

        {/* Content */}
        <div className="prose-dark" style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-main)' }}>
          {parseMarkdown(displayed)}
          {phase === 'streaming' && (
            <span className="animate-blink" style={{
              display: 'inline-block', width: '2px', height: '1.1em',
              background: '#38bdf8', marginLeft: '2px', verticalAlign: 'middle',
            }} />
          )}
        </div>

        {/* Action toolbar (only when done) */}
        {phase === 'done' && (
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ActionBtn icon="copy" label={copied ? '✓ Copied!' : 'Copy'} onClick={handleCopy} />
            <ActionBtn icon="thumbUp" title="Good response" />
            <ActionBtn icon="thumbDown" title="Bad response" />
            <ActionBtn icon="retry" label="Retry" />
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, title, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        padding: '6px', borderRadius: '8px', background: 'none', border: 'none',
        cursor: 'pointer', color: 'var(--text-subtle)', fontSize: '11px',
        transition: 'color 0.15s, background 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-main)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-subtle)'; }}
    >
      {icon === 'copy' && <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
      {icon === 'thumbUp' && <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H3.5A1.5 1.5 0 012 18.5v-7A1.5 1.5 0 013.5 10H7" /></svg>}
      {icon === 'thumbDown' && <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m7 0h3.5A1.5 1.5 0 0022 12.5v-7A1.5 1.5 0 0020.5 4H17" /></svg>}
      {icon === 'retry' && <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
      {label && <span>{label}</span>}
    </button>
  );
}