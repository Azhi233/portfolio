export default function BulkAssetPreview({
  bulkAssetPreview,
  bulkAssetSelectedKeys,
  onBulkAssetSelectedKeysChange,
  bulkAssetGroupBy,
  onBulkAssetGroupByChange,
  bulkAssetCollapsedGroups,
  onBulkAssetCollapsedGroupsChange,
  bulkAssetForm,
  onBulkAssetFormChange,
}) {
  if (bulkAssetPreview.length === 0) return null;

  const grouped = Object.entries(
    bulkAssetPreview.reduce((acc, item, index) => {
      const groupKey =
        bulkAssetGroupBy === 'ym'
          ? `${item.token.year || '----'}-${String(item.token.month || '').padStart(2, '0')}`
          : bulkAssetGroupBy === 'product'
            ? String(item.token.product || 'unknown').toLowerCase()
            : bulkAssetGroupBy === 'theme'
              ? String(item.token.theme || 'unknown').toLowerCase()
              : String(item.token.orientation || 'unknown').toLowerCase();
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push({ item, index });
      return acc;
    }, {}),
  );

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-[11px] text-zinc-400">
        <span>已选 {bulkAssetSelectedKeys.length} / {bulkAssetPreview.length}</span>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={bulkAssetGroupBy}
            onChange={(event) => {
              onBulkAssetGroupByChange(event.target.value);
              onBulkAssetCollapsedGroupsChange([]);
            }}
            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-300"
          >
            <option value="ym">按年月分组</option>
            <option value="product">按产品分组</option>
            <option value="theme">按主题分组</option>
            <option value="orientation">按横竖屏分组</option>
          </select>
          <button
            type="button"
            onClick={() => onBulkAssetSelectedKeysChange(bulkAssetPreview.map((item, index) => `${item.fileName}-${index}`))}
            className="rounded border border-zinc-700 px-2 py-1 text-[10px] text-zinc-300"
          >
            全选
          </button>
          <button
            type="button"
            onClick={() => onBulkAssetSelectedKeysChange([])}
            className="rounded border border-zinc-700 px-2 py-1 text-[10px] text-zinc-300"
          >
            清空
          </button>
          <input
            value={bulkAssetForm.manualTagsText}
            onChange={(event) => onBulkAssetFormChange((prev) => ({ ...prev, manualTagsText: event.target.value }))}
            className="min-w-56 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-200 outline-none"
            placeholder="手动标签，逗号/换行分隔"
          />
        </div>
      </div>

      {grouped.map(([groupKey, rows]) => {
        const isCollapsed = bulkAssetCollapsedGroups.includes(groupKey);
        const rowKeys = rows.map(({ item, index }) => `${item.fileName}-${index}`);
        const selectedCount = rowKeys.filter((key) => bulkAssetSelectedKeys.includes(key)).length;

        return (
          <div key={groupKey} className="rounded-md border border-zinc-800 bg-zinc-900/40">
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <button
                type="button"
                onClick={() => {
                  onBulkAssetCollapsedGroupsChange((prev) =>
                    prev.includes(groupKey) ? prev.filter((x) => x !== groupKey) : [...prev, groupKey],
                  );
                }}
                className="text-left text-xs tracking-[0.12em] text-zinc-200"
              >
                {isCollapsed ? '▶' : '▼'} {groupKey.toUpperCase()} ({selectedCount}/{rows.length})
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onBulkAssetSelectedKeysChange((prev) => Array.from(new Set([...prev, ...rowKeys])));
                  }}
                  className="rounded border border-zinc-700 px-2 py-1 text-[10px] text-zinc-300"
                >
                  组选
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onBulkAssetSelectedKeysChange((prev) => prev.filter((x) => !rowKeys.includes(x)));
                  }}
                  className="rounded border border-zinc-700 px-2 py-1 text-[10px] text-zinc-300"
                >
                  组清空
                </button>
              </div>
            </div>

            {!isCollapsed ? (
              <div className="space-y-2 px-2 pb-2">
                {rows.map(({ item, index }) => {
                  const rowKey = `${item.fileName}-${index}`;
                  const checked = bulkAssetSelectedKeys.includes(rowKey);
                  return (
                    <label
                      key={rowKey}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-xs transition ${
                        checked
                          ? 'border-emerald-300/60 bg-emerald-300/10 text-zinc-100'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          onBulkAssetSelectedKeysChange((prev) => {
                            if (event.target.checked) return [...prev, rowKey];
                            return prev.filter((x) => x !== rowKey);
                          });
                        }}
                        className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-emerald-400"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="text-zinc-100">{item.token.title}</p>
                        <p className="mt-1 truncate text-[11px] text-zinc-500">{item.fileName}</p>
                        <p className="mt-1 text-[11px] text-zinc-400">
                          {item.token.year || '----'}-{String(item.token.month || '').padStart(2, '0')} · 产品 {item.token.product} · 主题 {item.token.theme} · {item.token.orientation} · {item.token.resolution} · {item.token.stage} · #{item.token.seq} · {item.token.codec}
                        </p>
                        {item.autoTags?.length ? (
                          <p className="mt-1 text-[11px] text-emerald-200">AUTO TAGS · {item.autoTags.join(' · ')}</p>
                        ) : null}
                        {item.tagSummary ? (
                          <p className="mt-1 text-[11px] text-zinc-500">SUMMARY · {item.tagSummary}</p>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
