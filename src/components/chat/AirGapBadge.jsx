import { useNetworkLog } from '../../hooks/useNetworkLog';

// Always-visible proof, not just a claim: reflects the real fetch log.
// Turns red the instant a single external request is ever made — this is
// deliberately not something a component prop can override, since the
// whole point is that it can't be faked from inside the app.
export function AirGapBadge({ onClick, onMouseEnter, onMouseLeave, className }) {
  const log = useNetworkLog();
  const externalCount = log.filter((e) => e.classification === 'external').length;
  const isClean = externalCount === 0;

  return (
    <button
      className={className}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={
        isClean
          ? 'No external network requests detected this session — click for details'
          : `${externalCount} external request(s) detected — click for details`
      }
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 500,
        background: isClean ? 'rgba(16,185,129,0.10)' : 'rgba(244,63,94,0.15)',
        border: `1px solid ${isClean ? 'rgba(16,185,129,0.30)' : 'rgba(244,63,94,0.40)'}`,
        color: isClean ? '#6ee7b7' : '#fda4af',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
        background: isClean ? '#10b981' : '#f43f5e',
        boxShadow: isClean ? '0 0 6px #10b981' : '0 0 6px #f43f5e',
      }} />
      <span>{isClean ? 'Air-gapped' : `${externalCount} external call${externalCount === 1 ? '' : 's'}`}</span>
    </button>
  );
}