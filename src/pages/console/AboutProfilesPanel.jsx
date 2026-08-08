import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import Textarea from '../../components/Textarea.jsx';
import Modal from '../../components/Modal.jsx';
import ConsolePanelShell from './ConsolePanelShell.jsx';
import { fetchJson } from '../../utils/api.js';
import { aboutProfileToFormValue, createEmptyAboutProfile, formValueToPayload, normalizeAboutProfile, broadcastAboutProfilesUpdate, getAboutProfilesLocalFallback, persistAboutProfilesLocalFallback } from '../../utils/aboutProfiles.js';

function createDraft(profile, index = 0) {
  return aboutProfileToFormValue(profile || createEmptyAboutProfile(index), index);
}

function AboutProfilesPanel() {
  const [profiles, setProfiles] = useState(getAboutProfilesLocalFallback());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(createDraft(null, 0));
  const [editingId, setEditingId] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);

  const applyProfiles = (nextProfiles) => {
    const normalized = persistAboutProfilesLocalFallback(nextProfiles);
    setProfiles(normalized);
    broadcastAboutProfilesUpdate();
    return normalized;
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchJson('/about-profiles');
      const next = Array.isArray(data) ? data.map((item, index) => normalizeAboutProfile(item, index)) : [];
      if (next.length) {
        applyProfiles(next);
      } else {
        setProfiles(getAboutProfilesLocalFallback());
      }
      if (!editingId && next[0]) {
        setDraft(createDraft(next[0], 0));
      }
    } catch (err) {
      const fallback = getAboutProfilesLocalFallback();
      setProfiles(fallback);
      setError(`Using local fallback: ${err?.message || 'Failed to load about profiles.'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    const next = createEmptyAboutProfile(profiles.length);
    setEditingId('');
    setDraft(createDraft(next, profiles.length));
    setEditorOpen(true);
  };

  const openEdit = (profile) => {
    setEditingId(profile.id);
    setDraft(createDraft(profile, profile.sortOrder || 0));
    setEditorOpen(true);
  };

  const updateField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));
  const updateContact = (key, value) => setDraft((prev) => ({ ...prev, contact: { ...(prev.contact || {}), [key]: value } }));
  const updateListField = (key, value) => setDraft((prev) => ({ ...prev, [key]: String(value || '').split('\n').map((item) => item.trim()).filter(Boolean) }));

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = formValueToPayload(draft);
      let next;
      try {
        next = editingId
          ? await fetchJson(`/about-profiles/${editingId}`, { method: 'PUT', data: payload })
          : await fetchJson('/about-profiles', { method: 'POST', data: payload });
      } catch (remoteError) {
        const merged = editingId
          ? profiles.map((item) => (item.id === editingId ? { ...item, ...payload } : item))
          : [...profiles, payload];
        next = persistAboutProfilesLocalFallback(merged);
        setError(`Saved locally only: ${remoteError?.message || 'backend unavailable'}`);
      }
      const normalized = Array.isArray(next) ? next.map((item, index) => normalizeAboutProfile(item, index)) : [];
      applyProfiles(normalized.length ? normalized : profiles);
      setEditorOpen(false);
      setEditingId('');
    } catch (err) {
      setError(err?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (profile) => {
    if (!window.confirm(`Delete ${profile.name}?`)) return;
    setSaving(true);
    setError('');
    try {
      let next;
      try {
        next = await fetchJson(`/about-profiles/${profile.id}`, { method: 'DELETE' });
      } catch (remoteError) {
        next = profiles.filter((item) => item.id !== profile.id);
        next = persistAboutProfilesLocalFallback(next);
        setError(`Deleted locally only: ${remoteError?.message || 'backend unavailable'}`);
      }
      const normalized = Array.isArray(next) ? next.map((item, index) => normalizeAboutProfile(item, index)) : [];
      applyProfiles(normalized);
      if (editingId === profile.id) {
        setEditorOpen(false);
        setEditingId('');
      }
    } catch (err) {
      setError(err?.message || 'Failed to delete profile.');
    } finally {
      setSaving(false);
    }
  };

  const move = async (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= profiles.length) return;
    const next = [...profiles];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    const withOrder = next.map((profile, index) => ({ ...profile, sortOrder: index }));
    setProfiles(withOrder);
    try {
      const saved = await fetchJson('/about-profiles', { method: 'PUT', data: withOrder });
      applyProfiles(Array.isArray(saved) ? saved.map((item, index) => normalizeAboutProfile(item, index)) : withOrder);
    } catch (err) {
      applyProfiles(withOrder);
      setError(`Reordered locally only: ${err?.message || 'backend unavailable'}`);
    }
  };

  const visibleCount = useMemo(() => profiles.filter((item) => item.enabled !== false).length, [profiles]);

  return (
    <>
      <ConsolePanelShell
        eyebrow="ABOUT"
        title="About Profiles"
        description="多人资料卡片由这里统一维护，保存后会同步到 About 页面。"
        badge={{ label: 'PROFILE CMS', tone: 'warning' }}
        footer={(
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="subtle" onClick={load}>REFRESH</Button>
            <Button type="button" variant="primary" onClick={openCreate}>ADD PROFILE</Button>
          </div>
        )}
      >
        {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}
        {loading ? <p className="text-sm text-white/70">Loading about profiles...</p> : null}
        <div className="grid gap-4">
          {profiles.map((profile, index) => (
            <article key={profile.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/50">
                    <span>{index + 1}</span>
                    <span>{profile.enabled ? 'ENABLED' : 'DISABLED'}</span>
                    <span>{profile.sortOrder}</span>
                  </div>
                  <h3 className="mt-2 text-lg tracking-[0.08em] text-white">{profile.name}</h3>
                  <p className="mt-1 text-sm text-white/70">{profile.role}</p>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-white/65">{profile.summary}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="subtle" onClick={() => move(index, index - 1)} disabled={index === 0}>UP</Button>
                  <Button type="button" variant="subtle" onClick={() => move(index, index + 1)} disabled={index === profiles.length - 1}>DOWN</Button>
                  <Button type="button" variant="subtle" onClick={() => openEdit(profile)}>EDIT</Button>
                  <Button type="button" variant="danger" onClick={() => remove(profile)}>DELETE</Button>
                </div>
              </div>
            </article>
          ))}

          {!profiles.length && !loading ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/60">
              当前没有 About 资料。点击 <span className="text-white">ADD PROFILE</span> 创建第一条。
            </div>
          ) : null}
        </div>
        <p className="mt-4 text-xs tracking-[0.18em] text-white/45">VISIBLE {visibleCount} / TOTAL {profiles.length}</p>
      </ConsolePanelShell>

      <Modal open={editorOpen} title={editingId ? 'Edit About Profile' : 'Add About Profile'} onClose={() => setEditorOpen(false)}>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Name</p>
            <Input value={draft.name || ''} onChange={(event) => updateField('name', event.target.value)} placeholder="Name" />
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Role</p>
            <Input value={draft.role || ''} onChange={(event) => updateField('role', event.target.value)} placeholder="Role" />
          </label>
          <label className="block lg:col-span-2">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Portrait URL</p>
            <Input value={draft.portraitUrl || ''} onChange={(event) => updateField('portraitUrl', event.target.value)} placeholder="Image URL" />
          </label>
          <label className="block lg:col-span-2">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Summary</p>
            <Textarea value={draft.summary || ''} onChange={(event) => updateField('summary', event.target.value)} placeholder="Short introduction" />
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Capabilities (one per line)</p>
            <Textarea value={(draft.capabilities || []).join('\n')} onChange={(event) => updateListField('capabilities', event.target.value)} />
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Experience (one per line)</p>
            <Textarea value={(draft.experience || []).join('\n')} onChange={(event) => updateListField('experience', event.target.value)} />
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Email</p>
            <Input value={draft.contact?.email || ''} onChange={(event) => updateContact('email', event.target.value)} />
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Phone</p>
            <Input value={draft.contact?.phone || ''} onChange={(event) => updateContact('phone', event.target.value)} />
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">WeChat</p>
            <Input value={draft.contact?.wechat || ''} onChange={(event) => updateContact('wechat', event.target.value)} />
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Location</p>
            <Input value={draft.contact?.location || ''} onChange={(event) => updateContact('location', event.target.value)} />
          </label>
          <label className="block lg:col-span-2">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Links (label|url, one per line)</p>
            <Textarea
              value={(draft.links || []).map((link) => `${link.label || ''}|${link.url || ''}`).join('\n')}
              onChange={(event) => {
                const nextLinks = String(event.target.value || '')
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => {
                    const [label, url] = line.split('|').map((part) => part.trim());
                    return { label: label || 'Link', url: url || '' };
                  })
                  .filter((link) => link.url);
                setDraft((prev) => ({ ...prev, links: nextLinks }));
              }}
            />
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Accent</p>
            <Input value={draft.accent || ''} onChange={(event) => updateField('accent', event.target.value)} placeholder="#color or keyword" />
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Sort Order</p>
            <Input type="number" value={draft.sortOrder ?? 0} onChange={(event) => updateField('sortOrder', Number(event.target.value))} />
          </label>
          <label className="flex items-center gap-3 lg:col-span-2">
            <input type="checkbox" checked={draft.enabled !== false} onChange={(event) => updateField('enabled', event.target.checked)} />
            <span className="text-sm text-white/80">Enabled</span>
          </label>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="subtle" onClick={() => setEditorOpen(false)}>CANCEL</Button>
          <Button type="button" variant="primary" onClick={save} disabled={saving}>{saving ? 'SAVING...' : 'SAVE'}</Button>
        </div>
      </Modal>
    </>
  );
}

export default AboutProfilesPanel;
