import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCandle, updateCandle, moveToShelf, getSummary } from '../src/model.js';
import { validateCandleInput } from '../src/validation.js';
import { loadCollection, saveCollection, STORAGE_KEY, storageStatus } from '../src/storage.js';
import { initialize, saveCandle, state, purchase, removeCandle, changeCandle } from '../src/state.js';

const input={name:' Cedar ',brand:' Studio ',scentNotes:' wood ',vesselStyle:' glass ',burnStatus:'unlit',rating:null,list:'wishlist'};
const memory=()=>{const data=new Map();return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)}};
test('purchase preserves identity; burn transitions keep rating; summary excludes wishlist',()=>{
 const original=createCandle(input);assert.equal(original.name,'Cedar');const owned=moveToShelf(original);
 assert.equal(owned.id,original.id);assert.equal(owned.createdAt,original.createdAt);assert.equal(owned.burnStatus,'unlit');let rated=updateCandle(owned,{rating:5});
 for(const burnStatus of ['finished','unlit','burning']){rated=updateCandle(rated,{burnStatus});assert.equal(rated.rating,5)}
 assert.equal(moveToShelf(rated).burnStatus,'burning');assert.equal(updateCandle(rated,{rating:null}).rating,null);assert.throws(()=>updateCandle(rated,{list:'wishlist'}));
 const spoofed=updateCandle(rated,{id:'spoof',createdAt:'bad'});assert.equal(spoofed.id,original.id);assert.equal(spoofed.createdAt,original.createdAt);
 assert.deepEqual(getSummary([updateCandle(rated,{burnStatus:'finished'}),original]),{totalOwned:1,totalFinished:1,totalWishlist:1});
});
test('validation trims before limits and rejects invalid fields',()=>{
 for(const [field,max] of Object.entries({name:80,brand:60,scentNotes:200,vesselStyle:80})){assert.equal(validateCandleInput({...input,[field]:' '}).valid,false);assert.equal(validateCandleInput({...input,[field]:'x'.repeat(max)}).valid,true);assert.equal(validateCandleInput({...input,[field]:'x'.repeat(max+1)}).valid,false)}
 for(const rating of [0,-1,1.5,6,NaN,'5',undefined])assert.equal(validateCandleInput({...input,list:'shelf',rating}).valid,false);
 for(const patch of [{list:'invalid'},{burnStatus:'spent'},{rating:3},{burnStatus:'burning'}])assert.equal(validateCandleInput({...input,...patch}).valid,false);
 assert.equal(validateCandleInput(null).valid,false);assert.throws(()=>createCandle({...input,name:''}));
});
test('storage validates entries, backs up corrupt data and protects future schema',()=>{
 const storage=memory();assert.deepEqual(loadCollection(storage),[]);const candle=createCandle(input);assert.equal(saveCollection([candle],storage),true);assert.deepEqual(loadCollection(storage),[candle]);
 const damaged=JSON.stringify({schemaVersion:1,candles:[candle,candle,{...candle,id:'<bad>'},null]});storage.setItem(STORAGE_KEY,damaged);assert.deepEqual(loadCollection(storage),[candle]);assert.match(storageStatus.notice,/Some saved entries/);assert.equal(saveCollection([candle],storage),true);assert.equal(storage.getItem(`${STORAGE_KEY}:recovery`),damaged);
 storage.setItem(STORAGE_KEY,'{broken');assert.deepEqual(loadCollection(storage),[]);assert.match(storageStatus.notice,/could not be read/);assert.equal(saveCollection([],storage),true);assert.equal(storage.getItem(`${STORAGE_KEY}:recovery`),'{broken');
 storage.setItem(STORAGE_KEY,'{"schemaVersion":2,"candles":[]}');loadCollection(storage);assert.equal(saveCollection([],storage),false);assert.match(storage.getItem(STORAGE_KEY),/schemaVersion":2/);
});
test('storage failure keeps memory state, returns error and surfaces boot errors',()=>{
 const storage=memory();globalThis.window={localStorage:storage};initialize(()=>{});saveCandle(input,null);const id=state.candles[0].id;purchase(id);changeCandle(id,{rating:4,burnStatus:'finished'});assert.equal(loadCollection(storage)[0].rating,4);
 storage.setItem=()=>{throw new Error('full')};const result=changeCandle(id,{burnStatus:'unlit'});assert.equal(result.ok,false);assert.match(result.error,/only in this tab/);assert.equal(state.candles[0].burnStatus,'unlit');assert.equal(state.saved,false);removeCandle(id);assert.equal(state.candles.length,0);
 Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}});initialize(()=>{});assert.match(state.notice,/unavailable/);saveCandle(input,null);assert.equal(state.candles.length,1);assert.equal(state.saved,false);delete globalThis.window;
});
