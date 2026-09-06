import { useState } from 'react';

const TASK_LABELS = {
  coding: 'Code generation',
  reasoning_qa: 'Technical reasoning',
  general_qa: 'General Q&A',
  document_drafting: 'Document drafting',
  vision_ocr: 'Vision / OCR',
  data_analysis: 'Data analysis',
};

// Always-visible routing summary + expandable tool/reasoning trace for a
// single assistant response. This is what makes model auto-selection and
// tool use provable to a viewer, rather than an unverifiable claim.
export function RoutingTrace({ routing }) {
  const [expanded, setExpanded] = useState(false);
  if (!routing) return null;

  const { taskType, model, reason, toolCalls = [], latencyMs, externalCalls = 0 } = routing;

  return (
    <div style={{ margin: '2px 0 10px' }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(56,189,248,0.06)',
          border: '1px solid rgba(56,189,248,0.18)',
          borderRadius: '8px',
          padding: '5px 10px',
          cursor: 'pointer',
          font: 'inherit',
          fontSize: '11px',
          fontFamily: "'JetBrains Mono', monospace",
          width: '100%',
          textAlign: 'left',
          color: '#7dd3fc',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', flexShrink: 0 }} />
        <span style={{ color: '#94a3b8' }}>Routed &rarr;</span>
        <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{model}</span>
        <span style={{ color: '#475569' }}>&middot;</span>
        <span>{TASK_LABELS[taskType] || taskType}</span>
        <span style={{ color: '#475569' }}>&middot;</span>
        <span style={{ color: '#34d399' }}>{externalCalls} external calls</span>
        <span
          style={{
            marginLeft: 'auto',
            color: '#475569',
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        >
          &#9662;
        </span>
      </button>

      {expanded && (
        <div
          style={{
            marginTop: '6px',
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'rgba(15,20,31,0.6)',
            border: '1px solid rgba(255,255,255,0.06)',
            fontSize: '11px',
            color: '#94a3b8',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div>
            <span style={{ color: '#64748b' }}>Why this model: </span>
            {reason}
          </div>
          {typeof latencyMs === 'number' && (
            <div>
              <span style={{ color: '#64748b' }}>Inference time: </span>
              {latencyMs} ms (on-prem GPU)
            </div>
          )}
          {toolCalls.length > 0 ? (
            <div>
              <div style={{ color: '#64748b', marginBottom: '4px' }}>Tool calls:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {toolCalls.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: t.status === 'success' ? '#34d399' : '#f87171' }}>
                      {t.status === 'success' ? '\u2713' : '\u2715'}
                    </span>
                    <span style={{ color: '#cbd5e1' }}>{t.tool}</span>
                    <span style={{ color: '#475569' }}>&mdash; {t.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ color: '#475569', fontStyle: 'italic' }}>No external tools invoked for this task.</div>
          )}
        </div>
      )}
    </div>
  );
}