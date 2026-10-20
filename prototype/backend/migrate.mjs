import {readFile} from 'node:fs/promises';
import {createPool} from './database.mjs';
const pool=createPool();
try{await pool.query(await readFile(new URL('../db/001-leaderboard.sql',import.meta.url),'utf8'));console.log('Leaderboard schema ready.');}
finally{await pool.end();}
