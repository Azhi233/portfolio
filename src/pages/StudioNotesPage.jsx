import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import MinimalTopNav from '../components/MinimalTopNav.jsx';

const NOTES = [
  {
    index: '01',
    title: 'Editorial direction',
    body: 'A quiet place for references, framing ideas, and project tone before production.',
  },
  {
    index: '02',
    title: 'Production references',
    body: 'Gather lighting, texture, pace, and composition cues in one minimal working page.',
  },
  {
    index: '03',
    title: 'Client updates',
    body: 'Use for short status notes, deliverable reminders, and internal review points.',
  },
];

function NoteRow({ note }) {
  return (
    <article className="border-t border-black/5 pt-5 md:pt-6">
      <div className="grid gap-4 md:grid-cols-[150px_minmax(0,1fr)] md:gap-8">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] text-[#141414]/35">{note.index}</span>
        </div>
        <div className="min-w-0">
          <h3 className="max-w-2xl text-[1.6rem] font-light tracking-[0.02em] text-[#141414] md:text-[2.2rem] md:leading-[1.04]">
            {note.title}
          </h3>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#141414]/52 md:text-[15px] md:leading-8">{note.body}</p>
        </div>
      </div>
    </article>
  );
}

export default function StudioNotesPage() {
  return (
    <PageShell className="bg-[#FAF7F1] px-6 pb-20 pt-24 text-[#141414] md:px-12">
      <MinimalTopNav />
      <section className="mx-auto w-full max-w-[1100px]">
        <header className="pb-10 md:pb-12">
          <p className="text-[10px] uppercase tracking-[0.42em] text-[#141414]/32">Studio Notes</p>
          <h1 className="mt-5 max-w-3xl text-[2.4rem] font-light tracking-[0.01em] text-[#141414] md:text-[4.4rem] md:leading-[0.95]">
            Notes & references
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-8 text-[#141414]/46 md:text-[16px] md:leading-9">
            A restrained working page for references and project notes.
          </p>
        </header>

        <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] md:gap-14">
          <article>
            <p className="text-[10px] uppercase tracking-[0.42em] text-[#141414]/28">Selected notes</p>
            <h2 className="mt-4 max-w-2xl font-light text-[1.9rem] tracking-[0.01em] text-[#141414] md:text-[3rem] md:leading-[1.02]">
              A quiet index for direction, reference, and review.
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-8 text-[#141414]/44 md:text-[16px] md:leading-9">
              Built to feel closer to a printed page than a dashboard.
            </p>

            <div className="mt-10 space-y-7 md:mt-12 md:space-y-9">
              {NOTES.map((note, index) => (
                <NoteRow key={note.title} note={note} className={index === 1 ? 'md:ml-10' : index === 2 ? 'md:ml-20' : ''} />
              ))}
            </div>
          </article>

          <aside className="md:pt-2">
            <div className="sticky top-8 space-y-8 p-0">
              <div>
                <p className="text-[10px] uppercase tracking-[0.42em] text-[#141414]/28">Structure</p>
                <div className="mt-6 space-y-4 text-[15px] leading-8 text-[#141414]/44 md:space-y-5 md:text-[16px] md:leading-9">
                  <p>01. Editorial direction for the project voice.</p>
                  <p>02. Production references and visual cues.</p>
                  <p>03. Client updates and quick internal checkpoints.</p>
                </div>
              </div>

              <div className="pt-6">
                <p className="text-[10px] uppercase tracking-[0.42em] text-[#141414]/28">Archive note</p>
                <p className="mt-4 text-[15px] leading-8 text-[#141414]/44 md:text-[16px] md:leading-9">
                  Designed to feel like a printed page: restrained, spacious, and intentionally quiet.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-14 flex items-center justify-between pt-8 md:mt-16">
          <p className="text-[10px] uppercase tracking-[0.42em] text-[#141414]/28">Studio notes archive</p>
          <Link to="/" className="text-[10px] uppercase tracking-[0.32em] text-[#141414]/36 transition-opacity hover:opacity-60">
            Back home
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
