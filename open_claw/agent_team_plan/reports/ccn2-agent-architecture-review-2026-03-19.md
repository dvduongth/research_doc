# CCN2 Multi-Agent System — Architecture Review & Evaluation

*Ngày đánh giá: 2026-03-19*  
*Người đánh giá: Cốm Đào (OpenClaw Agent)*  
*Dự án: CCN2 (Elemental Hunter)*

---

## 1. Executive Summary

**CCN2 Multi-Agent System** là một hệ thống tự động hóa phát triển game, sử dụng 6 AI agents (chạy trên OpenClaw) để thực hiện full pipeline từ concept → GDD → implementation → testing. Mục tiêu: giảm thiểu thủ công, đảm bảo chất lượng qua quality gates, và duy trì tính nhất quán nhờ state tracking và constitution.

**Đánh giá tổng thể: 7.5/10** — Một kiến trúc ambitious và well-structured, với nhiều design pattern tốt, nhưng vẫn còn các vấn đề cần giải quyết để đạt production-ready.

---

## 2. Kiến trúc tổng quan

### 2.1 Pipeline overview

```
concepts/*.md
    ↓ (agent_gd, 15min)
design/GDD-FEATURE-*.md (score ≥ 70 → Review)
    ↓ (agent_dev, 15min)
analysis/REQ-*.md + analysis/DESIGN-*.md
    ↓ (dispatch to 3 impl agents)
    ├─ agent_dev_client → src/client/<feature>/
    ├─ agent_dev_server → src/server/<feature>/
    └─ agent_dev_admin  → src/admin/<feature>/
    ↓ (when all done → InQC)
agent_qc (15min) → tests, review, smoke test → Done/Flagged
```

### 2.2 Strengths (Ưu điểm)

1. **Separation of Concerns** — Mỗi agent có role rõ ràng (Design, Tech Lead, QA, Frontend, Backend, Admin).
2. **State-driven** — Tất cả state được lưu trong JSON files, đảm bảo idempotency và recoverability.
3. **Quality Gates** — Score thresholds (50, 70, 80) kiểm soát flow, ngăn chặn junk.
4. **Push-based** — Agents tự động poll workspace, không cần external triggers.
5. **Self-documentation** — Mỗi agent có AGENTS.md chi tiết (1200+ dòng tổng).
6. **Extensible** — Thêm impl agents dễ dàng qua `agent_dev_dispatched.json`.

---

## 3. Phân tích từng agent

### 3.1 agent_gd (Designia)

**Mục tiêu**: Chuyển concept game (markdown) thành GDD 10-section bằng tiếng Việt.

**Công cụ**: LLM generation + self-evaluation (GDD-EVAL-RUBRIC).

**Ứng dụng tốt**:
- Hash-based change detection hiệu quả (không reprocess unchanged files).
- Score gate (≥ 70 để Review) đã hoạt động (elemental-hunter đạt 93).
- GDD structure rõ ràng, đủ 10 sections.

**Vấn đề**:
- `GDD_Overview_v2_ElementalHunter.md` incompatible với CCN2 ruleset → bị skip. Cần có filter hoặc policy rõ ràng để tránh waste resources.
- Không có versioning của GDD (overwrite mỗi lần). Có thể nên lưu history (GDD-v1, v2,...).

**Đề xuất**:
- Thêm validation ruleset早期 (pre-scoring) để filter out concepts không phù hợp trước khi generate.
- Lưu GDD với timestamp (GDD-YYYY-MM-DD-HHMM.md) để audit trail.

---

### 3.2 agent_dev (Codera)

**Mục tiêu**: Tech Lead — phân tích GDD, tạo REQ + DESIGN, dispatch cho 3 impl agents.

**Workflow 4-phase**:
1. REQ extraction (Actors, Use Cases, Business Rules)
2. Self-eval REQ (≥ 70)
3. System Design (3 layers)
4. Update `agent_dev_dispatched.json` và GDD status

**Vấn đề nghiêm trọng**:

1. **Inconsistent state**:
   - agent_dev update GDD header `status: InDev` ngay sau Phase 4, nhưng chưa tạo `analysis/REQ-*.md` và `analysis/DESIGN-*.md`.
   - `agent_dev_dispatched.json` vẫn `{}` → downstream agents không có gì để process.
   - Điều này làm break pipeline và gây confusion (G4 gap).

