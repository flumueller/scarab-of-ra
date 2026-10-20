import {t} from './i18n.js';
import {drawMap,mapMetrics,MAP_SIZE} from './map-render.js';
export function mountMap(host,g){
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 const layout=el('div',null,'atlas-layout'),side=el('aside',null,'atlas-sidebar'),view=el('div',null,'atlas-view'),grid=el('div',null,'atlas-grid'),canvas=el('canvas');
 canvas.setAttribute('aria-label','Map of the current pyramid level');grid.append(canvas);
 let selected=g.y*g.n+g.x,original=g.notes[selected]||'';
 side.append(el('p',`LEVEL ${String(g.level).padStart(2,'0')} · GREAT PYRAMID`,'guide-kicker'),el('h2','Your expedition'),el('p',g.oriented?'Your position is marked by an open circle.':'You are disoriented. Return to a known square at a slower speed.'));
 const legend=el('ul',null,'atlas-legend');for(const [cls,label] of [['walked','Explored'],['seen','Seen corridor'],['unknown','Unexplored'],['position','Your position'],['selection','Selected square']]){const li=el('li');li.append(el('span',null,'atlas-swatch '+cls),document.createTextNode(label));legend.append(li);}side.append(legend);
 const label=el('label',null,'atlas-note-label'),heading=el('span'),note=el('textarea');note.id='map-note';note.maxLength=300;note.placeholder='Leave a reminder for this square…';note.setAttribute('aria-label','Map notes');label.append(heading,note);side.append(label);
 const hint=el('p','Notes are kept with your saved expedition.','atlas-note-hint'),undo=el('button','Undo note changes');undo.type='button';side.append(hint,undo);
 const buttons=[];
 const draw=()=>{drawMap(canvas,g,selected);heading.textContent=`Notes · square ${selected%g.n+1}, ${Math.floor(selected/g.n)+1}`;for(let p=0;p<buttons.length;p++){buttons[p].setAttribute('aria-pressed',String(p===selected));buttons[p].title=g.notes[p]||'';}};
 const {step}=mapMetrics(g.n);
 for(let p=0;p<g.cells.length;p++){const b=el('button');b.type='button';b.translate=false;b.setAttribute('aria-label',t(`Square ${p%g.n+1}, ${Math.floor(p/g.n)+1}, ${['unexplored','seen','explored'][g.known[p]]}${p===g.y*g.n+g.x&&g.oriented?', you are here':''}`));b.style.cssText=`left:${p%g.n*step/MAP_SIZE*100}%;top:${Math.floor(p/g.n)*step/MAP_SIZE*100}%;width:${step/MAP_SIZE*100}%;height:${step/MAP_SIZE*100}%`;b.onclick=()=>{selected=p;original=g.notes[p]||'';note.value=original;draw();};buttons.push(b);grid.append(b);}
 note.value=original;note.oninput=()=>{g.notes[selected]=note.value;draw();};undo.onclick=()=>{g.notes[selected]=original;note.value=original;draw();};
 view.append(el('p','Select a square to read or write a note.','atlas-instruction'),grid);layout.append(side,view);host.append(layout);draw();
}
