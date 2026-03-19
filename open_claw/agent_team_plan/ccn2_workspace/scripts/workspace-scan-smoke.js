// WORKSPACE_SCAN: Smoke test + Dashboard trigger
// Run from ccn2_workspace root

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE = process.cwd();
const now = new Date();
const nowUTC = new Date(now.toUTCString());

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Checks
const checks = {};

// C1: concepts/*.md count (exclude README.md)
const conceptsDir = path.join(BASE, 'concepts');
let c1Files = [];
if (fs.existsSync(conceptsDir)) {
  c1Files = fs.readdirSync(conceptsDir).filter(f => f.toLowerCase() !== 'readme.md' && f.endsWith('.md'));
}
checks.C1_concepts = c1Files.length;

// C2: design/GDD-FEATURE-*.md count
const designDir = path.join(BASE, 'design');
let c2Files = [];
if (fs.existsSync(designDir)) {
  c2Files = fs.readdirSync(designDir).filter(f => f.startsWith('GDD-FEATURE-') && f.endsWith('.md'));
}
checks.C2_design = c2Files.length;

// C3: All GDD-FEATURE-*.md must contain "**Trạng thái**:"
let c3Pass = 0, c3Total = c2Files.length;
if (c2Files.length > 0) {
  c2Files.forEach(f => {
    const content = fs.readFileSync(path.join(designDir, f), 'utf8');
    if (content.includes('**Trạng thái**:') || content.includes('**Trạng thái**:')) {
      c3Pass++;
    }
  });
}
checks.C3_gdd_header = `${c3Pass}/${c3Total}`;

// C4: src/ subfolders (excluding tests) with at least 1 file
const srcDir = path.join(BASE, 'src');
let c4NonEmpty = 0, c4Total = 0;
if (fs.existsSync(srcDir)) {
  const subdirs = fs.readdirSync(srcDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'tests')
    .map(d => d.name);
  c4Total = subdirs.length;
  subdirs.forEach(d => {
    const subPath = path.join(srcDir, d);
    const files = fs.readdirSync(subPath, { withFileTypes: true }).filter(f => !f.isDirectory());
    // Also check nested recursively? The spec says "kiểm tra có ≥1 file không" — could be direct file or any in subfolder?
    // Simpler: check if any file exists in that folder tree
    function hasFile(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory()) {
          if (hasFile(path.join(dir, e.name))) return true;
        } else {
          return true;
        }
      }
      return false;
    }
    if (hasFile(subPath)) c4NonEmpty++;
  });
}
checks.C4_src = `${c4NonEmpty} subfolders non-empty (of ${c4Total})`;

// C5: reports/quality-*.md within last 24h UTC
const reportsDir = path.join(BASE, 'reports');
let c5Files = [];
if (fs.existsSync(reportsDir)) {
  const files = fs.readdirSync(reportsDir).filter(f => f.startsWith('quality-') && f.endsWith('.md'));
  c5Files = files.filter(f => {
    const mtime = fs.statSync(path.join(reportsDir, f)).mtime;
    const diffHours = (nowUTC - mtime) / (1000 * 60 * 60);
    return diffHours < 24;
  });
}
checks.C5_quality_report = `${c5Files.length} within 24h UTC`;

// C6: state JSONs valid
const stateDir = path.join(BASE, '.state');
const stateFiles = ['agent_gd_processed.json','agent_dev_processed.json','agent_dev_dispatched.json','agent_qc_processed.json'];
let c6Valid = 0, c6Total = stateFiles.length;
stateFiles.forEach(f => {
  const p = path.join(stateDir, f);
  if (fs.existsSync(p)) {
    try {
      const content = fs.readFileSync(p, 'utf8');
      JSON.parse(content);
      c6Valid++;
    } catch (e) {}
  }
});
checks.C6_state_json = `${c6Valid}/${c6Total} valid`;

// Verdict
let failedCore = 0;
if (checks.C1_concepts < 1) failedCore++;
if (checks.C2_design < 1) failedCore++;
if (c3Pass !== c3Total) failedCore++;
if (c4NonEmpty < 1) failedCore++;
// C5 not core
if (c6Valid !== c6Total) failedCore++;

let failedTotal = failedCore;
if (c5Files.length < 1) failedTotal++;

let overall;
if (failedTotal === 0) overall = 'HEALTHY';
else if (failedCore >= 4 || c6Valid !== c6Total) overall = 'BROKEN';
else overall = 'DEGRADED';

// Generate smoke report
const timestamp = now.toISOString().replace(/[:T]/g, '-').substring(0, 19);
const reportPath = path.join(BASE, 'reports', `smoke-test-${timestamp}.md`);
const templatePath = path.join(BASE, 'reports', 'smoke-test-TEMPLATE.md');
let reportContent = '';
if (fs.existsSync(templatePath)) {
  reportContent = fs.readFileSync(templatePath, 'utf8')
    .replace(/{{timestamp}}/g, timestamp)
    .replace(/{{overall}}/g, overall)
    .replace(/{{passed}}/g, overall === 'HEALTHY' ? '6' : (6 - failedTotal).toString())
    .replace(/{{failed}}/g, failedTotal.toString())
    .replace(/{{C1_concepts}}/g, checks.C1_concepts.toString())
    .replace(/{{C2_design}}/g, checks.C2_design.toString())
    .replace(/{{C3_gdd_header}}/g, checks.C3_gdd_header)
    .replace(/{{C4_src}}/g, checks.C4_src)
    .replace(/{{C5_quality_report}}/g, checks.C5_quality_report)
    .replace(/{{C6_state_json}}/g, checks.C6_state_json);
} else {
  // Fallback
  reportContent = `# Smoke Test — ${timestamp}\n\nOverall: ${overall}\nPassed: ${6-failedTotal}/6\nFailed: ${failedTotal}\n\nChecks:\n- C1: ${checks.C1_concepts}\n- C2: ${checks.C2_design}\n- C3: ${checks.C3_gdd_header}\n- C4: ${checks.C4_src}\n- C5: ${checks.C5_quality_report}\n- C6: ${checks.C6_state_json}\n`;
}
ensureDir(path.join(BASE, 'reports'));
fs.writeFileSync(reportPath, reportContent, 'utf8');

// Update pipeline-health.json
const healthPath = path.join(BASE, '.state', 'pipeline-health.json');
const healthObj = {
  last_run: now.toISOString(),
  overall,
  passed: 6 - failedTotal,
  failed: failedTotal,
  checks: {
    C1_concepts: checks.C1_concepts,
    C2_design: checks.C2_design,
    C3_gdd_header: checks.C3_gdd_header,
    C4_src: checks.C4_src,
    C5_quality_report: checks.C5_quality_report,
    C6_state_json: checks.C6_state_json
  },
  last_report: path.join('reports', `smoke-test-${timestamp}.md`)
};
ensureDir(path.join(BASE, '.state'));
fs.writeFileSync(healthPath, JSON.stringify(healthObj, null, 2));

// Clean old smoke reports (>30)
const smokeFiles = fs.readdirSync(path.join(BASE, 'reports'))
  .filter(f => f.startsWith('smoke-test-') && f.endsWith('.md'))
  .map(f => path.join(BASE, 'reports', f))
  .sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
if (smokeFiles.length > 30) {
  const toDelete = smokeFiles.length - 30;
  for (let i = 0; i < toDelete; i++) {
    fs.unlinkSync(smokeFiles[i]);
  }
}

console.log(`[Part F] Smoke Test: ${overall} — report: ${reportPath}`);
