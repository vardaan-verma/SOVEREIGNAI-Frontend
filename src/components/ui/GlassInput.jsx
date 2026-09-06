import { forwardRef } from 'react';

// Glassmorphism input field with leading icon slot
export const GlassInput = forwardRef(function GlassInput(
  { icon, rightSlot, type = 'text', placeholder, id, required, defaultValue, value, onChange, className = '', ...rest },
  ref
) {
  return (
    <div style={{ position: 'relative' }}>
      {/* Leading icon */}
      {icon && (
        <div
          style={{
            position: 'absolute',
            insetBlock: 0,
            left: 0,
            paddingLeft: '14px',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          {icon}
        </div>
      )}

      <input
        ref={ref}
        id={id}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        className={`glass-input ${className}`}
        style={{
          paddingLeft: icon ? '40px' : '14px',
          paddingRight: rightSlot ? '44px' : '14px',
          paddingBlock: '12px',
          borderRadius: '12px',
          fontSize: '0.875rem',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: type === 'password' ? '0.15em' : '0.05em',
        }}
        {...rest}
      />

      {/* Trailing slot (e.g. eye toggle) */}
      {rightSlot && (
        <div
          style={{
            position: 'absolute',
            insetBlock: 0,
            right: 0,
            paddingRight: '14px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {rightSlot}
        </div>
      )}
    </div>
  );
});
