// replace the `const FIXCOURSE = {...};` line of a test.js with stdin's JSON
const fs=require('fs');const f=process.argv[2];const j=fs.readFileSync(0,'utf8').trim();JSON.parse(j);
const t=fs.readFileSync(f,'utf8');const n=t.replace(/^const FIXCOURSE = \{.*\};$/m,()=> 'const FIXCOURSE = '+j+';');
if(n===t) throw new Error('no change');fs.writeFileSync(f,n);
