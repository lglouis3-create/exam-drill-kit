// compare glossary-tap FIX / FIXPK with the sources, field by field
const fs=require('fs'),vm=require('vm'),path=require('path');
const t=fs.readFileSync(process.argv[2],'utf8');
const F=JSON.parse(t.match(/^const FIX = (\{.*\});$/m)[1]);
const P=JSON.parse(t.match(/^const FIXPK = (\{.*\});$/m)[1]);
const IP='/tmp/ip-readonly/exam1-drill/src', PK='/tmp/pk-readonly/src';
function sbx(dir, files, pre){ const sb={TOPICS:[],QUESTIONS:[],console};vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(dir,'course.js'),'utf8'),sb);
  for(const f of files){ try{ vm.runInContext(fs.readFileSync(path.join(dir,f),'utf8')+(pre||''),sb,{filename:f}); }catch(e){ console.log('load',f,e.message); } }
  return sb; }
const ipf=fs.readdirSync(IP).filter(f=>/^q_.*\.js$/.test(f));
const S=sbx(IP,['glossary.js'].concat(ipf),'\n;globalThis.__T=typeof TERMS!=="undefined"?TERMS:globalThis.__T;');
const terms=S.__T||[];
let d=0;
for(const ft of F.terms){ const st=terms.find(x=>x.id===ft.id); if(!st){console.log('no src term',ft.id);continue;}
  for(const k of Object.keys(ft)) if(JSON.stringify(ft[k])!==JSON.stringify(st[k])){d++;console.log('term diff',ft.id,k);} 
  for(const k of Object.keys(st)) if(!(k in ft)) console.log('term omit',ft.id,k); }
for(const fq of F.qs){ const sq=S.QUESTIONS.find(x=>x.id===fq.id); if(!sq){console.log('no src q',fq.id);continue;}
  for(const k of Object.keys(fq)) if(JSON.stringify(fq[k])!==JSON.stringify(sq[k])){d++;console.log('q diff',fq.id,k);}
  for(const k of Object.keys(sq)) if(!(k in fq)) console.log('q omit',fq.id,k,JSON.stringify(sq[k]).slice(0,50)); }
const g=fs.readFileSync(path.join(IP,'guide.js'),'utf8');
F.guide.split('\n').forEach((l,i)=>{ if(!g.includes(l)) console.log('guide line not in source',i,l.slice(0,120)); });
const pkf=fs.readdirSync(PK).filter(f=>/^q.*\.js$/.test(f));
const SP=sbx(PK,['glossary.js'].concat(pkf),'\n;globalThis.__T=typeof TERMS!=="undefined"?TERMS:(typeof GLOSSARY!=="undefined"?GLOSSARY:globalThis.__T);');
for(const fq of P.qs){ const sq=SP.QUESTIONS.find(x=>x.id===fq.id); if(!sq){console.log('no PK q',fq.id);continue;}
  for(const k of Object.keys(fq)) if(JSON.stringify(fq[k])!==JSON.stringify(sq[k])){console.log('PK q diff',fq.id,k);}
  for(const k of Object.keys(sq)) if(!(k in fq)) console.log('PK q omit',fq.id,k,JSON.stringify(sq[k]).slice(0,60)); }
const pt=SP.__T||[];
for(const ft of P.terms){ const st=pt.find(x=>x.id===ft.id); if(!st){console.log('no PK term',ft.id);continue;}
  for(const k of Object.keys(ft)) if(JSON.stringify(ft[k])!==JSON.stringify(st[k])) console.log('PK term diff',ft.id,k);
  for(const k of Object.keys(st)) if(!(k in ft)) console.log('PK term omit',ft.id,k); }
console.log('done; IP term/q diffs', d);
