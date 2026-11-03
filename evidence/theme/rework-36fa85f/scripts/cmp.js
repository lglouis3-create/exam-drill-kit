const B=require('/tmp/port-rework/paper-picker/scripts/pkload.js');
const src=require('fs').readFileSync('/tmp/port-rework/th/features/theme/current/test.js','utf8');
const m=src.match(/const FIX = (\{[\s\S]*?\n\});/); const FIX=eval('('+m[1]+')');
const by=Object.fromEntries(B.QUESTIONS.map(q=>[q.id,q]));const s=o=>JSON.stringify(o);
for(const q of FIX.qs){const o=Object.assign({},by[q.id]);console.log(q.id, s(Object.assign({},q,{prof:o.prof}))===s(o), q.prof, o.prof);}
const t=B.TOPICS.find(x=>x.id==='pkpd');console.log('topic', s(Object.assign({},FIX.topic,{prof:t.prof}))===s(t));
const l=B.COURSE.lectures.find(x=>x.id==='L11');console.log('lecture', s(Object.assign({},FIX.lecture,{prof:l.prof}))===s(l));