2. **Atomicity**:
   - Mỗi phase nên atomic: Phase 4 chỉ executed nếu Phase 1-3 đều thành công và artifacts được written.
   - Hiện tại có thể update header trước cả khi artifacts exist → partial success.

3. **Dispatch format**:
   - `agent_dev_dispatched.json` schema chưa rõ ràng. Có thể cần:
     ```json
     {
       "features": [
         {
           "name": "elemental-hunter",
           "client_status": "dispatched|done",
           "server_status": "dispatched|done",
           "admin_status": "dispatched|done",
           "dispatched_at": "2026-03-19T11:00+07:00"
         }
       ]
     }
     ```

**Đề xuất**:
- Chỉ update GDD status thành `InDev` sau khi tất cả artifacts (REQ, DESIGN) đã written.
- Thêm transaction-like pattern: if any phase fail → rollback partial writes.
- Validate `agent_dev_dispatched.json` schema và đảm bảo có ít nhất 1 feature được dispatch trước khi downstream agents chạy.

---

### 3.3 agent_qc (Verita)

**Mục tiêu**: QA Engineer — generate testcases, run tests, code review, test generation, smoke test.

**Parts A-F** rất comprehensive, đặc biệt Part D (code review) với independent eval (80+ pass) và FLAG nếu self-eval diff ≥ 20pt.

**Vấn đề**:
- **Smoke test** (Part F) chưa chạy lần nào → `pipeline-health.json` = UNKNOWN.
- `agent_qc_meta.json` rỗng — chưa có metadata cho code_review và test_gen.
- Một số quality reports cũ (18/03) chưa được weekly digest xử lý (tuy Weekly Digest chưa chạy).

**Đề xuất**:
- Đảm bảo Part F luôn chạy (ngay cả khi không có code changes) để có baseline health.
- Lưu metadata code_review/test_gen với versioning để track improvements.
- Weekly Digest nên aggregate tất cả reports trong 7 ngày, không chỉ quality nhưng cả dispatch status, pipeline health.

---

### 3.4 Implementation Agents (Pixel, Forge, Panel)

**Mục tiêu**: Code generation cho từng layer.

**Cách hoạt động**:
- Poll `agent_dev_dispatched.json` cho features có status = dispatched.
- Xử lý tuần tự (oldest first).
- Tạo code trong `src/<layer>/<feature>/` và self-eval.
- Update dispatched.json → done.

**Vấn đề**:
- Hiện tại `agent_dev_dispatched.json` rỗng → không có gì để làm.
- Nếu agent_dev dispatch quá nhanh (hoặc không dispatch đủ), các agent này sẽContinuedly poll → waste resources.
- Không có backpressure: nếu một feature fails, có thể block queue? Cần retry policy.

**Đề xuất**:
- Thêm `max_retries` và `retry_delay` trong dispatched entry.
- Nếu một feature fail nhiều lần → chuyển sang `failed` state và thông báo để human review.
- Implement agents có thể log progress vào state file riêng để debugging.

---

### 3.5 agent_gd (Weekly Digest)

**Mục tiêu**: Tổng hợp weekly quality reports.

**Lịch**: Thứ 2 9am.

**Chưa chạy** (chưa đến lịch). Cần đợi xem kết quả.

**Đề xuất**:
- Digest nên bao gồm:
  - Tổng số features trong pipeline (concept → GDD → dispatched → code → QC).
  - Quality metrics trung bình (pass rate, eval scores).
  - Các feature bị FLAG cần human review.
  - Pipeline health trend (duration, bottleneck agents).
- Gửi đến Telegram + lưu vào `reports/weekly-digest-YYYY-MM-DD.md`.

---

## 4. State Management & Consistency

### 4.1 State Schema

Có nhiều state files:

