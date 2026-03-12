# Agent Runner

`AgentRunner` (hoặc tương tự) là thành phần kết nối `Agent` (tier 2) với TUI (tier 3). Nó quản lý session, đăng ký event listeners, và điều phối stream messages tới UI.

---

## 🎯 Role

- Tạo `Agent` instance với config phù hợp.
- Load resources (skills, extensions, tools) và truyền vào agent.
- Đăng ký listeners cho `AgentEvent` để update UI.
- Xử lý user input từ editor và gửi vào agent (`prompt()` hoặc `steer()`/`followUp()`).
- Quản lý session save/load thông qua `SessionManager`.
- Xử lý compaction, branching, forking.
- Điều phối các chế độ: interactive, print, rpc.

---

## 📦 Files liên quan

- `src/core/sdk.ts`: `createAgentSession()` – factory tạo agent session với resource loader, settings, etc.
- `src/core/agent-runner.ts`: Lớp chính điều phải agent.
- `src/core/session-manager.ts`: Session persistence.
- `src/modes/interactive/interactive-mode.ts`: TUI mode.
- `src/modes/print-mode.ts`, `src/modes/rpc-mode.ts`: Các mode khác.

---

## 🔄 Flow

1. `main()` tạo `DefaultResourceLoader` với options từ args/settings.
2. Gọi `createAgentSession({ resourceLoader, settings, ... })`.
   - Tạo `Agent` instance.
   - Load extensions, skills, prompts, themes.
   - Register tools (built-in + extensions).
   - Tạo `SessionManager` (continue/resume/new).
   - Thiết lập system prompt từ resources.
   - Set up event bus.
3. Tạo mode phù hợp (InteractiveMode, PrintMode, RpcMode).
4. Mode xử lý input/output:
   - Interactive: TUI loop, editor events, message rendering.
   - Print: một lần prompt rồi exit.
   - RPC: JSON-RPC protocol.
5. Agent runner lắng nghe agent events và cập nhật UI/state tương ứng.

---

## 🎪 Event Handling

AgentRunner đăng ký các event:

- `agent_start`, `agent_end`: bắt đầu/kết thúc user prompt.
- `turn_start`, `turn_end`: mỗi turn (assistant response + tools).
- `message_start`, `message_update`, `message_end`: update nội dung message trong UI.
- `tool_execution_start`, `tool_execution_update`, `tool_execution_end`: hiển thị tool execution progress.
- Các event này được chuyển thành render updates trong TUI.

---

## 💾 Session Persistence

AgentRunner dùng `SessionManager` để:

- Tự động save mỗi `message_end` (hoặc theo config).
- Load session khi `--continue` hoặc `/resume`.
- Tạo session mới với `/new`.
- Fork với `/fork`.
- Branch với `/tree`.

Session file path được quản lý bởi SessionManager.

---

**Lưu ý**: Chi tiết implementation cụ thể nằm trong `src/core/agent-runner.ts` và `src/core/sdk.ts`. AgentRunner là trung tâm điều phối toàn bộ hoạt động của ứng dụng.
