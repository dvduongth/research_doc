# Round 6: Dependency Graph - Core Dependencies
**Mục tiêu**: Hiểu sâu dependency graph giữa các core packages của pi-mono, cách chúng phụ thuộc vào nhau, và implications cho development.

---

## 🎯 Mục tiêu chi tiết

- [ ] Phân tích package dependencies giữa `pi-ai`, `pi-agent-core`, `pi-coding-agent`.
- [ ] Hiểu direction của dependencies (top-down vs bottom-up).
- [ ] Xác định responsibilities của mỗi package.
- [ ] Kiểm tra cyclic dependencies.
- [ ] Document external dependencies (provider SDKs, utility libs).
- [ ] Vẽ dependency graph (mermaid).
- [ ] Ghi nhận insights về架构 设计.

---

## 📂 Files trong Round này

```
round6-dependency-graph-core/
├── README.md                  (file này)
├── checklist.md               (checklist chi tiết để đánh dấu)
├── quiz.md                    (bộ câu hỏi xác nhận hiểu)
├── diagrams/
│   └── dependency-graph.mmd   (mermaid diagram)
├── PROGRESS.md                (tiến độ, sẽ được update)
└── notes/
    ├── 01-package-deps.md     (chi tiết dependencies từ package.json)
    ├── 02-architecture-insights.md  (phân tích implications)
    └── 03-external-deps.md    (external SDKs và libs)
```

---

## 📚 Sources cần đọc

- `D:\PROJECT\CCN2\pi-mono\packages\ai\package.json`
- `D:\PROJECT\CCN2\pi-mono\packages\agent\package.json`
- `D:\PROJECT\CCN2\pi-mono\packages\coding-agent\package.json`
- `D:\PROJECT\CCN2\pi-mono\packages\tui\package.json`
- README của các packages (nếu cần).

---

## 🗺️ Diagram Plan

Vẽ 3-tier architecture với arrows:

```
[pi-coding-agent] --> [pi-agent-core] --> [pi-ai]
       |                    |               |
       +--> [pi-tui]        +               +--> [provider SDKs]
```

Chi tiết hơn: hiển thị external dependencies bên dưới mỗi package.

---

## 📋 Checklist chính

- [x] Đọc và ghi chú package dependencies.
- [ ] Verify không có cyclic dependencies.
- [ ] Vẽ mermaid diagram.
- [ ] Viết notes phân tích.
- [ ] Tạo quiz (5-10 câu).
- [ ] Cập nhật PROGRESS.

---

**Tiến độ**: 0% (bắt đầu).

---

*File này sẽ update khi tiến độ thay đổi.*