| File | Mục đích | Schema hiện tại |
|------|----------|-----------------|
| `agent_gd_processed.json` | Track concepts processed | `{filename: {hash, processedAt, status}}` |
| `agent_dev_processed.json` | Track GDDs processed | tương tự |
| `agent_dev_dispatched.json` | Dispatch tasks | **CHƯA RÕ RÀNG** — đang là `{}` hoặc chưa có schema chuẩn |
| `agent_qc_processed.json` | Track GDDs QC processed | `{gdd_file: {status}}` |
| `agent_qc_meta.json` | Code review & test gen metadata | `{code_review: {}, test_gen: {}}` |
| `pipeline-health.json` | Overall health | `{overall: "HEALTHY|DEGRADED|BROKEN", checks: {...}}` |

**Vấn đề**:
- Thiếu unified schema cho `agent_dev_dispatched.json` dẫn đến inconsistency.
- Không có `pipeline-health.json` generation thực tế (Part F chưa chạy).

### 4.2 Transactionality

Hiện tại, agents:
1. Read state file.
2. Process.
3. Write output files.
4. Update state file.

Nếu step 3 thành công nhưng step 4 fail → partial success (output files có nhưng state chưa update → có thể re-run và overwrite, nhưng cũng có thể gây duplicate hoặc skip).

**Đề xuất**:
- Sử dụng atomic write: write to temp file then rename.
- Write all-or-nothing: nếu update state fail → rollback output (delete).
- Thêm `run_id` duy nhất cho mỗi execution để track.

---

## 5. Quality Gates & Evaluation

**Rubrics hiện có**:
- GDD-EVAL-RUBRIC: 100pt, gate: ≥ 50 (Draft), ≥ 70 (Review)
- CODE-EVAL-RUBRIC: 100pt, gate: ≥ 80 (Pass)

**Điểm mạnh**:
- Independent evaluation (agent_qc re-evaluates GDD) tạo độ tin cậy.
- Self-eval diff check (≥ 20pt → FLAG) bắt lỗi overconfidence.

**Vấn đề**:
- Rubric details chưa thấy trong repo (có lẽ trong AGENTS.md).
- Không có calibration giữa các agents (có thể different standards).

**Đề xuất**:
- Document rubrics đầy đủ (criteria, weights).
- Periodic review rubric scores to ensure consistency.
- Consider using multiple judges (majority vote) for critical gates.

---

## 6. Monitoring & Observability

**Hiện tại**:
- Telegram notifications cho mỗi job run (success/failure).
- State files provide some persistence.
- Không có centralized dashboard.

**Vấn đề**:
- Khó theo dõi pipeline health tổng thể.
- No alerts cho pipeline block (ví dụ: agent_dev không dispatch).
- Logs chỉ trong Telegram history → không searchable.

**Đề xuất**:
- Build simple dashboard (HTML page) từ state files và reports.
- Thêm alert rules: nếu `agent_dev_dispatched.json` empty sau 2 giờ → alert.
- Centralize logs: mỗi agent write log vào `logs/agent_<name>-<date>.log`.
- Implement `pipeline-health.json` thực sự (Part F) với các check:
  -state file validity.
  - Recent activity (last run < 2h ago?).
  - Stuck features (InDev > 4h chưa dispatch?).

---

## 7. Scalability & Performance

**Điểm mạnh**:
- Incremental processing via hash detection → efficient.
- Parallel execution: 3 impl agents chạy độc lập, 30 phút interval.
- Chạy trên OpenClaw → có thể scale horizontally (cứ 1 agent chạy trên host riêng).

**Vấn đề**:
- Large codebase có thể làm chậm agents (đặc biệt agent_qc chạy `npm test`).
- Không có resource limits: agents có thể consume too much CPU/memory.
- Polling interval cố định — không adaptive dựa trên workload.

**Đề xuất**:
- Add performance metrics: duration, memory usage.
- Implement adaptive scheduling: nếu queue dài, tăng frequency.
- Limit concurrent agent sessions (lanes) để tránh resource exhaustion.
- Consider queue-based dispatch (RabbitMQ/Redis) thay vì polling file, nhưng会增加 complexity.

---

## 8. Security Considerations

**Hiện tại**:
- Code generation agents viết code vào workspace — could potentially write malicious code if prompt injection occurs.
- State files không được sign/verify — có thể bị tampered.
- No authentication between agents (chỉ file-based communication).

**Rủi ro**:
- Prompt injection: Nếu concept/ GDD chứa malicious instructions, agents có thể execute.
- Supply chain: Generated code có thể có vulnerabilities.

