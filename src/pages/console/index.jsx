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

function ConsoleHome() {
  const { t } = useI18n();
  const [mode, setMode] = useState('all');

  return (
    <main className="min-h-screen bg-[#050507] px-6 pb-20 pt-24 text-zinc-100 md:px-10">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Card className="p-8 md:p-10">
          <p className="text-[11px] tracking-[0.28em] text-zinc-500">{t('console.eyebrow')}</p>
          <h1 className="mt-4 font-serif text-4xl tracking-[0.08em] text-white md:text-6xl">{t('console.title')}</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">
            {t('console.subtitle')}
          </p>
          <ReviewNotice className="mt-6" />
        </Card>

        <TranslationReviewPanel />

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={mode === 'all' ? 'primary' : 'subtle'} onClick={() => setMode('all')}>ALL</Button>
          <Button type="button" variant={mode === 'photos' ? 'primary' : 'subtle'} onClick={() => setMode('photos')}>PHOTOS</Button>
          <Button type="button" variant={mode === 'videos' ? 'primary' : 'subtle'} onClick={() => setMode('videos')}>VIDEOS</Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <ProjectsPanel filterMode={mode} />
          <ConfigPanel />
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <AnalyticsPanel />
          <PrivateFilesPanel />
        </div>
        <TestimonialsPanel />
      </section>
    </main>
  );
}

export default ConsoleHome;
