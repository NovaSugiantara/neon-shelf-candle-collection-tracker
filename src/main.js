// @ts-check
/** @import {CandleInput} from './types.js' */
import { state, initialize, saveCandle, setView, purchase, removeCandle, changeCandle, retrySave, loadDemo } from './state.js';
import { render, byId } from './render.js';
import { validateCandleInput, statuses, lists } from './validation.js';

const dialog = /** @type {HTMLDialogElement} */ (byId('candle-dialog'));
const deletion = /** @type {HTMLDialogElement} */ (byId('delete-dialog'));
const form = /** @type {HTMLFormElement} */ (byId('candle-form'));
let editing = /** @type {string|null} */ (null);
let deleting = /** @type {string|null} */ (null);
let returnFocus = 'add';
/** @param {string} name */
function field(name) {
  const el = form.elements.namedItem(name);
  if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement)) throw new Error(`Missing field: ${name}`);
  return el;
}
function ownedFields() {
  const wishlist = field('list').value === 'wishlist';
  byId('owned-fields').hidden = wishlist;
  field('burnStatus').disabled = wishlist;
  field('rating').disabled = wishlist;
}
/** @param {Record<string,string>} errors */
function showErrors(errors) {
  for (const key of ['name', 'brand', 'scentNotes', 'vesselStyle', 'list', 'burnStatus', 'rating']) {
    field(key).setAttribute('aria-invalid', String(Boolean(errors[key])));
    byId(`error-${key}`).textContent = errors[key] ?? '';
  }
}
/** @param {string|null} id */
function openForm(id) {
  editing = id;
  form.reset();
  showErrors({});
  byId('form-error').textContent = '';
  const candle = state.candles.find(c => c.id === id);
  if (id && !candle) return;
  field('list').value = candle?.list ?? state.view;
  field('list').disabled = Boolean(candle);
  if (candle) for (const key of ['name', 'brand', 'scentNotes', 'vesselStyle', 'burnStatus', 'rating']) {
    field(key).value = String(candle[/** @type {keyof CandleInput} */ (key)] ?? '');
  }
  byId('form-title').textContent = candle ? 'A few finishing touches.' : 'Make room for a candle.';
  byId('save-button').textContent = candle ? 'Save changes' : 'Add candle';
  ownedFields();
  dialog.showModal();
  field('name').focus();
}
function restoreFocus() {
  const el = /** @type {HTMLElement|null} */ (document.querySelector(`[data-focus="${returnFocus}"]`));
  (el ?? byId('add')).focus({ preventScroll: true });
}
dialog.addEventListener('close', restoreFocus);
deletion.addEventListener('close', restoreFocus);
field('list').addEventListener('change', ownedFields);
form.addEventListener('submit', event => {
  event.preventDefault();
  const list = lists.find(v => v === field('list').value) ?? 'shelf';
  const burnStatus = statuses.find(v => v === field('burnStatus').value) ?? 'unlit';
  /** @type {CandleInput} */
  const input = { name: field('name').value, brand: field('brand').value, scentNotes: field('scentNotes').value,
    vesselStyle: field('vesselStyle').value, list, burnStatus: list === 'wishlist' ? 'unlit' : burnStatus,
    rating: list === 'wishlist' || !field('rating').value ? null : Number(field('rating').value) };
  const result = validateCandleInput(input);
  showErrors(result.errors);
  byId('form-error').textContent = result.valid ? '' : 'Check the highlighted details.';
  if (!result.valid) { field(Object.keys(result.errors)[0] ?? 'name').focus(); return; }
  try {
    const result = saveCandle(input, editing);
    if (result.ok) dialog.close();
    else byId('form-error').textContent = `Could not save this candle: ${result.error}`;
  }
  catch (error) { byId('form-error').textContent = error instanceof Error ? error.message : 'Candle could not be updated. Try again.'; }
});
document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target.closest('button') : null;
  if (!(target instanceof HTMLButtonElement)) return;
  const view = lists.find(v => v === target.dataset.view);
  if (view) { setView(view); return; }
  const id = target.dataset.id;
  switch (target.dataset.action) {
    case 'add': returnFocus = 'add'; openForm(null); break;
    case 'edit': if (id) { returnFocus = `edit-${id}`; openForm(id); } break;
    case 'close': dialog.close(); break;
    case 'demo': loadDemo(); byId('tab-shelf').focus(); break;
    case 'retry': retrySave(); break;
    case 'purchase': if (id) { purchase(id); byId('tab-wishlist').focus({ preventScroll: true }); } break;
    case 'delete': {
      const candle = state.candles.find(c => c.id === id);
      if (!candle) break;
      deleting = candle.id; returnFocus = `delete-${candle.id}`;
      byId('delete-detail').textContent = `“${candle.name}” will be deleted from your collection. This cannot be undone.`;
      deletion.showModal(); break;
    }
    case 'cancel-delete': deletion.close(); break;
    case 'confirm-delete': if (deleting) removeCandle(deleting); deletion.close(); deleting = null; break;
  }
});
document.addEventListener('change', event => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement) || !target.dataset.status) return;
  const status = statuses.find(s => s === target.value);
  if (status) changeCandle(target.dataset.status, { burnStatus: status });
});
document.querySelector('[role="tablist"]')?.addEventListener('keydown', event => {
  if (!(event instanceof KeyboardEvent) || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const view = event.key === 'Home' ? 'shelf' : event.key === 'End' ? 'wishlist' : state.view === 'shelf' ? 'wishlist' : 'shelf';
  setView(view);
  byId(`tab-${view}`).focus({ preventScroll: true });
});
// ponytail: native dialogs supply Escape, focus trapping, inert background.
initialize(() => render(state));
/** @type {HTMLButtonElement} */ (byId('add')).disabled = false;
