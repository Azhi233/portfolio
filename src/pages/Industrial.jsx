import CinematicMasonry from '../components/CinematicMasonry.jsx';
import EditableText from '../components/EditableText.jsx';
import { useConfig } from '../context/ConfigContext.jsx';

function Industrial() {
  const { projects, config, updateConfig } = useConfig();
  const industrialProjects = projects
    .filter(
      (project) =>
        project.category === 'Industrial' &&
        project.isVisible !== false &&
        project.publishStatus === 'Published',
    )
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));

  return (
    <main className="min-h-screen bg-[#050507] pb-16 pt-24 text-zinc-100">
      <section className="mx-auto w-full max-w-7xl px-6 md:px-12">
        <EditableText as="p" className="text-xs tracking-[0.2em] text-zinc-500" value={config.industrialCategoryLabel || 'CATEGORY'} onChange={(value) => updateConfig('industrialCategoryLabel', value)} />
        <EditableText as="h1" className="mt-2 font-serif text-4xl tracking-[0.12em] md:text-6xl" value={config.industrialTitle || 'INDUSTRIAL'} onChange={(value) => updateConfig('industrialTitle', value)} />
        <EditableText as="p" className="mt-3 text-xs tracking-[0.14em] text-zinc-500" value={config.industrialCountLabel || `VISIBLE PROJECTS · ${industrialProjects.length}`} onChange={(value) => updateConfig('industrialCountLabel', value)} />

        <div className="mt-10 overflow-hidden rounded-3xl border border-white/8 bg-zinc-950/35 p-4 backdrop-blur-sm md:p-6">
          {industrialProjects.length > 0 ? (
            <CinematicMasonry projects={industrialProjects} columns={4} />
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/70 p-10 text-center text-xs tracking-[0.16em] text-zinc-500">
              NO VISIBLE INDUSTRIAL PROJECTS.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Industrial;
