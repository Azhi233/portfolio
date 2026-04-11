import { useMemo } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';

function splitLines(text) {
  return String(text || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseTestimonials(text) {
  return splitLines(text)
    .map((line) => {
      const [quote, role, company] = line.split('|').map((x) => x?.trim() || '');
      if (!quote) return null;
      return { quote, role, company };
    })
    .filter(Boolean);
}

function AboutContact() {
  const { config } = useConfig();
  const { t } = useI18n();

  const awards = useMemo(() => splitLines(config.resumeAwardsText), [config.resumeAwardsText]);
  const experiences = useMemo(() => splitLines(config.resumeExperienceText), [config.resumeExperienceText]);
  const gearList = useMemo(() => splitLines(config.resumeGearText), [config.resumeGearText]);
  const testimonials = useMemo(() => parseTestimonials(config.testimonialsText), [config.testimonialsText]);
  const brands = useMemo(() => splitLines(config.brandNamesText), [config.brandNamesText]);

  return (
    <main className="min-h-screen bg-[#050507] pb-16 pt-24 text-zinc-100">
      <section className="mx-auto w-full max-w-7xl px-6 md:px-12">
        <p className="text-xs tracking-[0.2em] text-zinc-500">CATEGORY</p>
        <h1 className="mt-2 font-serif text-4xl tracking-[0.12em] md:text-6xl">{t('about.title', 'ABOUT & CONTACT')}</h1>

        <div className="mt-8 grid gap-6 rounded-3xl border border-white/8 bg-zinc-950/35 p-6 backdrop-blur-sm md:grid-cols-3 md:p-8">
          <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs tracking-[0.2em] text-zinc-500">EXPERIENCE</p>
            {experiences.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-300">
                {experiences.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-zinc-500">No experience data yet.</p>
            )}
          </article>

          <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs tracking-[0.2em] text-zinc-500">AWARDS</p>
            {awards.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-300">
                {awards.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-zinc-500">No awards data yet.</p>
            )}
          </article>

          <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs tracking-[0.2em] text-zinc-500">GEAR LIST</p>
            {gearList.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-300">
                {gearList.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-zinc-500">No gear list data yet.</p>
            )}
          </article>
        </div>

        <div className="mt-6 rounded-3xl border border-white/8 bg-zinc-950/35 p-6 backdrop-blur-sm md:p-8">
          <p className="text-xs tracking-[0.2em] text-zinc-500">TESTIMONIALS</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {testimonials.length > 0 ? (
              testimonials.slice(0, 6).map((item, idx) => (
                <article key={`${item.quote}-${idx}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm leading-relaxed text-zinc-200">“{item.quote.replace(/^“|”$/g, '')}”</p>
                  <p className="mt-3 text-xs text-zinc-500">{[item.role, item.company].filter(Boolean).join(' · ') || 'Client'}</p>
                </article>
              ))
            ) : (
              <p className="text-xs text-zinc-500">No testimonials yet.</p>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/8 bg-zinc-950/35 p-6 backdrop-blur-sm md:p-8">
          <p className="text-xs tracking-[0.2em] text-zinc-500">BRAND COLLABORATIONS</p>
          <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {brands.length > 0 ? (
              brands.slice(0, 12).map((brand) => (
                <div
                  key={brand}
                  className="flex min-h-16 items-center justify-center rounded-xl border border-white/10 bg-black/20 px-3 text-xs tracking-[0.12em] text-zinc-300"
                >
                  {brand}
                </div>
              ))
            ) : (
              <p className="col-span-full text-xs text-zinc-500">No brands yet.</p>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/8 bg-zinc-950/35 p-6 backdrop-blur-sm md:p-8">
          <p className="text-xs tracking-[0.2em] text-zinc-500">CONTACT</p>
          <div className="mt-4 grid gap-3 text-sm tracking-[0.08em] text-zinc-300 md:grid-cols-3">
            <p>Email: {config.contactEmail || 'Not set yet'}</p>
            <p>Phone: {config.contactPhone || 'Not set yet'}</p>
            <p>Location: {config.contactLocation || 'Not set yet'}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AboutContact;
