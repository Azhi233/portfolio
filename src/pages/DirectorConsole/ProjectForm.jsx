import LocalUploadField from '../../components/LocalUploadField.jsx';
import CoverUploader from '../../components/CoverUploader.jsx';

function ToggleField({ label, value, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center justify-between rounded-md border px-3 py-3 text-left text-xs tracking-[0.12em] transition ${
        value
          ? 'border-emerald-300/70 bg-emerald-300/15 text-emerald-200'
          : 'border-zinc-600 bg-zinc-800 text-zinc-300'
      }`}
    >
      <span>{label}</span>
      <span>{value ? 'ON' : 'OFF'}</span>
    </button>
  );
}

export default function ProjectForm({
  mode,
  formState,
  onChange,
  onSubmit,
  onCancel,
  onUploadVideo,
  uploadState,
  coverPreviewUrl,
  projectCategories,
  roleOptions,
  workOutlineOptions,
  formInputClass,
  formTextareaClass,
}) {
  return (
    <form onSubmit={onSubmit} className="mt-5 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
      <h3 className="text-sm tracking-[0.15em] text-zinc-200">{mode === 'edit' ? 'EDIT PROJECT' : 'NEW PROJECT'}</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Title</p>
          <input required value={formState.title} onChange={(e) => onChange('title', e.target.value)} className={formInputClass} placeholder="Project title" />
        </label>
        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Category</p>
          <select value={formState.category} onChange={(e) => onChange('category', e.target.value)} className={formInputClass}>
            {projectCategories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Role</p>
          <select value={formState.role} onChange={(e) => onChange('role', e.target.value)} className={formInputClass}>
            {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
        </label>
        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Release Date</p>
          <input type="date" value={formState.releaseDate} onChange={(e) => onChange('releaseDate', e.target.value)} className={formInputClass} />
        </label>
        <div className="block rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs tracking-[0.12em] text-zinc-300">Private Access</p>
            <button type="button" onClick={() => { const nextPrivate = !formState.isPrivate; onChange('isPrivate', nextPrivate); onChange('publishStatus', nextPrivate ? 'Private' : formState.publishStatus === 'Draft' ? 'Draft' : 'Published'); }} className={`rounded-full border px-3 py-1 text-xs tracking-[0.12em] transition ${formState.isPrivate ? 'border-amber-300/70 bg-amber-300/15 text-amber-200' : 'border-zinc-600 bg-zinc-800 text-zinc-300'}`}>
              {formState.isPrivate ? 'PRIVATE' : 'PUBLIC'}
            </button>
          </div>
          <p className="mt-2 text-[11px] tracking-[0.08em] text-zinc-500">开启后此项目需要密码访问。</p>
          <label className="mt-3 block">
            <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">Public Status</p>
            <select value={formState.isPrivate ? 'Private' : formState.publishStatus === 'Draft' ? 'Draft' : 'Published'} disabled={formState.isPrivate} onChange={(e) => onChange('publishStatus', e.target.value)} className={formInputClass}>
              <option value="Draft">Draft</option><option value="Published">Published</option>
            </select>
          </label>
        </div>
        <label className="block">
          <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Sort Order</p>
          <input type="number" value={formState.sortOrder} onChange={(e) => onChange('sortOrder', Number(e.target.value))} className={formInputClass} placeholder="0" />
        </label>
        <CoverUploader label="Cover URL" value={formState.coverUrl} preview={coverPreviewUrl || formState.coverUrl} buttonText="上传封面图片" onChange={(nextValue) => onChange('coverUrl', nextValue)} onUploadSuccess={(url) => onChange('coverUrl', url)} />
        <LocalUploadField label="Main Video URL" value={formState.videoUrl} placeholder="https://vimeo.com/..." accept="video/*" buttonText="上传视频到本地服务器" uploadState={uploadState.video} onChange={(nextValue) => onChange('videoUrl', nextValue)} onUpload={onUploadVideo} preview={uploadState.video?.url || formState.videoUrl} />
        <label className="block"><p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Client / Agency</p><input value={formState.clientAgency} onChange={(e) => onChange('clientAgency', e.target.value)} className={formInputClass} placeholder="Client / Agency name" /></label>
        <label className="block"><p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Client Code</p><input value={formState.clientCode} onChange={(e) => onChange('clientCode', e.target.value)} className={formInputClass} placeholder="e.g. ACME-0426" /><p className="mt-2 text-[11px] tracking-[0.08em] text-zinc-500">客户可通过统一入口页输入此代码直达私密项目。</p></label>
        <label className="block md:col-span-2"><p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">BTS Media (one URL per line)</p><textarea value={formState.btsMediaText} onChange={(e) => onChange('btsMediaText', e.target.value)} className={formTextareaClass} placeholder="https://.../bts-1.jpg&#10;https://.../bts-2.mp4" /></label>
        {formState.isPrivate ? <><label className="block md:col-span-2"><p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Access Password</p><input value={formState.accessPassword} onChange={(e) => onChange('accessPassword', e.target.value)} className={formInputClass} placeholder="Set password for private access" /><p className="mt-2 text-[11px] tracking-[0.08em] text-zinc-500">建议至少 4 位字符。</p></label><label className="block md:col-span-2"><p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Delivery PIN（提货码）</p><input value={formState.deliveryPin} onChange={(e) => onChange('deliveryPin', e.target.value)} className={formInputClass} placeholder="Set delivery pin for ZIP download unlock" /><p className="mt-2 text-[11px] tracking-[0.08em] text-zinc-500">客户仅在验证提货码后可进行批量高清下载。</p></label></> : null}
        <div className="grid gap-3 md:col-span-2 md:grid-cols-2"><ToggleField label="Featured Project" value={formState.isFeatured} onToggle={() => onChange('isFeatured', !formState.isFeatured)} /><ToggleField label="Visible On Frontend" value={formState.isVisible} onToggle={() => onChange('isVisible', !formState.isVisible)} /></div>
        <div className="md:col-span-2 rounded-md border border-zinc-700 bg-zinc-950 p-3"><p className="text-xs tracking-[0.12em] text-zinc-400">Work Outline 分类投放</p><div className="mt-3 grid gap-2 md:grid-cols-2">{workOutlineOptions.filter((item) => item.id !== 'all').map((item) => { const checked = Array.isArray(formState.outlineTags) && formState.outlineTags.includes(item.id); return (<label key={item.id} className="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-200"><input type="checkbox" checked={checked} onChange={(e) => { const next = new Set(Array.isArray(formState.outlineTags) ? formState.outlineTags : []); if (e.target.checked) next.add(item.id); else next.delete(item.id); onChange('outlineTags', Array.from(next)); }} /><span>{item.label}</span></label>); })}</div></div>
        <label className="block md:col-span-2"><p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Description</p><textarea value={formState.description} onChange={(e) => onChange('description', e.target.value)} className={formTextareaClass} placeholder="Short synopsis..." /></label>
      </div>
      <div className="mt-5 flex items-center justify-end gap-3"><button type="button" onClick={onCancel} className="rounded-md border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm text-zinc-300">Cancel</button><button type="submit" className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-200">Save</button></div>
    </form>
  );
}
