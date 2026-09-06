import { useEffect, useState } from 'react';

const FILE_ICONS = {
  pdf: '📄',
  doc: '📝',
  docx: '📝',
  xls: '📊',
  xlsx: '📊',
  csv: '📊',
  txt: '📃',
  default: '📎',
};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExt(name) {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

// file: a browser File object. removable=false renders a read-only chip
// (for already-sent messages); removable=true shows a remove (×) button
// (for the composer preview, before sending).
export function AttachmentChip({ file, onRemove, removable = true }) {
  const isImage = file.type?.startsWith('image/');
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!isImage) return undefined;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  if (isImage) {
    return (
      <div
        style={{
          position: 'relative', width: 64, height: 64, borderRadius: '10px',
          overflow: 'hidden', flexShrink: 0, border: '1px solid var(--input-border)',
          background: 'rgba(15,20,31,0.6)',
        }}
        title={file.name}
      >
        {previewUrl && (
          <img
            src={previewUrl}
            alt={file.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
        {removable && (
          <button
            type="button"
            onClick={() => onRemove?.()}
            aria-label={`Remove ${file.name}`}
            style={{
              position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%',
              background: 'rgba(10,13,20,0.85)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#f1f5f9', fontSize: '11px', lineHeight: '16px', cursor: 'pointer', padding: 0,
            }}
          >
            &times;
          </button>
        )}
      </div>
    );
  }

  const ext = getExt(file.name);
  const icon = FILE_ICONS[ext] || FILE_ICONS.default;

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
        padding: '6px 10px', borderRadius: '10px', maxWidth: 180,
        background: 'rgba(15,20,31,0.6)', border: '1px solid var(--input-border)',
      }}
      title={file.name}
    >
      <span style={{ fontSize: '16px', flexShrink: 0 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: '11px', color: 'var(--text-main)', whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {file.name}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-subtle)', fontFamily: "'JetBrains Mono', monospace" }}>
          {formatSize(file.size)}
        </div>
      </div>
      {removable && (
        <button
          type="button"
          onClick={() => onRemove?.()}
          aria-label={`Remove ${file.name}`}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-subtle)',
            cursor: 'pointer', fontSize: '14px', padding: 0, flexShrink: 0,
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
}