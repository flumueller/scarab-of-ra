import {createServer} from 'node:http';
import {readFile,realpath} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createScoreApi,json} from './http.mjs';
const project=fileURLToPath(new URL('../',import.meta.url)),root=resolve(project,'dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf','.m4a':'audio/mp4','.wav':'audio/wav'};
export function createGameServer({store,development=false,publicOrigin}={}){
 const scoreApi=createScoreApi(store,{publicOrigin});
 const server=createServer(async(req,res)=>{
  let url;try{url=new URL(req.url,'http://localhost');}catch{res.writeHead(400);res.end();return;}
  if(url.pathname==='/api/scores'){await scoreApi(req,res);return;}
  if(url.pathname==='/healthz'){
   if(req.method!=='GET'){res.writeHead(405,{Allow:'GET'});res.end();return;}
   try{await store.list();json(res,200,{status:'ok'});}catch{json(res,503,{status:'unavailable'});}return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return;}
  try{
   let data,type;
   if(url.pathname.startsWith('/__')){
    if(!development)throw Error('Not found');
    if(url.pathname==='/__scenario'){
     data=(await readFile(resolve(root,'index.html'),'utf8')).replace('data-app-module="./app.js"',`data-app-module="/__scenario-app.js?case=${encodeURIComponent(url.searchParams.get('case')||'tools')}"`);type=types['.html'];
    }else if(url.pathname==='/__scenario-app.js'){
     data=(await readFile(resolve(root,'app.js'),'utf8')).replace("const SAVE='scarab-ra-prototype-v2';let g=createGame()", "import {scenario} from '/__scenarios.js';const SAVE='scarab-ra-qa-v3';let g=scenario(new URL(import.meta.url).searchParams.get('case'))");type=types['.js'];
    }else if(url.pathname==='/__scenarios.js'){
     data=(await readFile(resolve(project,'tests/scenarios.mjs'),'utf8')).replace("'../dist/engine.js'","'/engine.js'").replace("'./wall-scenes.mjs'","'/__wall-scenes.js'");type=types['.js'];
    }else if(url.pathname==='/__wall-scenes.js'){data=await readFile(resolve(project,'tests/wall-scenes.mjs'));type=types['.js'];}
    else if(url.pathname==='/__render-check'){data=await readFile(resolve(project,'tests/render-check.html'));type=types['.html'];}
    else throw Error('Not found');
   }else{
    const path=await realpath(resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname)));
    if(!path.startsWith(root+sep))throw Error('Not found');
    data=await readFile(path);type=types[extname(path)]||'application/octet-stream';
   }
   res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404);res.end('Not found');}
 });
 server.requestTimeout=10000;server.headersTimeout=10000;
 return server;
}
