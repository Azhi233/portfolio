import { useMemo } from 'react';

export function useDirectorAnalytics({
  analyticsEvents,
  analyticsTimeRange,
  analyticsEventType,
  analyticsSearchQuery,
  analyticsChartMetric,
  analyticsCompareMetric,
}) {
  const analyticsRangeStart = useMemo(() => {
    const now = Date.now();
    if (analyticsTimeRange === '24h') return now - 24 * 60 * 60 * 1000;
    if (analyticsTimeRange === '7d') return now - 7 * 24 * 60 * 60 * 1000;
    if (analyticsTimeRange === '30d') return now - 30 * 24 * 60 * 60 * 1000;
    return 0;
  }, [analyticsTimeRange]);

  const analyticsFilteredEvents = useMemo(() => {
    const query = String(analyticsSearchQuery || '').trim().toLowerCase();
    return (analyticsEvents || []).filter((event) => {
      const timestamp = new Date(event.timestamp).getTime();
      if (timestamp < analyticsRangeStart) return false;
      if (analyticsEventType !== 'all' && event.type !== analyticsEventType) return false;
      if (!query) return true;
      const haystack = [event.type, event.path || '', JSON.stringify(event.payload || {})].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [analyticsEventType, analyticsEvents, analyticsRangeStart, analyticsSearchQuery]);

  const buildAnalyticsBuckets = (metricType) => {
    const bucketCount = analyticsTimeRange === '24h' ? 12 : analyticsTimeRange === '7d' ? 7 : 10;
    const bucketSize = analyticsTimeRange === '24h' ? 2 * 60 * 60 * 1000 : analyticsTimeRange === '7d' ? 24 * 60 * 60 * 1000 : 3 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const start = now - bucketSize * (bucketCount - index);
      const end = start + bucketSize;
      return {
        label: analyticsTimeRange === '24h' ? `${index * 2}H` : `#${index + 1}`,
        start,
        end,
        value: 0,
      };
    });

    analyticsFilteredEvents.forEach((event) => {
      const timestamp = new Date(event.timestamp).getTime();
      const bucket = buckets.find((item) => timestamp >= item.start && timestamp < item.end);
      if (!bucket) return;
      if (metricType === 'page_view') {
        if (event.type === 'page_view') bucket.value += 1;
        return;
      }
      if (metricType === 'video_play_clicked') {
        if (event.type === 'video_play_clicked') bucket.value += 1;
        return;
      }
      if (metricType === 'video_watch_duration') {
        if (event.type === 'video_watch_duration') bucket.value += Number(event.payload?.seconds || 0);
        return;
      }
      if (metricType === 'cta_total') {
        if (String(event.type || '').startsWith('cta_')) bucket.value += 1;
        return;
      }
      if (event.type === metricType) bucket.value += 1;
    });

    return buckets.map(({ label, value }) => ({ label, value }));
  };

  const analyticsChartData = useMemo(
    () => buildAnalyticsBuckets(analyticsChartMetric),
    [analyticsChartMetric, analyticsFilteredEvents, analyticsTimeRange],
  );

  const analyticsCompareChartData = useMemo(
    () => (analyticsCompareMetric === 'none' ? analyticsChartData.map(({ label }) => ({ label, value: 0 })) : buildAnalyticsBuckets(analyticsCompareMetric)),
    [analyticsChartData, analyticsCompareMetric, analyticsFilteredEvents, analyticsTimeRange],
  );

  const analyticsChartMax = useMemo(() => {
    const values = [...analyticsChartData, ...analyticsCompareChartData].map((item) => item.value);
    return Math.max(1, ...values);
  }, [analyticsChartData, analyticsCompareChartData]);

  const analyticsKpis = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const last7dStart = Date.now() - 7 * 24 * 60 * 60 * 1000;

    let todayPV = 0;
    const uniqueVisitors = new Set();
    let videoPlayCount = 0;
    let totalWatchDuration = 0;
    let watchDurationCount = 0;
    let ctaConsultCount = 0;
    let ctaProposalCount = 0;
    let ctaCopyEmailCount = 0;
    let filteredPageViews = 0;

    analyticsFilteredEvents.forEach((event) => {
      const timestamp = new Date(event.timestamp).getTime();
      if (event.type === 'page_view') {
        filteredPageViews += 1;
        if (timestamp >= todayStart.getTime()) todayPV += 1;
        if (timestamp >= last7dStart) uniqueVisitors.add(event.payload?.visitorId || event.id);
      }
      if (event.type === 'video_play_clicked') videoPlayCount += 1;
      if (event.type === 'video_watch_duration') {
        totalWatchDuration += Number(event.payload?.seconds || 0);
        watchDurationCount += 1;
      }
      if (event.type === 'cta_consult') ctaConsultCount += 1;
      if (event.type === 'cta_proposal') ctaProposalCount += 1;
      if (event.type === 'cta_copy_email') ctaCopyEmailCount += 1;
    });

    const ctaTotal = ctaConsultCount + ctaProposalCount + ctaCopyEmailCount;
    return {
      todayPV,
      sevenDayUV: uniqueVisitors.size,
      videoPlayCount,
      avgWatchDuration: watchDurationCount ? Math.round((totalWatchDuration / watchDurationCount) * 10) / 10 : 0,
      ctaConsultCount,
      ctaProposalCount,
      ctaCopyEmailCount,
      ctaTotal,
      filteredPageViews,
      ctaConversionRate: filteredPageViews ? Math.round((ctaTotal / filteredPageViews) * 1000) / 10 : 0,
    };
  }, [analyticsFilteredEvents]);

  const pageViewTopRoutes = useMemo(() => {
    const counts = new Map();
    analyticsFilteredEvents.forEach((event) => {
      if (event.type !== 'page_view' || !event.path) return;
      counts.set(event.path, (counts.get(event.path) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [analyticsFilteredEvents]);

  const topVideoPlays = useMemo(() => {
    const counts = new Map();
    analyticsFilteredEvents.forEach((event) => {
      if (event.type !== 'video_play_clicked') return;
      const key = event.payload?.videoId || event.path || event.id;
      const title = event.payload?.title || key;
      const current = counts.get(key) || { key, title, count: 0 };
      current.count += 1;
      counts.set(key, current);
    });
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [analyticsFilteredEvents]);

  const analyticsSummary = useMemo(
    () => `当前筛选范围内共有 ${analyticsFilteredEvents.length} 条事件，PV ${analyticsKpis.filteredPageViews}，CTA ${analyticsKpis.ctaTotal}，视频播放 ${analyticsKpis.videoPlayCount}。`,
    [analyticsFilteredEvents.length, analyticsKpis.ctaTotal, analyticsKpis.filteredPageViews, analyticsKpis.videoPlayCount],
  );

  const analyticsAnomaly = useMemo(() => {
    if (analyticsKpis.filteredPageViews >= 50 && analyticsKpis.ctaTotal === 0) return 'PV 较高但 CTA 为 0，建议检查按钮埋点。';
    if (analyticsKpis.videoPlayCount > 0 && analyticsKpis.avgWatchDuration < 2) return '视频播放存在，但平均观看时长偏低。';
    return '';
  }, [analyticsKpis.avgWatchDuration, analyticsKpis.ctaTotal, analyticsKpis.filteredPageViews, analyticsKpis.videoPlayCount]);

  const analyticsWoW = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = todayStart.getTime() - day;
    const prev7dStart = now - 14 * day;
    const current7dStart = now - 7 * day;

    let todayPv = 0;
    let yesterdayPv = 0;
    let this7dPlays = 0;
    let prev7dPlays = 0;

    (analyticsEvents || []).forEach((event) => {
      const timestamp = new Date(event.timestamp).getTime();
      if (event.type === 'page_view') {
        if (timestamp >= todayStart.getTime()) todayPv += 1;
        else if (timestamp >= yesterdayStart && timestamp < todayStart.getTime()) yesterdayPv += 1;
      }
      if (event.type === 'video_play_clicked') {
        if (timestamp >= current7dStart) this7dPlays += 1;
        else if (timestamp >= prev7dStart && timestamp < current7dStart) prev7dPlays += 1;
      }
    });

    const calcDelta = (current, previous) => {
      if (!previous) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 1000) / 10;
    };

    return {
      todayPv,
      yesterdayPv,
      todayVsYesterdayDelta: calcDelta(todayPv, yesterdayPv),
      this7dPlays,
      prev7dPlays,
      playWoWDelta: calcDelta(this7dPlays, prev7dPlays),
    };
  }, [analyticsEvents]);

  return {
    analyticsRangeStart,
    analyticsFilteredEvents,
    analyticsChartData,
    analyticsCompareChartData,
    analyticsChartMax,
    analyticsKpis,
    pageViewTopRoutes,
    topVideoPlays,
    analyticsSummary,
    analyticsAnomaly,
    analyticsWoW,
  };
}
