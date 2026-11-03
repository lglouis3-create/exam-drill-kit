// load Intro to Pharmacology source data (read-only) into a sandbox
const fs=require('fs'),vm=require('vm'),path=require('path');
module.exports=function(dir, files, mainFiles){
  const sb={TOPICS:[],QUESTIONS:[],console};vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(dir,'course.js'),'utf8')+'\nglobalThis.COURSE_=COURSE;',sb);
  for(const f of files){ const n=sb.QUESTIONS.length; vm.runInContext(fs.readFileSync(path.join(dir,f),'utf8'),sb,{filename:f}); if(!mainFiles||mainFiles.includes(f)) for(let i=n;i<sb.QUESTIONS.length;i++) sb.QUESTIONS[i].__main=true; }
  return {COURSE:sb.COURSE_, TOPICS:sb.TOPICS, QUESTIONS:sb.QUESTIONS};
};
