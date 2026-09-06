import { useRef } from 'react';
import { useParticles } from '../../hooks/useParticles';

// Full-screen ambient background layer used on both pages
// Includes: gradient blobs, grid overlay, particle canvas
export function AmbientBackground({ variant = 'login' }) {
  const canvasRef = useRef(null);
  useParticles(canvasRef);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Grid overlay */}
      <div
        className="grid-overlay"
        style={{ position: 'absolute', inset: 0, opacity: 0.4 }}
      />

      {variant === 'login' ? (
        <>
          {/* Login-style ambient orbs */}
          <div
            className="animate-float-slow"
            style={{
              position: 'absolute',
              top: '-8rem',
              left: '-8rem',
              width: '24rem',
              height: '24rem',
              background: 'rgba(37,99,235,0.20)',
              borderRadius: '50%',
              filter: 'blur(80px)',
            }}
          />
          <div
            className="animate-float-reverse"
            style={{
              position: 'absolute',
              top: '33%',
              right: '-6rem',
              width: '20rem',
              height: '20rem',
              background: 'rgba(79,70,229,0.15)',
              borderRadius: '50%',
              filter: 'blur(80px)',
            }}
          />
          <div
            className="animate-float-slow"
            style={{
              position: 'absolute',
              bottom: '-5rem',
              left: '33%',
              width: '32rem',
              height: '32rem',
              background: 'rgba(8,145,178,0.10)',
              borderRadius: '50%',
              filter: 'blur(100px)',
            }}
          />
        </>
      ) : (
        <>
          {/* Home-style larger blobs */}
          <div
            className="animate-blob-1"
            style={{
              position: 'absolute',
              top: '-8rem',
              right: '-8rem',
              width: '600px',
              height: '600px',
              background: 'linear-gradient(135deg, rgba(37,99,235,0.25), rgba(79,70,229,0.20), rgba(126,34,206,0.25))',
              borderRadius: '50%',
              filter: 'blur(120px)',
            }}
          />
          <div
            className="animate-blob-2"
            style={{
              position: 'absolute',
              bottom: '-9rem',
              left: '-9rem',
              width: '650px',
              height: '650px',
              background: 'linear-gradient(315deg, rgba(126,34,206,0.25), rgba(219,39,119,0.15), rgba(8,145,178,0.25))',
              borderRadius: '50%',
              filter: 'blur(130px)',
            }}
          />
          <div
            className="animate-blob-3"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '550px',
              height: '450px',
              background: 'linear-gradient(90deg, rgba(8,145,178,0.15), rgba(37,99,235,0.15), rgba(126,34,206,0.15))',
              borderRadius: '50%',
              filter: 'blur(140px)',
            }}
          />
        </>
      )}

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.6 }}
      />
    </div>
  );
}
