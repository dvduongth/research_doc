# 02. Kiến Trúc Monorepo của Pi-Mono

## Monorepo là gì?

**Monorepo** (mono = một, repo = kho code) là cách tổ chức mà **nhiều dự án con** (packages) cùng nằm trong **một kho code duy nhất**, thay vì mỗi dự án một kho riêng.

**Ví dụ đời thực**: Hãy tưởng tượng một tòa chung cư. Thay vì mỗi căn hộ là một tòa nhà riêng (multi-repo), tất cả căn hộ nằm trong một tòa nhà chung (monorepo). Lợi ích: dùng chung hạ tầng (thang máy, điện, nước), dễ quản lý, và các căn hộ có thể liên lạc nhanh với nhau.

### Ưu điểm monorepo:
- Chia sẻ code dễ dàng giữa các package
- Một lệnh build/test cho tất cả
- Version đồng bộ, không bị xung đột phiên bản

### Nhược điểm:
- Repo lớn hơn
- CI/CD phức tạp hơn
- Cần tooling chuyên biệt

---

## NPM Workspaces — Công cụ quản lý

Pi-Mono dùng **NPM Workspaces** (tính năng có sẵn của npm) để quản lý monorepo, **không dùng** pnpm, Yarn, hay Turborepo.

**Cấu hình** (trong `package.json` gốc):
```json
"workspaces": [
    "packages/*",
    "packages/web-ui/example",
    "packages/coding-agent/examples/extensions/with-deps",
    "packages/coding-agent/examples/extensions/custom-provider-anthropic",
    "packages/coding-agent/examples/extensions/custom-provider-gitlab-duo",
    "packages/coding-agent/examples/extensions/custom-provider-qwen-cli"
]
```

**Giải thích**: NPM tự động liên kết các package với nhau. Khi `agent` cần dùng `ai`, npm tạo một "đường tắt" (symlink) thay vì tải từ internet.

---

## Cấu trúc thư mục

```
pi-mono/
├── .github/           # CI/CD workflows
├── .husky/            # Git hooks (kiểm tra tự động trước commit)
├── .pi/               # Config cho pi tool
├── packages/          # ← 7 packages chính
│   ├── ai/            # Lớp giao tiếp LLM
│   ├── agent/         # Bộ điều khiển agent
│   ├── coding-agent/  # Trợ lý viết code (CLI)
│   ├── mom/           # Bot Slack
│   ├── pods/          # Quản lý GPU cloud
│   ├── tui/           # Giao diện terminal
│   └── web-ui/        # Giao diện web
├── scripts/           # Scripts phát hành, đồng bộ version
├── AGENTS.md          # Quy tắc phát triển (cho cả người và AI)
├── CONTRIBUTING.md    # Hướng dẫn đóng góp
├── package.json       # Config gốc monorepo
├── tsconfig.json      # TypeScript config gốc
├── tsconfig.base.json # Config cơ sở (chia sẻ)
├── biome.json         # Config lint/format
└── pi-test.sh         # Script chạy test
```

---

## Thứ tự Build — Đồ thị phụ thuộc

Các package phải build **theo đúng thứ tự** vì chúng phụ thuộc lẫn nhau:

```
Thứ tự build (từ trái sang phải):

   tui → ai → agent → coding-agent → mom → web-ui → pods
   (1)   (2)   (3)      (4)          (5)    (6)      (7)
```

**Tại sao thứ tự quan trọng?**
- `ai` phụ thuộc `tui` (để hiển thị output) → `tui` phải build trước
- `agent` phụ thuộc `ai` (để gọi LLM) → `ai` phải build trước
- `coding-agent` phụ thuộc `agent` + `ai` + `tui` → build sau cả 3
- `web-ui` cần file `.d.ts` (khai báo kiểu dữ liệu) từ `ai` và `agent`

**Lệnh build** (tuần tự, không song song):
```bash
npm run build
# Thực tế chạy: cd tui && build → cd ai && build → cd agent && build → ...
```

---

## Lockstep Versioning — Đồng bộ phiên bản

Tất cả 7 packages **luôn cùng số phiên bản**. Khi phát hành version mới, tất cả đều lên cùng lúc.

**Ví dụ**: Nếu phát hành v0.57.1 → tất cả packages đều là v0.57.1, dù chỉ `ai` có thay đổi.

**Cách thực hiện**:
```bash
npm run release:patch  # Tăng từ 0.57.1 → 0.57.2 (sửa lỗi nhỏ)
npm run release:minor  # Tăng từ 0.57.1 → 0.58.0 (tính năng mới)
npm run release:major  # Tăng từ 0.57.1 → 1.0.0 (thay đổi lớn)
```

Script tự động: đổi version → cập nhật CHANGELOG → commit → tag → publish → tạo section [Unreleased] mới.

---

## Dev Tooling — Bộ công cụ phát triển

### 1. Biome (Lint + Format)
- **Vai trò**: Kiểm tra code có đúng quy tắc không, tự động sửa format
- **Thay thế**: ESLint + Prettier (Biome nhanh hơn nhiều vì viết bằng Rust)
- **Lệnh**: `biome check --write --error-on-warnings .`

