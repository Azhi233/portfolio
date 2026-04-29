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
  return {
    homeVideoCaption: source?.homeVideoCaption || '',
  };
}

export default function PrivateFilesPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [draft, setDraft] = useState(createDraft());

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const config = await fetchJson('/config');
      const homepageVideo = config?.['homepage-video'] || {};
      setDraft(createDraft(homepageVideo));
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
      await fetchJson('/config/homepage-video', {
        method: 'POST',
        data: { homeVideoCaption: draft.homeVideoCaption || '' },
      });
      await load();
      setEditorOpen(false);
    } catch (err) {
      setError(err?.message || 'Failed to save homepage video copy.');
    } finally {
      setSaving(false);
    }
  };

  const styleVariants = [
    {
      id: 'cinematic',
      label: 'Cinematic',
      text: `CINEMATIC VISUALS FOR
INDUSTRY & PRODUCT

A QUIET VISUAL
PORTFOLIO BUILT AROUND
LARGE IMAGERY, MINIMAL
TEXT, AND HIGHLY
CURATED MOTION`,
    },
    {
      id: 'minimal',
      label: 'Minimal',
      text: 'A restrained moving image statement for modern brands, products, and environments.',
    },
    {
      id: 'editorial',
      label: 'Editorial',
      text: 'Built for motion-led storytelling with a calm, premium, editorial tone.',
    },
    {
      id: 'bilingual',
      label: 'Bilingual',
      text: `A QUIET VISUAL PORTFOLIO

安静、克制、以影像为核心的作品集`,
    },
  ];

  const charCount = String(draft.homeVideoCaption || '').trim().length;
  const lineCount = String(draft.homeVideoCaption || '').split('\n').filter((line) => String(line).trim()).length;
  const wordCount = String(draft.homeVideoCaption || '').trim().split(/\s+/).filter(Boolean).length;

  const resetToDefault = () => {
    setDraft({ homeVideoCaption: '' });
    setEditorOpen(true);
  };

  const applyPreset = (text) => {
    setDraft({ homeVideoCaption: text });
    setEditorOpen(true);
  };

  const copyLength = useMemo(() => String(draft.homeVideoCaption || '').trim().length, [draft.homeVideoCaption]);
  const isCustom = Boolean(String(draft.homeVideoCaption || '').trim());

  return (
    <>
      <ConsolePanelShell
        eyebrow="HOMEPAGE COPY"
        title="Homepage Video Caption"
        description="把首页大屏视频左下角文案当成一段品牌文案来管理，而不是一张配置表单。"
        badge={{ label: 'COPY SYSTEM', tone: 'warning' }}
      >
        {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}

        <div className="grid gap-4 rounded-3xl border border-white/10 bg-black/25 p-4 md:grid-cols-[1.15fr_0.85fr] md:items-start">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={isCustom ? 'success' : 'warning'}>{isCustom ? 'ACTIVE COPY' : 'DEFAULT COPY'}</Badge>
              <span className="text-xs tracking-[0.14em] text-white/45">{charCount ? `${charCount} chars` : 'empty'}</span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Homepage left-bottom overlay</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 tracking-[0.18em] text-white/80">
                {draft.homeVideoCaption || DEFAULT_COPY}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] tracking-[0.14em] text-white/45">
                <span>LINES {lineCount || '0'}</span>
                <span>•</span>
                <span>WORDS {wordCount || '0'}</span>
                <span>•</span>
                <span>{charCount ? `${charCount} CHARS` : 'EMPTY'}</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {styleVariants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => applyPreset(variant.text)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:border-white/20 hover:bg-white/[0.07]"
                >
                  <p className="text-[11px] tracking-[0.18em] text-white/45">Preset</p>
                  <p className="mt-2 text-sm tracking-[0.12em] text-white">{variant.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <Button type="button" variant="subtle" onClick={load} disabled={loading}>
              REFRESH
            </Button>
            <Button type="button" variant="subtle" onClick={() => setPreviewOpen(true)}>
              PREVIEW
            </Button>
            <Button type="button" variant="primary" onClick={() => setEditorOpen(true)}>
              EDIT COPY
            </Button>
            <Button type="button" variant="subtle" onClick={resetToDefault}>
              RESET TO DEFAULT
            </Button>
          </div>
        </div>
      </ConsolePanelShell>

      <Modal open={previewOpen} title="Homepage Video Copy Preview" onClose={() => setPreviewOpen(false)}>
        <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Preview card</p>
          <div className="mt-4 overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/[0.06] to-black/35 p-5">
            <div className="flex min-h-[280px] items-end rounded-[1.4rem] border border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.45))] p-4">
              <div className="max-w-[24rem] rounded-[1.4rem] border border-white/10 bg-black/40 px-4 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.3)] backdrop-blur-[4px]">
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">Left bottom copy</p>
                <p className="mt-3 whitespace-pre-line text-[11px] leading-6 tracking-[0.24em] text-white/82">
                  {draft.homeVideoCaption || DEFAULT_COPY}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="button" variant="subtle" onClick={() => setPreviewOpen(false)}>
              CLOSE
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={editorOpen} title="Edit Homepage Video Copy" onClose={() => setEditorOpen(false)}>
        <div className="grid gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] tracking-[0.18em] text-white/45">COPY MODE</p>
                <p className="mt-1 text-sm tracking-[0.12em] text-white">Homepage video caption</p>
              </div>
              <Badge tone={draft.homeVideoCaption ? 'success' : 'warning'}>{draft.homeVideoCaption ? 'CUSTOM' : 'DEFAULT'}</Badge>
            </div>
            <p className="mt-3 text-xs leading-5 text-white/55">
              这段文案会直接渲染到首页视频左下角。建议控制在 3 到 6 行，保持克制、留白和品牌感。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {styleVariants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setDraft({ homeVideoCaption: variant.text })}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:border-white/20 hover:bg-white/[0.07]"
              >
                <p className="text-[11px] tracking-[0.18em] text-white/45">Preset</p>
                <p className="mt-2 text-sm tracking-[0.12em] text-white">{variant.label}</p>
                <p className="mt-3 line-clamp-3 whitespace-pre-line text-xs leading-5 text-white/45">
                  {variant.text}
                </p>
              </button>
            ))}
          </div>

          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Left Bottom Copy</p>
            <textarea
              value={draft.homeVideoCaption}
              onChange={(event) => setDraft((prev) => ({ ...prev, homeVideoCaption: event.target.value }))}
              rows={10}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 tracking-[0.14em] text-white outline-none transition placeholder:text-white/30 focus:border-white/30"
              placeholder={DEFAULT_COPY}
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <p className="text-[11px] tracking-[0.18em] text-white/45">{copyLength ? `${copyLength} characters` : 'No copy yet'}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="subtle" onClick={() => setDraft({ homeVideoCaption: DEFAULT_COPY })}>
                APPLY DEFAULT
              </Button>
              <Button type="button" variant="subtle" onClick={() => setDraft({ homeVideoCaption: '' })}>
                CLEAR
              </Button>
              <Button
                type="button"
                variant="subtle"
                onClick={() => setDraft({ homeVideoCaption: String(draft.homeVideoCaption || '').split('\n').slice(0, 6).join('\n') })}
              >
                TRIM TO 6 LINES
              </Button>
            </div>
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
