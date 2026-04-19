import { readReviews, upsertReview } from '../db.js';

export async function listReviews() {
  return readReviews();
}

export async function createReview(payload) {
  return upsertReview(payload);
}
