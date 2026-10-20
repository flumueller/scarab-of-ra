export class RequestError extends Error {
 constructor(status,message){super(message);this.status=status;}
}
export function validateScore(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new RequestError(400,'Invalid score.');
 const {submissionId,prestige,level,status}=value;
 const name=typeof value.name==='string'?value.name.trim():'';
 if(typeof submissionId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)||
  !name||name.length>32||/[\x00-\x1f\x7f]/.test(name)||
  !Number.isInteger(prestige)||prestige<0||prestige>1000000000||
  !Number.isInteger(level)||level<1||level>10000||!['won','dead','quit'].includes(status)){
  throw new RequestError(400,'Invalid name or score.');
 }
 return {submissionId:submissionId.toLowerCase(),name,prestige,level,status};
}
export function createScoreStore(db){
 const publicColumns='name, prestige, level, status, created_at AS date';
 return {
  async list(){return (await db.query(`SELECT ${publicColumns} FROM leaderboard.scores ORDER BY prestige DESC, created_at ASC, submission_id ASC LIMIT 10`)).rows;},
  async submit(input){
   const score=validateScore(input),values=[score.submissionId,score.name,score.prestige,score.level,score.status];
   const result=await db.query(`INSERT INTO leaderboard.scores (submission_id,name,prestige,level,status) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (submission_id) DO NOTHING RETURNING ${publicColumns}`,values);
   if(result.rows.length)return {created:true,score:result.rows[0]};
   const existing=(await db.query(`SELECT ${publicColumns} FROM leaderboard.scores WHERE submission_id=$1`,[score.submissionId])).rows[0];
   if(!existing||['name','prestige','level','status'].some(k=>existing[k]!==score[k]))throw new RequestError(409,'This expedition already has a different score.');
   return {created:false,score:existing};
  }
 };
}
