# Plan: Phân tích chi tiết pi-mono theo package

## Context

**Repo**: [badlogic/pi-mono](https://github.com/badlogic/pi-mono) — AI agent toolkit (22.1k stars, TypeScript 96.6%, MIT, v0.57.1)
**Local clone**: `./pi-mono` (relative to R)
**Thư mục research (R)**: thư mục gốc của project research (portable, dùng đường dẫn tương đối)
**Mục tiêu**: Phân tích research-only (inspect, web search, web fetch) — không sản xuất code.
**Đối tượng**: Người chưa có nhiều kinh nghiệm AI, cần giải thích rõ ràng bằng tiếng Việt.
**Ngôn ngữ output**: Toàn bộ tiếng Việt, file human-readable, có thể chia sẻ.
**Tiến độ**: Thực hiện từng bước theo yêu cầu, tracking trong `PROGRESS.md`.
**Quy tắc**: Trước mỗi bước, ghi lại kế hoạch và **chờ chỉ thị** trước khi thực hiện.

Repo gồm 7 packages (506 TS files, 111 test files) theo lockstep versioning, tổ chức 3 tầng:

```
Tier 1 (Nền tảng)       Tier 2 (Lõi)            Tier 3 (Ứng dụng)
─────────────────────   ──────────────────────   ─────────────────────────
ai  (79 files, 31 tests) → agent (13f, 4t)     → coding-agent (263f, 58t)
tui (50 files, 18 tests) → web-ui (75f, 0t)    → mom (17f, 0t)
                                                 → pods (9f, 0t)
```

## Phân loại packages

| Nhóm | Package | Vai trò |
|------|---------|---------|
| **Hạ tầng LLM** | `ai` | Giao diện thống nhất cho 15+ nhà cung cấp LLM |
| **Hạ tầng LLM** | `pods` | Quản lý triển khai vLLM trên GPU cloud |
| **Khung Agent** | `agent` | Runtime cho AI agent + gọi công cụ |
| **Khung Agent** | `coding-agent` | CLI trợ lý lập trình tương tác |
| **Giao diện** | `tui` | Thư viện giao diện terminal |
| **Giao diện** | `web-ui` | Components web cho chat AI |
| **Tích hợp** | `mom` | Bot Slack → chuyển tiếp cho coding agent |

## Deliverables (sản phẩm đầu ra)

Tất cả file lưu tại `./docs/` (relative to R), tiếng Việt, human-readable:

| File | Nội dung | Thời gian tìm hiểu* |
|------|----------|---------------------|
| `PLAN.md` | Bản copy plan này | — |
| `PROGRESS.md` | Tracking tiến độ từng bước | — |
| `00-tu-dien-khai-niem.md` | Từ điển khái niệm AI/Agent/LLM cho người mới | ~30–45 phút |
| `01-ai-package.md` | Phân tích package `ai` | ~40–60 phút |
| `02-tui-package.md` | Phân tích package `tui` | ~25–35 phút |
| `03-agent-package.md` | Phân tích package `agent` | ~20–30 phút |
| `04-web-ui-package.md` | Phân tích package `web-ui` | ~30–40 phút |
| `05-coding-agent-package.md` | Phân tích package `coding-agent` | ~45–60 phút |
| `06-mom-package.md` | Phân tích package `mom` | ~20–30 phút |
| `07-pods-package.md` | Phân tích package `pods` | ~15–25 phút |
| `08-tong-hop.md` | Cross-cutting analysis + so sánh ecosystem | ~30–45 phút |
| `pi-mono-analysis.csv` | Bảng dữ liệu tổng hợp (mở rộng) | ~10 phút |

*Thời gian tìm hiểu: ước lượng thời gian để người đọc **hiểu được** nội dung (không chỉ đọc xong), bao gồm cả việc tự tra cứu thêm các reference liên quan. Mỗi file output sẽ ghi rõ thời gian ước lượng ở đầu file.

## Quy trình phân tích

### Bước 0: Từ điển khái niệm (cho người mới)
**Mục tiêu**: Tạo file giải thích các khái niệm nền tảng bằng tiếng Việt, dùng ví dụ đời thường.

**Nội dung cần giải thích** (nhóm theo chủ đề):

1. **LLM & AI cơ bản**:
   - LLM là gì? (Large Language Model — ví dụ ChatGPT, Claude)
   - Provider là gì? (OpenAI, Anthropic, Google — như nhà mạng điện thoại)
   - API là gì trong ngữ cảnh này? (cách gọi LLM từ code)
   - Token là gì? (đơn vị tính toán và tính phí của LLM)
   - Streaming là gì? (nhận trả lời từng phần thay vì đợi hết)
   - Context window là gì? (bộ nhớ ngắn hạn của LLM)

2. **Agent & Tool Calling**:
   - AI Agent là gì? (LLM + khả năng hành động, không chỉ trả lời)
   - Tool/Function Calling là gì? (LLM yêu cầu chạy lệnh rồi nhận kết quả)
   - Agent Loop là gì? (vòng lặp: hỏi → suy nghĩ → dùng công cụ → trả lời)
   - State Management là gì? (nhớ trạng thái giữa các lượt)
   - Steering/Follow-up là gì? (điều hướng agent giữa chừng)

3. **Kiến trúc phần mềm liên quan**:
   - Monorepo là gì? (nhiều package trong 1 repo)
   - Lockstep versioning là gì? (tất cả packages cùng version)
   - Event-driven architecture? (giao tiếp bằng sự kiện)
   - Web Components? (component UI chuẩn web, không phụ thuộc framework)
   - Differential rendering? (chỉ vẽ lại phần thay đổi)

4. **Hạ tầng & Triển khai**:
   - vLLM là gì? (engine chạy LLM nhanh trên GPU)
   - GPU Pod là gì? (máy chủ GPU thuê theo giờ trên cloud)
   - Docker/Sandbox là gì? (môi trường cách ly an toàn)

**Cách thực thi**:
- Web search: Tìm giải thích tiếng Việt tốt nhất cho từng khái niệm
- Viết ví dụ thực tế liên hệ với pi-mono (ví dụ: "package `ai` giống như ổ cắm đa năng — cắm vào OpenAI hay Anthropic đều dùng được")
- **Output**: `00-tu-dien-khai-niem.md`

### Bước 1–7: Phân tích từng package

Mỗi file package sẽ có cấu trúc thống nhất (10 mục):

1. **Tiêu đề**: `# [Tên package] — [Tên tiếng Việt]`
2. **Thời gian tìm hiểu**: ước lượng ở đầu file
3. **Giới thiệu**: 1–2 đoạn, dễ hiểu
4. **Vị trí trong hệ thống**: tier nào, phụ thuộc gì
5. **Chức năng chính**: bullet list
6. **Kiến trúc & Cấu trúc thư mục**: tree diagram
7. **Thành phần quan trọng**: key files + giải thích
8. **Dependencies**: nội bộ + bên ngoài, giải thích tại sao cần
9. **So sánh với alternatives**: bảng
10. **Điểm nổi bật & Hạn chế** + **Tóm tắt** (3–5 dòng)

**Thứ tự phân tích** (theo dependency, từ nền tảng lên):

1. `ai` → 2. `tui` → 3. `agent` → 4. `web-ui` → 5. `coding-agent` → 6. `mom` → 7. `pods`

**Công cụ cho mỗi bước**:

- **Read/Explore**: Đọc source code local (entry points, types, key modules)
- **WebSearch**: npm stats, alternatives, ecosystem context
- **WebFetch**: npm registry, CHANGELOG, GitHub data
- Mỗi bước output 1 file `.md` tiếng Việt

### Bước 8: Tổng hợp cross-cutting
- Dependency graph (text-based diagram)
- Build system analysis (tsgo, biome, vitest)
- CI/CD workflows
- Code quality patterns (AGENTS.md rules)
- So sánh tổng thể với Claude Code, Cursor, Aider
- **Output**: `08-tong-hop.md`

### Bước 9: CSV mở rộng
- Columns: package_name, category_vi, tier, path, description_vi, ts_files, test_files, internal_deps, key_external_deps, main_features_vi, npm_package, last_update, alternatives
- **Output**: `pi-mono-analysis.csv`

## Cách thực thi kỹ thuật

- **Agent (Explore)**: Đọc source code local, scan patterns
- **WebSearch**: npm stats, alternatives, ecosystem context
- **WebFetch**: npm registry data, GitHub API, CHANGELOG
- **Read**: Đọc specific files khi cần chi tiết
- Song song hóa khi có thể (multiple web searches, multiple file reads)
- Sau mỗi bước, ghi file ngay (không đợi cuối cùng)

## Quản lý thư mục R

Cấu trúc thư mục R (dùng đường dẫn tương đối, portable giữa các máy):

    R/                            ← thư mục gốc research
    ├── pi-mono/                  ← repo clone (đã có)
    ├── pi-mono-report.csv        ← CSV tổng quan (đã tạo)
    ├── pi-mono-report.md         ← MD tổng quan (đã tạo)
    └── docs/                     ← THƯ MỤC CHÍNH cho phân tích
        ├── PLAN.md               ← copy plan này
        ├── PROGRESS.md           ← tracking tiến độ
        ├── 00-tu-dien-khai-niem.md
        ├── 01-ai-package.md
        ├── ...
        ├── 08-tong-hop.md
        └── pi-mono-analysis.csv

## PROGRESS.md format

Bảng tracking với 5 cột: Bước, Tên, Trạng thái (Chưa bắt đầu / Đang làm / Hoàn thành), File output, Ngày hoàn thành.

## Verification

- Cross-check npm package names và versions với registry
- Verify dependency graph khớp với actual package.json
- Confirm provider list trong `ai` package khớp với source code
- So sánh star count, download stats với web data thực tế
