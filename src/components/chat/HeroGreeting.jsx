// Hero greeting shown when no conversation is active
export function HeroGreeting({ firstName, onDemoPrompt }) {
  const prompts = [
    { label: 'Lighting temperature guide', text: 'How do I pick 2700K vs 3000K warm lighting for my desk setup?', color: '#38bdf8' },
    { label: 'Explain Local LLM Quantization', text: 'Explain how local LLM quantizations (GGUF, AWQ, 4-bit) impact GPU VRAM and latency.', color: '#818cf8' },
    { label: 'Tailwind glassmorphism card', text: 'Generate a minimal tailwind flexbox card with glassmorphism styling.', color: '#c084fc' },
  ];

  return (
    <div
      style={{
        margin: 'auto',
        padding: '32px 0',
        textAlign: 'center',
        transition: 'all 0.5s ease-out',
      }}
    >
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        {/* Status badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '4px 12px', borderRadius: '9999px',
          background: 'rgba(56,189,248,0.10)', border: '1px solid rgba(56,189,248,0.20)',
          fontSize: '12px', color: '#93c5fd', marginBottom: '16px',
        }}>
          <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }} />
          <span>Ready to brainstorm or code</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontFamily: 'Outfit, sans-serif', fontWeight: 300, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          <span style={{ color: '#38bdf8', fontWeight: 500 }}>Hello, {firstName || 'Creator'}.</span>
          <br />
          <span style={{ color: 'var(--text-main)' }}>How can I assist your thinking today?</span>
        </h1>

        {/* Demo prompt pills */}
        <div style={{ paddingTop: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', maxWidth: '520px', margin: '0 auto' }}>
          {prompts.map((p) => (
            <button
              key={p.label}
              onClick={() => onDemoPrompt(p.text)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '9999px',
                background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                color: 'var(--text-main)', fontSize: '12px', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(56,189,248,0.5)'; e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--input-border)'; e.currentTarget.style.background = 'var(--input-bg)'; }}
            >
              <span style={{ color: p.color, fontSize: '14px', transition: 'transform 0.2s' }}>✦</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
