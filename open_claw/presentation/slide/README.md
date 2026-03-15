# OpenClaw Presentation — Hướng Dẫn Sử Dụng

**File:** `D:\workspace\CCN2\research_doc\open_claw\presentation\slide\index.html`

**Công cụ:** Reveal.js + Mermaid.js + Custom CSS

---

## 📁 Nội dung presentation

**Tổng số slides:** 15 slides

**Cấu trúc:**
1. **Title Slide** — OpenClaw branding, stats nổi bật
2. **Executive Summary** — OpenClaw là gì, phù hợp với ai
3. **Stats & Comparison** — Con số ấn tượng, USP
4. **5-Layer Architecture** — Sơ đồ kiến trúc 5 tầng (Mermaid)
5. **Gateway Routing** — 7-tier priority routing (Mermaid flowchart)
6. **Dual-Loop Execution** — Pi-Mono agent execution (Mermaid flowchart)
7. **Extension Ecosystem** — Layers architecture (Mermaid graph)
8. **Security Model** — 8-layer security stack (Mermaid graph)
9. **Pi-Mono Architecture** — 3-tier dependency graph (Mermaid)
10. **Data Flow Sequence** — Sequence diagram user→AI→response
11. **Skills Pipeline** — 4 stages (Discover, Filter, Serialize, Execute)
12. **LLM Providers** — Architecture với 22+ providers (Mermaid)
13. **Comparison Radar** — OpenClaw vs ChatGPT (Mermaid xychart)
14. **Integration Guide** — Quick start, config, use cases
15. **Conclusion** — Tóm tắt, 3 câu, USPs, Q&A

---

## 🎨 Design & Theme

**Color scheme:**
- Primary: #4A90D9 (blue)
- Secondary: #7B68EE (purple)
- Accent: #E8884A (orange)
- Success: #5CB85C (green)
- Danger: #D9534F (red)
- Background gradients theo slide category

