import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import Textarea from '../components/Textarea.jsx';
import FormField from '../components/FormField.jsx';

function AboutPage() {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const infoBlocks = useMemo(() => Object.values(t('about.infoBlocks', {})), [t]);
  const contactChannels = useMemo(() => Object.values(t('about.contactChannels', {})), [t]);

  return (
    <main className="min-h-screen bg-[#050507] px-6 pb-20 pt-24 text-zinc-100 md:px-10">
      <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-8 md:p-10">
          <p className="text-[11px] tracking-[0.28em] text-zinc-500">{t('about.eyebrow')}</p>
          <h1 className="mt-4 font-serif text-4xl tracking-[0.08em] text-white md:text-6xl">{t('about.title')}</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">{t('about.subtitle')}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {infoBlocks.map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] tracking-[0.2em] text-zinc-500">{title}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {contactChannels.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[11px] tracking-[0.2em] text-zinc-500">{label}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-8 md:p-10">
          <p className="text-[11px] tracking-[0.28em] text-zinc-500">{t('about.sendMessage')}</p>
          <h2 className="mt-4 text-2xl tracking-[0.08em] text-white">{t('about.formTitle')}</h2>
          <div className="mt-6 grid gap-4">
            <FormField label={t('about.fields.name')}>
              <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder={t('about.placeholders.name')} />
            </FormField>
            <FormField label={t('about.fields.email')}>
              <Input value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} placeholder={t('about.placeholders.email')} />
            </FormField>
            <FormField label={t('about.fields.message')}>
              <Textarea value={form.message} onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))} placeholder={t('about.placeholders.message')} />
            </FormField>
          </div>
          <div className="mt-6 flex justify-between gap-3">
            <Link to="/" className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs tracking-[0.16em] text-zinc-200">
              {t('about.backHome')}
            </Link>
            <Button type="button" variant="success">
              {t('about.sendMessage')}
            </Button>
          </div>
        </Card>
      </section>
    </main>
  );
}

export default AboutPage;
