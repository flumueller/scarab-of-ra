import {presentation} from './i18n.js';
import {drawVessel} from './vessel.js';
import {mapMetrics} from './map-render.js';
export function minimapMarker(g){
 if(!g.oriented)return null;
 const {step}=mapMetrics(g.n);
 return {x:(g.x+.5)*step/296*100,y:(g.y+.5)*step/296*100,angle:g.dir*90,direction:['N','E','S','W'][g.dir]};
}
export function minimapDoors(g){
 const {step}=mapMetrics(g.n);
 return [{p:0,name:'Entrance',label:'IN',south:false},{p:g.exit,name:'Exit',label:'OUT',south:true}]
  .filter(d=>Number.isInteger(d.p)&&g.known[d.p])
  .map(d=>({...d,x:(d.p%g.n+.5)*step/296*100,y:(Math.floor(d.p/g.n)+(d.south?1:0))*step/296*100}));
}
export function groupedNews(messages){
 const rows=[];for(const message of messages){const last=rows.at(-1);if(last?.message===message)last.count++;else rows.push({message,count:1});}return rows;
}
// Solid monochrome fills remain legible when the full map is reduced.
// Draw walls only for known squares; never reveal unexplored passages.
export function drawMinimap(canvas,g){
 const dpr=globalThis.devicePixelRatio||1;
 const width=Math.round((canvas.clientWidth||296)*dpr),height=Math.round((canvas.clientHeight||296)*dpr);
 canvas.width=width;canvas.height=height;
 const c=canvas.getContext('2d'),{step}=mapMetrics(g.n),ink=Math.max(2,Math.round(2*dpr));
 const X=v=>Math.round(v/296*width),Y=v=>Math.round(v/296*height);
 c.fillStyle='#fff';c.fillRect(0,0,width,height);
 for(let p=0;p<g.cells.length;p++){
  const x=p%g.n*step,y=Math.floor(p/g.n)*step;
  c.fillStyle=g.known[p]===2?'#fff':g.known[p]===1?'#ddd':'#777';
  c.fillRect(X(x),Y(y),X(x+step+2)-X(x),Y(y+step+2)-Y(y));
 }
 c.fillStyle='#000';
 // Shared edges reuse exactly the same device pixels. No scaled 296px bitmap:
 // every horizontal and vertical wall is two CSS pixels at every map size.
 for(let p=0;p<g.cells.length;p++)if(g.known[p]){
  const x=p%g.n*step,y=Math.floor(p/g.n)*step,[top,right,bottom,left]=g.cells[p].walls;
  const x0=X(x),y0=Y(y),x1=Math.min(width-ink,X(x+step)),y1=Math.min(height-ink,Y(y+step));
  if(top)c.fillRect(x0,y0,x1-x0+ink,ink);
  if(right)c.fillRect(x1,y0,ink,y1-y0+ink);
  if(bottom)c.fillRect(x0,y1,x1-x0+ink,ink);
  if(left)c.fillRect(x0,y0,ink,y1-y0+ink);
 }
}
export function createModernHud({onMap,onThrow}){
 const $=s=>document.querySelector(s);let newsVisible=true;
 const vessels=['.vital-health','.vital-hunger'].map(selector=>{const canvas=document.createElement('canvas');canvas.className='vessel-liquid';canvas.setAttribute('aria-hidden','true');$(selector+' .orb-well').prepend(canvas);return canvas;});
 try{newsVisible=localStorage.getItem('scarab-ra-news-visible')!=='false';}catch{}
 const applyNews=()=>{document.documentElement.dataset.newsVisible=String(newsVisible);$('#toggle-news').setAttribute('aria-pressed',String(newsVisible));$('#toggle-news').textContent=newsVisible?'Diary on':'Diary off';};
 $('#toggle-news').onclick=()=>{newsVisible=!newsVisible;applyNews();try{localStorage.setItem('scarab-ra-news-visible',String(newsVisible));}catch{}};applyNews();
 let mapState;new ResizeObserver(()=>{if(mapState)drawMinimap($('#minimap'),mapState);}).observe($('#minimap-button'));
 const slots=$('#inventory'),syncSlots=()=>{$('#slots-prev').disabled=slots.scrollLeft<=0;$('#slots-next').disabled=slots.scrollLeft+slots.clientWidth>=slots.scrollWidth-1;};
 $('#slots-prev').onclick=()=>{slots.scrollLeft-=240;syncSlots();};$('#slots-next').onclick=()=>{slots.scrollLeft+=240;syncSlots();};slots.addEventListener('scroll',syncSlots);window.addEventListener('resize',syncSlots);new ResizeObserver(syncSlots).observe(slots);
 $('#minimap-button').onclick=onMap;$('#throw-item').onclick=onThrow;
 const syncFullscreen=()=>{$('#fullscreen').textContent=document.fullscreenElement?'Exit fullscreen':'Fullscreen';$('#fullscreen').setAttribute('aria-pressed',String(!!document.fullscreenElement));};
 $('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();$('#hud-feedback').textContent='';}catch{$('#hud-feedback').textContent='Fullscreen is unavailable in this browser. The view already fills the window.';}};
 document.addEventListener('fullscreenchange',syncFullscreen);syncFullscreen();
 return {render(g,selected,suspended,selectedLabel){
  syncSlots();
  drawVessel(vessels[0],g.health,{kind:'health',colour:presentation().colour});drawVessel(vessels[1],100-g.hunger,{kind:'satiety',colour:presentation().colour});
  $('#modern-level').textContent=`LEVEL ${String(g.level).padStart(2,'0')} · GREAT PYRAMID`;
  $('#selected-item').textContent=selected?selectedLabel:'Select an item';
  $('#throw-item').disabled=!selected||suspended||g.status!=='playing';
  $('#modern-health').value=g.health;$('#modern-health-value').textContent=`${Math.round(g.health)} / 100`;$('#modern-hunger').value=100-g.hunger;$('#modern-hunger-value').textContent=`${Math.round(100-g.hunger)} / 100`;$('.vital-health').style.setProperty('--fill',`${Math.max(0,Math.min(100,g.health))}%`);$('.vital-hunger').style.setProperty('--fill',`${Math.max(0,Math.min(100,100-g.hunger))}%`);
  $('#modern-oil').textContent=`${Math.round(g.oil)}%`;$('#modern-oil-bar').value=g.oil;$('#modern-oil-bar').title=`Lamp oil: ${Math.round(g.oil)}%`;
  $('#minimap-button').disabled=suspended;
  mapState=g;drawMinimap($('#minimap'),g);
  const doors=$('#minimap-doors');doors.replaceChildren();
  for(const door of minimapDoors(g)){const badge=document.createElement('span');badge.className='minimap-door';badge.textContent=door.label;badge.title=door.name;badge.style.left=`clamp(14px, ${door.x}%, calc(100% - 14px))`;badge.style.top=`clamp(5px, ${door.y}%, calc(100% - 5px))`;doors.append(badge);}
  const log=$('#modern-news');log.replaceChildren();
  for(const row of groupedNews(g.messages)){const p=document.createElement('p');p.textContent=row.message;if(row.count>1){const count=document.createElement('span');count.className='news-count';count.textContent=`×${row.count}`;p.append(count);}log.append(p);}log.scrollTop=log.scrollHeight;
  const marker=minimapMarker(g),arrow=$('#minimap-arrow');arrow.hidden=!marker;
  if(marker){arrow.style.left=`clamp(10px, ${marker.x}%, calc(100% - 10px))`;arrow.style.top=`clamp(10px, ${marker.y}%, calc(100% - 10px))`;arrow.style.transform=`translate(-50%,-50%) rotate(${marker.angle}deg)`;}
  $('#minimap-heading').textContent=marker?`FACING ${marker.direction} · MAP [M]`:'POSITION LOST · MAP [M]';
  $('#minimap-button').setAttribute('aria-label',marker?`Open map; facing ${marker.direction}, level ${g.level}`:'Open map; position lost');
 }};
}
