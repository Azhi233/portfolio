import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

function EncryptedEnvelope({
  projectTitle = 'Private Project',
  hint = '该项目为私密访问，请输入密码后查看。',
  onUnlock,
}) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [opened, setOpened] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const ok = onUnlock?.(input);
    if (!ok) {
      setError('密码错误，请重试。');
      return;
    }
    setError('');
    setUnlocking(true);
    setTimeout(() => setUnlocking(false), 700);
  };

  return (
    <section className="mt-10 min-h-[62vh] rounded-2xl border border-zinc-800 bg-black p-8 md:p-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs tracking-[0.24em] text-zinc-500">ENCRYPTED DELIVERY</p>
        <h2 className="mt-3 font-serif text-3xl tracking-[0.08em] text-zinc-100 md:text-5xl">{projectTitle}</h2>
        <p className="mt-4 text-sm text-zinc-400">{hint}</p>

        <div className="mt-10 flex justify-center">
          <motion.button
            type="button"
            onClick={() => setOpened(true)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.4 }}
            className="relative h-52 w-80 overflow-hidden rounded-xl border border-zinc-700 bg-gradient-to-b from-zinc-800 to-zinc-950"
          >
            <motion.div
              animate={{ rotateZ: [0, 0.6, -0.6, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              className="absolute inset-x-0 top-0 h-1/2 origin-top border-b border-zinc-700 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]"
              style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 border-t border-zinc-800 bg-zinc-900/80" />
            <div className="absolute inset-0 flex items-center justify-center text-xs tracking-[0.18em] text-zinc-300">
              TAP TO UNSEAL
            </div>
          </motion.button>
        </div>

        <AnimatePresence>
          {opened ? (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mx-auto mt-8 max-w-md rounded-xl border border-zinc-700 bg-zinc-950/75 p-4"
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

              <motion.button
                type="submit"
                whileTap={{ scale: 0.98 }}
                animate={unlocking ? { boxShadow: ['0 0 0 rgba(16,185,129,0)', '0 0 28px rgba(16,185,129,0.45)', '0 0 0 rgba(16,185,129,0)'] } : {}}
                className="mt-4 rounded-md border border-cyan-300/70 bg-cyan-300/10 px-4 py-2 text-xs tracking-[0.14em] text-cyan-200 transition hover:bg-cyan-300/20"
              >
                UNSEAL PROJECT
              </motion.button>
            </motion.form>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default EncryptedEnvelope;
