const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('file://'+process.argv[2]);await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{const S=FX.api('paper-picker');const e=COURSE.exams.find(x=>x.id===1);const tests=e.pools.map(p=>poolFilter(p.filter));
const inPool=q=>tests.findIndex(t=>t(q));const ok=q=>!q.lowYield&&!q.type;
const info=e.pools.map((p,i)=>{const qs=QUESTIONS.filter(q=>ok(q)&&inPool(q)===i);return {key:p.key,q:qs.length,multi:qs.filter(isMulti).map(q=>q.id+'/'+familyOf(q)),singleFams:new Set(qs.filter(q=>!isMulti(q)).map(familyOf)).size,fams:new Set(qs.map(familyOf)).size}});
const runs=[];for(let k=0;k<30;k++){const d=S.drawFor(e,40);runs.push(e.pools.map((p,i)=>d.filter(q=>inPool(q)===i&&isMulti(q)).length).join('/')+' per '+e.pools.map((p,i)=>d.filter(q=>inPool(q)===i).length).join('/'));}
return {info,runs:[...new Set(runs)]};});console.log(JSON.stringify(r,null,1));await b.close();})();
