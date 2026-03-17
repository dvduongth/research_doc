# reports/ — Quality Reports

agent_qc writes here. Humans read here.

## File Types
| File | Generated when | Format |
|------|---------------|--------|
| `testcases-<feature>.md` | New GDD detected | Markdown checklist |
| `quality-<YYYY-MM-DD-HH-mm>.md` | Code change detected | Structured report |

## Quality Thresholds
| Metric | Minimum | Target |
|--------|---------|--------|
| Test pass rate | ≥ 80% | ≥ 95% |
| Test coverage | ≥ 60% | ≥ 80% |
| GDD completeness | 5 sections | 8 sections + edge cases |

## Reading Reports
- Latest quality: sort by date, read newest `quality-*.md`
- Feature tests: `testcases-<feature>.md`
- Failures: agent_qc sends Telegram alert automatically
