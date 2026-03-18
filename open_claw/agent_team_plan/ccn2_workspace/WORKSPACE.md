# CCN2 Agent Team Workspace
Last updated: 2026-03-17

## Team
| Agent | Role | Reads | Writes |
|-------|------|-------|--------|
| agent_gd | Game Designer | concepts/ | design/GDD-*.md |
| agent_dev | Developer | design/ | src/ |
| agent_qc | QA Engineer | design/ + src/ | reports/ + src/tests/ |
| Human | Orchestrator | reports/ | concepts/ |

## File Ownership
| Directory | Owner | Consumer |
|-----------|-------|---------|
| concepts/ | Human | agent_gd |
| design/ | agent_gd | agent_dev, agent_qc |
| src/ | agent_dev | agent_qc |
| reports/ | agent_qc | Human, team |
| .state/ | Each agent (own file) | Same agent only |

## How to Add a Feature
1. Create `concepts/<feature>.md` using the template in `concepts/README.md`
2. Wait 15–30 min for agent_gd to generate `design/GDD-<feature>.md`
3. Review GDD — edit concept file if revisions needed (triggers re-generation)
4. agent_dev implements within the next 15–30 min
5. agent_qc writes tests and runs them — check `reports/quality-*.md`

## Cron Schedule (Vietnam time, weekdays 8h–22h)
| Agent | Runs at | Offset reason |
|-------|---------|--------------|
| agent_gd | :00, :15, :30, :45 | First — generates GDD |
| agent_dev | :07, :22, :37, :52 | +7 min after GD finishes |
| agent_qc | :12, :27, :42, :57 | +12 min, sees both GDD and code |

## Agent Workspaces
- agent_gd: `{$project_dir}/openclaw/agents//agent_gd/`
- agent_dev: `{$project_dir}/openclaw/agents//agent_dev/`
- agent_qc: `{$project_dir}/openclaw/agents//agent_qc/`
