/* Validate the built app: parse the script, check the question bank, exercise the SRS. */
const fs = require('fs');
const vm = require('vm');

const PAGE = require('/tmp/port-module-pages/v2/c-own/src/built_page');
PAGE.need('test.js');
// the engine without its final boot block, which needs a real DOM
let code;
try { code = PAGE.engine(); }
catch (e) { console.error('FAIL: ' + e.message); process.exit(1); }

// minimal DOM + storage stubs
const store = {};
const el = () => ({ innerHTML:'', textContent:'', classList:{toggle(){},add(){},remove(){},contains(){return false}},
                    setAttribute(){}, querySelectorAll(){return []}, onclick:null, dataset:{}, style:{}, click(){} });
let PROMPTS = 0;   // the page must never ask for a name on its own
const sandbox = {
  console,
  localStorage:{ getItem:k=>(k in store?store[k]:null), setItem:(k,v)=>{store[k]=String(v)}, removeItem:k=>{delete store[k]} },
  document:{ querySelector:el, querySelectorAll:()=>[], getElementById:el, createElement:el, body:el(),
             addEventListener(){} },   // the page delegates clicks and changes from document
  window:{ scrollTo(){} },
  prompt:()=> { PROMPTS++; return 'TestUser'; },
  alert:()=>{}, confirm:()=>true,
  setTimeout:(f)=>{ f(); return 0; }, clearTimeout(){}, setInterval:()=>0, clearInterval(){},
  Blob:function(){}, URL:{createObjectURL:()=>'', revokeObjectURL(){}}, FileReader:function(){},
  Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp, Error, isNaN, parseInt, parseFloat
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
// DIA, DIAGRAMS and READ_LINKS are optional: a course without drawn figures or
// read links may leave them out (views.js reads them the same way).
code += "\nglobalThis.__X={QUESTIONS,TOPICS,IMAGES,COURSE,EXAM,DIA:typeof DIA!=='undefined'?DIA:{},DIAGRAMS:typeof DIAGRAMS!=='undefined'?DIAGRAMS:[],READ_LINKS:typeof READ_LINKS!=='undefined'?READ_LINKS:{},BUILD,record,pickNext,st,score,drawN,drawMixed,drawPaper,drawBlueprint,bpCat,EXAM_SATA,askProfile,markGuessed,markShaky,isMulti,gradeMulti,correctSet,gradeNumeric,NUMERIC:typeof NUMERIC!=='undefined'?NUMERIC:null,lecOf,skillOf,linksFor,sessionLog,solidEntry,getDB:()=>DB};\n";
try { vm.runInContext(code, sandbox); }
catch (e) { console.error('FAIL: script threw at load — ' + e.message + '\n' + e.stack); process.exit(1); }

const X = sandbox.__X; const {QUESTIONS, record, pickNext} = X;
const byC = {}; QUESTIONS.forEach(q => (byC[q.concept] ||= []).push(q));
const pair = Object.values(byC).find(a => a.length > 1); console.log('pair', pair.map(q=>q.id+' '+q.topic+' dupOf='+q.dupOf));
const pool = QUESTIONS.filter(q => q.topic === pair[0].topic); console.log('pool', pool.map(q=>q.id+':'+q.concept).join(' '));
X.getDB().concepts = {}; X.getDB().answers = []; X.getDB().qn = 0; record(pair[0], 'wrong');
for (let i=0;i<6;i++){ const n = pickNext(pool.filter(q=>q.concept!==pair[0].concept), null); console.log('warm', n&&n.id); if(n) record(n,'correct'); }
for (let i=0;i<20;i++){ const n = pickNext(pool, null); console.log('pick', n&&n.id); if(!n) break; if(n.concept===pair[0].concept) break; record(n,'correct'); }
