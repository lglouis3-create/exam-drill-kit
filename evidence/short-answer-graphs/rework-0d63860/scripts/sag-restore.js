// short-answer-graphs rework: prof, lectures L14/L21/TBL3, the Graphs intro lines and the Short answer subtitle back to the source (929cd62)
const fs=require('fs');const f=process.argv[2];
const load=require('/tmp/port-rework/scripts/ipload.js');
const SRC='/tmp/ip-readonly/exam1-drill/src';
const D=load(SRC,['q_FIGS.js','q_L06.js','q_PE2.js']);
let t=fs.readFileSync(f,'utf8');
const lines=t.split('\n'); const i=lines.findIndex(l=>l.startsWith('const IP = '));
const IP=JSON.parse(lines[i].slice('const IP = '.length,-1));
if(JSON.stringify(IP)!==lines[i].slice('const IP = '.length,-1)) throw new Error('IP does not round-trip');
const put=(o,prof)=>{ if(o.prof===undefined) throw new Error('no prof on '+o.id); o.prof=prof; };
IP.qs.forEach(q=>{const s=D.QUESTIONS.find(x=>x.id===q.id); put(q,s.prof);});
IP.topics.forEach(tp=>{const s=D.TOPICS.find(x=>x.id===tp.id); put(tp,s.prof);});
IP.lectures.forEach(l=>{const s=D.COURSE.lectures.find(x=>x.id===l.id); put(l,s.prof);});
for(const id of ['L14','L21','TBL3']){ if(IP.lectures.some(l=>l.id===id)) continue; const s=D.COURSE.lectures.find(x=>x.id===id); IP.lectures.push(JSON.parse(JSON.stringify(s))); }
lines[i]='const IP = '+JSON.stringify(IP)+';';
t=lines.join('\n');
// the Graphs page's intro lines, app.js vGraphs INTRO, and the Short answer subtitle, app.js vSa
const app=fs.readFileSync(SRC+'/app.js','utf8');
const m=app.match(/const INTRO = \{1: '([^']*)',\n\s+2: '([^']*)'\};/); if(!m) throw new Error('no INTRO');
const sa=app.match(/<p class="sub">(Her exam has two short-answer questions graded with partial credit\.)/); if(!sa) throw new Error('no vSa subtitle');
const r=(a,b)=>{ if(!t.includes(a)) throw new Error('missing: '+a.slice(0,70)); t=t.replace(a,()=>b); };
r(`const EXAMS = {1: {intro: "Dose–response curves from the professor's PollEV polls, Jeopardy, the 9/30 review and Part 3: read the shift, the baseline and the maximum."},`,
  `const EXAMS = {1: {intro: ${JSON.stringify(m[1])}},`);
r(`  2: {intro: "Tissue tracings from the professor's Exam 2 polls and review: read which tissue and response are measured, which receptor the drug acts on, and whether the response is helped or blocked.",`,
  `  2: {intro: ${JSON.stringify(m[2])},`);
r(`const SA_ABOUT = "The professor's exam has two short-answer questions graded with partial credit.";`, `const SA_ABOUT = ${JSON.stringify(sa[1])};`);
fs.writeFileSync(f,t);
console.log('prof:', [...new Set([].concat(IP.qs,IP.topics,IP.lectures).map(x=>x.prof))], 'lectures', IP.lectures.map(l=>l.id).join(','));
