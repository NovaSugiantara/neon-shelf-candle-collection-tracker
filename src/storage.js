// @ts-check
/** @import {Candle} from './types.js' */
import { isCandle, isRecord } from './validation.js';
export const STORAGE_KEY = 'neon-shelf:collection';
export const storageStatus = { notice: '', protected: false };
/** @type {string|null} */
let recovery = null;

/** @param {Storage} [storage] @returns {Candle[]} */
export function loadCollection(storage) {
  storageStatus.notice = '';
  storageStatus.protected = false;
  recovery = null;
  try {
    const raw = (storage ?? window.localStorage).getItem(STORAGE_KEY);
    if (raw === null) return [];
    recovery = raw;
    /** @type {unknown} */
    const data = JSON.parse(raw);
    if (!isRecord(data) || data.schemaVersion !== 1 || !Array.isArray(data.candles)) {
      storageStatus.protected = true;
      storageStatus.notice = 'Saved data has an unsupported format. It is untouched; changes stay in this tab only.';
      return [];
    }
    const seen = new Set();
    const candles = data.candles.filter((c) => {
      if (!isCandle(c) || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
    if (candles.length !== data.candles.length) {
      storageStatus.notice = 'Some saved entries could not be read. Valid candles were kept; the original will be backed up on your next save.';
    } else recovery = null;
    return candles;
  } catch {
    storageStatus.notice = recovery === null
      ? 'Browser storage is unavailable. Changes stay in this tab only; enable storage before closing it.'
      : 'Saved data could not be read. Starting with an empty shelf; the original will be backed up on your next save.';
    return [];
  }
}

/** @param {Candle[]} candles @param {Storage} [storage] @returns {boolean} */
export function saveCollection(candles, storage) {
  if (storageStatus.protected) return false;
  if (!candles.every(isCandle) || new Set(candles.map(c => c.id)).size !== candles.length) {
    storageStatus.notice = 'These candle records are invalid and were not saved.';
    return false;
  }
  try {
    const target = storage ?? window.localStorage;
    if (recovery !== null) target.setItem(`${STORAGE_KEY}:recovery`, recovery);
    target.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, candles }));
    recovery = null;
    storageStatus.notice = '';
    return true;
  } catch {
    storageStatus.notice = 'Changes are only in this tab. Browser storage is blocked or full. Enable storage or free space, then retry before closing.';
    return false;
  }
}
