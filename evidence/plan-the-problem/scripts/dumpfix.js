const fs=require('fs');const t=fs.readFileSync(process.argv[2],'utf8');
const line=t.split('\n').find(l=>l.startsWith('const PK = '));const PK=JSON.parse(line.slice(11).replace(/;$/,''));
console.log(Object.keys(PK));console.log(JSON.stringify(PK.plan,null,1).slice(0,5000));console.log(JSON.stringify(PK.topics).slice(0,2500));
console.log(PK.qs.map(q=>[q.id,q.topic,q.module,q.setup&&q.setup.eq,(q.setup&&q.setup.pre||[]).join('+'),q.asks,q.cite].join(' | ')).join('\n'));
console.log(Object.keys(PK.asks).length, Object.keys(PK.qs[0]));
