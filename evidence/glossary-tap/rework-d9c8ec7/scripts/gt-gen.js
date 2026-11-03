/* glossary-tap rework: build FIXCOURSE from Intro to Pharmacology exam1-drill/src (929cd62), verbatim.
   usage: node gt-gen.js <ipSrc> <lectures,comma> <topicFiles,comma> <excludeIds,comma|-> <dropFields,comma|-> */
const path=require('path');
const load=require('/tmp/port-rework/scripts/ipload.js');
const [dir, lecs, files, excl, drop, extra] = process.argv.slice(2);
const extraIds = new Set(extra ? extra.split(',') : []);
const D = load(dir, files.split(',').map(f => f.replace(/^\+/, '')), files.split(',').filter(f => !f.startsWith('+')));
const ex = new Set(excl && excl !== '-' ? excl.split(',') : []);
const dropF = drop && drop !== '-' ? drop.split(',') : [];
const lectures = lecs.split(',').map(id => { const l = D.COURSE.lectures.find(x => x.id === id); if(!l) throw new Error('no lecture ' + id); return l; });
const mainFiles = files.split(',').filter(f => !f.startsWith('+'));
const qs = D.QUESTIONS.filter(q => !ex.has(q.id) && (q.__main || extraIds.has(q.id))).map(q => { const o = Object.assign({}, q); delete o.__main; dropF.forEach(f => delete o[f]); return o; });
const usedSkills = new Set(qs.map(q => q.skill));
const skills = D.COURSE.skills.filter(s => usedSkills.has(s.id) || true);
const usedT = new Set(qs.map(q => q.topic));
const topics = D.TOPICS.filter(t => usedT.has(t.id));
const professors = [...new Set([].concat(lectures, topics, qs).map(x => x.prof))];
const IMG = JSON.parse(require('fs').readFileSync(path.join(dir, 'images.json'), 'utf8'));
const images = {}; qs.filter(q => q.img).forEach(q => { if(!IMG[q.img]) throw new Error('no image ' + q.img); images[q.img] = IMG[q.img]; });
const FC = {lectures, professors, skills: D.COURSE.skills, topics, qs, images};
process.stdout.write(JSON.stringify(FC));
