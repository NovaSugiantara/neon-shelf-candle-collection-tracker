// @ts-check
/** @import {AppState, Candle, CandleInput, List, SaveResult} from './types.js' */
import { createCandle, updateCandle, moveToShelf } from './model.js';
import { loadCollection, saveCollection, storageStatus } from './storage.js';

/** @type {AppState} */
export const state = { candles: [], view: 'shelf', notice: '', saved: true, message: '', error: '', errorCandleId: null, loading: true };
/** @type {() => void} */
let notify = () => {};
/** @param {() => void} render */
export function initialize(render) {
  notify = render;
  state.candles = loadCollection();
  state.notice = storageStatus.notice;
  state.saved = !state.notice;
  state.error = state.notice;
  state.errorCandleId = null;
  state.loading = false;
  notify();
}
/** @param {Candle[]} candles @param {string} message @param {string|null} [errorCandleId] @returns {SaveResult} */
function commit(candles, message, errorCandleId = null) {
  // ponytail: whole-collection saves suit ~200 candles; indexed storage only if scale demands it.
  state.candles = candles;
  state.saved = saveCollection(candles);
  state.notice = storageStatus.notice;
  state.error = state.saved ? '' : state.notice || 'Changes could not be saved.';
  state.errorCandleId = state.saved ? null : errorCandleId;
  state.message = state.saved ? message : 'Changes kept in this tab, but could not be saved.';
  notify();
  return { ok: state.saved, error: state.error };
}
/** @param {List} view */
export function setView(view) { state.view = view; state.message = ''; notify(); }
/** @param {CandleInput} input @param {string|null} id */
export function saveCandle(input, id) {
  const existing = state.candles.find(c => c.id === id);
  if (id && !existing) throw new Error('This candle no longer exists. Close the form and try again.');
  const candle = existing ? updateCandle(existing, input) : createCandle(input);
  state.view = candle.list;
  return commit(existing ? state.candles.map(c => c.id === id ? candle : c) : [...state.candles, candle], `${candle.name} ${existing ? 'updated' : 'added'}.`, candle.id);
}
/** @param {string} id @param {Partial<CandleInput>} patch */
export function changeCandle(id, patch) {
  return commit(state.candles.map(c => c.id === id ? updateCandle(c, patch) : c), 'Candle updated.', id);
}
/** @param {string} id */
export function purchase(id) {
  return commit(state.candles.map(c => c.id === id ? moveToShelf(c) : c), 'Candle moved to My Shelf.', id);
}
/** @param {string} id */
export function removeCandle(id) { return commit(state.candles.filter(c => c.id !== id), 'Candle deleted.'); }
export function retrySave() { return commit(state.candles, 'Storage retried.', state.errorCandleId); }
export function loadDemo() {
  if (state.candles.length) return;
  /** @type {[string,string,string,string,CandleInput['burnStatus'],number|null,List][]} */
  const examples = [
    ['Cedar after rain', 'Sunday Still', 'cedar, moss, wet earth', 'amber glass', 'burning', 5, 'shelf'],
    ['A slower morning', 'Quiet Hours', 'bergamot, black tea, honey', 'ivory ceramic', 'unlit', null, 'shelf'],
    ['The last fig', 'Orchard House', 'fig leaf, sandalwood, green stems', 'olive green glass', 'finished', 4, 'shelf'],
    ['Velvet dusk', 'Sunday Still', 'plum, rose, smoked wood', 'burgundy glass', 'unlit', null, 'shelf'],
    ['Salt on the windows', 'Coast & Clay', 'sea salt, sage, driftwood', 'ivory ceramic', 'unlit', null, 'wishlist'],
    ['Midnight library', 'Quiet Hours', 'leather, cedar, vanilla', 'matte black jar', 'unlit', null, 'wishlist']
  ];
  commit(examples.map(([name, brand, scentNotes, vesselStyle, burnStatus, rating, list]) =>
    createCandle({ name, brand, scentNotes, vesselStyle, burnStatus, rating, list })), 'Six fictional demo candles added. Edit or delete them freely.');
}
