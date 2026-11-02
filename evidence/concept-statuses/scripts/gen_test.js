/* Writes features/concept-statuses/current/test.js from test.tpl.js, with FIX and WORDS
   as extracted from Basic-Pharmacokinetics by extract_fix.js (nothing typed by hand).
     node gen_test.js <tpl> <fix.json> <words.json> <out test.js> */
const fs = require('fs');
const [tpl, fix, words, out] = process.argv.slice(2);
const F = fs.readFileSync(fix, 'utf8').trim(), W = fs.readFileSync(words, 'utf8').trim();
JSON.parse(F); JSON.parse(W);
let t = fs.readFileSync(tpl, 'utf8');
if(t.split('__FIX__').length !== 2 || t.split('__WORDS__').length !== 2) throw new Error('placeholders must occur once');
t = t.replace('__FIX__', () => F).replace('__WORDS__', () => W);
fs.writeFileSync(out, t);
console.log('wrote', out, t.length, 'bytes');
