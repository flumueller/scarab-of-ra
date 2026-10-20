// Apply material colours only to the scene's white paper. Engraved black ink,
// silhouettes and darkness remain intact, so colour never exposes hidden detail.
export const MATERIALS={floor:[251,248,242],stone:[248,241,226],door:[235,221,202]};
export function colourScene(data,mask){
 for(let p=0;p<data.length;p+=4){if(!data[p])continue;const code=mask[p];const colour=code>200?MATERIALS.door:code>120?MATERIALS.stone:MATERIALS.floor;for(let ch=0;ch<3;ch++)data[p+ch]=colour[ch];}
 return data;
}
export function fillMaterial(context,points,code){context.fillStyle=`rgb(${code},0,0)`;context.beginPath();points.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y));context.closePath();context.fill();}
export function vesselPalette(kind,colour){return !colour?{empty:'#050505',liquid:'#fff',ink:'#111',shine:'#fff'}:kind==='health'?{empty:'#211a19',liquid:'#dfbbb6',ink:'#76504b',shine:'#faeae5'}:{empty:'#1c2017',liquid:'#ccd2b9',ink:'#626b4e',shine:'#f1f3e6'};}
