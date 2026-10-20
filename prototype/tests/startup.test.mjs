import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const source=await readFile(new URL('../dist/boot.js',import.meta.url),'utf8');
async function boot(loadApp){
 const root={dataset:{boot:'loading'}},loader={setAttribute(){},remove(){this.removed=true;}},message={},retry={hidden:true,focus(){this.focused=true;}};
 const timers=[];const nodes={'#boot-loader':loader,'#boot-message':message,'#boot-retry':retry,'#boot-script':{dataset:{appModule:'./app.js'}}};
 const code=source.replace('import(new URL(app,location.href).href)','loadApp()');
 await runInNewContext(`(async()=>{${code}})()`,{document:{documentElement:root,querySelector:s=>nodes[s]},location:{reload(){}},loadApp,
  setTimeout(fn,ms){timers.push({fn,ms});return timers.length;},clearTimeout(){},requestAnimationFrame:fn=>fn(),console:{error(){}}});
 return {root,loader,message,retry,timers};
}
test('Startup keeps its cover until application readiness, then fades it out',async()=>{
 let resolveApp;const pending=boot(()=>new Promise(resolve=>{resolveApp=resolve;}));
 resolveApp();const b=await pending;assert.equal(b.root.dataset.boot,'ready');assert.equal(b.retry.hidden,true);
 assert.equal(b.loader.removed,undefined);b.timers.find(t=>t.ms===250).fn();assert.equal(b.loader.removed,true);
});
test('Failed startup retains the cover and offers a focused retry instead of a partial UI',async()=>{
 const b=await boot(()=>Promise.reject(Error('image missing')));assert.equal(b.root.dataset.boot,'error');assert.equal(b.retry.hidden,false);assert.equal(b.retry.focused,true);assert.match(b.message.textContent,/try again/);assert.equal(b.loader.removed,undefined);
});
