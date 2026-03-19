# src/ — Implementation Code

agent_dev writes here. agent_qc reads here.

## Structure
```
src/
├── <feature>.js          ← Implementation (agent_dev)
└── tests/
    └── <feature>.test.js ← Jest tests (agent_qc writes, agent_dev writes skeleton)
```

## CCN2 Architecture Rules (agent_dev enforces)
- NO ES6 modules (no import/export)
- All constants in CONFIG object (from rules.js)
- Global state via CONFIG, not module-level vars
- Event bus: `gv.bus` for new code (NOT signalMgr)
- Script load order: rules → utils → entities → board → input → game → ui → main

## Running Tests
```bash
cd D:\PROJECT\CCN2\research_doc\open_claw\agent_team_plan\ccn2_workspace\ && npm test
```
