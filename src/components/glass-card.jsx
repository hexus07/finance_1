export function GlassCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-3xl backdrop-blur-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] ${className}`}
      style={{ boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}
    >
      {children}
    </div>
  );
}