# Câu hỏi Attendees + Gợi ý trả lời — Người A

> **Phạm vi**: Kiến trúc 3 Tiers, Dependency Graph, Extension System
> Câu hỏi không có đáp án: xem [file câu hỏi](qa-nguoi-a-questions.md)

---

## Nhóm 1: Kiến trúc tổng quan

**Q1. Tại sao pi-mono chọn kiến trúc 3 tiers thay vì monolith?**

> **Gợi ý**: 3 lợi ích chính:
> 1. **Tái sử dụng**: `pi-ai` có thể dùng độc lập (ví dụ: build chatbot không cần agent)
> 2. **Thay thế linh hoạt**: Có thể swap toàn bộ UI layer (từ CLI sang web) mà không đụng agent core
> 3. **Test dễ hơn**: Mỗi tier test độc lập, mock tier dưới
>
> Ví dụ thực tế: `pi-mom` (Slack bot) dùng `pi-agent-core` + `pi-ai` nhưng KHÔNG dùng `pi-tui` — chứng minh tính modular.

**Q2. Nếu chỉ muốn dùng pi-ai mà không cần agent, có được không?**

> **Gợi ý**: Được. `pi-ai` là package độc lập, publish trên npm là `@mariozechner/pi-ai`. Chỉ cần `npm install @mariozechner/pi-ai` và dùng trực tiếp API stream/model. Xem example `01-minimal.ts` và `02-custom-model.ts` trong SDK examples.

**Q3. Tại sao lockstep versioning thay vì independent versioning?**

> **Gợi ý**:
> - Các packages phụ thuộc chặt chẽ → version khác nhau dễ gây incompatibility
> - Giảm cognitive load cho maintainer (1 person project — Mario Zechner)
> - Trade-off: Minor fix ở 1 package → bump version tất cả, nhưng chấp nhận được vì repo có 1 maintainer chính

---

## Nhóm 2: Provider & Model

**Q4. Thêm provider mới có khó không?**

> **Gợi ý**: Không quá khó nhờ Provider Registry pattern. Cần:
> 1. Implement interface `Provider` (chủ yếu là `stream()` method)
> 2. Đăng ký vào registry
> 3. Map model names
>
> Hoặc đơn giản hơn: dùng Extension API → `pi.registerProvider()` mà không cần fork repo.

**Q5. ModelRegistry khác gì gọi thẳng OpenAI SDK?**

> **Gợi ý**:
> - OpenAI SDK chỉ gọi được OpenAI models
> - `ModelRegistry` là layer trừu tượng — cùng 1 API `getModel("claude-3.5-sonnet")` hay `getModel("gpt-4o")` đều hoạt động
> - Ví dụ đời thường: ModelRegistry giống ổ cắm đa năng — cắm phích EU hay US đều dùng được

**Q6. Nếu 2 providers cùng có model "gpt-4o"?**

> **Gợi ý**: ModelRegistry resolve theo provider prefix hoặc priority. Có thể chỉ định rõ: `getModel("openai:gpt-4o")` vs `getModel("azure:gpt-4o")`. Cần verify trong source code xem default resolution strategy.

---

## Nhóm 3: Dependencies & Extension

**Q7. Extension override built-in tools — rủi ro bảo mật?**

> **Gợi ý**:
> - Đúng là có rủi ro: extension từ `~/.pi/agent/extensions/` có full access
> - Pi-mono **trust user** — extension do user tự cài, không có marketplace public
> - Khác với VS Code: VS Code có sandbox + permission model, pi-mono thì không
> - Đây là trade-off: flexibility vs security. Pi-mono chọn flexibility vì target user là developer

**Q8. So sánh Extension System pi-mono vs VS Code plugins?**

> **Gợi ý**:
> | Aspect | Pi-mono | VS Code |
> |--------|---------|---------|
> | Discovery | File-based (local dirs) | Marketplace |
> | Sandbox | Không | Có (extension host process) |
> | API | `pi.on()`, `pi.registerTool()` | `vscode.commands`, `vscode.window` |
> | Override | Có thể override built-in | Hạn chế |
> | Scope | Agent behavior, tools, events | UI, editor, language features |

**Q9. Muốn extension load trước skills?**

> **Gợi ý**: Không được theo mặc định — thứ tự cố định trong `DefaultResourceLoader`. Tuy nhiên có thể custom bằng cách tạo `ResourceLoader` riêng (override `DefaultResourceLoader`). Thứ tự cố định là by design để đảm bảo extensions có thể reference skills đã load.

**Q10. Custom provider qua extension vs built-in provider?**

> **Gợi ý**: Về mặt chức năng thì giống nhau — đều implement cùng interface. Khác biệt:
> - Built-in: đi kèm package, maintained bởi core team
> - Extension: user tự maintain, có thể bị lỗi khi upgrade pi-mono
> - Extension provider đăng ký sau built-in → có thể override

---

## Nhóm 4: So sánh & Thực tiễn

**Q11. Pi-mono vs Claude Code — khác nhau kiến trúc?**

> **Gợi ý**: 3 điểm chính:
> 1. **Multi-provider**: Pi-mono hỗ trợ 15+ providers, Claude Code chỉ dùng Claude
> 2. **Open source**: Pi-mono là MIT open source, Claude Code là closed source
> 3. **Extension model**: Pi-mono có Extension API mở, Claude Code có MCP (Model Context Protocol) nhưng hạn chế hơn

**Q12. Ai nên dùng pi-mono SDK?**

> **Gợi ý**:
> - Developer muốn build AI agent custom (không chỉ dùng CLI)
> - Team cần switch giữa nhiều LLM providers (cost optimization, compliance)
> - Người muốn extend/customize deep (vượt quá khả năng của Claude Code / Cursor)

**Q13. Tại sao ít người biết ở Việt Nam?**

> **Gợi ý**: Câu hỏi mở, có thể trả lời:
> - Pi-mono khá mới, community chủ yếu English
> - Target audience là developers nâng cao
> - Chưa có content tiếng Việt (đây chính là lý do project này tồn tại!)

---

## Nhóm 5: Câu hỏi "bẫy"

**Q14. Rate limit → fallback tự động?**

> **Gợi ý**: Cần verify trong source code. Theo hiểu biết hiện tại, `pi-ai` có retry logic nhưng **không tự động fallback sang provider khác**. Đây có thể là feature request hợp lý. Trả lời trung thực nếu chưa chắc: "Tôi chưa verify điểm này trong source code, sẽ kiểm tra và cập nhật sau."

**Q15. Multi-modal handling?**

> **Gợi ý**: `pi-ai` hỗ trợ multi-modal qua message format (image content blocks) — tùy thuộc provider có hỗ trợ không. Cần verify mức độ support trong source code. Không nên đoán — nếu chưa chắc, nói rõ sẽ kiểm tra thêm.
