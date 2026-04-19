import { useEffect, useMemo, useState } from 'react';
import Card from './Card.jsx';
import Badge from './Badge.jsx';
import Button from './Button.jsx';
import { fetchJson } from '../utils/api.js';
import { useI18n } from '../context/I18nContext.jsx';

const STATUS_META = {
  pending: { tone: 'warning' },
  approved: { tone: 'success' },
  locked: { tone: 'default' },
};

function ReviewRow({ item, onApprove, onLock, onReset, t }) {
  const tone = STATUS_META[item.status]?.tone || 'warning';
  const label = t(`review.${item.status}`, item.status);
  const description =
    item.status === 'approved'
      ? t('review.passed')
      : item.status === 'locked'
        ? t('review.lockedDesc')
        : t('review.draft');

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.18em] text-zinc-500">{item.translationKey}</p>
          <h3 className="mt-2 text-sm tracking-[0.08em] text-white">{item.translationKey}</h3>
        </div>
        <Badge tone={tone}>{label}</Badge>
      </div>

      <p className="mt-3 text-sm leading-7 text-zinc-400">{description}</p>
      <p className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm leading-7 text-zinc-300">
        {item.translatedText}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {item.status !== 'approved' ? (
          <Button type="button" variant="primary" onClick={() => onApprove(item.translationKey)}>
            {t('review.approve')}
          </Button>
        ) : null}
        {item.status !== 'locked' ? (
          <Button type="button" variant="subtle" onClick={() => onLock(item.translationKey)}>
            {t('review.lock')}
          </Button>
        ) : null}
        <Button type="button" variant="default" onClick={() => onReset(item.translationKey)}>
          {t('review.reset')}
        </Button>
      </div>
    </div>
  );
}

export default function TranslationReviewPanel({ className = '' }) {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchJson('/translation-review-items');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load translation review items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    const counts = { pending: 0, approved: 0, locked: 0 };
    for (const item of items) {
      if (counts[item.status] !== undefined) counts[item.status] += 1;
      else counts.pending += 1;
    }
    return counts;
  }, [items]);

  const updateStatus = async (translationKey, status) => {
    try {
      const next = await fetchJson(`/translation-review-items/${encodeURIComponent(translationKey)}/status`, {
        method: 'PATCH',
        data: { status },
      });
      setItems((prev) => prev.map((item) => (item.translationKey === translationKey ? next : item)));
    } catch (err) {
      setError(err?.message || 'Failed to update translation status.');
    }
  };

  return (
    <Card className={`p-6 md:p-8 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-zinc-500">REVIEW QUEUE</p>
          <h2 className="mt-2 text-xl tracking-[0.08em] text-white">{t('review.title')}</h2>
          <p className="mt-2 text-sm leading-7 text-zinc-400">{t('review.subtitle')}</p>
        </div>
        <div className="flex gap-2 text-[11px] tracking-[0.16em] text-zinc-400">
          <span>{t('review.pending')} {summary.pending}</span>
          <span>{t('review.approved')} {summary.approved}</span>
          <span>{t('review.locked')} {summary.locked}</span>
        </div>
      </div>

      {loading ? <p className="mt-5 text-sm text-zinc-400">{t('review.loading')}</p> : null}
      {error ? <p className="mt-5 rounded-2xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

      <div className="mt-5 grid gap-4">
        {items.map((item) => (
          <ReviewRow
            key={item.id}
            item={item}
            t={t}
            onApprove={(key) => updateStatus(key, 'approved')}
            onLock={(key) => updateStatus(key, 'locked')}
            onReset={(key) => updateStatus(key, 'pending')}
          />
        ))}
      </div>
    </Card>
  );
}
