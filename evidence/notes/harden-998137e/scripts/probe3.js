// For topics pkpd and nonlin of Basic-Pharmacokinetics (ac2eb73): each question's option count, dupOf,
// whether it has {{frac:}}, and whether it names the professor (case-insensitive) or uses she/her.
const fs=require('fs'),vm=require('vm');
const S='/tmp/pk-readonly/src/';
const rd=f=>fs.readFileSync(S+f,'utf8');
const code=rd('course.js')+'\nvar TOPICS=[];var CHAINS=[];\n'+rd('q13_quizzes.js')+'\n'+rd('q15_module7b.js')+'\n'+rd('q16_module8.js')+
 '\n;globalThis.__R={COURSE,TOPICS,Q:[].concat(Q_QUIZZES,Q_MODULE7B,Q_MODULE8)};';
const c={};vm.createContext(c);vm.runInContext(code,c);
const {COURSE,Q}=c.__R;const prof=COURSE.professors[0].toLowerCase();
for(const q of Q.filter(q=>q.topic==='pkpd'||q.topic==='nonlin')){const r=Object.assign({},q);delete r.prof;const s=JSON.stringify(r);
 const bad=s.toLowerCase().includes(prof)||/\b(she|her|hers|herself)\b/i.test(s)||/given as/i.test(s);
 if(bad) continue;
 console.log(q.id,q.topic,(q.type||'mc')+(q.multi?'-multi':''),'opts:'+(q.options||[]).length,'right:'+(q.options||[]).filter(o=>o.correct).length,'dup:'+(q.dupOf||''),'frac:'+/\{\{frac/.test(s), 'steps:'+(q.steps||[]).length);}
