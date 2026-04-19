import { REVIEW_AUDIT_LOGS_STORAGE_KEY, REVIEWS_STORAGE_KEY, writeLocalJson } from './configStorage.js';
import { normalizeReview } from './configNormalizers.js';

export function createReviewActions({ getConfig, getReviewAuditLogs, setReviews, setReviewAuditLogs, fetchJson }) {
  const submitReview = (input) => {
    const next = normalizeReview({ ...input, status: 'pending', isFeatured: false }, 0);
    setReviews((prev) => {
      const nextReviews = [next, ...prev];
      writeLocalJson(REVIEWS_STORAGE_KEY, nextReviews);
      return nextReviews;
    });
    fetchJson('/reviews', { method: 'POST', body: JSON.stringify(next) }).catch((error) => console.error('Failed to persist review:', error));
    return next;
  };

  const updateReview = (reviewId, updates) => {
    setReviews((prev) => {
      const next = prev.map((item) => (item.id === reviewId ? normalizeReview({ ...item, ...updates }) : item));
      writeLocalJson(REVIEWS_STORAGE_KEY, next);
      return next;
    });
  };

  const appendReviewAuditLog = (entry) => {
    const next = { id: `audit-${Date.now()}-${Math.round(Math.random() * 10000)}`, at: new Date().toISOString(), ...entry };
    setReviewAuditLogs((prev) => {
      const nextLogs = [next, ...prev];
      writeLocalJson(REVIEW_AUDIT_LOGS_STORAGE_KEY, nextLogs);
      return nextLogs;
    });
    fetchJson('/config', {
      method: 'POST',
      body: JSON.stringify({ ...getConfig(), reviewAuditLogs: [next, ...getReviewAuditLogs()] }),
    }).catch((error) => console.error('Failed to persist review audit log:', error));
  };

  const setReviewStatus = (reviewId, status, operator = 'console-admin') => {
    if (!['pending', 'approved', 'rejected'].includes(status)) return;
    setReviews((prev) => {
      const target = prev.find((item) => item.id === reviewId);
      if (!target) return prev;
      const previousStatus = target.status || 'pending';
      if (previousStatus !== status) {
        appendReviewAuditLog({ type: 'status_changed', reviewId, operator, from: previousStatus, to: status, projectId: target.projectId, projectName: target.projectName, clientName: target.clientName });
      }
      return prev.map((item) => (item.id === reviewId ? normalizeReview({ ...item, status }) : item));
    });
  };

  return { submitReview, updateReview, appendReviewAuditLog, setReviewStatus };
}
