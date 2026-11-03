// glossary-tap rework: put the source's prof back on FIX.qs (Intro to Pharmacology) and FIXPK.qs (Basic-Pharmacokinetics)
const fs=require('fs'),path=require('path');const f=process.argv[2];
const load=require('/tmp/port-rework/scripts/ipload.js');
const D=load('/tmp/ip-readonly/exam1-drill/src',['q_L02.js','q_L10.js','q_TERMS.js']);
let t=fs.readFileSync(f,'utf8');
const withProf=(q,prof)=>{const o={id:q.id,prof};for(const k of Object.keys(q)) if(k!=='id'&&k!=='prof') o[k]=q[k];return o;};
t=t.replace(/^const FIX = (\{.*\});$/m,(m,j)=>{const F=JSON.parse(j);F.qs=F.qs.map(q=>{const s=D.QUESTIONS.find(x=>x.id===q.id);if(!s) throw new Error(q.id);return withProf(q,s.prof);});return 'const FIX = '+JSON.stringify(F)+';';});
// PK: q9_worksheets.js line 168 is a JSON object per line
const pkLine=fs.readFileSync('/tmp/pk-readonly/src/q9_worksheets.js','utf8').split('\n')[167];
const pk=JSON.parse(pkLine.replace(/,\s*$/,''));
t=t.replace(/^const FIXPK = (\{.*\});$/m,(m,j)=>{const F=JSON.parse(j);F.qs=F.qs.map(q=>{if(q.id!==pk.id) throw new Error(q.id);return withProf(q,pk.prof);});return 'const FIXPK = '+JSON.stringify(F)+';';});
fs.writeFileSync(f,t);
