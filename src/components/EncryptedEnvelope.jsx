import { useState } from 'react';

function EncryptedEnvelope({
  projectTitle = 'Private Project',
  hint = '该项目为私密访问，请输入密码后查看。',
  onUnlock,
}) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  return (
    <section className="mt-14 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/75 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] md:p-12">
      <div className="pointer-events-none absolute" aria-hidden />
      <p className="text-xs tracking-[0.24em] text-zinc-500">SEALED MESSAGE</p>
      <h2 className="mt-3 font-serif text-2xl tracking-[0.08em] text-zinc-100 md:text-4xl">{projectTitle}</h2>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">{hint}</p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/70 to-zinc-950/70 p-4 md:p-6">
        <div className="mb-4 text-xs tracking-[0.18em] text-zinc-500">ENCRYPTED ENVELOPE</div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const ok = onUnlock?.(input);
            if (!ok) {
              setError('密码错误，请重试。');
              return;
            }
            setError('');
          }}
          className="max-w-md"
        >
          <input
            type="password"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              if (error) setError('');
            }}
            placeholder="请输入项目访问密码"
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-400 transition focus:ring-2"
          />

          {error ? <p className="mt-3 text-xs tracking-[0.08em] text-rose-400">{error}</p> : null}

          <button
            type="submit"
            className="mt-4 rounded-md border border-cyan-300/70 bg-cyan-300/10 px-4 py-2 text-xs tracking-[0.14em] text-cyan-200 transition hover:bg-cyan-300/20"
          >
            UNSEAL PROJECT
          </button>
        </form>
      </div>
    </section>
  );
}

export default EncryptedEnvelope;
