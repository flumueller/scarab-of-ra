// Small fixed junctions, independent of random level generation.
export function wallScene(kind='both',depth=1){
 const n=7,cells=Array.from({length:n*n},()=>({walls:[true,true,true,true],items:[]}));
 const connect=(p,dir)=>{const q=p+[ -n,1,n,-1 ][dir];cells[p].walls[dir]=false;cells[q].walls[(dir+2)%4]=false;};
 const start=10;
 for(let d=0;d<depth;d++)connect(start+d*n,2);
 for(let d=0;d<=depth;d++){
  if(kind!=='right')connect(start+d*n,1);
  if(kind!=='left')connect(start+d*n,3);
 }
 if(kind==='return'){
  // An isolated side passage continuing forward: no loop in the maze.
  cells[start+n].walls[1]=true;cells[start+n+1].walls[3]=true;
  connect(start+1,2);
 }
 cells[start+depth*n].items=[{type:'key',qty:1}];
 return {x:3,y:1,n,dir:2,cells,exit:48,lit:true,animals:[]};
}
