import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useConfig } from '../context/ConfigContext.jsx';

const REVIEW_RATE_LIMIT_KEY = 'reviews.submit.lastAt';
const REVIEW_SUBMIT_COOLDOWN_MS = 60 * 1000;
const MIN_REVIEW_LENGTH = 12;
const BLOCKED_PATTERNS = [/https?:\/\//i, /\b(?:vx|wechat|telegram|whatsapp|qq|微信|电报)\b/i, /博彩|赌博|色情|约炮|刷单|代开/i];

function Testimonials() {
  const { reviews, projects, submitReview } = useConfig();
  const [authorType, setAuthorType] = useState('personal');
  const [form, setForm] = useState({
    projectId: '',
    clientName: '',
    companyName: '',
    position: '',
    content: '',
    extractionCode: '',
    isAnonymous: false,
  });
  const [message, setMessage] = useState('');
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const approvedReviews = useMemo(
    () => (reviews || []).filter((item) => item.status === 'approved'),
    [reviews],
  );

  const privateProjects = useMemo(
    () => (projects || []).filter((project) => project.publishStatus === 'Private'),
    [projects],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const tick = () => {
      const last = Number(window.localStorage.getItem(REVIEW_RATE_LIMIT_KEY) || 0);
      const left = Math.max(0, REVIEW_SUBMIT_COOLDOWN_MS - (Date.now() - last));
      setCooldownLeft(left);
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (cooldownLeft > 0) {
      setMessage(`提交过于频繁，请在 ${Math.ceil(cooldownLeft / 1000)} 秒后重试。`);
      return;
    }

    if (!form.projectId || !form.clientName || !form.content.trim()) {
      setMessage('请完整填写项目、姓名和评价内容。');
      return;
    }

    if (authorType === 'company' && (!form.companyName.trim() || !form.position.trim())) {
      setMessage('公司评价需填写公司名称和职位。');
      return;
    }

    const normalizedContent = String(form.content || '').trim();
    if (normalizedContent.length < MIN_REVIEW_LENGTH) {
      setMessage(`评价内容至少需要 ${MIN_REVIEW_LENGTH} 个字符。`);
      return;
    }

    if (BLOCKED_PATTERNS.some((pattern) => pattern.test(normalizedContent))) {
      setMessage('评价内容包含疑似广告/引流信息，请修改后再提交。');
      return;
    }

    const selectedProject = projects.find((item) => item.id === form.projectId);
    if (!selectedProject) {
      setMessage('项目不存在。');
      return;
    }

    let anonymous = false;
    if (form.extractionCode.trim()) {
      if (String(selectedProject.accessPassword || '') !== form.extractionCode.trim()) {
        setMessage('提取码错误，无法匿名提交。');
        return;
      }
      anonymous = true;
    }

    submitReview({
      projectId: selectedProject.id,
      projectName: selectedProject.title,
      clientName: anonymous ? '匿名用户' : form.clientName,
      companyName: authorType === 'company' ? form.companyName : '',
      position: authorType === 'company' ? form.position : '',
      content: normalizedContent,
      coverUrl: selectedProject.coverUrl || '',
      isFeatured: false,
      authorType,
      isAnonymous: anonymous,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(REVIEW_RATE_LIMIT_KEY, String(Date.now()));
      setCooldownLeft(REVIEW_SUBMIT_COOLDOWN_MS);
    }

    setForm({
      projectId: '',
      clientName: '',
      companyName: '',
      position: '',
      content: '',
      extractionCode: '',
      isAnonymous: false,
    });
    setMessage('已提交，待审核。');
  };

  return (
    <main className="min-h-screen bg-[#050507] pb-16 pt-24 text-zinc-100">
      <section className="mx-auto w-full max-w-7xl px-6 md:px-12">
        <p className="text-xs tracking-[0.2em] text-zinc-500">VOICE OF CLIENTS</p>
        <h1 className="mt-2 font-serif text-4xl tracking-[0.12em] md:text-6xl">TESTIMONIALS</h1>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="columns-1 gap-4 space-y-4 md:columns-2">
            {approvedReviews.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.02 }}
                className="break-inside-avoid overflow-hidden rounded-2xl border border-white/12 bg-white/5 backdrop-blur-md"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  <img src={item.coverUrl} alt={item.projectName} className="h-full w-full object-cover" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                </div>
                <div className="p-4">
                  <p className="text-[10px] tracking-[0.16em] text-zinc-500">{item.projectName}</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-200">“{item.content}”</p>
                  <p className="mt-3 text-[11px] tracking-[0.14em] text-zinc-400">— {item.clientName}</p>
                </div>
              </motion.article>
            ))}
          </div>

          <aside className="rounded-2xl border border-white/12 bg-white/5 p-4 backdrop-blur-md">
            <p className="text-xs tracking-[0.16em] text-zinc-400">提交评价</p>
            {cooldownLeft > 0 ? (
              <p className="mt-2 text-[11px] tracking-[0.1em] text-amber-300">限频保护中：约 {Math.ceil(cooldownLeft / 1000)} 秒后可再次提交。</p>
            ) : (
              <p className="mt-2 text-[11px] tracking-[0.1em] text-zinc-500">基础风控已启用：拦截引流/广告类内容。</p>
            )}

            <div className="mt-3 flex gap-2">
              {['personal', 'company'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAuthorType(type)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    authorType === type
                      ? 'border-cyan-300/70 bg-cyan-300/10 text-cyan-200'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-300'
                  }`}
                >
                  {type === 'company' ? '公司' : '个人'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
              <select
                value={form.projectId}
                onChange={(event) => setForm((prev) => ({ ...prev, projectId: event.target.value }))}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              >
                <option value="">选择关联项目</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>

              <input
                value={form.clientName}
                onChange={(event) => setForm((prev) => ({ ...prev, clientName: event.target.value }))}
                placeholder="您的姓名"
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              />

              {authorType === 'company' ? (
                <>
                  <input
                    value={form.companyName}
                    onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
                    placeholder="公司名称"
                    className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  />
                  <input
                    value={form.position}
                    onChange={(event) => setForm((prev) => ({ ...prev, position: event.target.value }))}
                    placeholder="职位"
                    className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  />
                </>
              ) : null}

              <textarea
                value={form.content}
                onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                placeholder="请输入评价内容"
                className="min-h-28 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              />

              {privateProjects.length > 0 ? (
                <input
                  value={form.extractionCode}
                  onChange={(event) => setForm((prev) => ({ ...prev, extractionCode: event.target.value }))}
                  placeholder="私密用户可输入提取码匿名评论（可选）"
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                />
              ) : null}

              <button type="submit" className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-3 py-2 text-xs tracking-[0.14em] text-emerald-200">
                提交评价
              </button>
            </form>

            {message ? <p className="mt-3 text-xs text-cyan-300">{message}</p> : null}
          </aside>
        </div>
      </section>
    </main>
  );
}

export default Testimonials;
