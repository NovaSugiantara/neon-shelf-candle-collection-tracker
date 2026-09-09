// @ts-check
/** @import {Candle, CandleInput, Summary} from './types.js' */
import{normalizeInput}from"./validation.js";
/** @param {CandleInput} input @returns {Candle} */export function createCandle(input){const data=normalizeInput(input),now=(new Date).toISOString();return{...data,id:crypto.randomUUID(),createdAt:now,updatedAt:now}}
/** @param {Candle} candle @param {Partial<CandleInput>} patch @returns {Candle} */export function updateCandle(candle,patch){if("shelf"===candle.list&&"wishlist"===patch.list)throw new Error("Owned candles stay on My Shelf.");return{...normalizeInput({...candle,...patch}),id:candle.id,createdAt:candle.createdAt,updatedAt:(new Date).toISOString()}}
/** @param {Candle} candle @returns {Candle} */export function moveToShelf(candle){return"shelf"===candle.list?candle:updateCandle(candle,{list:"shelf",burnStatus:"unlit"})}
/** @param {Candle[]} candles @returns {Summary} */export function getSummary(candles){return{totalOwned:candles.filter(c=>"shelf"===c.list).length,totalFinished:candles.filter(c=>"shelf"===c.list&&"finished"===c.burnStatus).length,totalWishlist:candles.filter(c=>"wishlist"===c.list).length}}