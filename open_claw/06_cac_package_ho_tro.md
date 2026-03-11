# 06. Các Package Hỗ Trợ — tui, web-ui, mom, pods

## Tổng quan

Ngoài 3 package core (ai, agent, coding-agent), Pi-Mono còn có 4 package hỗ trợ, mỗi cái phục vụ một giao diện hoặc môi trường khác nhau:

```
┌────────────────────────────────────────────┐
│              Pi-Mono Ecosystem              │
│                                             │
│   ┌─────┐  ┌────────┐  ┌─────┐  ┌──────┐ │
│   │ tui │  │ web-ui │  │ mom │  │ pods │  │
│   │     │  │        │  │     │  │      │  │
│   │Term-│  │Trình   │  │Slack│  │GPU   │  │
│   │inal │  │duyệt  │  │Bot  │  │Cloud │  │
│   └─────┘  └────────┘  └─────┘  └──────┘ │
└────────────────────────────────────────────┘
```

---

## 1. pi-tui — Giao diện Terminal

### Giải thích đơn giản
**TUI** (Terminal User Interface) là giao diện đồ họa trong terminal — giống như khi bạn dùng `vim` hay `htop`. Thay vì chỉ hiển thị text dòng lệnh, TUI có **ô nhập liệu**, **nút bấm**, **danh sách chọn**, và **scroll**.

### Thông tin cơ bản

| Thông tin | Chi tiết |
|-----------|---------|
| **Tên NPM** | @mariozechner/pi-tui |
| **Đường dẫn** | `packages/tui/` |
| **Mô tả** | Terminal UI framework with differential rendering |

### Tính năng nổi bật

#### Differential Rendering (Vẽ lại theo sự khác biệt)
- **Vấn đề thông thường**: Khi cập nhật terminal, phải xóa toàn bộ rồi vẽ lại → **nhấp nháy** (flicker)
- **Cách Pi-tui giải quyết**: Chỉ cập nhật **phần thay đổi**, giữ nguyên phần không đổi → **mượt mà, không nhấp nháy**
- **Ví dụ đời thực**: Giống cách Netflix chỉ load phần video mới thay vì tải lại toàn bộ trang

#### Component sẵn có
- **Text Input**: Ô nhập liệu (hỗ trợ Unicode, CJK)
- **Editor**: Trình soạn thảo text
- **Selection List**: Danh sách chọn (lên/xuống)
- **Markdown Renderer**: Hiển thị markdown trong terminal

#### Hỗ trợ CJK (Tiếng Trung, Nhật, Hàn)
- Ký tự CJK chiếm **2 cột** trong terminal (thay vì 1)
- Pi-tui dùng `get-east-asian-width` để tính chính xác độ rộng ký tự
- Không bị lệch hàng khi hiển thị tiếng Việt có dấu

### Dependencies chính
- `chalk` — Tô màu text trong terminal
- `marked` — Parse markdown
- `mime-types` — Nhận dạng loại file
- `get-east-asian-width` — Tính độ rộng ký tự
- `xterm.js` — Terminal emulation (cho testing)

---

## 2. pi-web-ui — Giao diện Web

### Giải thích đơn giản
Pi-web-ui cung cấp **bộ component web** để xây dựng giao diện chat AI trên trình duyệt — giống như bạn tự tạo ChatGPT interface riêng.

### Thông tin cơ bản

| Thông tin | Chi tiết |
|-----------|---------|
| **Tên NPM** | @mariozechner/pi-web-ui |
| **Đường dẫn** | `packages/web-ui/` |
| **Mô tả** | Web components for AI chat interfaces |
| **Tech stack** | mini-lit (web components) + Tailwind CSS v4 |

### Tính năng nổi bật

#### Chat Interface
- Lịch sử tin nhắn (scrollable)
- Streaming support (text xuất hiện từng từ)
- Tool execution display (hiển thị khi AI gọi tool)

#### File Attachment
- Hỗ trợ: PDF, DOCX, XLSX, PPTX, hình ảnh
- Tự động trích xuất text từ file
- Drag & drop

#### Interactive Artifacts
- Chạy HTML/SVG/Markdown trong sandbox
- An toàn: code chạy trong iframe cách ly

#### Lưu trữ dữ liệu
- **IndexedDB**: Lưu sessions, API keys, settings trên trình duyệt
- Không cần server — tất cả chạy local

#### Custom Providers
- Hỗ trợ Ollama, LM Studio, vLLM, OpenAI-compatible
- CORS proxy tự động cho browser

### Dependencies chính
- `@mariozechner/pi-ai` — Gọi LLM
- `@lmstudio/sdk` — LM Studio local
- `ollama` — Ollama local
- `pdfjs-dist` — Đọc PDF
- `docx-preview` — Xem trước Word
- `xlsx` — Đọc Excel
- `lucide` — Icons
- `@tailwindcss/cli` — Styling

---

## 3. pi-mom — Bot Slack

### Giải thích đơn giản
**Mom** là một bot Slack được "điều khiển" bởi AI. Khi bạn @mention nó trong Slack, nó đọc tin nhắn, suy nghĩ, và có thể **chạy lệnh trên server**, **đọc/ghi file**, hoặc **trả lời câu hỏi**.

