// @ts-check
/** @import {Candle, CandleInput, Summary} from './types.js' */
import { normalizeInput } from './validation.js';

/** @param {CandleInput} input @returns {Candle} */
export function createCandle(input) {
  const data = normalizeInput(input);
  const now = new Date().toISOString();
  return { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
}

/** @param {Candle} candle @param {Partial<CandleInput>} patch @returns {Candle} */
export function updateCandle(candle, patch) {
  if (candle.list === 'shelf' && patch.list === 'wishlist') throw new Error('Owned candles stay on My Shelf.');
  return { ...normalizeInput({ ...candle, ...patch }), id: candle.id,
    createdAt: candle.createdAt, updatedAt: new Date().toISOString() };
}

/** @param {Candle} candle @returns {Candle} */
export function moveToShelf(candle) {
  return candle.list === 'shelf' ? candle : updateCandle(candle, { list: 'shelf', burnStatus: 'unlit' });
}

/** @param {Candle[]} candles @returns {Summary} */
export function getSummary(candles) {
  return { totalOwned: candles.filter(c => c.list === 'shelf').length,
    totalFinished: candles.filter(c => c.list === 'shelf' && c.burnStatus === 'finished').length,
    totalWishlist: candles.filter(c => c.list === 'wishlist').length };
}
