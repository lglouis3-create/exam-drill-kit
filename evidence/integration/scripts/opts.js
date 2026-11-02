const fs = require('fs'), path = require('path');
const F = '/home/user/exam-drill-kit/.claude/worktrees/agent-afef9148abf43eda3/features';
for (const m of fs.readdirSync(F)) {
  const p = path.join(F, m, 'current', 'module.json'); if (!fs.existsSync(p)) continue;
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  const o = {}; for (const [k, v] of Object.entries(j.options || {})) o[k] = v.default;
  console.log(m, j.version, 'needs', JSON.stringify(j.needs || []), 'types', JSON.stringify(j.types || []), 'opts', JSON.stringify(o).slice(0, 300));
}
