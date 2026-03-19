const fs = require('fs');
const path = require('path');
const designDir = 'D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace/design';
const files = fs.readdirSync(designDir).filter(f => f.startsWith('GDD-FEATURE-') && f.endsWith('.md'));
const now = new Date();
const twoDaysMs = 48 * 60 * 60 * 1000;
const stuck = [];
for (const f of files) {
  const content = fs.readFileSync(path.join(designDir, f), 'utf8');
  const statusMatch = content.match(/\*\*Trạng thái\*\*:\s*(InDev|InQC)/);
  if (!statusMatch) continue;
  const updateMatch = content.match(/\*\*Cập nhật lần cuối lúc\*\*:\s*([^\n]+)/);
  if (!updateMatch) {
    console.log(`Warning: ${f} missing update timestamp`);
    continue;
  }
  const updateStr = updateMatch[1].trim();
  const updateDate = new Date(updateStr);
  if (isNaN(updateDate.getTime())) continue;
  const delta = now - updateDate;
  if (delta > twoDaysMs) {
    const hours = Math.floor(delta / 3600000);
    stuck.push({ file: f, status: statusMatch[1], hours });
  }
}
console.log(JSON.stringify(stuck, null, 2));
