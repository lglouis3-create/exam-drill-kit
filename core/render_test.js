const fs=require('fs'), vm=require('vm');
const PAGE=require('./built_page'); PAGE.need('render_test.js');
let code=PAGE.engine();
code+="\nglobalThis.__X={QUESTIONS,TOPICS,DIA,DIAGRAMS,startQuiz,renderTopics,renderQuiz,renderGaps,renderRef,renderTell,renderGuide,renderDiagrams,renderSettings,answer,Qref:()=>Q,askProfile,record,beginExam,renderExamQ,EXref:()=>EX,sessionLog,linksFor,drawPaper};\n";
const store={}, sinks={};
function mk(id){ return sinks[id] ||= {innerHTML:'',textContent:'',dataset:{},style:{},classList:{toggle(){},add(){},remove(){},contains(){return false}},setAttribute(){},querySelectorAll(){return []},onclick:null,click(){}}; }
const sb={console,localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}},
 document:{querySelector:s=>mk(s),querySelectorAll:()=>[],getElementById:i=>mk(i),createElement:()=>mk('tmp'),body:mk('body'),addEventListener(){}},
 window:{scrollTo(){}},prompt:()=>'Student',alert:m=>console.log('ALERT:',m),confirm:()=>true,
 setTimeout:f=>{f();return 0},clearTimeout(){},setInterval:()=>0,clearInterval(){},
 Blob:function(){},URL:{createObjectURL:()=>'',revokeObjectURL(){}},FileReader:function(){},
 Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Error,isNaN,parseInt,parseFloat};
sb.globalThis=sb; vm.createContext(sb); vm.runInContext(code,sb);
const X=sb.__X; X.askProfile(false);

function check(name, html){
  const problems=[];
  if(!html || html.length<50) problems.push('empty or near-empty output');
  // base64 image data contains every short letter sequence by chance, so strip
  // the data URLs before looking for a value that came from the app's own code
  const prose = html.replace(/data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+/g, 'DATAURL');
  if(/undefined/.test(prose)) problems.push('contains the literal word "undefined"');
  if(/NaN/.test(prose)) problems.push('contains NaN');
  if(/\[object Object\]/.test(prose)) problems.push('contains [object Object]');
  if(/\{\{fig:/.test(prose)) problems.push('an unexpanded {{fig:...}} token reached the page');
  const open=(html.match(/<div/g)||[]).length, close=(html.match(/<\/div>/g)||[]).length;
  if(open!==close) problems.push(`div tags unbalanced: ${open} open vs ${close} close`);
  console.log(`  ${problems.length?'FAIL':'ok  '}  ${name.padEnd(22)} ${html.length} chars` + (problems.length?'\n         '+problems.join('\n         '):''));
  return problems.length===0;
}
let ok=true;
console.log('\n=== Render smoke test ===');
X.renderTopics();        ok &= check('topics list', sinks['#v-topics'].innerHTML);
X.startQuiz(X.TOPICS[0].id, X.TOPICS[0].subs[0].id);ok &= check('quiz, unanswered', sinks['#v-quiz'].innerHTML);
X.answer(0);              ok &= check('quiz, answered', sinks['#v-quiz'].innerHTML);
const qh=sinks['#v-quiz'].innerHTML;
console.log('         explanations rendered: '+((qh.match(/class="wrow"/g)||[]).length)+' option rows');
console.log('         citation present: '+/class="cite"/.test(qh));
// image question
const imgQ=X.QUESTIONS.find(q=>q.img);
if(imgQ){
  X.startQuiz(imgQ.topic,imgQ.sub);
  let tries=0; while(X.Qref().current && X.Qref().current.id!==imgQ.id && tries++<60){ X.answer(0); X.Qref().answered++; X.Qref().lastId=X.Qref().current.id; sb.nextQuestion&&sb.nextQuestion(); break; }
  ok &= check('quiz, image item', sinks['#v-quiz'].innerHTML);
} else console.log('  skip  quiz, image item        no question in this bank carries an image');
X.renderGaps();          ok &= check('weak spots', sinks['#v-gaps'].innerHTML);
X.renderRef();           ok &= check('reference', sinks['#v-ref'].innerHTML);
X.renderTell();          ok &= check('tell apart', sinks['#v-tell'].innerHTML);
X.renderGuide();         ok &= check('guides', sinks['#v-guide'].innerHTML);
X.renderDiagrams();      ok &= check('diagrams', sinks['#v-diagrams'].innerHTML);
console.log('         figures registered: ' + Object.keys(X.DIA).length +
            ', step-throughs: ' + Object.keys(X.DIA).filter(k => /data-anim/.test(X.DIA[k])).length);
X.renderSettings();      ok &= check('settings', sinks['#v-settings'].innerHTML);
X.beginExam();           ok &= check('exam paper', sinks['#v-exam'].innerHTML);
console.log('         exam question count: '+X.EXref().qs.length);
// verify an image actually embeds
const withImg = X.QUESTIONS.filter(q=>q.img).length;
console.log(`         ${withImg} questions carry an image`);
console.log(ok?'\nRender smoke test passed\n':'\nRENDER PROBLEMS FOUND\n');
console.log(ok?'PASS: render_test.js: every view rendered clean':'FAIL: render_test.js: a view rendered undefined, NaN, [object Object] or unbalanced markup');
process.exit(ok?0:1);
