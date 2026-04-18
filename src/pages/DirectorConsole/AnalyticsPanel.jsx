export default function AnalyticsPanel({
  analyticsSnapshot,
  analyticsAutoRefresh,
  setAnalyticsAutoRefresh,
  setAnalyticsSnapshot,
  getAnalyticsSnapshot,
  clearAnalytics,
  analyticsTimeRange,
  setAnalyticsTimeRange,
  analyticsEventType,
  setAnalyticsEventType,
  analyticsChartMetric,
  setAnalyticsChartMetric,
  analyticsCompareMetric,
  setAnalyticsCompareMetric,
  analyticsKpis,
  analyticsWoW,
  analyticsSummary,
  analyticsAnomaly,
  filterInputClass,
  analyticsTimeRangeOptions,
  analyticsMetricOptions,
  analyticsCompareOptions,
  showMetricA,
  setShowMetricA,
  showMetricB,
  setShowMetricB,
  analyticsChartData,
  analyticsCompareChartData,
  analyticsChartMax,
  analyticsHoverIndex,
  setAnalyticsHoverIndex,
  pageViewTopRoutes,
  topVideoPlays,
  analyticsSearchQuery,
  setAnalyticsSearchQuery,
  analyticsFilteredEvents,
}) {
  return (
    <section className="mt-6 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm tracking-[0.16em] text-zinc-100">ANALYTICS OVERVIEW</h2>
          <p className="mt-1 text-[11px] tracking-[0.12em] text-zinc-500">
            PV {analyticsSnapshot.totalPV} · UV {analyticsSnapshot.totalUV}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={analyticsAutoRefresh}
            onChange={(event) => setAnalyticsAutoRefresh(event.target.value)}
            className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs tracking-[0.12em] text-zinc-200"
          >
            <option value="off">AUTO: OFF</option>
            <option value="10s">AUTO: 10S</option>
            <option value="30s">AUTO: 30S</option>
          </select>

          <button
            type="button"
            onClick={() => setAnalyticsSnapshot(getAnalyticsSnapshot())}
            className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-xs tracking-[0.12em] text-zinc-200 transition hover:border-zinc-400"
          >
            REFRESH
          </button>
          <button
            type="button"
            onClick={() => {
              clearAnalytics();
              setAnalyticsSnapshot(getAnalyticsSnapshot());
            }}
            className="rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-2 text-xs tracking-[0.12em] text-rose-200 transition hover:bg-rose-400/20"
          >
            CLEAR DATA
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-3 md:grid-cols-4">
        <label className="block">
          <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">TIME RANGE</p>
          <select value={analyticsTimeRange} onChange={(event) => setAnalyticsTimeRange(event.target.value)} className={filterInputClass}>
            {analyticsTimeRangeOptions.map((item) => (
              <option key={item} value={item}>{item.toUpperCase()}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">EVENT TYPE FILTER</p>
          <select value={analyticsEventType} onChange={(event) => setAnalyticsEventType(event.target.value)} className={filterInputClass}>
            <option value="all">ALL</option>
            {analyticsMetricOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">CHART METRIC A</p>
          <select value={analyticsChartMetric} onChange={(event) => setAnalyticsChartMetric(event.target.value)} className={filterInputClass}>
            {analyticsMetricOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <p className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">CHART METRIC B</p>
          <select value={analyticsCompareMetric} onChange={(event) => setAnalyticsCompareMetric(event.target.value)} className={filterInputClass}>
            {analyticsCompareOptions.map((item) => (
              <option key={item} value={item}>{item === 'none' ? 'NONE' : item}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-cyan-300/25 bg-cyan-300/5 p-3"><p className="text-[10px] tracking-[0.14em] text-cyan-200">TODAY PV</p><p className="mt-1 text-lg text-cyan-100">{analyticsKpis.todayPV}</p></div>
        <div className="rounded-xl border border-sky-300/25 bg-sky-300/5 p-3"><p className="text-[10px] tracking-[0.14em] text-sky-200">7D UV</p><p className="mt-1 text-lg text-sky-100">{analyticsKpis.sevenDayUV}</p></div>
        <div className="rounded-xl border border-violet-300/25 bg-violet-300/5 p-3"><p className="text-[10px] tracking-[0.14em] text-violet-200">VIDEO PLAYS</p><p className="mt-1 text-lg text-violet-100">{analyticsKpis.videoPlayCount}</p></div>
        <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/5 p-3"><p className="text-[10px] tracking-[0.14em] text-emerald-200">AVG WATCH (S)</p><p className="mt-1 text-lg text-emerald-100">{analyticsKpis.avgWatchDuration}</p></div>
        <div className="rounded-xl border border-amber-300/25 bg-amber-300/5 p-3"><p className="text-[10px] tracking-[0.14em] text-amber-200">CTA CONSULT</p><p className="mt-1 text-lg text-amber-100">{analyticsKpis.ctaConsultCount}</p></div>
        <div className="rounded-xl border border-fuchsia-300/25 bg-fuchsia-300/5 p-3"><p className="text-[10px] tracking-[0.14em] text-fuchsia-200">CTA PROPOSAL</p><p className="mt-1 text-lg text-fuchsia-100">{analyticsKpis.ctaProposalCount}</p></div>
        <div className="rounded-xl border border-lime-300/25 bg-lime-300/5 p-3"><p className="text-[10px] tracking-[0.14em] text-lime-200">CTA COPY EMAIL</p><p className="mt-1 text-lg text-lime-100">{analyticsKpis.ctaCopyEmailCount}</p></div>
        <div className="rounded-xl border border-rose-300/25 bg-rose-300/5 p-3"><p className="text-[10px] tracking-[0.14em] text-rose-200">CTA TOTAL</p><p className="mt-1 text-lg text-rose-100">{analyticsKpis.ctaTotal}</p><p className="mt-1 text-[11px] text-rose-200/80">CVR {analyticsKpis.ctaConversionRate}% · PV {analyticsKpis.filteredPageViews}</p></div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-3">
          <p className="text-[10px] tracking-[0.14em] text-zinc-400">TODAY VS YESTERDAY (PV)</p>
          <p className="mt-1 text-sm text-zinc-200">
            {analyticsWoW.todayPv} vs {analyticsWoW.yesterdayPv}
            <span className={`ml-2 ${analyticsWoW.todayVsYesterdayDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {analyticsWoW.todayVsYesterdayDelta >= 0 ? '+' : ''}{analyticsWoW.todayVsYesterdayDelta}%
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-3">
          <p className="text-[10px] tracking-[0.14em] text-zinc-400">LAST 7D VS PREV 7D (VIDEO PLAYS)</p>
          <p className="mt-1 text-sm text-zinc-200">
            {analyticsWoW.this7dPlays} vs {analyticsWoW.prev7dPlays}
            <span className={`ml-2 ${analyticsWoW.playWoWDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {analyticsWoW.playWoWDelta >= 0 ? '+' : ''}{analyticsWoW.playWoWDelta}%
            </span>
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-3">
        <p className="text-[10px] tracking-[0.14em] text-zinc-400">AUTO SUMMARY</p>
        <p className="mt-1 text-xs text-zinc-300">{analyticsSummary}</p>
        {analyticsAnomaly ? <p className="mt-2 text-xs text-amber-300">{analyticsAnomaly}</p> : null}
      </div>

      <div className="mt-3 rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs tracking-[0.16em] text-zinc-400">TREND LINE (COMPARISON)</p>
          <div className="flex items-center gap-3 text-[11px] tracking-[0.12em]">
            <button type="button" onClick={() => setShowMetricA((v) => !v)} className={`inline-flex items-center gap-1 rounded px-2 py-1 ${showMetricA ? 'text-cyan-300' : 'text-zinc-500'}`}><span className="inline-block h-2 w-2 rounded-full bg-cyan-300" />{analyticsChartMetric}</button>
            {analyticsCompareMetric !== 'none' ? <button type="button" onClick={() => setShowMetricB((v) => !v)} className={`inline-flex items-center gap-1 rounded px-2 py-1 ${showMetricB ? 'text-violet-300' : 'text-zinc-500'}`}><span className="inline-block h-2 w-2 rounded-full bg-violet-300" />{analyticsCompareMetric}</button> : null}
          </div>
        </div>

        <div className="relative h-52 w-full overflow-hidden rounded-lg border border-zinc-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.35)_0%,rgba(10,15,24,0.4)_100%)]">
          <svg viewBox="0 0 100 40" className="h-full w-full transition-all duration-300">
            {[0, 1, 2, 3, 4].map((n) => {
              const y = 8 + n * 7;
              return <line key={n} x1="0" y1={y} x2="100" y2={y} stroke="rgba(148,163,184,0.18)" strokeWidth="0.3" />;
            })}
            {showMetricA ? <polyline fill="none" stroke="rgba(56,189,248,0.95)" strokeWidth="1.3" points={analyticsChartData.map((point, index) => {
              const x = (index / Math.max(1, analyticsChartData.length - 1)) * 100;
              const y = 36 - (point.value / analyticsChartMax) * 30;
              return `${x},${y}`;
            }).join(' ')} /> : null}
            {analyticsCompareMetric !== 'none' && showMetricB ? <polyline fill="none" stroke="rgba(167,139,250,0.95)" strokeWidth="1.3" points={analyticsCompareChartData.map((point, index) => {
              const x = (index / Math.max(1, analyticsCompareChartData.length - 1)) * 100;
              const y = 36 - (point.value / analyticsChartMax) * 30;
              return `${x},${y}`;
            }).join(' ')} /> : null}
          </svg>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] tracking-[0.08em] text-zinc-500 md:grid-cols-6">
          {analyticsChartData.map((point, index) => (
            <button key={point.label} type="button" onMouseEnter={() => setAnalyticsHoverIndex(index)} onMouseLeave={() => setAnalyticsHoverIndex(null)} className="rounded border border-zinc-800 bg-zinc-900/40 px-2 py-1 text-left">
              <p>{point.label}</p>
              <p className="text-cyan-300">A {point.value}</p>
              {analyticsCompareMetric !== 'none' ? <p className="text-violet-300">B {analyticsCompareChartData[index]?.value || 0}</p> : null}
            </button>
          ))}
        </div>

        {analyticsHoverIndex !== null ? (
          <div className="mt-2 rounded-md border border-zinc-700 bg-black/50 px-3 py-2 text-xs text-zinc-300">
            <p>Bucket: {analyticsChartData[analyticsHoverIndex]?.label}</p>
            <p>A ({analyticsChartMetric}): {analyticsChartData[analyticsHoverIndex]?.value || 0}</p>
            {analyticsCompareMetric !== 'none' ? <p>B ({analyticsCompareMetric}): {analyticsCompareChartData[analyticsHoverIndex]?.value || 0}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4">
          <p className="text-xs tracking-[0.16em] text-zinc-400">TOP ROUTES</p>
          <div className="mt-3 space-y-2">
            {pageViewTopRoutes.length > 0 ? pageViewTopRoutes.map(([path, count], idx) => (
              <div key={path} className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs"><span className="tracking-[0.12em] text-zinc-300">#{idx + 1} {path}</span><span className="text-emerald-300">{count}</span></div>
            )) : <p className="text-xs tracking-[0.12em] text-zinc-500">No data yet.</p>}
          </div>
          <p className="mt-4 text-xs tracking-[0.16em] text-zinc-400">TOP VIDEO PLAYS</p>
          <div className="mt-3 space-y-2">
            {topVideoPlays.length > 0 ? topVideoPlays.map((item, idx) => (
              <div key={item.key} className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs"><span className="tracking-[0.12em] text-zinc-300">#{idx + 1} {item.title}</span><span className="text-violet-300">{item.count}</span></div>
            )) : <p className="text-xs tracking-[0.12em] text-zinc-500">No video play data yet.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs tracking-[0.16em] text-zinc-400">RECENT EVENTS (FILTERED)</p>
            <input value={analyticsSearchQuery} onChange={(event) => setAnalyticsSearchQuery(event.target.value)} placeholder="search event/path/payload" className="w-44 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-200" />
          </div>

          <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {analyticsFilteredEvents.length > 0 ? analyticsFilteredEvents.slice(0, 40).map((event) => (
              <div key={event.id} className="rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                <p className={`text-[11px] tracking-[0.14em] ${event.type === 'page_view' ? 'text-cyan-300' : event.type === 'video_play_clicked' ? 'text-violet-300' : event.type === 'video_watch_duration' ? 'text-emerald-300' : event.type === 'layout_changed' ? 'text-amber-300' : 'text-sky-300'}`}>{event.type}</p>
                <p className="mt-1 text-[10px] tracking-[0.08em] text-zinc-500">{new Date(event.timestamp).toLocaleString()}</p>
                {event.path ? <p className="mt-1 text-[11px] text-zinc-300">path: {event.path}</p> : null}
                {event.payload ? <p className="mt-1 text-[11px] text-zinc-400">{JSON.stringify(event.payload)}</p> : null}
              </div>
            )) : <p className="text-xs tracking-[0.12em] text-zinc-500">No events in current filter.</p>}
          </div>

          <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2">
            <p className="text-[11px] tracking-[0.12em] text-zinc-300">{analyticsSummary}</p>
            {analyticsAnomaly ? <p className="mt-2 text-[11px] text-amber-300">{analyticsAnomaly}</p> : null}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const header = 'id,type,timestamp,path,payload';
                const rows = analyticsFilteredEvents.map((event) =>
                  [event.id, event.type, event.timestamp, event.path || '', JSON.stringify(event.payload || {}).replaceAll('"', '""')]
                    .map((value) => `"${String(value)}"`)
                    .join(','),
                );
                const csv = [header, ...rows].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `analytics-${Date.now()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs tracking-[0.12em] text-zinc-200 transition hover:border-zinc-400"
            >
              EXPORT CSV
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
