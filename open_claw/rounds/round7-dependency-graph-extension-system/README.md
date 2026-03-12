# Round 7: Dependency Graph - Extension System
**Mục tiêu**: Hiểu sâu hệ thống Extension của pi-mono: cách extensions discovered, loaded, chúng phụ thuộc vào những gì, và cách chúng mở rộng kiến trúc.

---

## 🎯 Mục tiêu chi tiết

- [ ] Extension discovery paths (global, project, packages)
- [ ] Extension loading mechanism (jiti, runtime)
- [ ] ExtensionAPI: tất cả methods và events
- [ ] Extension lifecycle (load → session_start → events → session_shutdown → reload)
- [ ] Cách extensions phụ thuộc vào các tier (ai, agent-core, tui)
- [ ] Vẽ diagram: extension trong dependency graph
- [ ] Phân tích implications: hot-reload, isolation, security
- [ ] Document extension types (tools, commands, providers, UI)

---

## 📂 Files trong Round này

```
round7-dependency-graph-extension-system/
├── README.md                  (file này)
├── checklist.md               (checklist chi tiết)
├── quiz.md                    (bộ câu hỏi xác nhận hiểu)
├── diagrams/
│   ├── extension-lifecycle.mmd
│   └── extension-dependencies.mmd
├── PROGRESS.md                (tiến độ)
└── notes/
    ├── 01-extension-api.md    (chi tiết ExtensionAPI)
    ├── 02-extension-events.md (tất cả events)
    ├── 03-extension-loading.md (discovery, jiti, hot-reload)
    └── 04-extension-arch.md   (implications, security, best practices)
```

---

## 📚 Sources

- `packages/coding-agent/docs/extensions.md`
- `packages/coding-agent/src/core/extensions/loader.ts`
- `packages/coding-agent/src/core/extensions/types.ts`
- Extension examples: `packages/coding-agent/examples/extensions/`

---

## 🗺️ Diagrams

- Extension lifecycle (states, events)
- Extension dependencies (trong kiến trúc 3-tier)

---

## 📋 Checklist

- [ ] Đọc docs extensions.md tổng thể.
- [ ] Đọc code loader (loader.ts) và types.
- [ ] Liệt kê tất cả ExtensionAPI methods.
- [ ] Liệt kê tất cả event types và khi nào phát.
- [ ] Xác định dependencies của extensions (import từ pi-coding-agent, pi-agent-core, pi-ai, pi-tui).
- [ ] Vẽ mermaid diagrams.
- [ ] Tạo quiz (10-15 câu).
- [ ] Viết notes phân tích.

---

**Tiến độ**: 0% (bắt đầu).
