// Generate Dashboard — CCN2 Agent Team
// Called by agent_qc (Node.js) to populate reports/dashboard.html

const fs = require('fs');
const path = require('path');

const base = 'D:/PROJECT/CCN2/research_doc/open_claw/agent_team_plan/ccn2_workspace';
const stateDir = path.join(base, '.state');
const reportsDir = path.join(base, 'reports');
const designDir = path.join(base, 'design');
const memoryDir = path.join(base, 'memory');

function readJson(file) {
  try {
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) { /* ignore */ }
  return null;
}

function nowAsia() {
  const now = new Date();
  // Asia/Ho_Chi_Minh is UTC+7
  const offset = 7 * 60; // minutes
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const asia = new Date(utc + (offset * 60000));
  return asia;
}

function formatISO(date) {
  return date.toISOString().replace('Z', '+07:00');
}

function getAgentStatus(state) {
  if (!state) return { status: 'unknown', lastRun: '', processed: 0, skipped: 0, errors: 0 };
  const now = new Date();
  let processed = 0, skipped = 0, errors = 0, lastRun = null;
  for (const key of Object.keys(state)) {
    const val = state[key];
    processed++;
    if (val && val.status === 'skipped') skipped++;
    if (val && val.status === 'error') errors++;
    if (val && val.processedAt) {
      const pt = new Date(val.processedAt);
      if (!lastRun || pt > lastRun) lastRun = pt;
    }
  }
  let status = 'unknown';
  if (lastRun) {
    const diff = (now - lastRun) / 60000; // minutes
    if (diff < 15) status = 'online';
    else if (diff < 60) status = 'idle';
    else status = 'idle';
    if (errors > 0) status = 'error';
  }
  return {
    status,
    lastRun: lastRun ? formatISO(lastRun) : '',
    processed,
    skipped,
    errors
  };
}

// Load states
const health = readJson(path.join(stateDir, 'pipeline-health.json'));
const gdState = readJson(path.join(stateDir, 'agent_gd_processed.json'));
const devState = readJson(path.join(stateDir, 'agent_dev_processed.json'));
const dispatched = readJson(path.join(stateDir, 'agent_dev_dispatched.json'));
const qcState = readJson(path.join(stateDir, 'agent_qc_processed.json'));
const errorLog = fs.existsSync(path.join(stateDir, 'error.log'))
  ? fs.readFileSync(path.join(stateDir, 'error.log'), 'utf8').split('\n').slice(-10).map(l => l.trim()).filter(l => l)
  : [];

// Build agents
const agents = {
  agent_gd: getAgentStatus(gdState),
  agent_dev: getAgentStatus(devState),
  agent_qc: getAgentStatus(qcState),
  agent_dev_client: (dispatched && Object.values(dispatched).some(v => v.client_status)) ?
    { status: 'online', lastRun: '', processed: Object.keys(dispatched).length, skipped: 0, errors: 0 } :
    { status: 'unknown', lastRun: '', processed: 0, skipped: 0, errors: 0 },
  agent_dev_server: (dispatched && Object.values(dispatched).some(v => v.server_status)) ?
    { status: 'online', lastRun: '', processed: Object.keys(dispatched).length, skipped: 0, errors: 0 } :
    { status: 'unknown', lastRun: '', processed: 0, skipped: 0, errors: 0 },
  agent_dev_admin: (dispatched && Object.values(dispatched).some(v => v.admin_status)) ?
    { status: 'online', lastRun: '', processed: Object.keys(dispatched).length, skipped: 0, errors: 0 } :
    { status: 'unknown', lastRun: '', processed: 0, skipped: 0, errors: 0 }
};

// GDD flow
const stages = { Draft: 0, Review: 0, InDev: 0, InQC: 0, Done: 0, Flagged: 0 };
const items = { Draft: [], Review: [], InDev: [], InQC: [], Done: [], Flagged: [] };
if (fs.existsSync(designDir)) {
  const files = fs.readdirSync(designDir).filter(f => f.startsWith('GDD-') && f.endsWith('.md') && !f.includes('TEMPLATE'));
  for (const f of files) {
    const content = fs.readFileSync(path.join(designDir, f), 'utf8');
    const m = content.match(/\*\*Trạng thái\*\*:\s*(\w+)/);
    if (m && stages.hasOwnProperty(m[1])) {
      stages[m[1]]++;
      if (items[m[1]].length < 3) {
        items[m[1]].push(f.replace(/\.md$/, '').replace(/^GDD-FEATURE-/, ''));
      }
    }
  }
}
const gddFlow = {};
for (const s of Object.keys(stages)) {
  gddFlow[s] = { count: stages[s], items: items[s] };
}

// Smoke
const smoke = {
  overall: (health && health.overall) ? health.overall.toLowerCase() : 'unknown',
  last_run: (health && health.last_run) ? health.last_run : '',
  checks: (health && health.checks) ? health.checks : {}
};
const stuck_gdds = (health && health.stuck_gdds) ? health.stuck_gdds : [];

// Dashboard data
const DASHBOARD_DATA = {
  generated_at: formatISO(nowAsia()),
  agents,
  gdd_flow: gddFlow,
  smoke,
  stuck_gdds,
  recent_errors: errorLog
};

// Inject
const dashPath = path.join(reportsDir, 'dashboard.html');
if (fs.existsSync(dashPath)) {
  let html = fs.readFileSync(dashPath, 'utf8');
  const pattern = /(const\s+DASHBOARD_DATA\s*=\s*)(\{[\s\S]*?\});/;
  const json = JSON.stringify(DASHBOARD_DATA, null, 2);
  const newHtml = html.replace(pattern, `$1${json};`);
  fs.writeFileSync(dashPath, newHtml, 'utf8');
  // Log to memory
  const memFile = path.join(memoryDir, nowAsia().toISOString().slice(0,10) + '.md');
  if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir, { recursive: true });
  fs.appendFileSync(memFile, `[${nowAsia().toLocaleString('sv-SE')}] Dashboard generated: agents=${Object.keys(agents).length}; smoke=${smoke.overall}\n`, { encoding: 'utf8' });
} else {
  console.warn('dashboard.html not found');
}
