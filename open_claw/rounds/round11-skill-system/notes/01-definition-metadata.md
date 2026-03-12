# Skill Definition & Metadata
**Round 11: Skill System**

---

## Overview

Trong pi-mono, **skill** là một file Markdown (`SKILL.md`) với YAML frontmatter chứa metadata. Skill cung cấp hướng dẫn chuyên biệt cho agent — khi task của user khớp với mô tả skill, agent sẽ đọc file SKILL.md để biết cách xử lý.

Pi-mono implement [Agent Skills Standard](https://agentskills.io/specification) — một chuẩn mở cho việc định nghĩa skills.

**Source**: `packages/coding-agent/src/core/skills.ts`

---

## Cấu trúc SKILL.md

```markdown
---
name: my-skill
description: Mô tả ngắn về skill — khi nào nên dùng, làm gì. Tối đa 1024 ký tự.
---

# My Skill

## Setup
...

## Usage
...
```

Nội dung Markdown phía dưới frontmatter là tài liệu hướng dẫn mà agent sẽ đọc khi skill được gọi.

---

## Frontmatter Fields

| Field | Bắt buộc | Type | Giới hạn | Mô tả |
|-------|----------|------|----------|-------|
| `name` | Có | string | 1-64 ký tự | Lowercase a-z, 0-9, dấu gạch ngang. **Phải khớp tên thư mục cha**. |
| `description` | Có | string | ≤1024 ký tự | Mô tả skill — dùng để hiển thị trong system prompt và slash command. |
| `license` | Không | string | — | Tên giấy phép hoặc tham chiếu file. |
| `compatibility` | Không | string | ≤500 ký tự | Yêu cầu môi trường. |
| `metadata` | Không | object | — | Key-value tùy ý (author, homepage, v.v.). |
| `allowed-tools` | Không | string | — | Danh sách tool được phê duyệt trước (thử nghiệm), phân tách bằng dấu cách. |
| `disable-model-invocation` | Không | boolean | — | Khi `true`, skill bị ẩn khỏi system prompt — chỉ gọi được qua `/skill:name`. |

---

## Quy tắc đặt tên (Name Validation)

Source: `skills.ts` lines 91-115

1. **Độ dài**: 1-64 ký tự (`MAX_NAME_LENGTH = 64`)
2. **Ký tự hợp lệ**: Chỉ lowercase a-z, số 0-9, dấu gạch ngang
3. **Khớp thư mục**: Name phải khớp chính xác với tên thư mục cha
4. **Gạch ngang**: Không được đầu/cuối, không liên tiếp (`--`)

Hợp lệ: `pdf-processing`, `data-analysis`, `code-review`
Không hợp lệ: `PDF-Processing` (uppercase), `-pdf` (đầu gạch ngang), `pdf--gen` (gạch kép)

**Lưu ý**: Vi phạm tên chỉ tạo **warning** — skill vẫn được load. Chỉ thiếu `description` mới **chặn** load.

---

## Skill Interface (TypeScript)

```typescript
export interface Skill {
  name: string;
  description: string;
  filePath: string;      // Đường dẫn tuyệt đối đến SKILL.md
  baseDir: string;       // Thư mục cha của SKILL.md
  source: string;        // "user" | "project" | "path"
  disableModelInvocation: boolean;
}
```

---

## Validation và Diagnostics

Source: `skills.ts` lines 232-280

Khi load một skill:
1. Parse YAML frontmatter
2. Kiểm tra `description` — **bắt buộc**, tối đa 1024 ký tự → thiếu = **chặn load**
3. Kiểm tra `name` — chuỗi quy tắc ở trên → vi phạm = **warning** (vẫn load)
4. YAML không hợp lệ → **chặn load**
5. Field không quen biết → **bỏ qua** (silent)

Output: `ResourceDiagnostic[]` với type `"warning"` hoặc `"collision"`.

---

## So sánh Skill vs Extension

| Aspect | Skill | Extension |
|--------|-------|-----------|
| Định nghĩa | File `SKILL.md` với YAML frontmatter | TypeScript module export default function |
| Runtime | Không chạy code — agent đọc tài liệu | Chạy trong process agent, đăng ký tools/events |
| Gọi | `/skill:name` hoặc auto qua system prompt | Tự động load khi khởi động |
| Cung cấp | Hướng dẫn, instructions | Tools, commands, shortcuts, event handlers |
| Phân phối | File SKILL.md trong thư mục | npm packages hoặc local TypeScript files |

---

**End of definition & metadata**.