**Đề xuất**:
- Sandbox code generation: run in container (Docker) với limited permissions.
- Static analysis of generated code trước khi accept (security scanner).
- Code review gate: agent_qc sử dụng security scanner (SAST) như phần của Part D.
- Sign state files với HMAC (shared secret) để detect tampering.

---

## 9. Error Handling & Resilience

**Current error handling**:
- Agents có try/catch cơ bản, ghi lỗi vào state file (status: "error").
- Consecutive errors tracked (ví dụ: agentDev 6 lỗi).
- Failure alerts sau ngưỡng (after: 2-3) → Telegram.

**Vấn đề**:
- Error handling không đồng nhất giữa agents.
- No retry mechanism với backoff.
- No circuit breaker: failing agent có thể block pipeline.

**Đề xuất**:
- Standardize error handlingMiddleware:
  - Transient errors (network, timeout) → retry with backoff (max 3 lần).
  - Permanent errors (syntax, validation) → skip và flag, không retry.
- Circuit breaker: nếu agent fail liên tiếp > 5 → tạm dừng 1h và alert.
- Dead letter queue: lưu failed tasks vào `failed/` để manual review.

---

## 10. Maintainability & Documentation

**Điểm mạnh**:
- Mỗi agent có AGENTS.md rất chi tiết (100-400 dòng).
- Constitution rõ ràng (7 principles).
- Schema và protocols được document.

**Vấn đề**:
- Hard-coded paths (ví dụ: `D:/PROJECT/CCN2/...`) — nếu di chuyển repo sẽ break.
- Không có unit tests cho agents (chỉ integration via cron).
- Dependency trên LLM APIs (Anthropic, OpenRouter) — nếu API fail, agents có thể fallback?

**Đề xuất**:
- Config hóa paths: dùng biến môi trường hoặc config file (ví dụ: `CCN2_WORKSPACE`).
- Write unit tests cho critical functions (hash detection, rubric scoring, state updates).
- Implement fallback models: nếu primary LLM fails, chuyển sang backup (OpenAI, local Ollama).
- Version agents: mỗi agent nên có version number trong AGENTS.md.

---

## 11. Gaps & Critical Issues Summary

| Gap | Severity | Impact | Solution |
|-----|----------|--------|----------|
| G1 & G4: agent_dev dispatch inconsistency | 🔴 Critical | Pipeline block; downstream idle | Ensure dispatch only after artifacts written; atomic state update |
| G2: pipeline-health.json UNKNOWN | 🟡 Medium | No health baseline | Run smoke test (Part F) immediately |
| agent_gd incompatible filter | 🟡 Medium | Wasted compute | Add pre-filter bằng ruleset hoặc skip based on metadata |
| State file schema unvalidated | 🔴 Critical | Corrupted state, pipeline failure | Define JSON schemas và validate before read |
| No retry/backoff | 🟡 Medium | Transient failures stop pipeline | Implement retry with exponential backoff |
| Hard-coded paths | 🟡 Medium | Not portable | Parameterize via config |
| No centralized logging | 🟢 Low | Debugging hard | Write logs to files per agent |
| No security scanning | 🟡 Medium | Vulnerable code | Add SAST step in agent_qc Part D |

---

## 12. Recommendations & Roadmap

### Phase 1: Stability (Ngắn hạn — 1 tuần)

1. **Fix agent_dev dispatch** — Chỉ update GDD status sau khi cả `REQ` và `DESIGN` được written và `agent_dev_dispatched.json` updated.
2. **Validate state schemas** — Add JSON schema validation vào đầu mỗi agent.
3. **Run smoke test** — Kích hoạt agent_qc Part F để tạo `pipeline-health.json`.
4. **Add retry logic** — Cho các transient errors (HTTP timeouts, LLM API failures).

### Phase 2: Observability (1-2 tuần)

1. **Dashboard** — Tạo HTML page từ state files và reports.
2. **Alerts** — Thêm Telegram alerts cho:
   - Pipeline block > 2h
   - Consecutive failures > 3
   - Health status change
3. **Logging** — Mỗi agent ghi log vào `logs/agent_<name>/<date>.log` với rotation.
4. **Weekly Digest enhancement** — Include pipeline metrics.

