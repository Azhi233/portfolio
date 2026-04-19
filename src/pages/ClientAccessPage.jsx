import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchJson } from '../utils/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import Select from '../components/Select.jsx';
import Badge from '../components/Badge.jsx';

function ClientAccessPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [state, setState] = useState({ clientCode: '', password: '', error: '', loading: false, matches: [], selectedProjectId: '', submitted: false });

  const hasMultiple = Array.isArray(state.matches) && state.matches.length > 1;
  const hasMatches = Array.isArray(state.matches) && state.matches.length > 0;

  const selectedProject = useMemo(
    () => state.matches.find((item) => item.id === state.selectedProjectId) || state.matches[0] || null,
    [state.matches, state.selectedProjectId],
  );

  const submit = async (event) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const projects = await fetchJson('/projects');
      const matches = (Array.isArray(projects) ? projects : []).filter((project) => {
        const codeOk = !state.clientCode || String(project.clientCode || '').trim().toLowerCase() === String(state.clientCode || '').trim().toLowerCase();
        const passwordOk = !project.accessPassword || String(project.accessPassword || '') === String(state.password || '');
        return codeOk && passwordOk && Boolean(project.accessPassword || project.clientCode);
      });

      if (matches.length === 0) {
        setState((prev) => ({ ...prev, loading: false, submitted: true, error: t('clientAccess.noMatches', 'No private projects matched the provided credentials.'), matches: [] }));
        return;
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        submitted: true,
        error: '',
        matches,
        selectedProjectId: matches[0].id,
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, submitted: true, error: error.message || t('clientAccess.validationFailed', 'Failed to validate access.') }));
    }
  };

  const openProject = () => {
    if (!selectedProject) return;
    navigate(`/project/${selectedProject.id}`);
  };

  return (
    <main className="min-h-screen bg-[#050507] px-6 pb-16 pt-24 text-zinc-100 md:px-10">
      <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-8 md:p-10">
          <p className="text-[11px] tracking-[0.28em] text-zinc-500">{t('clientAccess.eyebrow', 'CLIENT ACCESS')}</p>
          <h1 className="mt-4 font-serif text-4xl tracking-[0.08em] text-white md:text-6xl">{t('clientAccess.title', 'Private Project Vault')}</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">
            {t('clientAccess.subtitle', '输入客户代码与访问密码，快速定位可访问的私密项目。这里会成为客户查看交付内容、私密文件和项目详情的统一入口。')}
          </p>

          <form onSubmit={submit} className="mt-8 grid gap-4">
            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">{t('clientAccess.fields.clientCode', 'Client Code')}</p>
              <Input
                value={state.clientCode}
                onChange={(event) => setState((prev) => ({ ...prev, clientCode: event.target.value, error: '' }))}
                placeholder={t('clientAccess.placeholders.clientCode', 'e.g. ACME-0426')}
              />
            </label>

            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">{t('clientAccess.fields.password', 'Password')}</p>
              <Input
                type="password"
                value={state.password}
                onChange={(event) => setState((prev) => ({ ...prev, password: event.target.value, error: '' }))}
                placeholder={t('clientAccess.placeholders.password', 'Enter access password')}
              />
            </label>

            {state.error ? <p className="rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{state.error}</p> : null}
            {state.submitted && !state.error ? <p className="text-xs tracking-[0.16em] text-emerald-300">{t('clientAccess.validated', 'Access validated successfully.')}</p> : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="success">
                {state.loading ? t('clientAccess.checking', 'CHECKING...') : t('clientAccess.enter', 'ENTER PRIVATE PROJECT')}
              </Button>
              <Link to="/" className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs tracking-[0.16em] text-zinc-200">
                {t('clientAccess.backHome', 'BACK HOME')}
              </Link>
            </div>
          </form>
        </Card>

        <Card className="p-8 md:p-10">
          <p className="text-[11px] tracking-[0.28em] text-zinc-500">{t('clientAccess.results', 'RESULTS')}</p>
          <h2 className="mt-4 text-2xl tracking-[0.08em] text-white">{t('clientAccess.matches', '匹配到的私密项目')}</h2>

          {!state.submitted ? <p className="mt-5 text-sm leading-7 text-zinc-400">{t('clientAccess.waiting', '提交后会在这里显示可访问的项目结果。')}</p> : null}

          {hasMatches ? <p className="mt-4 text-sm text-zinc-500">{t('clientAccess.found', 'Found')} {state.matches.length} {t('clientAccess.accessible', 'accessible project(s).')}</p> : null}
          {state.submitted && !hasMatches && !state.error ? <p className="mt-4 text-sm text-zinc-500">{t('clientAccess.noResults', 'No projects were returned.')}</p> : null}

          {hasMultiple ? (
            <div className="mt-6 grid gap-3">
              <p className="text-xs tracking-[0.16em] text-zinc-400">{t('clientAccess.chooseProject', '检测到多个可访问项目，请选择：')}</p>
              <Select value={state.selectedProjectId} onChange={(event) => setState((prev) => ({ ...prev, selectedProjectId: event.target.value }))}>
                {state.matches.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          {selectedProject ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] tracking-[0.2em] text-zinc-500">{t('clientAccess.project', 'PROJECT')}</p>
                    <h3 className="mt-2 text-lg tracking-[0.08em] text-white">{selectedProject.title}</h3>
                  </div>
                  <Badge tone={selectedProject.isVisible === false ? 'danger' : 'success'}>{selectedProject.isVisible === false ? t('clientAccess.hidden', 'HIDDEN') : t('clientAccess.live', 'LIVE')}</Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{selectedProject.description || t('clientAccess.noDescription', 'No description yet.')}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Button type="button" variant="primary" onClick={openProject}>
                  {t('clientAccess.openSelected', 'OPEN SELECTED PROJECT')}
                </Button>
                <Button type="button" variant="subtle" onClick={() => navigate(`/project/${selectedProject.id}`)}>
                  {t('clientAccess.viewDetails', 'VIEW DETAILS')}
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      </section>
    </main>
  );
}

export default ClientAccessPage;
