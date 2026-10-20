import {RequestError} from './scores.mjs';
export function json(res,status,value,headers={}){
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(value));
}
async function readJson(req){
 if(req.headers['content-type']?.split(';')[0].trim().toLowerCase()!=='application/json')throw new RequestError(415,'Use application/json.');
 let size=0;const chunks=[];
 if(Number(req.headers['content-length'])>2048)throw new RequestError(413,'Request too large.');
 for await(const chunk of req){size+=chunk.length;if(size>2048)throw new RequestError(413,'Request too large.');chunks.push(chunk);}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new RequestError(400,'Invalid JSON.');}
}
export function createScoreApi(store,{publicOrigin}={}){
 // Global burst guard also works behind a proxy without trusting forwarded IPs.
 let writes=0,windowStart=Date.now();
 return async(req,res)=>{
  try{
   if(req.method==='GET'){json(res,200,{scores:await store.list()});return;}
   if(req.method!=='POST'){json(res,405,{error:'Method not allowed.'},{Allow:'GET, POST'});return;}
   const expected=publicOrigin||`http://${req.headers.host}`;
   if(req.headers.origin&&req.headers.origin!==expected)throw new RequestError(403,'Origin not allowed.');
   if(Date.now()-windowStart>=60000){writes=0;windowStart=Date.now();}
   if(++writes>60){json(res,429,{error:'Too many submissions. Please try again shortly.'},{'Retry-After':'60'});return;}
   const result=await store.submit(await readJson(req));json(res,result.created?201:200,{score:result.score});
  }catch(error){
   if(error instanceof RequestError)json(res,error.status,{error:error.message});
   else{console.error('Leaderboard database request failed.');json(res,503,{error:'The shared leaderboard is temporarily unavailable.'});}
  }
 };
}
