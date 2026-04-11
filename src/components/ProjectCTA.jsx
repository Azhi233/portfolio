import { useMemo, useState } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { trackEvent } from '../utils/analytics.js';

function ProjectCTA({ className = '' }) {
  const { config } = useConfig();
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const contactEmail = useMemo(() => config.contactEmail?.trim() || 'hello@director.vision', [config.contactEmail]);
  const consultHref = `mailto:${contactEmail}?subject=${encodeURIComponent('Project Consultation')}`;
  const proposalHref = `mailto:${contactEmail}?subject=${encodeURIComponent('Project Proposal Request')}`;

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contactEmail);
      trackEvent('cta_click', { action: 'copy_email', email: contactEmail });
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className={`rounded-3xl border border-white/10 bg-zinc-950/35 p-6 md:p-8 ${className}`}>
      <p className="text-xs tracking-[0.18em] text-zinc-500">CALL TO ACTION</p>
      <h3 className="mt-3 text-xl tracking-[0.06em] text-zinc-100 md:text-2xl">{t('cta.title', 'Ready to kick off your next visual project?')}</h3>
      <p className="mt-2 text-sm text-zinc-400">{t('cta.subtitle', 'Start with a 20-minute discovery call before moving into proposal stage.')}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href={consultHref}
          onClick={() => trackEvent('cta_click', { action: 'consult', email: contactEmail })}
          className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-4 py-2 text-xs tracking-[0.12em] text-emerald-200"
        >
          {t('cta.consult', 'Book a Call')}
        </a>
        <a
          href={proposalHref}
          onClick={() => trackEvent('cta_click', { action: 'proposal', email: contactEmail })}
          className="rounded-md border border-cyan-300/70 bg-cyan-300/10 px-4 py-2 text-xs tracking-[0.12em] text-cyan-200"
        >
          {t('cta.proposal', 'Get Proposal')}
        </a>
        <button
          type="button"
          onClick={copyEmail}
          className="rounded-md border border-zinc-600 bg-zinc-900 px-4 py-2 text-xs tracking-[0.12em] text-zinc-300"
        >
          {copied ? t('cta.copied', 'Email Copied') : t('cta.copyEmail', 'Copy Email')}
        </button>
      </div>

      <p className="mt-3 text-xs text-zinc-500">{contactEmail}</p>
    </section>
  );
}

export default ProjectCTA;
