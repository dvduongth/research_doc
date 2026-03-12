# Round #1 — Task 1: Checklist đã hiểu / chưa hiểu

> **Ngày:** T4 — 11/3
> **Mục tiêu:** Đọc lại tài liệu pi-mono đã có (00→08). Focus: kiến trúc 3 tiers, dependency graph, agent loop
> **Cách dùng:** Đánh `[x]` vào ô đã hiểu, để trống `[ ]` nếu chưa hiểu hoặc cần xem lại

---

## 00 — Từ điển khái niệm

### Nhóm 1: LLM & AI cơ bản
- [ ] LLM (Large Language Model)
- [ ] Provider (Nhà cung cấp LLM)
- [ ] API (Giao diện lập trình)
- [ ] Token (Đơn vị xử lý của LLM)
- [ ] Streaming (Truyền trả lời từng phần)
- [ ] Context Window (Cửa sổ ngữ cảnh)

### Nhóm 2: Agent & Tool Calling
- [ ] AI Agent (Tác nhân AI)
- [ ] Tool Calling / Function Calling (Gọi công cụ)
- [ ] Agent Loop (Vòng lặp Agent)
- [ ] State Management (Quản lý trạng thái)
- [ ] Steering & Follow-up (Điều hướng và theo dõi)

### Nhóm 3: Kiến trúc phần mềm liên quan
- [ ] Monorepo (Kho mã nguồn đơn nhất)
- [ ] Lockstep Versioning (Đánh phiên bản đồng bộ)
- [ ] Event-driven Architecture (Kiến trúc hướng sự kiện)
- [ ] Web Components (Thành phần web chuẩn)
- [ ] Differential Rendering (Vẽ lại khác biệt)

### Nhóm 4: Hạ tầng & Triển khai
- [ ] vLLM (Engine chạy LLM trên GPU)
- [ ] GPU Pod (Máy chủ GPU thuê theo giờ)
- [ ] Docker / Sandbox (Môi trường cách ly)

---

## 01 — `ai` package (Foundation tier)

- [ ] Giới thiệu — vai trò của package `ai`
- [ ] Vị trí trong hệ thống (tier nào, ai phụ thuộc vào nó)
- [ ] Chức năng chính
- [ ] Kiến trúc & cấu trúc thư mục
- [ ] Hàm `stream()` — trái tim của package
- [ ] Hệ thống Provider Registry
- [ ] Model Registry — quản lý 22 providers
- [ ] OAuth — 5 provider hỗ trợ đăng nhập
- [ ] Context Overflow Detection
- [ ] Dependencies (nội bộ + bên ngoài)
- [ ] So sánh với alternatives
- [ ] Điểm nổi bật & hạn chế

---

## 02 — `tui` package (Foundation tier)

- [ ] Giới thiệu — vai trò của package `tui`
- [ ] Vị trí trong hệ thống
- [ ] Chức năng chính
- [ ] Rendering Pipeline — cách vẽ màn hình
- [ ] Components — 12 thành phần UI
- [ ] Keyboard Protocol — 3 tầng hỗ trợ
- [ ] Text Utilities — xử lý text thông minh
- [ ] Overlay System — popup xếp chồng
- [ ] Fuzzy Matching — tìm kiếm mờ
- [ ] Dependencies (nội bộ + bên ngoài)
- [ ] So sánh với alternatives
- [ ] Điểm nổi bật & hạn chế

---

## 03 — `agent` package (Core tier) ⭐ FOCUS

- [ ] Giới thiệu — vai trò của package `agent`
- [ ] Vị trí trong hệ thống
- [ ] Chức năng chính
- [ ] Kiến trúc & cấu trúc thư mục
- [ ] `types.ts` — hệ thống kiểu dữ liệu
- [ ] **`agent-loop.ts` — vòng lặp lõi (~1.150 dòng)**
- [ ] `agent.ts` — lớp Agent (State Manager)
- [ ] `proxy.ts` — Proxy Streaming
- [ ] **Luồng xử lý chi tiết (end-to-end flow)**
- [ ] Dependencies
- [ ] So sánh với alternatives
- [ ] Điểm nổi bật & hạn chế

