const fs=require('fs'),vm=require('vm');const ctx={window:{},console};vm.createContext(ctx);
const files=['course.js'];const c=fs.readFileSync('course.js','utf8');vm.runInContext(c+';this.COURSE=COURSE;',ctx);
for(const f of ctx.COURSE.files||[]){try{vm.runInContext(fs.readFileSync(f,'utf8').replace(/^(const|let) /gm,'var '),ctx);}catch(e){}}
const Q=[];for(const k of Object.keys(ctx)) if(Array.isArray(ctx[k])&&ctx[k][0]&&ctx[k][0].concept&&ctx[k][0].stem) Q.push(...ctx[k]);
const by={};Q.forEach(q=>{(by[q.concept]||=new Set()).add(q.topic)});
const multi=Object.entries(by).filter(([c,s])=>s.size>1);console.log('questions',Q.length,'concepts',Object.keys(by).length,'in >1 topic',multi.length);
const pre=t=>t.split('-')[0];const pairs={};multi.forEach(([c,s])=>{const k=[...s].map(pre).sort().join('+');pairs[k]=(pairs[k]||0)+1});console.log(pairs);
