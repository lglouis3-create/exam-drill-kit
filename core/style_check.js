/* Flags phrasing the drill's style rules reject: study meta-commentary, metaphor, and appeals to the deck. */
const fs=require('fs'), vm=require('vm');
const PAGE=require('./built_page'); PAGE.need('style_check.js');
let c=PAGE.engine(); c+='\nglobalThis.__Q=QUESTIONS;';
const sb={console,localStorage:{getItem:()=>null,setItem(){},removeItem(){}},document:{querySelector:()=>({}),querySelectorAll:()=>[],getElementById:()=>({}),createElement:()=>({}),body:{},addEventListener(){}},window:{},prompt:()=>'x',setTimeout:()=>0,clearTimeout(){},Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,Error,isNaN,parseInt,parseFloat};
sb.globalThis=sb;vm.createContext(sb);vm.runInContext(c,sb);
const Q=sb.__Q;

const BANNED=[
 [/easier to (hold|remember|recall)/i,'study meta-commentary'],
 [/\b(worth (doing|noticing|holding|the effort|learning))\b/i,'study meta-commentary'],
 [/\b(memoriz\w+|by rote|recallable|learnable|under (exam )?pressure)\b/i,'study meta-commentary'],
 [/\bthe (deck|slide|lecture) (states|says|gives|tells)\b/i,'appeals to the deck instead of giving the reason'],
 [/\b(workhorse|backbone|cleaning up|clean up after|downstream of|sits at the (centre|center)|single point of failure)\b/i,'metaphor'],
 [/\b(quench\w*|mop up|soak up|hand off|catches people|the trap (here|is))\b/i,'metaphor or jargon'],
 [/\bis the (whole )?point\b/i,'commentary about the question'],
 [/\bthis (option|question) (tests|is testing|exists to|is designed to)\b/i,'commentary about the question'],
];
// vague cross-references: naming a lecture without a file or slide number
const VAGUE=/\b(?:Dr\.\s*\w+'s\s+\w+\s+lecture|the (metabolism|toxicity|absorption|distribution) lecture)\b/i;

let hits=0;
function scan(txt, where){
  if(!txt) return;
  for(const [re,label] of BANNED){
    const m = txt.match(re);
    if(m){ console.log(`  ${where}\n      [${label}] "...${txt.slice(Math.max(0,m.index-45), m.index+m[0].length+45).trim()}..."`); hits++; }
  }
  const v = txt.match(VAGUE);
  if(v && !/\.pdf|slide/i.test(txt.slice(Math.max(0,v.index-90), v.index+140))){
    console.log(`  ${where}\n      [vague cross-reference, no file or slide] "...${txt.slice(Math.max(0,v.index-40), v.index+v[0].length+40).trim()}..."`); hits++;
  }
}
// the stem rule, with "given as" allowed in dose or problem wording (style_rules.js)
const {stemFlag}=require('./style_rules');
console.log('\n=== Stem check (every stem asks the subject, not "what does the deck say") ===');
let stemHits=0;
for(const q of Q){ const m=stemFlag(q.stem);
  if(m){ console.log(`  ${q.id} [${m}]: "${q.stem}"`); stemHits++; } }
console.log(stemHits ? `  ${stemHits} stems refer to the course material\n` : `  all ${Q.length} stems clean\n`);
hits += stemHits;

console.log('=== Style check (rebuilt questions only) ===');
const teachText = t => Array.isArray(t) ? t.map(p=>[p.h,p.t].filter(Boolean).join('. ')).join(' ') : (t||'');
const rebuilt = Q.filter(q=>q.teach);
for(const q of rebuilt){
  scan(teachText(q.teach), q.id+' · concept block');
  (q.options||[]).forEach((o,i)=>scan(o.why, q.id+' · option '+'ABCDEFGHIJ'[i]));
  (q.steps||[]).forEach((st,i)=>scan(st.why, q.id+' · step '+(i+1)));
  (q.pairs||[]).forEach((p,i)=>scan(p.why, q.id+' · pair '+(i+1)));
}
console.log(`\n  scanned ${rebuilt.length} rebuilt questions`);
console.log(hits ? `  ${hits} phrasing issues found\n` : '  no flagged phrasing found\n');

/* The change log is what the reader sees on the Topics page as "What's new", a
   few bullets at a time, so a bullet that runs to a paragraph defeats it. The
   limit is one short line. */
console.log('=== Change log ===');
const CL = 'CHANGELOG.md';
if(!fs.existsSync(CL)){
  console.log('  no CHANGELOG.md: the page will show no What\'s new card\n');
}else{
  const lines = fs.readFileSync(CL, 'utf8').split('\n');
  const bullets = lines.filter(l => l.startsWith('- '));
  const heads = lines.filter(l => /^##\s/.test(l));
  const long = bullets.filter(l => l.length > 120);
  long.forEach(l => { console.log(`  [bullet longer than one short line] ${l.slice(0, 70)}…`); hits++; });
  if(!heads.length){ console.log('  no "## date (title)" heading, so no entry can be shown'); hits++; }
  console.log(`  ${heads.length} entries, ${bullets.length} bullets${long.length ? `, ${long.length} too long` : ', all within one line'}\n`);
}

/* Citation coverage. The rule is that a citation names the file and the slide.
   A slide can be named two ways: by number, where the deck was paged through
   and the number checked, or by its own title in quotes, which is what is
   available for a deck that was only ever read as extracted text with no page
   boundaries. Both point at one slide, so both count; anything naming neither
   is reported. */
const byNumber = q => /slides?\s*\d/i.test(q.cite);
const byTitle  = q => /["“][^"”]{4,}["”]/.test(q.cite);
const located  = rebuilt.filter(q => byNumber(q) || byTitle(q));
const vague    = rebuilt.filter(q => !byNumber(q) && !byTitle(q));
console.log(`  rebuilt questions whose citation names a slide: ${located.length} of ${rebuilt.length}`);
console.log(`     by slide number: ${rebuilt.filter(byNumber).length}`);
console.log(`     by slide title:  ${rebuilt.filter(q => !byNumber(q) && byTitle(q)).length}`);
if(vague.length)
  console.log(`  citations naming neither a slide number nor a slide title: ${
    vague.slice(0,6).map(q=>q.id).join(', ')}${vague.length>6?' …':''}`);
console.log(`  rebuilt questions with a diagram: ${rebuilt.filter(q=>q.svg).length}`);
// the summary line run_checks.sh reads (codes in check_lib.js)
console.log(hits ? `FAIL: style_check.js: ${hits} phrasing or change-log issue(s)` : `PASS: style_check.js: ${Q.length} stems and ${rebuilt.length} explanations clean`);
process.exit(hits?1:0);
