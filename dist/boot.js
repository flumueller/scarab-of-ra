const root=document.documentElement,loader=document.querySelector('#boot-loader');
const retry=document.querySelector('#boot-retry');retry.onclick=()=>location.reload();
let timer;
try{
 const app=document.querySelector('#boot-script').dataset.appModule;
 await Promise.race([
  import(new URL(app,location.href).href),
  new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Startup timed out')),30000);})
 ]);
 clearTimeout(timer);
 // Commit the complete menu/game frame before removing the loading cover.
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 root.dataset.boot='ready';loader.setAttribute('aria-hidden','true');
 document.querySelector('#start-screen:not([hidden]) button:not([hidden]):not(:disabled)')?.focus();
 setTimeout(()=>loader.remove(),250);
}catch(error){
 clearTimeout(timer);root.dataset.boot='error';
 document.querySelector('#boot-message').textContent='The pyramid could not be loaded. Please try again.';
 retry.hidden=false;retry.focus();console.error('Game startup failed:',error);
}
