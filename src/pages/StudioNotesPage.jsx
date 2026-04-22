import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';

const NOTES = [
  {
    index: '01',
    title: 'Editorial direction',
    body: 'A calm, minimal space for layout studies, references, and visual direction notes before a project goes live.',
  },
  {
    index: '02',
    title: 'Production references',
    body: 'Use this section to gather lighting, framing, pacing, and motion ideas in one place.',
  },
  {
    index: '03',
    title: 'Client updates',
    body: 'Capture short status notes, deliverable reminders, or small process updates for internal review.',
  },
];

function NoteRow({ note, className = '' }) {
  return (
    <article className={`border-t border-black/5 pt-5 md:pt-6 ${className}`.trim()}>
      <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)] md:gap-8">
        <div className="flex items-center gap-3 md:block">
          <span className="text-[10px] uppercase tracking-[0.4em] text-[#151515]/35">{note.index}</span>
          <span className="hidden h-px w-10 bg-black/10 md:block md:mt-5" />
        </div>
        <div className="min-w-0">
          <h3 className="max-w-2xl text-[1.55rem] font-light tracking-[0.03em] text-[#151515] md:text-[2.15rem] md:leading-[1.08]">{note.title}</h3>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#151515]/52 md:mt-5 md:text-[15px] md:leading-8">{note.body}</p>
        </div>
      </div>
    </article>
  );
}

export default function StudioNotesPage() {
  return (
    <PageShell className="bg-[#FAF7F1] px-6 pb-20 pt-24 text-[#141414] md:px-12">
      <section className="mx-auto w-full max-w-[1100px]">
        <header className="border-b border-black/5 pb-10 md:pb-12">
          <p className="text-[10px] uppercase tracking-[0.42em] text-[#141414]/42">Studio Notes</p>
          <h1 className="mt-5 max-w-3xl text-[2.9rem] font-light tracking-[0.02em] text-[#141414] md:text-[5.2rem] md:leading-[0.92]">
            Notes & references
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#141414]/52 md:text-base md:leading-8">
            A quiet working module for ideas, references, and production notes.
          </p>
        </header>

        <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] md:gap-14">
          <article>
            <p className="text-[10px] uppercase tracking-[0.42em] text-[#141414]/35">Selected notes</p>
            <h2 className="mt-4 max-w-2xl font-serif text-3xl tracking-[0.02em] text-[#141414] md:text-[3.4rem] md:leading-[0.98]">
              A quiet index for direction, reference, and review.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#141414]/52 md:text-[15px] md:leading-8">
              Use this page as a lightweight editorial space. It stays minimal, but keeps enough structure for internal notes and project
              context.
            </p>

            <div className="mt-10 space-y-7 md:mt-12 md:space-y-9">
              {NOTES.map((note, index) => (
                <NoteRow
                  key={note.title}
                  note={note}
                  className={index === 1 ? 'md:ml-10' : index === 2 ? 'md:ml-20' : ''}
                />
              ))}
            </div>
          </article>

          <aside className="md:pt-2">
            <div className="sticky top-8 space-y-8 rounded-[1.75rem] border border-black/5 bg-white/65 p-6 backdrop-blur-[2px] md:p-8">
              <div>
                <p className="text-[10px] uppercase tracking-[0.42em] text-[#141414]/35">Structure</p>
                <div className="mt-6 space-y-4 text-sm leading-7 text-[#141414]/52 md:space-y-5 md:text-[15px] md:leading-8">
                  <p>01. Editorial direction for the project voice.</p>
                  <p>02. Production references and visual cues.</p>
                  <p>03. Client updates and quick internal checkpoints.</p>
                </div>
              </div>

              <div className="border-t border-black/5 pt-6">
                <p className="text-[10px] uppercase tracking-[0.42em] text-[#141414]/35">Archive note</p>
                <p className="mt-4 text-sm leading-7 text-[#141414]/50 md:text-[15px] md:leading-8">
                  Designed to feel like a printed page: restrained, spacious, and intentionally quiet.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-14 flex items-center justify-between border-t border-black/5 pt-8 md:mt-16">
          <p className="text-[10px] uppercase tracking-[0.42em] text-[#141414]/32">Studio notes archive</p>
          <Link to="/" className="text-[10px] uppercase tracking-[0.3em] text-[#141414]/45 transition-opacity hover:opacity-60">
            Back home
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
