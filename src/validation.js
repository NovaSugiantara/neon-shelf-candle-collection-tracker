// @ts-check
/** @import {CandleInput} from './types.js' */
export const statuses=/** @type {const} */(["unlit","burning","finished"]);export const lists=/** @type {const} */(["shelf","wishlist"]);export const textFields=/** @type {const} */({name:80,brand:60,scentNotes:200,vesselStyle:80});
/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */export const isRecord=value=>"object"==typeof value&&null!==value&&!Array.isArray(value);
/** @param {unknown} input */export function validateCandleInput(input){
/** @type {Record<string,string>} */
const errors={},value=isRecord(input)?input:{};for(const[key,max]of Object.entries(textFields)){const text=value[key];"string"==typeof text&&text.trim()?text.trim().length>max&&(errors[key]=`Use ${max} characters or fewer.`):errors[key]="Please fill this in."}return statuses.some(status=>status===value.burnStatus)||(errors.burnStatus="Choose a burn status."),lists.some(list=>list===value.list)||(errors.list="Choose My Shelf or Wish List."),null!==value.rating&&("number"!=typeof value.rating||!Number.isInteger(value.rating)||value.rating<1||value.rating>5)&&(errors.rating="Choose 1–5 stars, or leave unrated."),"wishlist"!==value.list||"unlit"===value.burnStatus&&null===value.rating||(errors.list="Wishlist candles must be unlit and unrated."),{valid:0===Object.keys(errors).length,errors:errors}}
/**
 * @param {unknown} value
 * @returns {value is import('./types.js').Candle}
 */export function isCandle(value){return!(!isRecord(value)||!validateCandleInput(value).valid)&&("string"==typeof value.id&&/^[a-zA-Z0-9_-]{1,100}$/.test(value.id)&&[value.createdAt,value.updatedAt].every(date=>"string"==typeof date&&/^\d{4}-\d{2}-\d{2}T/.test(date)&&Number.isFinite(Date.parse(date))))}
/** @param {CandleInput} input @returns {CandleInput} */export function normalizeInput(input){if(!validateCandleInput(input).valid)throw new Error("Check the highlighted candle details.");return{name:input.name.trim(),brand:input.brand.trim(),scentNotes:input.scentNotes.trim(),vesselStyle:input.vesselStyle.trim(),burnStatus:input.burnStatus,rating:input.rating,list:input.list}}
