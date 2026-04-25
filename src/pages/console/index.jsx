import Card from '../../components/Card.jsx';
import ReviewNotice from '../../components/ReviewNotice.jsx';
import TranslationReviewPanel from '../../components/TranslationReviewPanel.jsx';
import { useState } from 'react';
import ProjectsPanel from './ProjectsPanel.jsx';
import ConfigPanel from './ConfigPanel.jsx';
import AnalyticsPanel from './AnalyticsPanel.jsx';
import PrivateFilesPanel from './PrivateFilesPanel.jsx';
import TestimonialsPanel from './TestimonialsPanel.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import Button from '../../components/Button.jsx';

const consoleSections = [
  { id: 'projects', label: 'Projects' },
  { id: 'config', label: 'Config' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'files', label: 'Private Files' },
  { id: 'reviews', label: 'Testimonials' },
];

function ConsoleHome() {
  const { t } = useI18n();
  const [mode, setMode] = useState('all');

  return (
    <main className="min-h-screen bg-[#050507] px-4 pb-20 pt-20 text-zinc-100 md:px-8 lg:px-10">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-6 py-6 md:px-8 md:py-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] tracking-[0.32em] text-zinc-500">{t('console.eyebrow')}</p>
                <h1 className="mt-4 font-serif text-4xl tracking-[0.08em] text-white md:text-6xl">{t('console.title')}</h1>
                <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">{t('console.subtitle')}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">Mode</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" variant={mode === 'all' ? 'primary' : 'subtle'} onClick={() => setMode('all')}>All</Button>
                    <Button type="button" variant={mode === 'photos' ? 'primary' : 'subtle'} onClick={() => setMode('photos')}>Photos</Button>
                    <Button type="button" variant={mode === 'videos' ? 'primary' : 'subtle'} onClick={() => setMode('videos')}>Videos</Button>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">Sections</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-300">
                    {consoleSections.map((section) => <span key={section.id} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">{section.label}</span>)}
                  </div>
                </div>
              </div>
            </div>
            <ReviewNotice className="mt-6" />
          </div>
        </Card>

        <TranslationReviewPanel />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
          <ProjectsPanel filterMode={mode} />
          <div className="grid gap-6">
            <ConfigPanel />
            <AnalyticsPanel />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <PrivateFilesPanel />
          <TestimonialsPanel />
        </div>
      </section>
    </main>
  );
}

export default ConsoleHome;
