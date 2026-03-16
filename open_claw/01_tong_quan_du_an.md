# 01. Tổng Quan Dự Án Pi-Mono

## Pi-Mono là gì?

**Pi-Mono** là một bộ công cụ mã nguồn mở (open-source) dùng để xây dựng **AI agent** — những chương trình thông minh có khả năng tự thực hiện các tác vụ như đọc/ghi file, chạy lệnh terminal, và tương tác với các mô hình ngôn ngữ lớn (LLM).

Nói đơn giản: Pi-Mono giống như một **bộ lego** để bạn lắp ráp trợ lý AI riêng — từ trợ lý viết code, đến bot Slack, đến giao diện chat web.

---

## Thông tin cơ bản

| Thông tin | Chi tiết |
|-----------|---------|
| **Tên dự án** | Pi Monorepo |
| **Tác giả** | Mario Zechner (@badlogic) |
| **Giấy phép** | MIT (miễn phí, tự do sử dụng) |
| **Ngôn ngữ** | TypeScript (JavaScript nâng cao) |
| **Nền tảng** | Node.js >= 20.0.0 |
| **Repo** | https://github.com/badlogic/pi-mono |
| **Website** | https://shittycodingagent.ai |
| **Discord** | https://discord.com/invite/3cU7Bz4UPx |
| **Stars** | 22,100+ |
| **Forks** | 2,300+ |
| **Releases** | 169 (phiên bản mới nhất: v0.57.1) |
| **Module system** | ES Modules ("type": "module") |

---

## Tại sao Pi-Mono tồn tại?

Pi-Mono được tạo ra với triết lý **"tối giản nhưng mở rộng được"**:
- Thay vì nhồi nhét tất cả tính năng vào một ứng dụng (như Claude Code hay Cursor), Pi cung cấp những **khối xây dựng nhỏ, chuyên biệt**.
- Người dùng **tự lắp ráp** bộ công cụ phù hợp với nhu cầu riêng.
- Mọi thứ đều có thể mở rộng qua TypeScript — không bị giới hạn bởi framework.

---

## 7 Packages — Làm gì?

Pi-Mono gồm 7 package, mỗi cái đảm nhận một vai trò rõ ràng:

### Tầng nền tảng (Core)

| Package | Tên NPM | Vai trò |
|---------|---------|---------|
| **ai** | @mariozechner/pi-ai | **Lớp giao tiếp LLM thống nhất**. Giống như "phiên dịch viên" giúp nói chuyện với nhiều AI khác nhau (OpenAI, Anthropic, Google, v.v.) bằng cùng một "ngôn ngữ". |
| **agent** | @mariozechner/pi-agent-core | **Bộ điều khiển agent**. Quản lý vòng đời agent: nhận yêu cầu → gọi AI → thực hiện tool → trả kết quả. |

### Tầng giao diện (UI)

| Package | Tên NPM | Vai trò |
|---------|---------|---------|
| **tui** | @mariozechner/pi-tui | **Giao diện terminal**. Thư viện vẽ giao diện trong terminal, mượt mà không bị nhấp nháy. |
| **web-ui** | @mariozechner/pi-web-ui | **Giao diện web**. Bộ component web để tạo giao diện chat AI trên trình duyệt. |

### Tầng ứng dụng (Apps)

| Package | Tên NPM | Vai trò |
|---------|---------|---------|
| **coding-agent** | @mariozechner/pi-coding-agent | **Trợ lý viết code**. CLI terminal giúp bạn code với sự hỗ trợ của AI — đọc file, sửa file, chạy lệnh. |
| **mom** | @mariozechner/pi-mom | **Bot Slack**. Slack bot thông minh, có thể chạy lệnh bash, đọc/ghi file trong workspace. |
| **pods** | @mariozechner/pi-pods | **Quản lý GPU cloud**. CLI để triển khai mô hình AI lên các máy chủ GPU từ xa (DataCrunch, RunPod, Vast.ai). |

---

## Sơ đồ quan hệ giữa các package

```
┌─────────────────────────────────────────────────┐
│                 TẦNG ỨNG DỤNG                   │
│                                                 │
│  coding-agent    mom (Slack)    pods (GPU)      │
│  (CLI viết code) (Bot chat)    (Deploy AI)      │
└───────┬──────────┬──────────────┬───────────────┘
        │          │              │
        v          v              v
┌─────────────────────────────────────────────────┐
│              TẦNG GIAO DIỆN                     │
│                                                 │
│     tui (Terminal UI)    web-ui (Web UI)        │
└───────┬──────────────────┬──────────────────────┘
        │                  │
        v                  v
┌─────────────────────────────────────────────────┐
│                TẦNG NỀN TẢNG                    │
│                                                 │
│  agent (Bộ điều khiển)   ai (Giao tiếp LLM)     │
└─────────────────────────────────────────────────┘
```

---

## Tech Stack (Công nghệ sử dụng)

| Công nghệ | Vai trò | Giải thích đơn giản |
|-----------|---------|---------------------|
| **TypeScript** | Ngôn ngữ chính | JavaScript nhưng có kiểm tra kiểu dữ liệu, ít lỗi hơn |
| **Node.js 20+** | Nền tảng chạy | Môi trường chạy JavaScript ngoài trình duyệt |
| **NPM Workspaces** | Quản lý monorepo | Cho phép nhiều package cùng chung một repo |
| **Biome** | Lint + Format | Kiểm tra và định dạng code tự động |
| **Vitest** | Testing | Chạy test tự động |
| **Husky** | Git hooks | Tự động kiểm tra code trước khi commit |
| **tsgo** | Type checker | Kiểm tra kiểu dữ liệu TypeScript (thay cho tsc) |
| **esbuild** | Bundler | Đóng gói code cho trình duyệt |

---

## Lệnh cơ bản

```bash
npm install          # Cài đặt tất cả dependencies
npm run build        # Build tất cả packages (theo thứ tự phụ thuộc)
npm run check        # Kiểm tra lint, format, types (BẮT BUỘC sau mỗi thay đổi)
./test.sh            # Chạy test
./pi-test.sh         # Chạy pi coding agent từ source
```

---

## Điểm nổi bật so với các công cụ AI khác

| Đặc điểm | Pi-Mono | Giải thích |
|-----------|---------|-----------|
| Mã nguồn mở | MIT License | Ai cũng có thể xem, sửa, và phân phối |
| Modular | 7 packages độc lập | Dùng riêng từng phần hoặc kết hợp |
| Multi-provider | 10+ LLM providers | Không bị khóa vào một nhà cung cấp AI |
| Extensible | TypeScript extensions | Tự viết plugin, không cần chờ tác giả thêm tính năng |
| Đa giao diện | Terminal + Web + Slack | Dùng ở đâu cũng được |

---

## Tóm tắt

Pi-Mono là một **bộ công cụ AI agent mã nguồn mở**, được thiết kế theo triết lý **"nhỏ gọn, chuyên biệt, mở rộng được"**. Với 7 package phân tầng rõ ràng (nền tảng → giao diện → ứng dụng), nó cho phép lập trình viên tạo ra trợ lý AI tùy chỉnh — từ CLI coding agent đến Slack bot đến web chat — mà không bị giới hạn bởi bất kỳ nhà cung cấp AI nào.

---

*Nguồn: Local clone `D:\PROJECT\CCN2\pi-mono` — README.md, package.json, LICENSE*
*Ngày thu thập: 2026-03-11*
