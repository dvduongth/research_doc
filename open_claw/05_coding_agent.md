# 05. Coding Agent — Package pi-coding-agent

## Giải thích cho người mới

### Coding Agent là gì?
**Coding agent** là trợ lý AI chuyên giúp viết code. Thay vì chỉ trả lời câu hỏi (như ChatGPT), coding agent có thể **trực tiếp**:
- Đọc file code trong dự án
- Tạo file mới
- Sửa file hiện có
- Chạy lệnh terminal (build, test, git, ...)

### So sánh nhanh với IDE truyền thống

| | IDE (VS Code) | Coding Agent (Pi) |
|--|-------------|------------------|
| Ai viết code? | Bạn | AI (có sự giám sát) |
| Cách tương tác | Click, gõ | Nói bằng ngôn ngữ tự nhiên |
| Phạm vi | 1 file tại một thời điểm | Toàn bộ dự án |
| Tự động hóa | Hạn chế | Cao (tool calling) |

---

## Tổng quan Package

| Thông tin | Chi tiết |
|-----------|---------|
| **Tên NPM** | @mariozechner/pi-coding-agent |
| **Phiên bản** | 0.57.1 |
| **Mô tả** | Coding agent CLI with read, bash, edit, write tools and session management |
| **Binary** | `pi` (cài qua npm: `npm i -g @mariozechner/pi-coding-agent`) |
| **Config dir** | `.pi/` trong thư mục dự án |

---

## Triết lý thiết kế — "Tối giản, tùy biến"

Pi coding agent được xây dựng với triết lý **ngược lại** so với Claude Code:

```
Claude Code:  Nhiều tính năng built-in → User chọn tắt/bật
Pi:           Ít tính năng core → User tự thêm qua extension
```

### Những gì Pi CỐ Ý KHÔNG CÓ:
- **Không có MCP** (Model Context Protocol)
- **Không có sub-agents** (agent con lồng nhau)
- **Không có plan mode** (chế độ lập kế hoạch)
- **Không có permission popups** (hộp thoại xin phép)
- **Không có todo list built-in**
- **Không có background bash**

### Tại sao?
> "Adapt pi to your workflows, not the other way around."
> (Điều chỉnh Pi theo cách làm việc của bạn, không phải ngược lại.)

Ý tưởng: Mỗi developer có workflow khác nhau. Thay vì ép tất cả vào một khuôn, Pi cung cấp **nền tảng tối giản** để bạn tự xây dựng công cụ riêng.

---

## 4 Chế độ hoạt động

| Chế độ | Mô tả | Use case |
|--------|-------|----------|
| **Interactive** | CLI terminal tương tác | Developer ngồi trước máy, chat với AI |
| **Print/JSON** | Xuất kết quả ra stdout | Tích hợp vào script/pipeline |
| **RPC** | Giao tiếp qua process | Nhúng vào ứng dụng khác |
| **SDK** | Import như thư viện | Xây dựng ứng dụng AI riêng |

---

## 8 Tools mặc định

Từ source code (`src/core/tools/`), Pi cung cấp 8 tools:

| Tool | File | Chức năng |
|------|------|----------|
| **read** | `read.ts` | Đọc nội dung file |
| **write** | `write.ts` | Ghi/tạo file mới |
| **edit** | `edit.ts` | Sửa file (tìm và thay thế) |
| **edit-diff** | `edit-diff.ts` | Sửa file bằng diff format |
| **bash** | `bash.ts` | Chạy lệnh terminal |
| **find** | `find.ts` | Tìm file theo pattern |
| **grep** | `grep.ts` | Tìm nội dung trong file |
| **ls** | `ls.ts` | Liệt kê thư mục |

### So sánh tools với Claude Code:

| Chức năng | Pi | Claude Code |
|-----------|-----|------------|
| Đọc file | read | Read |
| Ghi file | write | Write |
| Sửa file | edit, edit-diff | Edit |
| Terminal | bash | Bash |
| Tìm file | find | Glob |
| Tìm nội dung | grep | Grep |
| Liệt kê | ls | (qua Bash) |
| Browser | Không (cần extension) | Có (MCP) |
| Agent con | Không | Agent tool |

---

## Hệ thống Extension — 5 tầng mở rộng

Đây là **điểm khác biệt lớn nhất** của Pi so với các coding agent khác:

### Tầng 1: Extensions (TypeScript modules)
- **Loại**: Module TypeScript được load khi khởi động
- **Khả năng**: Thêm tool mới, command mới, UI component, event handler
- **Ví dụ**: Extension SSH cho phép chạy lệnh trên server remote
- **File**: `src/core/extensions/` (loader.ts, runner.ts, types.ts, wrapper.ts)

