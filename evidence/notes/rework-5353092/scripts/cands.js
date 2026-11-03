// lists Basic-Pharmacokinetics (ac2eb73) questions of topics pkpd and nonlin that the notes port left out for
// naming the professor or using a pronoun for her, or for a core refusal; with fields the core checks read
const fs=require('fs'),vm=require('vm');const S='/tmp/pk-readonly/src/';const rd=f=>fs.readFileSync(S+f,'utf8');
const code=rd('course.js')+'\nvar TOPICS=[];var CHAINS=[];\n'+rd('q13_quizzes.js')+'\n'+rd('q15_module7b.js')+'\n'+rd('q16_module8.js')+'\n;globalThis.__R={COURSE,TOPICS,Q:[].concat(Q_QUIZZES,Q_MODULE7B,Q_MODULE8)};';
const c={};vm.createContext(c);vm.runInContext(code,c);const {COURSE,Q}=c.__R;const prof=COURSE.professors[0].toLowerCase();
const decks=COURSE.lectures.map(l=>l.deck);
const out=[];
for(const q of Q.filter(q=>q.topic==='pkpd'||q.topic==='nonlin')){const r=Object.assign({},q);delete r.prof;const s=JSON.stringify(r);
 const why=[];if(s.toLowerCase().includes(prof))why.push('name');if(/\b(she|her|hers|herself)\b/i.test(s))why.push('pronoun');if(/given as/i.test(s))why.push('given-as');if(!q.type&&(q.options||[]).length<3)why.push('2opts');
 out.push({id:q.id,why,dupOf:q.dupOf||'',type:q.type||'mc',steps:(q.steps||[]).length,teachImg:!!q.teachImg,fig:!!(q.fig||/"fig"/.test(s)),deck:decks.some(d=>String(q.cite||'').includes(d)),lecture:q.lecture});}
console.log(JSON.stringify(out));
