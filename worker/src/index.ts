export interface Env { DB: D1Database; HEALTH_SYNC_TOKEN: string; ALLOWED_ORIGIN?: string; }
const json=(body:unknown,status=200,origin="*")=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":origin,"access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"authorization,content-type","vary":"Origin","x-content-type-options":"nosniff"}});
const dayPattern=/^\\d{4}-\\d{2}-\\d{2}$/;
const numberKeys=["activeEnergyKcal","exerciseMinutes","standHours","steps","distanceKm","flights","heartRateMin","heartRateMax"];
function authorized(req:Request,env:Env){const token=(req.headers.get("authorization")||"").replace(/^Bearer\\s+/i,"");return !!env.HEALTH_SYNC_TOKEN&&token===env.HEALTH_SYNC_TOKEN;}
export default {async fetch(req:Request,env:Env):Promise<Response>{
 const origin=req.headers.get("Origin")||"",allow=env.ALLOWED_ORIGIN||"https://sharychen1121.github.io";
 if(origin&&origin!==allow)return json({error:"origin_not_allowed"},403,allow);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:{"access-control-allow-origin":allow,"access-control-allow-methods":"GET,POST,OPTIONS","access-control-allow-headers":"authorization,content-type","access-control-max-age":"86400","vary":"Origin"}});
 const u=new URL(req.url);if(!u.pathname.startsWith("/api/health"))return json({error:"not_found"},404,allow);
 if(!authorized(req,env))return json({error:"unauthorized"},401,allow);
 if(req.method==="GET"){
   const from=u.searchParams.get("from")||"",to=u.searchParams.get("to")||"";
   if(!dayPattern.test(from)||!dayPattern.test(to)||from>to||((Date.parse(to)-Date.parse(from))/86400000)>90)return json({error:"invalid_date_range"},400,allow);
   const {results=[]}=await env.DB.prepare("SELECT day, payload, updated_at FROM health_days WHERE day >= ? AND day <= ? ORDER BY day").bind(from,to).all<{day:string,payload:string,updated_at:string}>();
   return json({days:results.map(r=>({...JSON.parse(r.payload),date:r.day,updatedAt:r.updated_at}))},200,allow);
 }
 if(req.method==="POST"){
   let body:any;try{body=await req.json();}catch{return json({error:"invalid_json"},400,allow);}
   if(!Array.isArray(body?.days)||body.days.length>100)return json({error:"invalid_payload"},400,allow);
   const stmts=[];
   for(const d of body.days){
     if(!d||!dayPattern.test(String(d.date||"")))return json({error:"invalid_day"},400,allow);
     const record:Record<string,number>= {};
     for(const k of numberKeys){const v=Number(d[k]??0);if(!Number.isFinite(v)||v<0||v>100000000)return json({error:"invalid_metric",metric:k},400,allow);record[k]=v;}
     const workouts=Array.isArray(d.workouts)?d.workouts.slice(0,50).map((w:any)=>({name:String(w.name||"Workout").slice(0,80),start:String(w.start||"").slice(0,40),minutes:Math.max(0,Math.min(1440,Number(w.minutes)||0)),activeEnergyKcal:Math.max(0,Math.min(10000,Number(w.activeEnergyKcal)||0)),distanceKm:Math.max(0,Math.min(1000,Number(w.distanceKm)||0))})):[];
     const payload=JSON.stringify({...record,workouts});
     stmts.push(env.DB.prepare("INSERT INTO health_days(day,payload,updated_at) VALUES(?,?,?) ON CONFLICT(day) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at").bind(d.date,payload,new Date().toISOString()));
   }
   if(stmts.length)await env.DB.batch(stmts);
   return json({saved:stmts.length},200,allow);
 }
 return json({error:"method_not_allowed"},405,allow);
}};
