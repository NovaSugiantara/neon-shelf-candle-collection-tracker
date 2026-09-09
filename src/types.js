// @ts-check
/** @typedef {'unlit'|'burning'|'finished'} BurnStatus */
/** @typedef {'shelf'|'wishlist'} List */
/** @typedef {{name:string, brand:string, scentNotes:string, vesselStyle:string, burnStatus:BurnStatus, rating:number|null, list:List}} CandleInput */
/** @typedef {CandleInput & {id:string, createdAt:string, updatedAt:string}} Candle */
/** @typedef {{totalOwned:number, totalFinished:number, totalWishlist:number}} Summary */
/** @typedef {{candles:Candle[], view:List, notice:string, saved:boolean, message:string}} AppState */
export {};
