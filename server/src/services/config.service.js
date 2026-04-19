import { readConfigObject, upsertConfigObject } from '../db.js';

export async function getConfig() {
  return readConfigObject();
}

export async function saveConfig(payload) {
  return upsertConfigObject(payload);
}