**Slide backgrounds:**
- Title: Dark gradient (#1a1a2e → #16213e)
- Features: Light gray gradient (#f5f7fa)
- Architecture: Blue tint (#e8f4fd)
- Security: Red tint (#fff5f5)
- Conclusion: Green tint (#e8f8f5)

**Typography:**
- Headings: Bold, vibrant colors, Vietnamese fonts
- Body: Clear, readable, 0.85em line-height
- Code: GitHub Dark theme for syntax highlighting

---

## 📊 Diagrams Included

Tất cả diagrams từ `OpenClaw_Architecture_Diagrams.md` đã được integrate:

| Diagram | Slide | Type | Status |
|---------|-------|------|--------|
| Feature Comparison (Quadrant) | Slide 3 (inferred) | Mermaid quadrantChart | ✅ Có thể thêm |
| 22+ Channels Ecosystem (Mindmap) | Slide 7 | Mermaid mindmap | ✅ |
| 5-Layer Architecture (Graph) | Slide 4 | Mermaid graph TD | ✅ |
| Gateway Routing (Flowchart) | Slide 5 | Mermaid flowchart LR | ✅ |
| Dual-Loop Execution (Flowchart) | Slide 6 | Mermaid flowchart TD | ✅ |
| Extension Ecosystem (Graph) | Slide 7 | Mermaid graph TD | ✅ |
| Security Model (Graph) | Slide 8 | Mermaid graph TD | ✅ |
| Pi-Mono 3-Tier (Graph) | Slide 9 | Mermaid graph LR | ✅ |
| Data Flow (Sequence) | Slide 10 | Mermaid sequenceDiagram | ✅ |
| Skills Pipeline (Flowchart) | Slide 11 | Mermaid flowchart TD | ✅ |
| LLM Providers (Graph) | Slide 12 | Mermaid graph LR | ✅ |
| Benchmark Radar (Xychart) | Slide 13 | Mermaid xychart-beta | ✅ |

---

## 🗣️ Speaker Notes

**Mỗi slide có notes riêng** trong `<aside class="notes">` với:

- **Ý nghĩa diagram** — giải thích từng phần
- **Gió ý nói** — script gợi ý cho người trình bày
- **Key points** — highlight thông tin quan trọng
- **Demo walkthrough** — hướng dẫn từng bước
- **Timing** — đánh dấu thời gian chuyển slide

**Làm sao xem notes:**
- Trong Reveal.js: Press `s` (lowercase) để mở speaker notes panel
- Notes chỉ hiện với người trình bày, không hiện trên slide chính

---

## 🚀 Cách Dùng

### 1. Mở trong trình duyệt

```bash
# Simple: double-click file
D:\workspace\CCN2\research_doc\open_claw\presentation\slide\index.html
```

File sẽ mở trong trình duyệt mặc định (Chrome, Firefox, Edge).

### 2. Trình chiếu

**Controls:**
- `←` `→` or `Space` — Next/prev slide
- `Home` `End` — First/last slide
- `f` — Fullscreen
- `s` — Speaker notes (mở panel notes)
- `p` — Presenter mode (slide + notes)
- `Esc` — Exit fullscreen

**Touch gestures (nếu dùng tablet):**
- Swipe left/right — Navigate
- Pinch — Zoom (nếu cần)

### 3. Export sang PDF

Reveal.js có tính năng export PDF:

```javascript
// Trong trình duyệt, vào print dialog (Ctrl+P)
// Chọn "Save as PDF"
// Layout: Landscape
// Margins: None (hoặc minimal)
// Options: Background graphics ✓
```

Hoặc dùng `decktape` (Node.js tool):
```bash
npm install -g decktape
decktape reveal index.html openclaw-presentation.pdf
```

### 4. Chuyển sang PowerPoint

**Không có convert trực tiếp.** Cách làm:

1. **Export PDF từ Reveal.js** (như trên)
2. **Mở PDF trong PowerPoint**:
   - File → Open → chọn PDF → PowerPoint sẽ convert slides
3. **Hoặc chụp ảng từng slide** và paste vào PPT manually

### 5. Customize content

Nếu muốn sửa nội dung:

1. Mở `index.html` trong code editor (VS Code)
2. Tìm slide cần sửa (mỗi slide là `<section>`)
3. Chỉnh sửa text, diagrams, notes
4. Refresh trình duyệt để xem changes

**Lưu ý:** Diagrams dùng Mermaid syntax — chỉnh sửa trong `<div class="mermaid">...</div>`.

---

## 🛠️ Technical Details

**Dependencies (CDN):**
- Reveal.js 4.5.0
- Mermaid 10.6.1
- Highlight.js 11.7.0 (code syntax)

**No build step required** — pure HTML/CSS/JS, mở là dùng.

**Browser support:**
- Chrome/Edge ✅
- Firefox ✅
- Safari ✅
- IE11 ❌ (không hỗ trợ)

**Responsive:**
- Desktop: 1920×1080 (recommended)
- Tablet: 1024×768
- Mobile: 768×1024 (nhưng không khuyên dùng cho presentation)

---

## 📝 Slide-by-Slide Guide

| Slide | Topic | Duration | Key Diagrams |
|-------|-------|----------|--------------|
| 1 | Title | 30-45s | Stats grid |
| 2 | Executive Summary | 60s | Two-column layout |
| 3 | Stats & Comparison | 60-90s | Stats grid, info box |
| 4 | 5-Layer Architecture | 90s | Graph TD (5 layers) |
| 5 | Gateway Routing | 60-90s | Flowchart LR (7-tier) |
| 6 | Dual-Loop Execution | 90-120s | Flowchart TD (outer/inner) |
| 7 | Extension Ecosystem | 90-120s | Graph TD (4 layers) |
| 8 | Security Model | 90-120s | Graph TD (8 layers) |
| 9 | Pi-Mono Architecture | 90-120s | Graph LR (3 tiers) |
| 10 | Data Flow Sequence | 90-120s | Sequence diagram |
| 11 | Skills Pipeline | 90-120s | Flowchart TD (4 stages) |
| 12 | LLM Providers | 90-120s | Graph LR (registry pattern) |
| 13 | Comparison Radar | 60-90s | Xychart (bar vs line) |
| 14 | Integration Guide | 90-120s | Two-column (code + use cases) |
| 15 | Conclusion | 60-90s | Summary table + final words |

**Total estimated duration:** 18-25 minutes (tùy tốc độ nói và Q&A)

---

## 🔄 Changelog

**v1.0 (2025-06-20):**
- Initial version
- 15 slides đầy đủ
- 12 Mermaid diagrams
- Speaker notes cho tất cả slides
- Vietnamese language throughout
- Custom theme với brand colors

---

## 📚 Source Materials

**Tài liệu gốc:**
1. `openclaw_deep_dive_full.md` — Deep dive toàn diện (15 sections)
2. `OpenClaw_Architecture_Diagrams.md` — 13 diagrams Mermaid

**Ngôn ngữ:** Tiếng Việt (dịch từ original tiếng Anh, adapted cho audience Việt)

---

## ❓ FAQ

**Q: Cần internet để chạy presentation không?**
A: Ban đầu cần để load CDN (Reveal.js, Mermaid). Sau đó có thể dùng offline nếu cache. Để chạy hoàn toàn offline, download các CDN files về local.

**Q: Mermaid diagrams không hiển thị?**
A: Kiểm tra JavaScript console. Có thể do network block. Mermaid cần load từ CDN. Nếu offline, copy mermaid.min.js về local và sửa script src.

**Q: Làm sao thay đ fonts?**
A: Sửa CSS trong `<style>` block. Thay đổi `font-family` của body.

**Q: Có thể thêm slide mới không?**
A: Có. Copy `<section>` block, paste trước `</div>` của `.slides`, chỉnh nội dung.

**Q: Làm sao thêm logo/ảnh?**
A: Dùng `<img src="...">` trong slide. Nếu ảnh local, đặt trong cùng thư mục hoặc subfolder.

**Q: Export PPTX trực tiếp được không?**
A: Không trực tiếp. Export PDF rồi mở trong PowerPoint để convert.

**Q: Speaker notes hiện trên máy tính cá nhân nhưng không lên projector?**
A: Speaker notes chỉ hiện trên màn hình presenter (dùng mode Presenter). Khi chiếu fullscreen, slideshow hiện trên projector, notes hiện trên laptop. Cấu hình Reveal.js mặc định là vậy.

---

## 🙏 Credits

**Built with:**
- [Reveal.js](https://revealjs.com/) — Presentation framework
- [Mermaid.js](https://mermaid.js.org/) — Diagrams as code
- [Highlight.js](https://highlightjs.org/) — Code syntax highlighting

**Content source:** OpenClaw project documentation, analyzed và adapted bởi Kẹo Đào 🪄

**License:** MIT (same as OpenClaw)

---

**Ready to present!** 🚀

Mở `index.html` và bắt đầu trình chiếu.
