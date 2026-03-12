# Dependency Graph - Core Dependencies Checklist

---

## ✅ Phase 1: Ghi nhận Dependencies

- [ ] Đọc `packages/ai/package.json` và liệt kê dependencies.
- [ ] Đọc `packages/agent/package.json` và liệt kê dependencies.
- [ ] Đọc `packages/coding-agent/package.json` và liệt kê dependencies.
- [ ] Đọc `packages/tui/package.json` và liệt kê dependencies.
- [ ] Tổng hợp vào notes `01-package-deps.md`.
- [ ] Xác nhận direction: coding-agent → agent-core → ai.

---

## ✅ Phase 2: Kiểm tra Cyclic Dependencies

- [ ] Kiểm tra xem có package nào import ngược lên không (ví dụ ai import agent-core?).
- [ ] Verify code: `packages/ai/src/index.ts` exports gì? (không import agent-core).
- [ ] Verify: `packages/agent/src/agent.ts` chỉ import từ `@mariozechner/pi-ai`.
- [ ] Verify: `packages/coding-agent/src/` import từ agent-core và tui.
- [ ] Không có cyclic → đánh dấu [x].

---

## ✅ Phase 3: Architecture Insights

- [ ] Ghi chú responsibilities của mỗi package:
  - [ ] `pi-ai`: LLM abstraction, providers, models.
  - [ ] `pi-agent-core`: agent state, event loop, tool execution.
  - [ ] `pi-coding-agent`: CLI, TUI, resource loading, session management.
  - [ ] `pi-tui`: terminal UI components.
- [ ] Phân tích tại sao phải có 3-tier (separation of concerns).
- [ ] Ghi insights vào `02-architecture-insights.md`.

---

## ✅ Phase 4: External Dependencies

- [ ] Liệt kê provider SDKs trong `pi-ai` (Anthropic, OpenAI, Google, Mistral, AWS).
- [ ] Liệt kê utility libs trong `pi-coding-agent` (chalk, diff, extract-zip, glob, yaml...).
- [ ] Liệt kê libs trong `pi-tui` (chalk, marked, xterm...).
- [ ] Document mục đích chính của các libs quan trọng.
- [ ] Ghi vào `03-external-deps.md`.

---

## ✅ Phase 5: Mermaid Diagram

- [ ] Vẽ dependency graph (packages + external) dùng mermaid syntax.
- [ ] Lưu vào `diagrams/dependency-graph.mmd`.
- [ ] Render (có thể dùng online mermaid editor để preview).
- [ ] Có thể vẽ thêm diagram cho responsibilities layers.

---

## ✅ Phase 6: Quiz

- [ ] Tạo 5-10 câu hỏi trắc nghiệm/tự luận về dependencies.
- [ ] Đưa vào `quiz.md`.
- [ ] Đảm bảo quiz bao phủ:
  - [ ] Direction của dependencies.
  - [ ] Responsibilities.
  - [ ] Cyclic check.
  - [ ] External libs用途.
  - [ ] Kiến trúc rationale.

---

## ✅ Phase 7: PROGRESS

- [ ] Tạo `PROGRESS.md` và cập nhật khi mỗi phase hoàn thành.
- [ ] Ghi nhận thời gian, insights, blockers.

---

## 📊 Success Criteria

- [ ] Tất cả dependencies được document đầy đủ.
- [ ] Kiến trúc rõ ràng, không cyclic.
- [ ] Diagram thể hiện được dependencies.
- [ ] Quiz xác nhận hiểu.
- [ ] Notes chứa phân tích sâu.

---

**Ghi chú**: Đánh dấu [x] khi hoàn thành. Lưu ý mỗi item vào notes tương ứng.
