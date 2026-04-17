import CinematicMasonry from '../components/CinematicMasonry.jsx';
import EditableText from '../components/EditableText.jsx';
import { useConfig } from '../context/ConfigContext.jsx';

function Misc() {
  const { projects, config, updateConfig } = useConfig();
  const miscProjects = projects
    .filter(
      (project) => project.category === 'Misc' && project.isVisible !== false && project.publishStatus === 'Published',
    )
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));

  return (
    <main className="min-h-screen bg-[#050507] pb-16 pt-24 text-zinc-100">
      <section className="mx-auto w-full max-w-7xl px-6 md:px-12">
        <EditableText as="p" className="text-xs tracking-[0.2em] text-zinc-500" value={config.miscCategoryLabel || 'CATEGORY'} onChange={(value) => updateConfig('miscCategoryLabel', value)} />
        <EditableText as="h1" className="mt-2 font-serif text-4xl tracking-[0.12em] md:text-6xl" value={config.miscTitle || 'MISC'} onChange={(value) => updateConfig('miscTitle', value)} />
        <EditableText as="p" className="mt-3 text-xs tracking-[0.14em] text-zinc-500" value={config.miscCountLabel || `VISIBLE PROJECTS · ${miscProjects.length}`} onChange={(value) => updateConfig('miscCountLabel', value)} />

        <div className="mt-10 overflow-hidden rounded-3xl border border-white/8 bg-zinc-950/35 p-4 backdrop-blur-sm md:p-6">
          {miscProjects.length > 0 ? (
            <CinematicMasonry projects={miscProjects} columns={4} />
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/70 p-10 text-center text-xs tracking-[0.16em] text-zinc-500">
              NO VISIBLE MISC PROJECTS.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Misc;
