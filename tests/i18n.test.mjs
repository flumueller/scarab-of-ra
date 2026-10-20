import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createGame,act,serialize} from '../dist/engine.js';
import {TYPES} from '../dist/item-types.js';
import {itemPurpose} from '../dist/item-info.js';
import {topicsDE,hintsDE} from '../dist/guide-de.js';
async function locale(saved,id){const old=globalThis.localStorage;globalThis.localStorage={getItem:()=>saved};try{return await import(`../dist/i18n.js?test=${id}`);}finally{if(old===undefined)delete globalThis.localStorage;else globalThis.localStorage=old;}}
test('English and monochrome are defaults; malformed preferences are safe',async()=>{
 for(const [i,saved] of [null,'{','{"language":"fr","colour":"false"}'].entries()){const l=await locale(saved,i);assert.equal(l.language(),'en');assert.equal(l.presentation().colour,false);assert.equal(l.t('Settings'),'Settings');}
});
test('German translates mechanics, quantities, traps, relics and item purposes without changing state',async()=>{
 const l=await locale('{"language":"de","colour":true}','de');
 assert.equal(l.t('Settings'),'Einstellungen');assert.equal(l.t('Scarab of RA'),'Scarab of RA');assert.equal(l.itemGerman('Scarab of RA'),'Skarabäus des RA');
 assert.equal(l.t('16 ounces of food'),'16 Unzen Proviant');assert.equal(l.t('1 ounce gold'),'1 Unze Gold');assert.equal(l.t('You found a sprung spear trap.'),'Du hast eine bereits ausgelöste Falle gefunden: Speerfalle.');
 assert.equal(l.t('The monkey stole your bottle of snake bite cure!'),'Der Affe hat dich bestohlen: Flasche Gegengift!');
 assert.equal(l.t('FACING E · MAP [M]'),'BLICK O · KARTE [M]');
 assert.equal(l.t('The wall reads: Settings'),'An der Wand steht: Settings','Player inscriptions stay literal');
 for(const item of TYPES.filter(i=>i.frequency>0)){assert.notEqual(l.itemGerman(item.name),item.name,item.name);const purpose=itemPurpose(item);assert.notEqual(l.t(purpose),purpose,purpose);}
 const g=createGame(7);act(g,'info','lantern');const before=serialize(g);const info=l.t(g.messages.at(-1));assert.match(info,/Pint Öl/);assert.match(info,/Laterne/);assert.doesNotMatch(info,/Lights|ounces|pints/);assert.equal(serialize(g),before);
 assert.equal(topicsDE.length,10);assert.equal(hintsDE.length,14);
});
test('Every literal engine event has a German translation',async()=>{
 const l=await locale('{"language":"de"}','coverage'),source=await readFile(new URL('../dist/engine.js',import.meta.url),'utf8');
 for(const m of source.matchAll(/say\(g,(['"])(.*?)\1\)/g)){assert.notEqual(l.t(m[2]),m[2],m[2]);}
});
