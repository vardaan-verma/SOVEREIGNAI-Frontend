// Shared π logo icon used across both pages
export function PiLogo({ size = 'md', className = '' }) {
  const sizes = {
    sm: { outer: '20px', inner: '12px' },
    md: { outer: '56px', inner: '30px' },
    lg: { outer: '64px', inner: '36px' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div
      className={className}
      style={{
        width: s.outer,
        height: s.outer,
        borderRadius: '14px',
        background: 'linear-gradient(135deg, rgba(56,189,248,0.20), rgba(59,130,246,0.30), rgba(99,102,241,0.20))',
        border: '1px solid rgba(56,189,248,0.30)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(56,189,248,0.15)',
        flexShrink: 0,
      }}
    >
      <span
        className="pi-glow"
        style={{
          fontFamily: 'Georgia, serif',
          fontWeight: 700,
          fontSize: s.inner,
          color: '#93c5fd',
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        π
      </span>
    </div>
  );
}
