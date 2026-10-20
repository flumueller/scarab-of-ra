import {createPool} from './backend/database.mjs';
import {createScoreStore} from './backend/scores.mjs';
import {createGameServer} from './backend/server.mjs';
const development=process.argv.includes('--dev');
const pool=process.env.DATABASE_URL?createPool():null;
if(!pool&&!development)throw Error('DATABASE_URL is required. Run npm run migrate before starting.');
const unavailable={async list(){throw Error('No database configured');},async submit(){throw Error('No database configured');}};
const publicOrigin=process.env.PUBLIC_ORIGIN?new URL(process.env.PUBLIC_ORIGIN).origin:undefined;
if(!development&&!publicOrigin)throw Error('PUBLIC_ORIGIN is required, e.g. https://your-game.example.');
const server=createGameServer({store:pool?createScoreStore(pool):unavailable,development,publicOrigin});
const port=Number(process.env.PORT||4173),host=process.env.HOST||'127.0.0.1';
server.listen(port,host,()=>console.log(`Scarab listening on ${host}:${port}${development?' (development)':''}`));
async function shutdown(){server.close(async()=>{await pool?.end();process.exit(0);});setTimeout(()=>process.exit(1),10000).unref();}
process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);
