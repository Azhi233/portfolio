import { buildPrivateFileItem } from './usePrivateFilesActions.js';

export default function PrivateFilesPanel({
  privateProjects,
  privateFilesProjectId,
  onPrivateFilesProjectIdChange,
  resetPrivateFileForm,
  privateFileForm,
  onPrivateFileFormChange,
  privateFileError,
  onPrivateFileErrorChange,
  editingPrivateFileId,
  onEditingPrivateFileIdChange,
  privateFiles,
  savePrivateFilesForProject,
  formInputClass,
  formTextareaClass,
}) {
  return (
    <section className="mt-6 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm tracking-[0.16em] text-zinc-100">PRIVATE PROJECT FILE CONTROL</h2>
          <p className="mt-1 text-[11px] tracking-[0.12em] text-zinc-500">单独管理私密项目的上传/下载文件信息、顺序和启用状态。</p>
        </div>
      </div>

      {privateProjects.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 p-6 text-center text-xs tracking-[0.14em] text-zinc-500">
          NO PRIVATE PROJECTS. PLEASE MARK A PROJECT AS PRIVATE FIRST.
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Target Private Project</p>
              <select
                value={privateFilesProjectId}
                onChange={(event) => {
                  onPrivateFilesProjectIdChange(event.target.value);
                  resetPrivateFileForm();
                }}
                className={formInputClass}
              >
                {privateProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title} {project.clientCode ? `· CODE ${project.clientCode}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">File Name</p>
              <input
                value={privateFileForm.name}
                onChange={(event) => {
                  onPrivateFileFormChange((prev) => ({ ...prev, name: event.target.value }));
                  if (privateFileError) onPrivateFileErrorChange('');
                }}
                className={formInputClass}
                placeholder="e.g. Final Delivery Pack"
              />
            </label>

            <label className="block">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Action Type</p>
              <select
                value={privateFileForm.actionType}
                onChange={(event) => onPrivateFileFormChange((prev) => ({ ...prev, actionType: event.target.value }))}
                className={formInputClass}
              >
                <option value="download">download</option>
                <option value="upload">upload</option>
              </select>
            </label>

            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">File URL</p>
              <input
                value={privateFileForm.url}
                onChange={(event) => {
                  onPrivateFileFormChange((prev) => ({ ...prev, url: event.target.value }));
                  if (privateFileError) onPrivateFileErrorChange('');
                }}
                className={formInputClass}
                placeholder="https://..."
              />
            </label>

            <label className="block md:col-span-2">
              <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">Note</p>
              <textarea
                value={privateFileForm.note}
                onChange={(event) => onPrivateFileFormChange((prev) => ({ ...prev, note: event.target.value }))}
                className={formTextareaClass}
                placeholder="Optional note shown to client"
              />
            </label>

            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2">
              <label className="inline-flex items-center gap-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={Boolean(privateFileForm.enabled)}
                  onChange={(event) => onPrivateFileFormChange((prev) => ({ ...prev, enabled: event.target.checked }))}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-emerald-400"
                />
                Enabled
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetPrivateFileForm}
                  className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs tracking-[0.12em] text-zinc-300"
                >
                  RESET
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!privateFilesProjectId) {
                      onPrivateFileErrorChange('请选择私密项目。');
                      return;
                    }

                    const { error, nextItem } = buildPrivateFileItem({
                      privateFileForm,
                      editingPrivateFileId,
                    });

                    if (error) {
                      onPrivateFileErrorChange(error);
                      return;
                    }

                    if (editingPrivateFileId) {
                      const nextFiles = privateFiles.map((item, index) =>
                        item.id === editingPrivateFileId ? { ...item, ...nextItem, sortOrder: index } : item,
                      );
                      savePrivateFilesForProject(privateFilesProjectId, nextFiles);
                    } else {
                      const nextFiles = [...privateFiles, { ...nextItem, sortOrder: privateFiles.length }];
                      savePrivateFilesForProject(privateFilesProjectId, nextFiles);
                    }

                    resetPrivateFileForm();
                  }}
                  className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-4 py-2 text-xs tracking-[0.12em] text-emerald-200"
                >
                  {editingPrivateFileId ? 'UPDATE FILE ITEM' : 'ADD FILE ITEM'}
                </button>
              </div>
            </div>

            {privateFileError ? (
              <p className="md:col-span-2 rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-2 text-xs tracking-[0.1em] text-rose-200">{privateFileError}</p>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3">
            {privateFiles.map((item, index) => (
              <article key={item.id} className="rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-zinc-100">{item.name}</p>
                    <p className="text-[11px] text-zinc-500">{item.url}</p>
                    <p className="mt-1 text-[11px] text-zinc-400">TYPE: {String(item.actionType || 'download').toUpperCase()} · ORDER #{index}</p>
                    {item.note ? <p className="mt-1 text-[11px] text-zinc-400">NOTE: {item.note}</p> : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!item.enabled ? <span className="rounded-full border border-amber-300/70 bg-amber-300/15 px-2 py-0.5 text-[10px] tracking-[0.14em] text-amber-200">DISABLED</span> : null}
                    <button
                      type="button"
                      onClick={() => {
                        if (index === 0) return;
                        const nextFiles = [...privateFiles];
                        const [picked] = nextFiles.splice(index, 1);
                        nextFiles.splice(index - 1, 0, picked);
                        savePrivateFilesForProject(privateFilesProjectId, nextFiles);
                      }}
                      className="rounded-md border border-zinc-600 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (index === privateFiles.length - 1) return;
                        const nextFiles = [...privateFiles];
                        const [picked] = nextFiles.splice(index, 1);
                        nextFiles.splice(index + 1, 0, picked);
                        savePrivateFilesForProject(privateFilesProjectId, nextFiles);
                      }}
                      className="rounded-md border border-zinc-600 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onEditingPrivateFileIdChange(item.id);
                        onPrivateFileFormChange({
                          projectId: privateFilesProjectId,
                          name: item.name,
                          url: item.url,
                          actionType: item.actionType || 'download',
                          note: item.note || '',
                          enabled: item.enabled !== false,
                        });
                        onPrivateFileErrorChange('');
                      }}
                      className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200"
                    >
                      EDIT
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextFiles = privateFiles.filter((x) => x.id !== item.id);
                        savePrivateFilesForProject(privateFilesProjectId, nextFiles);
                        if (editingPrivateFileId === item.id) {
                          resetPrivateFileForm();
                        }
                      }}
                      className="rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-1.5 text-xs text-rose-200"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {privateFiles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 p-6 text-center text-xs tracking-[0.14em] text-zinc-500">
                NO FILE ITEMS IN THIS PRIVATE PROJECT.
              </div>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
