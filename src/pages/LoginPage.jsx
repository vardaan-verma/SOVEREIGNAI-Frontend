import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AmbientBackground } from '../components/layout/AmbientBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { PiLogo } from '../components/ui/PiLogo';
import { StatusBox } from '../components/ui/StatusBox';
import { authenticateUser } from '../api/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const empIdRef = useRef(null);
  const tokenRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('failed');
  const [statusMsg, setStatusMsg] = useState('');
  const [statusVisible, setStatusVisible] = useState(false); // hidden on first load


  async function handleLogin(e) {
    e.preventDefault();
    if (loading) return;

    const empId = empIdRef.current?.value.trim();
    const token = tokenRef.current?.value.trim();
    if (!empId || !token) return;

    setLoading(true);
    setStatus('checking');
    setStatusMsg(undefined);
    setStatusVisible(true);

    try {
      const result = await authenticateUser(empId, token);
      if (result.success) {
        localStorage.setItem('sova_session', JSON.stringify(result.data));
        setStatus('success');
        setStatusMsg(result.message);
        // Navigate to home after brief success display
        setTimeout(() => navigate('/'), 1200);
      } else {
        setStatus('failed');
        setStatusMsg(result.message);
      }
    } catch (err) {
      setStatus('failed');
      setStatusMsg('Network error. Could not reach authentication server.');
    } finally {
      setLoading(false);
    }
  }

  function triggerTestState(state) {
    setStatusVisible(true);
    setStatus(state);
    setStatusMsg(undefined);
  }

  return (
    <div
      className="ambient-bg-login"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
      }}
    >
      <AmbientBackground variant="login" />

      {/* Main content */}
      <main
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 16px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '460px' }}>
          <GlassCard>
            <div style={{ padding: '40px' }}>
              {/* Logo + Title */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <div
                    style={{ transition: 'transform 0.3s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <PiLogo size="md" />
                  </div>
                </div>
                <h1 style={{
                  fontSize: 'clamp(1.5rem, 4vw, 1.875rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'white',
                  marginBottom: '4px',
                }}>
                  Welcome to{' '}
                  <span style={{
                    background: 'linear-gradient(to right, #38bdf8, #60a5fa, #818cf8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>SOVA</span>
                </h1>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Employee ID */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label
                      htmlFor="employee-id"
                      style={{ fontSize: '11px', fontWeight: 500, color: '#cbd5e1', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Employee ID
                    </label>
                    <span style={{ fontSize: '11px', color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>e.g. EMP-9428</span>
                  </div>
                  <GlassInput
                    ref={empIdRef}
                    id="employee-id"
                    type="text"
                    placeholder="EMP-XXXX"
                    required
                    defaultValue=""
                    icon={
                      <svg width="16" height="16" fill="none" stroke="#38bdf8" strokeWidth="1.8" viewBox="0 0 24 24" style={{ opacity: 0.8 }}>
                        <path d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    }
                  />
                </div>

                {/* Access Token */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label
                      htmlFor="access-token"
                      style={{ fontSize: '11px', fontWeight: 500, color: '#cbd5e1', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Access Token / Passkey
                    </label>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      style={{ fontSize: '11px', color: '#38bdf8', textDecoration: 'none', fontFamily: "'JetBrains Mono', monospace", transition: 'color 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#7dd3fc')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#38bdf8')}
                    >
                      Request temporary key
                    </a>
                  </div>
                  <GlassInput
                    ref={tokenRef}
                    id="access-token"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••••••"
                    required
                    defaultValue=""
                    icon={
                      <svg width="16" height="16" fill="none" stroke="#38bdf8" strokeWidth="1.8" viewBox="0 0 24 24" style={{ opacity: 0.8 }}>
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    }
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#64748b', display: 'flex', padding: '4px',
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#e2e8f0')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          </svg>
                        )}
                      </button>
                    }
                  />
                </div>

                {/* Submit button */}
                <div style={{ paddingTop: '8px' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="auth-submit-btn"
                    style={{
                      position: 'relative',
                      width: '100%',
                      padding: '14px 24px',
                      borderRadius: '12px',
                      background: 'linear-gradient(to right, #06b6d4, #3b82f6, #6366f1)',
                      border: 'none',
                      color: 'white',
                      fontWeight: 500,
                      fontSize: '14px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 20px rgba(56,189,248,0.25)',
                      transition: 'filter 0.2s, box-shadow 0.2s, transform 0.1s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      overflow: 'hidden',
                      opacity: loading ? 0.8 : 1,
                    }}
                    onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(56,189,248,0.40)'; }}}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(56,189,248,0.25)'; }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.99)')}
                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {/* Shimmer overlay */}
                    <div
                      className={loading ? '' : 'shimmer-hover'}
                      style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
                        transform: 'translateX(-100%)',
                        animation: loading ? 'none' : undefined,
                      }}
                    />
                    {loading ? (
                      <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ color: 'white' }}>
                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <>
                        <span style={{ letterSpacing: '0.02em' }}>Authenticate Session</span>
                        <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '16px', color: '#bfdbfe' }}>π</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Status box */}
              {statusVisible && (
                <div style={{ marginTop: '16px' }}>
                  <StatusBox state={status} customMessage={statusMsg} />

                  {import.meta.env.DEV && (
                    <div style={{
                      marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(30,41,59,0.6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px',
                    }}>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono', monospace", color: '#475569', userSelect: 'none' }}>
                        Test states:
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <ChipBtn label="Checking" color="amber" onClick={() => triggerTestState('checking')} />
                        <ChipBtn label="Success" color="emerald" onClick={() => triggerTestState('success')} />
                        <ChipBtn label="Failed" color="rose" onClick={() => triggerTestState('failed')} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          padding: '16px 24px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(6,10,18,0.60)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '12px',
          color: '#475569',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, color: '#38bdf8', fontSize: '14px' }}>π</span>
          <span>SOVA Autonomous Intelligence Systems © {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

function ChipBtn({ label, color, onClick }) {
  const colors = {
    amber: { bg: 'rgba(245,158,11,0.10)', text: 'rgba(252,211,77,0.9)', border: 'rgba(245,158,11,0.30)', dot: '#fbbf24' },
    emerald: { bg: 'rgba(52,211,153,0.10)', text: 'rgba(110,231,183,0.9)', border: 'rgba(52,211,153,0.30)', dot: '#34d399' },
    rose: { bg: 'rgba(244,63,94,0.10)', text: 'rgba(253,164,175,0.9)', border: 'rgba(244,63,94,0.30)', dot: '#f43f5e' },
  };
  const c = colors[color];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '2px 8px', borderRadius: '6px',
        background: c.bg, color: c.text, border: `1px solid ${c.border}`,
        fontSize: '10px', fontFamily: "'JetBrains Mono', monospace",
        cursor: 'pointer', transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = c.bg.replace('0.10', '0.25'))}
      onMouseLeave={(e) => (e.currentTarget.style.background = c.bg)}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {label}
    </button>
  );
}