### 2. tsgo (Type Checker)
- **Vai trò**: Kiểm tra kiểu dữ liệu TypeScript
- **Đặc biệt**: Dùng `@typescript/native-preview` (phiên bản thử nghiệm viết bằng Go, nhanh hơn tsc)
- **Lệnh**: `tsgo --noEmit`

### 3. Husky (Git Hooks)
- **Vai trò**: Tự động chạy kiểm tra trước khi commit
- **Ví dụ**: Nếu code có lỗi lint → commit bị chặn

### 4. Vitest (Testing)
- **Vai trò**: Chạy unit test cho từng package
- **Lưu ý**: Test chạy từ thư mục package, không phải root

### 5. esbuild (Browser Smoke Test)
- **Vai trò**: Kiểm tra xem code có chạy được trên trình duyệt không
- **Cách làm**: Bundle toàn bộ code thành 1 file → nếu có lỗi import → thất bại

---

## TypeScript Configuration

### Cấu hình cơ sở (`tsconfig.base.json`)
```
Target: ES2022       → Sử dụng JavaScript hiện đại
Module: Node16       → Hệ thống module của Node.js
Strict: true         → Kiểm tra kiểu nghiêm ngặt
Declaration: true    → Xuất file .d.ts cho các package khác dùng
SourceMap: true      → Hỗ trợ debug
```

### Path Mapping (`tsconfig.json`)
- Cho phép import bằng tên package thay vì đường dẫn tương đối
- Ví dụ: `import { stream } from "@mariozechner/pi-ai"` → trỏ đến `packages/ai/src/index.ts`

---

## AGENTS.md — Quy tắc phát triển

File `AGENTS.md` là bộ quy tắc cho **cả lập trình viên lẫn AI agent**. Những điểm nổi bật:

### Quy tắc code
- **Không dùng `any`** (kiểu dữ liệu "bất kỳ") trừ trường hợp bất khả kháng
- **Không dùng inline imports** (tất cả import phải ở đầu file)
- **Không downgrade code** để sửa lỗi type → phải upgrade dependency thay vào đó

### Quy tắc lệnh (NGHIÊM NGẶT)
- Sau khi sửa code: **BẮT BUỘC chạy `npm run check`**, sửa hết lỗi
- **KHÔNG ĐƯỢC chạy**: `npm run dev`, `npm run build`, `npm test` (trừ khi user yêu cầu rõ)
- **KHÔNG ĐƯỢC commit** trừ khi user yêu cầu

### Quy tắc Git (cho nhiều agent làm song song)
- Chỉ commit file **mình đã sửa**: `git add <file-cụ-thể>` (không dùng `-A` hay `.`)
- **CẤM**: `reset --hard`, `checkout .`, `clean -fd`, `stash`, `--no-verify`
- Xung đột? Chỉ giải quyết file mình sửa, abort nếu xung đột ở file khác

### Quy tắc CHANGELOG
- Mỗi package có `CHANGELOG.md` riêng
- Chỉ sửa phần `[Unreleased]`, **không bao giờ** sửa phiên bản đã phát hành
- Format: Breaking Changes / Added / Changed / Fixed / Removed

### Quy tắc style
- Ngắn gọn, kỹ thuật, không emoji
- Không dùng lời nói thừa: "Thanks @user" thay vì "Thanks so much @user!"

---

## Sơ đồ kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────┐
│                    pi-mono (root)                        │
│  package.json | tsconfig.json | biome.json | AGENTS.md  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────┐  ┌────┐  ┌───────┐  ┌──────────────┐          │
│  │ tui │→→│ ai │→→│ agent │→→│ coding-agent │          │
│  └─────┘  └────┘  └───────┘  └──────────────┘          │
│              │        │              │                   │
│              │        │        ┌─────┘                   │
│              │        │        │                         │
│              v        v        v                         │
│           ┌──────┐ ┌─────┐ ┌──────┐                    │
│           │web-ui│ │ mom │ │ pods │                     │
│           └──────┘ └─────┘ └──────┘                    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  scripts/ | .github/ | .husky/ | test.sh                │
└─────────────────────────────────────────────────────────┘
```

---

## Tóm tắt

Pi-Mono sử dụng **NPM Workspaces** để quản lý 7 packages trong một monorepo. Kiến trúc được thiết kế với:
- **Build tuần tự** theo đồ thị phụ thuộc
- **Lockstep versioning** (tất cả cùng phiên bản)
- **Quy tắc nghiêm ngặt** trong AGENTS.md (cho cả người và AI)
- **Tooling hiện đại**: Biome (Rust), tsgo (Go), Vitest, Husky

Điểm đặc biệt nhất là file `AGENTS.md` — một bộ quy tắc chi tiết cho phép **nhiều AI agent làm việc song song** trên cùng repo mà không xung đột.

---

*Nguồn: `pi-mono/package.json`, `AGENTS.md`, `tsconfig.json`, `tsconfig.base.json`*
*Ngày thu thập: 2026-03-11*
