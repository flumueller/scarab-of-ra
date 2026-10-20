// Port of CODE 19:010c (main path), 01f0/0244 (branches), 034c (escape test).
// RNG is supplied by the browser engine; it is not Macintosh QuickDraw Random.
export function generateMaze(n,rand){
 const cells=Array.from({length:n*n},()=>({walls:[true,true,true,true],items:[],trap:null}));
 const connected=new Set([0]),main=new Set([0]);
 const neighbour=(p,d)=>{const x=p%n+[0,1,0,-1][d],y=Math.floor(p/n)+[-1,0,1,0][d];return x<0||y<0||x>=n||y>=n?-1:y*n+x;};
 const connect=(p,q,d)=>{cells[p].walls[d]=false;cells[q].walls[(d+2)%4]=false;};
 const randdir=(d,chance)=>rand(100)<chance?d:rand(4);
 // Exclude the existing main path while checking that a candidate can reach the exit.
 const reachesExit=p=>{const seen=new Set(main),stack=[p];while(stack.length){const q=stack.pop();if(q===n*n-1)return true;if(seen.has(q))continue;seen.add(q);for(let d=0;d<4;d++){const r=neighbour(q,d);if(r>=0&&!seen.has(r))stack.push(r);}}return false;};
 let p=0,d=rand(2)?2:1;
 while(p!==n*n-1){d=randdir(d,16);let choices=[0,1,3,2];let q;
  while((q=neighbour(p,d))<0||main.has(q)||!reachesExit(q)){choices=choices.filter(v=>v!==d);if(!choices.length)throw Error('No route to exit');d=choices[rand(choices.length)];}
  connect(p,q,d);p=q;main.add(p);connected.add(p);
 }
 const visiting=new Set();
 function branch(p,d){if(connected.has(p))return true;visiting.add(p);d=randdir(d,1);
  for(let i=0;i<4;i++,d=(d+1)%4){const q=neighbour(p,d);if(q>=0&&!visiting.has(q)&&branch(q,d)){connected.add(p);visiting.delete(p);connect(p,q,d);return true;}}
  return false;
 }
 for(let p=0;p<n*n;p++)if(!connected.has(p)){visiting.clear();branch(p,randdir(2,-1));}
 return cells;
}