---

## 04 — `web-ui` package (Application tier)

- [ ] Giới thiệu — vai trò của package `web-ui`
- [ ] Vị trí trong hệ thống
- [ ] Component Hierarchy — cấu trúc phân cấp
- [ ] 32 Web Components
- [ ] Artifacts System — tạo/xem file
- [ ] Sandbox Architecture — chạy code cách ly
- [ ] Storage System — lưu trữ local
- [ ] Proxy & CORS Handling
- [ ] Registry Patterns — mở rộng không cần sửa code
- [ ] Styling (Light DOM, framework)
- [ ] Dependencies
- [ ] So sánh với alternatives
- [ ] Điểm nổi bật & hạn chế

---

## 05 — `coding-agent` package (Application tier)

- [ ] Giới thiệu — vai trò của package `coding-agent`
- [ ] Vị trí trong hệ thống
- [ ] 7 Built-in Tools
- [ ] 4 Chế độ chạy (Run Modes)
- [ ] Extension System — mở rộng không cần fork
- [ ] Session Management — quản lý phiên làm việc
- [ ] Context Compaction — nén context thông minh
- [ ] System Prompt — xây dựng prompt hệ thống
- [ ] Configuration — hệ thống cấu hình
- [ ] **Luồng xử lý khi gõ `pi`**
- [ ] Dependencies
- [ ] So sánh với alternatives
- [ ] Điểm nổi bật & hạn chế

---

## 06 — `mom` package (Application tier)

- [ ] Giới thiệu — vai trò của package `mom`
- [ ] Vị trí trong hệ thống
- [ ] Luồng xử lý tin nhắn
- [ ] Slack APIs sử dụng
- [ ] 5 Built-in Tools
- [ ] Event System — lên lịch tác vụ
- [ ] Memory & Skills
- [ ] Docker Sandbox
- [ ] Dependencies
- [ ] So sánh với alternatives
- [ ] Điểm nổi bật & hạn chế

---

## 07 — `pods` package (Infrastructure tier)

- [ ] Giới thiệu — vai trò của package `pods`
- [ ] Vị trí trong hệ thống
- [ ] Luồng triển khai model
- [ ] CLI Commands
- [ ] 13 Predefined Model Configs
- [ ] Cloud Providers
- [ ] Deployment Scripts (`pod_setup.sh`, `model_run.sh`)
- [ ] Dependencies
- [ ] So sánh với alternatives
- [ ] Điểm nổi bật & hạn chế

---

## 08 — Tổng hợp cross-cutting ⭐ FOCUS

### Kiến trúc tổng thể
- [ ] Tổng quan dự án
- [ ] **Dependency Graph — đồ thị phụ thuộc (3 tiers)**
- [ ] Build System (tsgo, build order)
- [ ] Linting & Formatting (Biome)
- [ ] Testing (Vitest)
- [ ] CI/CD (GitHub Actions)

### Monorepo & Quản lý
- [ ] npm workspaces
- [ ] Lockstep Versioning
- [ ] Changelog Format
- [ ] Code Quality Rules (AGENTS.md)

### So sánh tổng thể
- [ ] **pi-mono vs Claude Code vs Aider vs Cursor**
- [ ] Điểm khác biệt độc nhất của pi-mono
- [ ] Hạn chế so với ecosystem

### Patterns kiến trúc xuyên suốt
- [ ] **Event-Driven Architecture**
- [ ] Registry Pattern
- [ ] **Stream-First Design**
- [ ] Pluggable Operations
- [ ] Context at LLM Boundary

### Thống kê & Kết luận
- [ ] Thống kê tổng hợp
- [ ] Kết luận

---

## Ghi chú thêm

### Câu hỏi cần làm rõ:
1.
2.
3.

### Phần cần đào sâu thêm:
1.
2.
3.

### Liên hệ với Claude Code (chuẩn bị cho task T5 — 12/3):
- Giống:
- Khác:
