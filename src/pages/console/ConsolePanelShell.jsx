import Badge from '../../components/Badge.jsx';

export default function ConsolePanelShell({
  eyebrow = 'MODULE',
  title,
  description,
  badge,
  children,
  footer,
  className = '',
}) {
  return (
    <section className={`border-b border-white/10 py-6 ${className}`.trim()}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/70">{eyebrow}</p>
          <h2 className="mt-2 text-xl tracking-[0.08em] text-white md:text-2xl">{title}</h2>
          {description ? <p className="mt-2 text-sm leading-7 text-white/80">{description}</p> : null}
        </div>
        {badge ? <Badge tone={badge.tone || 'default'}>{badge.label}</Badge> : null}
      </div>
      <div>{children}</div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </section>
  );
}
