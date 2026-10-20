const endpoint=new URL('api/scores',new URL('.',import.meta.url));
async function request(options){
 const response=await fetch(endpoint,{cache:'no-store',signal:AbortSignal.timeout(10000),...options});
 const data=await response.json();
 if(!response.ok)throw Error(data.error||'The shared leaderboard is unavailable.');
 return data;
}
export async function listScores(){return (await request()).scores;}
export async function submitScore(score){return (await request({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(score)})).score;}
