// Glassmorphism card container
export function GlassCard({ children, className = '' }) {
  return (
    <div
      className={`glass-card ${className}`}
      style={{ borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
    >
      {/* Top decorative gradient line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(to right, transparent, rgba(56,189,248,0.70), transparent)',
        }}
      />
      {children}
    </div>
  );
}
