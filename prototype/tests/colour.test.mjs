import test from 'node:test';
import assert from 'node:assert/strict';
import {colourScene,MATERIALS,vesselPalette} from '../dist/colour.js';
import {drawVessel} from '../dist/vessel.js';
test('Material tint preserves dark ink and distinguishes floors, walls and doors',()=>{
 const pixels=new Uint8ClampedArray([255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,255]);
 colourScene(pixels,new Uint8ClampedArray([80,0,0,255,160,0,0,255,240,0,0,255,240,0,0,255]));
 assert.deepEqual([...pixels],[...MATERIALS.floor,255,...MATERIALS.stone,255,...MATERIALS.door,255,0,0,0,255]);
});
test('Vessels redraw when colour changes at an unchanged health value',()=>{
 let clears=0;const context=new Proxy({fillRect(){clears++;}},{get(target,key){return target[key]??(()=>{});}}),canvas={dataset:{},getContext:()=>context};
 drawVessel(canvas,75);const first=clears;drawVessel(canvas,75);assert.equal(clears,first);
 drawVessel(canvas,75,{colour:true,kind:'health'});assert.ok(clears>first);const red=clears;drawVessel(canvas,75,{colour:true,kind:'satiety'});assert.ok(clears>red);
 assert.notDeepEqual(vesselPalette('health',true),vesselPalette('satiety',true));assert.equal(vesselPalette('health',false).liquid,'#fff');
});
