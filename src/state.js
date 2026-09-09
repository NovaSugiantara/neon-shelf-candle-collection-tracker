// @ts-check
/** @import {AppState, Candle, CandleInput, List} from './types.js' */
import { createCandle, updateCandle, moveToShelf } from './model.js';
import { loadCollection, saveCollection, storageStatus } from './storage.js';

/** @type {AppState} */
export const state = { candles: [], view: 'shelf', notice: '', saved: true, message: '' };
/** @type {() => void} */
let notify = () => {};
/** @param {() => void} render */
export function initialize(render) {
  notify = render;
  state.candles = loadCollection();
  state.notice = storageStatus.notice;
  state.saved = !state.notice;
  notify();
}
/** @param {Candle[]} candles @param {string} message */
function commit(candles, message) {
  // ponytail: whole-collection saves suit ~200 candles; indexed storage only if scale demands it.
  state.candles = candles;
  state.saved = saveCollection(candles);
  state.notice = storageStatus.notice;
  state.message = message;
  notify();
}
/** @param {List} view */
export function setView(view) { state.view = view; state.message = ''; notify(); }
/** @param {CandleInput} input @param {string|null} id */
export function saveCandle(input, id) {
  const existing = state.candles.find(c => c.id === id);
  if (id && !existing) throw new Error('This candle no longer exists. Close the form and try again.');
  const candle = existing ? updateCandle(existing, input) : createCandle(input);
  state.view = candle.list;
  commit(existing ? state.candles.map(c => c.id === id ? candle : c) : [...state.candles, candle], `${candle.name} ${existing ? 'updated' : 'added'}.`);
}
/** @param {string} id @param {Partial<CandleInput>} patch */
export function changeCandle(id, patch) {
  commit(state.candles.map(c => c.id === id ? updateCandle(c, patch) : c), 'Candle updated.');
}
/** @param {string} id */
export function purchase(id) {
  commit(state.candles.map(c => c.id === id ? moveToShelf(c) : c), 'Candle moved to My Shelf.');
}
/** @param {string} id */
export function removeCandle(id) { commit(state.candles.filter(c => c.id !== id), 'Candle deleted.'); }
export function retrySave() { commit(state.candles, 'Storage retried.'); }
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
