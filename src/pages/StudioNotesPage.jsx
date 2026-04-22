import { Link } from 'react-router-dom';

const NOTES = [
  {
    title: 'Editorial direction',
    body: 'A calm, minimal space for layout studies, references, and visual direction notes before a project goes live.',
  },
  {
    title: 'Production references',
    body: 'Use this section to gather lighting, framing, pacing, and motion ideas in one place.',
  },
  {
    title: 'Client updates',
    body: 'Capture short status notes, deliverable reminders, or small process updates for internal review.',
  },
];

export default function StudioNotesPage() {
  return (
    <main className="min-h-screen bg-[#FAF9F6] px-6 pb-20 pt-24 text-[#151515] md:px-12">
      <section className="mx-auto w-full max-w-6xl">
        <header className="border-b border-black/5 pb-8">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[#151515]/45">Studio Notes</p>
          <h1 className="mt-4 text-4xl font-light tracking-[0.08em] md:text-6xl">Notes & references</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#151515]/55 md:text-base">
            A quiet working module for ideas, references, and production notes.
          </p>
        </header>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {NOTES.map((note) => (
            <article key={note.title} className="rounded-[1.5rem] border border-black/5 bg-white p-6 shadow-[0_18px_55px_rgba(0,0,0,0.04)]">
              <h2 className="text-lg font-light tracking-[0.08em]">{note.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#151515]/55">{note.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-12">
          <Link to="/" className="text-[11px] uppercase tracking-[0.22em] text-[#151515]/45 transition-opacity hover:opacity-60">
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
