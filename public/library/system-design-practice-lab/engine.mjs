export const DAY=86400000;
export function hash(s){let n=2166136261;for(const c of String(s)){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
export function shuffle(list,seed=1){const a=[...list];let x=hash(seed)||1;for(let i=a.length-1;i>0;i--){x^=x<<13;x^=x>>>17;x^=x<<5;const j=(x>>>0)%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
export function grade(q,response){
 if(q.kind==='numeric'){
   if(response===null||response===undefined||String(response).trim()==='')return false;
   const raw=String(response).trim();
   if(raw.includes(',')&&!/^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d*)?(?:e[+-]?\d+)?$/i.test(raw))return false;
   const cleaned=raw.replace(/,/g,'');
   if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(cleaned))return false;
   const n=Number(cleaned);return Number.isFinite(n)&&Math.abs(n-q.numeric.value)<=Math.max(q.numeric.tolerance||0,Number.EPSILON*Math.max(1,Math.abs(q.numeric.value))*8);
 }
 if(q.kind==='match')return !!response&&typeof response==='object'&&q.items.every(i=>response[i.id]===q.answer[i.id]);
 if(q.kind==='order')return Array.isArray(response)&&response.length===q.answer.length&&q.answer.every((id,i)=>response[i]===id);
 const got=Array.isArray(response)?response:[response];
 return got.length===q.answer.length&&new Set(got).size===got.length&&q.answer.every(id=>got.includes(id));
}
export function isAnswered(q,response){
 if(q.kind==='numeric')return response!==undefined&&response!==null&&String(response).trim()!=='';
 if(q.kind==='match')return q.items.every(i=>response?.[i.id]);
 if(q.kind==='order')return Array.isArray(response)&&response.length===q.items.length;
 return Array.isArray(response)&&response.length>0;
}
export function emptyProgress(){return {version:1,answers:{},saved:[],notes:{},sessions:[],session:null,theme:'light'};}
export function cleanProgress(value,validIds){
 if(!value||value.version!==1||!value.answers||typeof value.answers!=='object'||Array.isArray(value.answers))throw new Error('This is not a supported Design Gym backup.');
 const clean=emptyProgress(),known=id=>typeof id==='string'&&validIds.has(id);
 clean.saved=Array.isArray(value.saved)?[...new Set(value.saved.filter(known))]:[];
 if(value.notes&&typeof value.notes==='object')for(const [id,n]of Object.entries(value.notes))if(known(id)&&typeof n==='string')clean.notes[id]=n.slice(0,12000);
 for(const[id,r]of Object.entries(value.answers))if(known(id)&&r&&Number.isFinite(r.attempts)&&r.attempts>=0){
   clean.answers[id]={attempts:Math.min(1e6,Math.floor(r.attempts)),correct:Math.max(0,Math.min(Math.floor(r.correct)||0,Math.floor(r.attempts))),lastCorrect:r.lastCorrect===true,streak:Math.max(0,Math.min(30,Math.floor(r.streak)||0)),lastAt:Math.max(0,Number(r.lastAt)||0),due:Math.max(0,Number(r.due)||0),confidence:['low','medium','high'].includes(r.confidence)?r.confidence:'medium',revealed:r.revealed===true};
 }
 clean.theme=value.theme==='dark'?'dark':'light';
 clean.sessions=Array.isArray(value.sessions)?value.sessions.filter(s=>s&&typeof s.id==='string'&&Number.isFinite(s.at)&&Number.isFinite(s.total)&&Number.isFinite(s.correct)).slice(-100).map(s=>({id:s.id,at:s.at,total:s.total,correct:Math.min(s.correct,s.total),mode:s.mode==='exam'?'exam':'practice'})):[];
 return clean;
}
export function recordAttempt(progress,q,response,confidence='medium',now=Date.now()){
 const previous=progress.answers[q.id]||{attempts:0,correct:0,streak:0};
 const correct=grade(q,response),streak=correct?(previous.streak||0)+1:0;
 const intervals=[1,3,7,14,30];const days=correct?(confidence==='low'?1:intervals[Math.min(streak-1,4)]):0;
 progress.answers[q.id]={attempts:previous.attempts+1,correct:previous.correct+(correct?1:0),lastCorrect:correct,streak,lastAt:now,due:now+days*DAY,confidence,revealed:false};
 return correct;
}
export function matches(q,filters,progress,now=Date.now()){
 if(filters.tracks?.length&&!filters.tracks.includes(q.track))return false;
 if(filters.level&&filters.level!=='all'&&q.level!==filters.level)return false;
 if(filters.kind&&filters.kind!=='all'&&q.kind!==filters.kind)return false;
 const r=progress.answers[q.id];
 if(filters.status==='unseen'&&r)return false;
 if(filters.status==='missed'&&(!r||r.lastCorrect))return false;
 if(filters.status==='due'&&(!r||r.due>now))return false;
 if(filters.status==='saved'&&!progress.saved.includes(q.id))return false;
 if(filters.query){const hay=`${q.title} ${q.caseTitle} ${q.context} ${q.prompt} ${q.tags.join(' ')}`.toLowerCase();if(!filters.query.trim().toLowerCase().split(/\s+/).every(t=>hay.includes(t)))return false;}
 return true;
}
export function selectSession(questions,filters,progress,count=20,seed=Date.now()){
 const selected=shuffle(questions.filter(q=>matches(q,filters,progress)),seed),groups=new Map();
 for(const q of selected){if(!groups.has(q.family))groups.set(q.family,[]);groups.get(q.family).push(q);}
 const out=[],families=shuffle([...groups.values()],String(seed)+'-families');
 while(out.length<count&&families.some(g=>g.length))for(const g of families){if(g.length&&out.length<count)out.push(g.shift().id);}
 return out;
}
export function summary(progress,questions,now=Date.now()){
 const records=Object.values(progress.answers),attempts=records.reduce((s,r)=>s+r.attempts,0),correct=records.reduce((s,r)=>s+r.correct,0);
 return {seen:records.length,attempts,correct,accuracy:attempts?Math.round(correct/attempts*100):null,due:records.filter(r=>r.due<=now).length,saved:progress.saved.length,total:questions.length};
}
