import pg from 'pg';
export function createPool(connectionString=process.env.DATABASE_URL){
 if(!connectionString)throw Error('DATABASE_URL is required. See DEPLOYMENT.md.');
 const pool=new pg.Pool({connectionString,max:5,idleTimeoutMillis:30000,connectionTimeoutMillis:5000,statement_timeout:5000,application_name:'scarab-leaderboard'});
 pool.on('error',()=>console.error('PostgreSQL connection lost.'));
 return pool;
}
