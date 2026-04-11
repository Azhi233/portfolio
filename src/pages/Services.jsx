import { useMemo } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';

function splitLines(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseServices(text) {
  return splitLines(text).map((line, idx) => {
    const [title, deliverables, timeline, forWho] = line.split('|').map((x) => x?.trim() || '');
    return {
      id: `${title}-${idx}`,
      title: title || `Service ${idx + 1}`,
      deliverables,
      timeline,
      forWho,
    };
  });
}

function Services() {
  const { config } = useConfig();
  const { t } = useI18n();

  const services = useMemo(() => parseServices(config.servicesText), [config.servicesText]);

  return (
    <main className="min-h-screen bg-[#050507] pb-16 pt-24 text-zinc-100">
      <section className="mx-auto w-full max-w-7xl px-6 md:px-12">
        <p className="text-xs tracking-[0.2em] text-zinc-500">CATEGORY</p>
        <h1 className="mt-2 font-serif text-4xl tracking-[0.12em] md:text-6xl">{t('services.title', 'SERVICES & DELIVERABLES')}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
          {t('services.subtitle', '清晰列出合作范围、周期与交付物，让客户快速判断是否匹配。')}
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <article key={service.id} className="rounded-3xl border border-white/10 bg-zinc-950/40 p-6">
              <p className="text-xs tracking-[0.2em] text-zinc-500">SERVICE</p>
              <h2 className="mt-3 text-lg tracking-[0.08em] text-zinc-100">{service.title}</h2>
              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                {service.deliverables ? (
                  <div>
                    <p className="text-[11px] tracking-[0.14em] text-zinc-500">DELIVERABLES</p>
                    <p className="mt-1">{service.deliverables}</p>
                  </div>
                ) : null}
                {service.timeline ? (
                  <div>
                    <p className="text-[11px] tracking-[0.14em] text-zinc-500">TIMELINE</p>
                    <p className="mt-1">{service.timeline}</p>
                  </div>
                ) : null}
                {service.forWho ? (
                  <div>
                    <p className="text-[11px] tracking-[0.14em] text-zinc-500">BEST FOR</p>
                    <p className="mt-1">{service.forWho}</p>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Services;
