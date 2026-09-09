// @ts-check
/** @import {Candle, AppState} from './types.js' */
import { getSummary } from './model.js';
import { statuses } from './validation.js';

/** @param {string} id */
export function byId(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: ${id}`);
  return el;
}
/** @param {string} value */
export function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
}
/** @param {string} style */
function vesselTone(style) {
  const text = style.toLowerCase();
  if (/white|ivory|cream|ceramic/.test(text)) return 'ivory';
  if (/green|olive|sage/.test(text)) return 'olive';
  if (/pink|red|wine|burgundy|plum/.test(text)) return 'wine';
  if (/black|charcoal/.test(text)) return 'charcoal';
  return 'amber';
}
/** Decorative illustration; full user text lives in the accessible card below.
 * @param {string} tone
 * @param {string} label
 * @param {boolean} lit
 */
function vessel(tone, label, lit) {
  return `<div class="vessel ${tone}${lit ? ' lit' : ''}" aria-hidden="true"><i class="wick"></i><div class="jar-label"><span>neon shelf</span><b>${escapeHtml(label)}</b><small>SCENT LIBRARY</small></div></div>`;
}
/** @param {Candle} c @param {AppState} state */
function card(c, state) {
  const id = escapeHtml(c.id), name = escapeHtml(c.name), shelf = c.list === 'shelf';
  return `<article class="candle ${c.burnStatus}" aria-labelledby="title-${id}">
<div class="candle-stage"><span class="status-label">${shelf ? c.burnStatus === 'finished' ? '✓ Finished' : c.burnStatus === 'burning' ? '◦ Burning' : 'Unlit' : 'On the wish list'}</span>
${vessel(vesselTone(c.vesselStyle), c.name, shelf && c.burnStatus === 'burning')}</div>
 <div class="candle-info"><p class="brand">${escapeHtml(c.brand)}</p><h2 id="title-${id}">${name}</h2>
 <p class="scent" title="${escapeHtml(c.scentNotes)}">${escapeHtml(c.scentNotes)}</p><p class="vessel-style">${escapeHtml(c.vesselStyle)}</p>
${shelf ? `<p class="rating">${c.rating === null ? 'Not rated yet' : `<span aria-hidden="true">${'★'.repeat(c.rating)}${'☆'.repeat(5 - c.rating)}</span><span class="sr-only">Rated </span><span class="rating-value">${c.rating} / 5</span>`}</p>` : '<p class="wishlist-hint">A scent to look forward to.</p>'}
<div class="card-actions">${shelf ? `<select data-status="${id}" data-focus="status-${id}" aria-label="Burn status for ${name}">${statuses.map(s => `<option value="${s}"${s === c.burnStatus ? ' selected' : ''}>${s[0]?.toUpperCase()}${s.slice(1)}</option>`).join('')}</select>` : `<button class="purchase" data-action="purchase" data-id="${id}">Add to Shelf <span aria-hidden="true">↗</span></button>`}
 <button data-action="edit" data-id="${id}" data-focus="edit-${id}" aria-label="Edit ${name}">Edit</button><button class="delete-button" data-action="delete" data-id="${id}" data-focus="delete-${id}" aria-label="Delete ${name}">Delete</button></div><p class="card-error" role="alert">${state.errorCandleId === c.id ? escapeHtml(state.error) : ''}</p></div></div></article>`;
}
/** @param {AppState} state */
export function render(state) {
  const focus = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.focus : undefined;
  const summary = getSummary(state.candles);
  for (const [id, value] of Object.entries({ owned: summary.totalOwned, finished: summary.totalFinished,
    wanted: summary.totalWishlist, 'shelf-count': summary.totalOwned, 'wish-count': summary.totalWishlist })) byId(id).textContent = String(value);
  document.querySelectorAll('[data-view]').forEach(tab => {
    if (!(tab instanceof HTMLButtonElement)) return;
    const selected = tab.dataset.view === state.view;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  const shelf = state.view === 'shelf';
  const candles = state.candles.filter(c => c.list === state.view);
  byId('panel').setAttribute('aria-labelledby', `tab-${state.view}`);
  byId('storage-notice').hidden = !state.notice;
  byId('storage-text').textContent = state.notice;
  const note = document.getElementById('collection-note');
  if (note) note.textContent = candles.length ? `${candles.length} ${candles.length === 1 ? 'candle' : 'candles'} · Vessel illustrations` : 'Your scents, all in one place';
  const grid = byId('grid');
  grid.setAttribute('aria-busy', String(state.loading));
  if (state.loading) { grid.innerHTML = '<p class="loading" role="status">Opening your shelf…</p>'; return; }
  grid.innerHTML = candles.length ? candles.map(c => card(c, state)).join('') : `<div class="empty-state"><div class="empty-art" aria-hidden="true">${vessel('amber', 'Your next favorite', true)}${vessel('ivory', 'Something lovely', false)}</div><div class="empty-copy"><h2>${shelf ? 'Your shelf starts here.' : 'What’s on your wish list?'}</h2><p>${shelf ? 'Keep the names, notes, and little details of the candles you love.' : 'Found a scent you want to try? Save it here. Move it to your shelf when it comes home.'}</p><button class="primary" data-action="add">${shelf ? 'Add your first candle' : 'Add to Wish List'} <span aria-hidden="true">＋</span></button>${!state.candles.length ? '<button class="demo-button" data-action="demo">Try a sample collection</button><small>Six fictional candles to explore.</small>' : ''}</div></div>`;
  byId('announcement').textContent = state.message ? `${state.message} ${state.saved ? 'Saved in this browser.' : 'Not saved to browser storage.'} ${summary.totalOwned} owned, ${summary.totalFinished} burned through, ${summary.totalWishlist} on your wish list.` : '';
  if (focus) document.querySelectorAll('[data-focus]').forEach(el => {
    if (el instanceof HTMLElement && el.dataset.focus === focus) el.focus({ preventScroll: true });
  });
}
