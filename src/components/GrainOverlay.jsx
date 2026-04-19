function GrainOverlay({ opacity = 1 }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[2] mix-blend-soft-light"
      style={{
        opacity,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 0.45px, transparent 0.8px)',
        backgroundSize: '3px 3px',
      }}
    />
  );
}

export default GrainOverlay;
