// Animated authentication status box — three states: checking, success, failed
// Each state has distinct color, icon, message, and progress bar style.

const STATE_CONFIGS = {
  checking: {
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.35)',
    text: '#fcd34d',
    shadow: 'rgba(245,158,11,0.20)',
    trackBg: 'rgba(120,53,15,0.6)',
    trackBorder: 'rgba(245,158,11,0.20)',
    barClass: 'shimmer-bg',
    barWidth: '60%',
    barColor: null,
    message: 'Validating credentials across SOVA secure enclave...',
  },
  success: {
    bg: 'rgba(52,211,153,0.10)',
    border: 'rgba(52,211,153,0.35)',
    text: '#6ee7b7',
    shadow: 'rgba(52,211,153,0.25)',
    trackBg: 'rgba(6,78,59,0.6)',
    trackBorder: 'rgba(52,211,153,0.20)',
    barClass: '',
    barWidth: '100%',
    barColor: 'linear-gradient(to right, #10b981, #2dd4bf)',
    message: 'Authentication successful. Directing to SOVA workspace...',
  },
  failed: {
    bg: 'rgba(244,63,94,0.15)',
    border: 'rgba(244,63,94,0.40)',
    text: '#fda4af',
    shadow: 'rgba(244,63,94,0.30)',
    trackBg: 'rgba(76,5,25,0.6)',
    trackBorder: 'rgba(244,63,94,0.20)',
    barClass: '',
    barWidth: '100%',
    barColor: '#f43f5e',
    message: 'Authentication failed. Please check your Employee ID and Access Token.',
  },
};

function StatusIcon({ state }) {
  if (state === 'checking') {
    return (
      <svg className="animate-spin" style={{ width: 16, height: 16, color: '#fbbf24' }} fill="none" viewBox="0 0 24 24">
        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path style={{ opacity: 0.85 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    );
  }
  if (state === 'success') {
    return (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          className="animate-ping"
          style={{ position: 'absolute', width: 20, height: 20, borderRadius: '50%', background: 'rgba(52,211,153,0.30)' }}
        />
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: 'rgba(52,211,153,0.20)', border: '1px solid rgba(52,211,153,0.40)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399',
        }}>
          <svg style={{ width: 14, height: 14, strokeWidth: 2.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
    );
  }
  // failed
  return (
    <div style={{
      width: 20, height: 20, borderRadius: '50%',
      background: 'rgba(244,63,94,0.25)', border: '1px solid rgba(244,63,94,0.50)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e',
      boxShadow: '0 0 10px rgba(244,63,94,0.5)',
    }}>
      <svg style={{ width: 14, height: 14, strokeWidth: 2.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );
}

export function StatusBox({ state, customMessage }) {
  const cfg = STATE_CONFIGS[state];
  if (!cfg) return null;

  const message = customMessage || cfg.message;

  return (
    <div
      className={state === 'failed' ? 'animate-wobble' : ''}
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '14px',
        borderRadius: '12px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.text,
        fontSize: '0.75rem',
        fontFamily: "'JetBrains Mono', monospace",
        boxShadow: `0 0 25px -2px ${cfg.shadow}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'all 0.3s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ flexShrink: 0 }}>
          <StatusIcon state={state} />
        </div>
        <span style={{ lineHeight: 1.6 }}>{message}</span>
      </div>
      {/* Progress track */}
      <div style={{
        width: '100%',
        height: '4px',
        borderRadius: '9999px',
        background: cfg.trackBg,
        overflow: 'hidden',
        border: `1px solid ${cfg.trackBorder}`,
      }}>
        <div
          className={cfg.barClass}
          style={{
            height: '100%',
            borderRadius: '9999px',
            width: cfg.barWidth,
            background: cfg.barColor || undefined,
            boxShadow: state === 'failed' ? '0 0 8px rgba(244,63,94,0.7)' : state === 'success' ? '0 0 8px rgba(52,211,153,0.6)' : undefined,
            transition: 'width 0.7s ease',
          }}
        />
      </div>
    </div>
  );
}
