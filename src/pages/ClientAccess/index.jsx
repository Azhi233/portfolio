import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext.jsx';

const PRIVATE_ACCESS_PREFIX = 'project.private.access.';
const LAST_CLIENT_CODE_KEY = 'clientAccess.lastCode';
const LAST_PROJECT_ID_KEY = 'clientAccess.lastProjectId';
const ADMIN_ACCOUNT = 'zhizhi';
const ADMIN_PASSWORD = 'zhizhi233';
const ACCESS_FAIL_LIMIT = 5;
const LOCK_DURATION_MS = 10 * 60 * 1000;

function ClientAccessPage() {
  const { projects } = useConfig();
  const navigate = useNavigate();
  const [clientCode, setClientCode] = useState(() => {
    if (typeof window === 'undefined') return '';
    return String(window.localStorage.getItem(LAST_CLIENT_CODE_KEY) || '');
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unlockResult, setUnlockResult] = useState(null);
  const [isAdminSession, setIsAdminSession] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    if (typeof window === 'undefined') return '';
    return String(window.localStorage.getItem(LAST_PROJECT_ID_KEY) || '');
  });

  const privateProjects = useMemo(
    () =>
      (projects || []).filter(
        (project) =>
          project?.publishStatus === 'Private' &&
          project?.isVisible !== false &&
          String(project?.clientCode || '').trim(),
      ),
    [projects],
  );

  const readLockState = (normalizedCode) => {
    if (typeof window === 'undefined') return { failCount: 0, lockedUntil: 0 };
    try {
      const raw = window.localStorage.getItem(`clientAccess.lock.${normalizedCode}`);
      if (!raw) return { failCount: 0, lockedUntil: 0 };
      const parsed = JSON.parse(raw);
      return {
        failCount: Number(parsed?.failCount || 0),
        lockedUntil: Number(parsed?.lockedUntil || 0),
      };
    } catch {
      return { failCount: 0, lockedUntil: 0 };
    }
  };

  const writeLockState = (normalizedCode, failCount, lockedUntil) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      `clientAccess.lock.${normalizedCode}`,
      JSON.stringify({ failCount, lockedUntil }),
    );
  };

  const unlockProject = (targetProject) => {
    if (!targetProject?.id) return;
    if (typeof window !== 'undefined') {
      const key = `${PRIVATE_ACCESS_PREFIX}${targetProject.id}`;
      window.sessionStorage.setItem(key, 'true');
      window.localStorage.setItem(LAST_PROJECT_ID_KEY, String(targetProject.id));
    }
    navigate(`/project/${targetProject.id}`);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const code = String(clientCode || '').trim().toLowerCase();
    const pwd = String(password || '');

    if (!code || !pwd) {
      setError('请输入客户代码和访问密码。');
      return;
    }

    const lockState = readLockState(code);
    if (lockState.lockedUntil > Date.now()) {
      const minutes = Math.ceil((lockState.lockedUntil - Date.now()) / 60000);
      setError(`尝试过多，已临时锁定。请约 ${minutes} 分钟后再试。`);
      return;
    }

    const isAdminLogin = code === ADMIN_ACCOUNT && pwd === ADMIN_PASSWORD;

    if (isAdminLogin) {
      const allPrivateProjects = privateProjects;

      writeLockState(code, 0, 0);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LAST_CLIENT_CODE_KEY, String(clientCode || '').trim());
        allPrivateProjects.forEach((project) => {
          const key = `${PRIVATE_ACCESS_PREFIX}${project.id}`;
          window.sessionStorage.setItem(key, 'true');
        });
      }
      setError('');
      setIsAdminSession(true);
      setUnlockResult(allPrivateProjects);
      setSelectedProjectId(allPrivateProjects[0]?.id || selectedProjectId || '');
      return;
    }

    const matchedProjects = privateProjects.filter(
      (project) => String(project.clientCode || '').trim().toLowerCase() === code,
    );

    if (matchedProjects.length === 0) {
      const nextFailCount = lockState.failCount + 1;
      const nextLockedUntil = nextFailCount >= ACCESS_FAIL_LIMIT ? Date.now() + LOCK_DURATION_MS : 0;
      writeLockState(code, nextFailCount, nextLockedUntil);
      setError('未找到对应的私密项目，请检查客户代码。');
      return;
    }

    const unlockedProjects = matchedProjects.filter(
      (project) => String(project.accessPassword || '') === pwd,
    );

    if (unlockedProjects.length === 0) {
      const nextFailCount = lockState.failCount + 1;
      const nextLockedUntil = nextFailCount >= ACCESS_FAIL_LIMIT ? Date.now() + LOCK_DURATION_MS : 0;
      writeLockState(code, nextFailCount, nextLockedUntil);
      setError('访问密码错误，请重试。');
      return;
    }

    writeLockState(code, 0, 0);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LAST_CLIENT_CODE_KEY, String(clientCode || '').trim());
    }
    setError('');
    setIsAdminSession(false);

    if (unlockedProjects.length === 1) {
      unlockProject(unlockedProjects[0]);
      return;
    }

    setUnlockResult(unlockedProjects);
    setSelectedProjectId(unlockedProjects[0]?.id || '');
  };

  return (
    <main className="min-h-screen bg-black px-6 pb-16 pt-24 text-zinc-100 md:px-12">
      <section className="mx-auto w-full max-w-4xl">
        <Link
          to="/"
          className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-900/70 px-4 py-2 text-xs tracking-[0.14em] text-zinc-300 transition hover:border-zinc-500"
        >
          &lt;- Back to Home
        </Link>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-8 md:p-10">
          <p className="text-xs tracking-[0.24em] text-zinc-500">CLIENT ACCESS</p>
          <h1 className="mt-3 font-serif text-3xl tracking-[0.08em] text-zinc-100 md:text-5xl">Private Project Vault</h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            请输入客户代码与访问密码，快速进入你的专属私密项目页面。
          </p>


          <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:max-w-xl">
            {Array.isArray(unlockResult) && unlockResult.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  const quickTarget =
                    unlockResult.find((project) => project.id === selectedProjectId) || unlockResult[0];
                  if (!quickTarget) return;
                  unlockProject(quickTarget);
                }}
                className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-4 py-2 text-xs tracking-[0.14em] text-emerald-200 transition hover:bg-emerald-300/20"
              >
                QUICK OPEN LAST PROJECT
              </button>
            ) : null}
            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Client Code</p>
              <input
                value={clientCode}
                onChange={(event) => {
                  setClientCode(event.target.value);
                  if (error) setError('');
                }}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-400 transition focus:ring-2"
                placeholder="e.g. ACME-0426"
              />
              {String(clientCode || '').trim() ? (
                <button
                  type="button"
                  onClick={() => {
                    setClientCode('');
                    if (typeof window !== 'undefined') {
                      window.localStorage.removeItem(LAST_CLIENT_CODE_KEY);
                    }
                  }}
                  className="mt-2 text-[11px] tracking-[0.08em] text-zinc-500 underline-offset-2 transition hover:text-zinc-300 hover:underline"
                >
                  清除记住的客户代码
                </button>
              ) : null}
            </label>

            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Password</p>
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError('');
                }}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-400 transition focus:ring-2"
                placeholder="Enter access password"
              />
            </label>

            {error ? <p className="rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">{error}</p> : null}

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  className="rounded-md border border-cyan-300/70 bg-cyan-300/10 px-4 py-2 text-xs tracking-[0.14em] text-cyan-200 transition hover:bg-cyan-300/20"
                >
                  ENTER PRIVATE PROJECT
                </button>

                {isAdminSession ? (
                  <button
                    type="button"
                    onClick={() => navigate('/console')}
                    className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-4 py-2 text-xs tracking-[0.14em] text-emerald-200 transition hover:bg-emerald-300/20"
                  >
                    OPEN DIRECTOR CONSOLE
                  </button>
                ) : null}
              </div>
            </div>
          </form>

          {Array.isArray(unlockResult) && unlockResult.length > 1 ? (
            <div className="mt-6 rounded-xl border border-zinc-700/60 bg-zinc-900/50 p-4 md:max-w-xl">
              <p className="text-xs tracking-[0.14em] text-zinc-300">检测到多个可访问项目，请选择：</p>

              <select
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                className="mt-3 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
              >
                {unlockResult.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  const target = unlockResult.find((item) => item.id === selectedProjectId);
                  if (!target) return;
                  unlockProject(target);
                }}
                className="mt-3 rounded-md border border-emerald-300/70 bg-emerald-300/10 px-4 py-2 text-xs tracking-[0.14em] text-emerald-200 transition hover:bg-emerald-300/20"
              >
                OPEN SELECTED PROJECT
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default ClientAccessPage;
