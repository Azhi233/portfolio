export default function ProjectModulesPanel({
  exportCmsBundle,
  buildLegacyMigrationPreview,
  caseStudies,
  setMigrationPreview,
  setMigrationPreviewOpen,
  importJsonText,
  setImportJsonText,
  importResult,
  setImportResult,
  importCmsBundle,
  migrationPreviewOpen,
  migrationPreview,
  migrateLegacyCaseStudiesToProjectData,
}) {
  return (
    <section className="mt-6 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm tracking-[0.16em] text-zinc-100">PROJECT MODULES CMS</h2>
          <p className="mt-1 text-[11px] tracking-[0.12em] text-zinc-500">编辑 Toy / Industry 复盘页四模块数据</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const bundle = exportCmsBundle();
              const json = JSON.stringify(bundle, null, 2);
              const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `cms-bundle-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-md border border-cyan-300/70 bg-cyan-300/10 px-4 py-2 text-xs tracking-[0.12em] text-cyan-200"
          >
            EXPORT CMS JSON
          </button>
          <button
            type="button"
            onClick={() => {
              setMigrationPreview(buildLegacyMigrationPreview(caseStudies));
              setMigrationPreviewOpen(true);
            }}
            className="rounded-md border border-amber-300/70 bg-amber-300/10 px-4 py-2 text-xs tracking-[0.12em] text-amber-200"
          >
            PREVIEW & MIGRATE LEGACY DATA
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4">
        <p className="text-xs tracking-[0.16em] text-zinc-400">IMPORT CMS JSON</p>
        <textarea
          value={importJsonText}
          onChange={(event) => {
            setImportJsonText(event.target.value);
            if (importResult) setImportResult('');
          }}
          className="mt-3 min-h-28 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200"
          placeholder="Paste exported cms-bundle JSON here..."
        />
        {importResult ? <p className="mt-2 text-xs text-zinc-300">{importResult}</p> : null}
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setImportJsonText('');
              setImportResult('');
            }}
            className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs text-zinc-300"
          >
            CLEAR
          </button>
          <button
            type="button"
            onClick={() => {
              try {
                const parsed = JSON.parse(importJsonText || '{}');
                const result = importCmsBundle(parsed);
                setImportResult(result?.message || 'Import finished.');
              } catch {
                setImportResult('Invalid JSON format.');
              }
            }}
            className="rounded-md border border-emerald-300/70 bg-emerald-300/10 px-3 py-2 text-xs text-emerald-200"
          >
            IMPORT JSON
          </button>
        </div>
      </div>

      {migrationPreviewOpen ? (
        <div className="mt-4 rounded-2xl border border-amber-300/40 bg-amber-300/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs tracking-[0.16em] text-amber-200">MIGRATION PREVIEW</p>
            <button type="button" onClick={() => setMigrationPreviewOpen(false)} className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300">CLOSE</button>
          </div>
          <div className="mt-3 grid gap-3 text-xs text-zinc-300 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              TOY · TAGS {(migrationPreview?.toy?.targetTags || []).length} · ACTIONS {(migrationPreview?.toy?.actionBullets || []).length}
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              INDUSTRY · TAGS {(migrationPreview?.industry?.targetTags || []).length} · ACTIONS {(migrationPreview?.industry?.actionBullets || []).length}
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                migrateLegacyCaseStudiesToProjectData();
                setMigrationPreviewOpen(false);
              }}
              className="rounded-md border border-amber-300/70 bg-amber-300/10 px-4 py-2 text-xs tracking-[0.12em] text-amber-200"
            >
              CONFIRM MIGRATION
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