### Tầng 2: Skills (Agent Skills)
- **Loại**: Markdown file với hướng dẫn cho AI
- **Gọi bằng**: `/skill:tên-skill` trong chat
- **File**: `src/core/skills.ts`
- **Ví dụ**: `/skill:review-code` → AI đọc code và review

### Tầng 3: Slash Commands
- **Loại**: Lệnh tắt trong chat
- **File**: `src/core/slash-commands.ts`
- **Ví dụ**: `/compact` (nén context), `/export` (xuất HTML)

### Tầng 4: Prompt Templates (Markdown)
- **Loại**: Template câu hỏi có biến
- **File**: `src/core/prompt-templates.ts`
- **Hỗ trợ**: Hot-reload (sửa file → tự động cập nhật, không cần restart)

### Tầng 5: Themes (Giao diện)
- **Loại**: File JSON định nghĩa màu sắc terminal
- **Đường dẫn**: `src/modes/interactive/theme/*.json`
- **Hỗ trợ**: Hot-reload

### Sơ đồ hệ thống extension

```
┌─────────────────────────────────────────┐
│           Pi Coding Agent                │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Tầng 5: Themes (giao diện)        │ │
│  ├────────────────────────────────────┤ │
│  │ Tầng 4: Prompt Templates          │ │
│  ├────────────────────────────────────┤ │
│  │ Tầng 3: Slash Commands            │ │
│  ├────────────────────────────────────┤ │
│  │ Tầng 2: Skills (Markdown)         │ │
│  ├────────────────────────────────────┤ │
│  │ Tầng 1: Extensions (TypeScript)   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Core: read, write, edit, bash,     │ │
│  │       find, grep, ls, edit-diff    │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Cấu trúc thư mục chính

```
packages/coding-agent/src/
├── cli.ts                  # Entry point (binary "pi")
├── core/
│   ├── agent-session.ts    # Quản lý phiên làm việc
│   ├── session-manager.ts  # Lưu/tải session
│   ├── settings-manager.ts # Cài đặt người dùng
│   ├── model-resolver.ts   # Chọn model AI phù hợp
│   ├── model-registry.ts   # Danh sách models
│   ├── system-prompt.ts    # Xây dựng system prompt
│   ├── compaction/         # Nén context khi quá dài
│   │   ├── compaction.ts   # Logic nén
│   │   └── branch-summarization.ts
│   ├── extensions/         # Hệ thống extension
│   │   ├── loader.ts       # Load extension từ file
│   │   ├── runner.ts       # Chạy extension
│   │   └── types.ts        # Kiểu dữ liệu extension
│   ├── tools/              # 8 built-in tools
│   │   ├── bash.ts, read.ts, write.ts, edit.ts, ...
│   │   └── path-utils.ts, truncate.ts
│   ├── skills.ts           # Agent skills
│   ├── slash-commands.ts   # Slash commands
│   ├── prompt-templates.ts # Prompt templates
│   ├── keybindings.ts      # Phím tắt (cấu hình được)
│   ├── event-bus.ts        # Event bus nội bộ
│   ├── export-html/        # Xuất session thành HTML
│   └── auth-storage.ts     # Lưu trữ xác thực
├── modes/
│   └── interactive/        # Chế độ tương tác
│       └── theme/          # Themes JSON
└── index.ts                # Xuất SDK
```

---

## Quản lý Session và Context

### Session
- Mỗi cuộc hội thoại = 1 session
- Session lưu trong thư mục `.pi/sessions/`
- Có thể export thành HTML để chia sẻ

### Context Compaction (Nén context)
- Khi hội thoại quá dài → vượt context window
- Pi tự động **tóm tắt** tin nhắn cũ (compaction)
- Cách nén: "branch summarization" — tóm tắt từng nhánh hội thoại
- File: `src/core/compaction/`

---

## Tóm tắt

Pi coding agent là **"IDE bằng lời nói"** với triết lý tối giản:

| Đặc điểm | Giải thích |
|-----------|-----------|
| **Minimal core** | 8 tools cơ bản, không tính năng thừa |
| **Extensible** | 5 tầng mở rộng (extension → skill → command → template → theme) |
| **Multi-mode** | 4 chế độ (Interactive, Print, RPC, SDK) |
| **Session management** | Lưu/tải/export hội thoại |
| **Context compaction** | Tự nén khi hội thoại quá dài |
| **No lock-in** | Không buộc dùng MCP, permission, hay bất kỳ pattern cố định |

---

*Nguồn: `pi-mono/packages/coding-agent/` — package.json, README.md, src/core/*
*Ngày thu thập: 2026-03-11*