Điểm đặc biệt: Mom **tự cài đặt** tools cần thiết, **tự quản lý** workspace, không cần setup phức tạp.

### Thông tin cơ bản

| Thông tin | Chi tiết |
|-----------|---------|
| **Tên NPM** | @mariozechner/pi-mom |
| **Đường dẫn** | `packages/mom/` |
| **Mô tả** | Slack bot powered by LLM |

### Kiến trúc

```
Slack Channel
    │
    ▼ @mention / DM
┌────────────────────────────────┐
│            Mom Bot              │
│                                 │
│  ┌──────────────────────────┐  │
│  │ Channel Context Manager   │  │
│  │ (mỗi channel 1 context)  │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │ Coding Agent Runner       │  │
│  │ (pi-coding-agent SDK)     │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │ Docker Sandbox            │  │
│  │ (bash chạy an toàn)      │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

### Tính năng nổi bật

#### Per-Channel Context
- Mỗi Slack channel có **context riêng** (lịch sử hội thoại riêng)
- Lưu trữ: `log.jsonl` (permanent) + `context.jsonl` (cho LLM)

#### Docker Sandbox (An toàn)
- Lệnh bash chạy trong Docker container → cách ly khỏi hệ thống chính
- Nếu bot chạy lệnh sai → chỉ ảnh hưởng container, không ảnh hưởng server

#### Delegated OAuth (Xác thực ủy quyền)
- Mom **không lưu API key** trực tiếp
- Xác thực qua phiên coding-agent riêng → chia sẻ `auth.json`
- An toàn: Bot không bao giờ trực tiếp tiếp xúc credentials

#### Self-Managing (Tự quản lý)
- Tự cài đặt tools cần thiết
- Tự lập trình "skills" (CLI tools riêng) cho workflow
- Tự cấu hình credentials
- Tự duy trì workspace

---

## 4. pi-pods — Quản lý GPU Cloud

### Giải thích đơn giản
**Pods** là công cụ CLI giúp bạn **triển khai mô hình AI lên máy chủ GPU từ xa**. Thay vì phải SSH vào server, cài đặt thủ công, cấu hình vLLM... bạn chỉ cần 1 lệnh.

### Thông tin cơ bản

| Thông tin | Chi tiết |
|-----------|---------|
| **Tên NPM** | @mariozechner/pi-pods |
| **Đường dẫn** | `packages/pods/` |
| **Mô tả** | CLI for managing vLLM deployments on GPU pods |

### Cloud Providers được hỗ trợ

| Provider | Loại | Đặc điểm |
|----------|------|----------|
| **DataCrunch** | GPU cloud | Shared NFS storage |
| **RunPod** | GPU cloud | Pay-per-second |
| **Vast.ai** | GPU marketplace | Giá rẻ, cộng đồng |
| **AWS EC2** | Cloud computing | Enterprise-grade |
| **Self-hosted** | Tự build | Ubuntu + NVIDIA GPU + SSH |

### Tính năng nổi bật

#### Tự động cài đặt vLLM
- SSH vào pod → cài Ubuntu packages → setup vLLM → cấu hình model
- Tối ưu cho tool-calling (Qwen, GPT-OSS, GLM)

#### Multi-model deployment
- Chạy **nhiều model** cùng lúc trên 1 GPU
- Quản lý bộ nhớ GPU thông minh (phân bổ VRAM tự động)

#### OpenAI-compatible API
- Mỗi model deployed tạo endpoint tương thích OpenAI
- Ứng dụng hiện có (dùng OpenAI) chỉ cần đổi URL → dùng model local

#### Agent tích hợp
- Có agent CLI tích hợp để test model ngay sau deploy
- Hỗ trợ JSON output cho tích hợp vào pipeline

---

## Bảng so sánh 4 package

| Tiêu chí | tui | web-ui | mom | pods |
|----------|-----|--------|-----|------|
| **Giao diện** | Terminal | Trình duyệt | Slack | CLI |
| **Đối tượng** | Developer | End user | Team | DevOps |
| **Yêu cầu** | Terminal | Browser | Slack workspace | GPU server |
| **Offline** | Có | Có (local models) | Không (cần Slack) | Không (cần cloud) |
| **Phụ thuộc** | Độc lập | pi-ai | pi-coding-agent | pi-ai |
| **Khi nào dùng** | Xây CLI app | Xây web chat | Team collaboration | Deploy LLM |

---

## Tóm tắt

4 package hỗ trợ mở rộng Pi-Mono ra **mọi môi trường**:

| Package | Một câu tóm tắt |
|---------|-----------------|
| **tui** | Framework terminal mượt mà, không nhấp nháy, hỗ trợ Unicode |
| **web-ui** | Bộ component web cho chat AI, hỗ trợ file và artifacts |
| **mom** | Slack bot tự quản lý, chạy lệnh an toàn trong Docker |
| **pods** | Triển khai model AI lên GPU cloud bằng 1 lệnh |

Cùng với core (ai + agent + coding-agent), 4 package này hoàn thiện **hệ sinh thái Pi-Mono** — từ development (tui, coding-agent) → deployment (pods) → collaboration (mom) → end-user (web-ui).

---

*Nguồn: `pi-mono/packages/` — tui, web-ui, mom, pods (README.md + package.json)*
*Ngày thu thập: 2026-03-11*
