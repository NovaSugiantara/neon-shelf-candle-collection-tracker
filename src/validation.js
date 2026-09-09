// @ts-check
/** @import {CandleInput} from './types.js' */
export const statuses = /** @type {const} */ (['unlit', 'burning', 'finished']);
export const lists = /** @type {const} */ (['shelf', 'wishlist']);
export const textFields = /** @type {const} */ ({ name: 80, brand: 60, scentNotes: 200, vesselStyle: 80 });
/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
export const isRecord = value => typeof value === 'object' && value !== null && !Array.isArray(value);

/** @param {unknown} input */
export function validateCandleInput(input) {
  /** @type {Record<string,string>} */
  const errors = {};
  const value = isRecord(input) ? input : {};
  for (const [key, max] of Object.entries(textFields)) {
    const text = value[key];
    if (typeof text !== 'string' || !text.trim()) errors[key] = 'Please fill this in.';
    else if (text.trim().length > max) errors[key] = `Use ${max} characters or fewer.`;
  }
  if (!statuses.some(status => status === value.burnStatus)) errors.burnStatus = 'Choose a burn status.';
  if (!lists.some(list => list === value.list)) errors.list = 'Choose My Shelf or Wish List.';
  if (value.rating !== null && (typeof value.rating !== 'number' || !Number.isInteger(value.rating) || value.rating < 1 || value.rating > 5)) {
    errors.rating = 'Choose 1–5 stars, or leave unrated.';
  }
  if (value.list === 'wishlist' && (value.burnStatus !== 'unlit' || value.rating !== null)) {
    errors.list = 'Wishlist candles must be unlit and unrated.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * @param {unknown} value
 * @returns {value is import('./types.js').Candle}
 */
export function isCandle(value) {
  if (!isRecord(value) || !validateCandleInput(value).valid) return false;
  return typeof value.id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value.id)
    && [value.createdAt, value.updatedAt].every(date => typeof date === 'string'
      && /^\d{4}-\d{2}-\d{2}T/.test(date) && Number.isFinite(Date.parse(date)));
}

/** @param {CandleInput} input @returns {CandleInput} */
export function normalizeInput(input) {
  if (!validateCandleInput(input).valid) throw new Error('Check the highlighted candle details.');
  return { name: input.name.trim(), brand: input.brand.trim(), scentNotes: input.scentNotes.trim(),
    vesselStyle: input.vesselStyle.trim(), burnStatus: input.burnStatus, rating: input.rating, list: input.list };
}
