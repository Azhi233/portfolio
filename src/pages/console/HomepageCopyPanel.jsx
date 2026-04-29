import { useEffect, useMemo, useState } from 'react';
import { fetchJson } from '../../utils/api.js';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import ConsolePanelShell from './ConsolePanelShell.jsx';

const DEFAULT_COPY = `CINEMATIC VISUALS FOR
INDUSTRY & PRODUCT

A QUIET VISUAL
PORTFOLIO BUILT AROUND
LARGE IMAGERY, MINIMAL
TEXT, AND HIGHLY
CURATED MOTION`;

function createDraft(source = {}) {
  return { homeVideoCaption: source?.homeVideoCaption ?? '' };
}

function getHomepageVideoConfig(config = {}) {
  return config?.['homepage-video'] || {};
}

export default function HomepageCopyPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(createDraft());

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const config = await fetchJson('/config');
      setDraft(createDraft(getHomepageVideoConfig(config)));
    } catch (err) {
      setError(err?.message || 'Failed to load homepage video copy.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const nextCaption = draft.homeVideoCaption ?? '';
      const currentConfig = await fetchJson('/config');
      const currentHomepageVideo = getHomepageVideoConfig(currentConfig);
      const savedConfig = await fetchJson('/config', {
        method: 'POST',
        data: {
          'homepage-video': {
            ...currentHomepageVideo,
            homeVideoCaption: nextCaption,
          },
        },
      });
      const savedHomepageVideo = getHomepageVideoConfig(savedConfig);
      setDraft(createDraft({ ...currentHomepageVideo, ...savedHomepageVideo, homeVideoCaption: nextCaption }));
      setEditorOpen(false);
    } catch (err) {
      setError(err?.message || 'Failed to save homepage video copy.');
    } finally {
      setSaving(false);
    }
  };

  const charCount = useMemo(() => String(draft.homeVideoCaption || '').trim().length, [draft.homeVideoCaption]);
  const lineCount = useMemo(() => String(draft.homeVideoCaption || '').split('\n').filter((line) => String(line).trim()).length, [draft.homeVideoCaption]);
  const isCustom = Boolean(String(draft.homeVideoCaption || '').trim());

  return (
    <>
      <ConsolePanelShell
        eyebrow="HOMEPAGE COPY"
        title="Homepage Video Caption"
        description="把首页大屏视频左下角文案当成一段品牌文案来管理。"
        badge={{ label: 'COPY SYSTEM', tone: 'warning' }}
      >
        {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}

        <div className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-4">
          <div className="flex flex-wrap items-center gap-3 text-xs tracking-[0.14em] text-white/45">
            <Badge tone={isCustom ? 'success' : 'warning'}>{isCustom ? 'ACTIVE COPY' : 'DEFAULT COPY'}</Badge>
            <span>{charCount ? `${charCount} chars` : 'empty'}</span>
            <span>LINES {lineCount || '0'}</span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Homepage left-bottom overlay</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 tracking-[0.18em] text-white/80">
              {draft.homeVideoCaption || DEFAULT_COPY}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="subtle" onClick={() => setDraft({ homeVideoCaption: DEFAULT_COPY })}>
              APPLY PRESET
            </Button>
            <Button type="button" variant="subtle" onClick={() => setEditorOpen(true)}>
              EDIT COPY
            </Button>
            <Button type="button" variant="subtle" onClick={() => setDraft({ homeVideoCaption: '' })}>
              RESET
            </Button>
          </div>
        </div>
      </ConsolePanelShell>

      <Modal open={editorOpen} title="Edit Homepage Video Copy" onClose={() => setEditorOpen(false)}>
        <div className="grid gap-4">
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Left Bottom Copy</p>
            <textarea
              value={draft.homeVideoCaption}
              onChange={(event) => setDraft((prev) => ({ ...prev, homeVideoCaption: event.target.value }))}
              rows={12}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 tracking-[0.14em] text-white outline-none transition placeholder:text-white/30 focus:border-white/30"
              placeholder={DEFAULT_COPY}
            />
          </label>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="subtle" onClick={() => setDraft({ homeVideoCaption: DEFAULT_COPY })}>
              APPLY DEFAULT
            </Button>
            <Button type="button" variant="subtle" onClick={() => setDraft({ homeVideoCaption: '' })}>
              CLEAR
            </Button>
            <Button type="button" variant="subtle" onClick={() => setDraft({ homeVideoCaption: String(draft.homeVideoCaption || '').split('\n').slice(0, 6).join('\n') })}>
              TRIM TO 6 LINES
            </Button>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="subtle" onClick={() => setEditorOpen(false)}>
              CANCEL
            </Button>
            <Button type="button" variant="primary" onClick={save} disabled={saving}>
              {saving ? 'SAVING...' : 'SAVE COPY'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