### Phase 3: Quality & Security (2-3 tuần)

1. **SAST integration** — Thêm security scan vào agent_qc Part D (ví dụ: Bandit cho Python, ESLint security rules cho JS, SpotBugs cho Java).
2. **Code review multi-agent** — Có thể thêm agent_review角色 để double-check.
3. **Rubric calibration** — Chạy blind evaluation trên sample artifacts để align scores.
4. **Vulnerability database** — Track known issues in generated code.

### Phase 4: Scalability & Reliability (3-4 tuần)

1. **Containerize agents** — Chạy mỗi agent trong Docker container với resource limits.
2. **Message queue** — Thay vì polling file, dùng Redis/RabbitMQ để dispatch jobs (backpressure).
3. **Hot reload** — Không cần restart agents khi config thay đổi.
4. **Backup & restore** — Snapshot state files định kỳ.

---

## 13. So sánh với industry best practices

| Practice | CCN2 Agents | Industry Standard | GAP |
|----------|-------------|------------------|-----|
| CI/CD Pipeline | Custom cron-based | Jenkins/GitHub Actions | Needs event triggering (on commit) |
| State Persistence | JSON files | Database (PostgreSQL) | No ACID, concurrency issues |
| Code Review | Agent-based | Human + Bot (ReviewDog) | Lacks human-in-the-loop for flagged |
| Testing | Automated (npm test) | Unit + Integration + E2E | No coverage enforcement? |
| Security | None | SAST/DAST + secrets scanning | Missing |
| Monitoring | Telegram only | Prometheus + Grafana | No metrics collection |
| Rollback | Manual | Automated (canary, blue-green) | No versioning of produced artifacts |
| Configuration | Hard-coded | config files / env vars | Need parameterization |

---

## 14. Conclusion

**CCN2 Multi-Agent System** là một proof-of-concept ấn tượng, cho thấy AI agents có thể tự động hóa full software development lifecycle. Kiến trúc modular và state-driven cho phép scaling và debugging.

**Tuy nhiên**, để đạt production-ready, cần fix các vấn đề nghiêm trọng:

1. **State consistency** — đặc biệt agent_dev dispatch.
2. **Observability** — dashboard, logs, alerts.
3. **Error resilience** — retry, circuit breaker.
4. **Security** — sandbox, SAST.
5. **Infrastructure** — containerization, message queue.

Với những cải tiến trên, hệ thống có thể trở thành một CI/CD platform mạnh mẽ dựa trên AI, phù hợp cho indie game studios và small teams.

---

## 15. Appendix — Sample Configuration Improvements

### A. Unified State Schema (example)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CCN2 Agent State",
  "type": "object",
  "required": ["filename", "hash", "status", "processedAt"],
  "properties": {
    "filename": { "type": "string" },
    "hash": { "type": "string", "pattern": "^[a-f0-9]{32}$" },
    "status": { "type": "string", "enum": ["pending", "processing", "done", "skipped", "error"] },
    "processedAt": { "type": "string", "format": "date-time" },
    "error": { "type": "string" },
    "runId": { "type": "string" }
  }
}
```

### B. agent_dev_dispatched.json schema

```json
{
  "features": [
    {
      "name": "elemental-hunter",
      "client_status": "dispatched|done|error",
      "server_status": "dispatched|done|error",
      "admin_status": "dispatched|done|error",
      "dispatchedAt": "2026-03-19T11:00:00+07:00",
      "completedAt": "2026-03-19T11:30:00+07:00",
      "retryCount": 0,
      "error": null
    }
  ]
}
```

### C. Pipeline Health Check (Part F) output

```json
{
  "overall": "HEALTHY",
  "timestamp": "2026-03-19T11:45:00+07:00",
  "checks": {
    "C1": { "pass": true, "message": "concepts/ has 1 .md" },
    "C2": { "pass": true, "message": "design/ has GDD-FEATURE-*.md" },
    "C3": { "pass": true, "message": "All GDDs have status header" },
    "C4": { "pass": false, "message": "src/client/ empty" },
    "C5": { "pass": null, "message": "Exempt (no quality report yet)" },
    "C6": { "pass": true, "message": "State JSONs valid" }
  }
}
```

---

*End of Architecture Review — 2026-03-19*
