# CODE-EVAL-RUBRIC — agent_dev Code Workflow
**Version**: v1
**Created**: 2026-03-18
**Authoritative**: agent_qc (Verita) — self-eval bởi sub-agents là gate, không authoritative

---

## Client Mode (TypeScript/Vite/Cocos2d) — pass ≥80/100

| Dimension | Weight | Pass Criteria |
|-----------|--------|---------------|
| GDD Alignment | 30pt | TypeScript features map đúng GDD mechanics, không contradictions |
| Pattern Compliance | 25pt | Dùng đúng demo-main patterns: BaseLayer/BaseModal/SceneManager/EventEmitter3; không dùng global state |
| Type Safety | 20pt | Strict TypeScript typing; interfaces cho tất cả state/event; không `any` trừ khi bắt buộc |
| Error Handling | 15pt | try/catch tường minh; EventEmitter error events; không silent failures |
| Testability | 10pt | Functions Jest-able; không side effects ẩn; dependencies injectable |

## Server Mode (Kotlin/Ktor/Actor) — pass ≥80/100

| Dimension | Weight | Pass Criteria |
|-----------|--------|---------------|
| GDD Alignment | 30pt | Kotlin logic map đúng GDD mechanics; không contradictions với GDD |
| Pattern Compliance | 25pt | Actor model đúng (suspend function + coroutine scope); Exposed ORM (không raw SQL); không blocking call |
| Type Safety | 20pt | Kotlin null-safe; sealed classes cho state; Result<T> cho error handling |
| Error Handling | 15pt | suspend + Result<T>; không blocking exceptions; proper coroutine cancellation |
| Testability | 10pt | Functions unit-testable; dependencies injectable; không hard-coded global state |

## Admin Mode (Java+React) — pass ≥80/100

| Dimension | Weight | Pass Criteria |
|-----------|--------|---------------|
| GDD Alignment | 30pt | CRUD panels cover đúng data model từ DESIGN-\<name>.md; không self-invented endpoints |
| Pattern Compliance | 25pt | Java: bean + service + controller (REST); React: functional components + hooks; auth token từ config |
| Type Safety | 20pt | Java type-safe beans; TypeScript strict trong React components; không implicit any |
| Error Handling | 15pt | HTTP status codes đúng (200/400/401/404/500); validation errors hiển thị rõ; không swallowed exceptions |
| Testability | 10pt | Services mockable (interface-based); controllers testable với MockMvc; React components testable với RTL |

---

## Score Gates (áp dụng cho tất cả 3 modes)

| Score | Status | Action |
|-------|--------|--------|
| < 60 | FAIL | KHÔNG write file. Telegram: `[<agent>] CODE FAIL: <feature>/<layer> score=XX/100 — not saved` |
| 60–79 | WARNING | Write file, status=done_warning. Telegram: `[<agent>] CODE WARNING: <feature>/<layer> score=XX/100 — saved, human review recommended` |
| ≥ 80 | PASS | Write file, status=done. Telegram: `[<agent>] Code ready: <feature>/<layer> score=XX/100` |

---

## Eval Output Format

```
# CODE-EVAL: <layer>-<feature> — YYYY-MM-DD
**Mode**: Client | Server | Admin
**Score**: XX/100 — PASS | WARNING | FAIL

## Dimension Scores
| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|

## Issues Found
- [CRITICAL] ...
- [WARNING] ...

## Recommendation
PASS — agent_qc có thể review code
WARNING — human review recommended trước khi merge vào source
FAIL — sub-agent cần revise: [list issues]
```

---

## Ownership

- **Sub-agent self-eval**: gate trước khi save — không authoritative
- **agent_qc (Verita)**: independent code review sau khi nhận notify → **authoritative**
- Nếu agent_qc score thấp hơn sub-agent self-score ≥20pt → flag human
