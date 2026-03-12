# Extension System - Quiz

---

## Câu hỏi

**Q1**: Extension được discover từ những đâu? Liệt kê đầy đủ paths.

**Q2**: Extension được load bằng công cụ nào? (jiti) Tại sao dùng jiti?

**Q3**: Khi nào event `session_start` được phát? Extension nào nhận event này?

**Q4**: ExtensionAPI có method nào để đăng ký custom tool? Tool definition cần những trường bắt buộc nào?

**Q5**: Làm thế nào để extension gửi một message vào session? `pi.sendMessage()` vs `pi.sendUserMessage()` khác nhau thế nào?

**Q6**: Extension có thể override built-in tool không? Làm thế nào?

**Q7**: Event `tool_call` được phát khi nào? Extension có thể block tool execution không? Làm thế nào?

**Q8**: Extension context (`ExtensionContext`) cung cấp `ctx.ui`. Khi nào `ctx.hasUI` là false?

**Q9**: Extension state nên lưu ở đâu để hỗ trợ branching? Giải thích.

**Q10**: Hot reload (`/reload`) làm gì với extensions? Cũng phát những event nào?

**Q11**: Extension có thể đăng ký command không? Command handler nhận context gì?

**Q12**: `pi.events` dùng để làm gì? Ví dụ use case.

**Q13**: Extension có thể register provider mới không? Cách làm?

**Q14**: Đâu là differences giữa `steer` và `followUp`? Extension có thể trigger các loại message đó không?

**Q15**: Extension có thể access model và API key không? Qua đâu?

---

## Đáp án (cheat sheet)

1. global `~/.pi/agent/extensions/`, project `.pi/extensions/`, packages, additional paths trong settings.
2. jiti: runtime TypeScript loader, allow extensions viết bằng TS mà không compile.
3. Sau khi session manager được tạo, trước khi bất kỳ agent run nào. C extensions nhận.
4. `pi.registerTool(toolDef)`. Bắt buộc: name, label, description, parameters (Type.Object), execute.
5. `pi.sendMessage()` gửi custom message (có customType). `pi.sendUserMessage()` gửi user message (role user). Đều có thể trigger turn tùy option.
6. Có, bằng cách `pi.registerTool()` với cùng name. Có thể wrap built-in tool.
7. Trước khi tool execute. Có, return `{ block: true, reason: "..." }`.
8. `ctx.hasUI` false trong print mode (`-p`) và JSON mode. True trong interactive và RPC.
9. Nên lưu state trong tool result `details`. Reconstruct từ session entries khi `session_start`.
10. `/reload` unload extensions cũ (phát `session_shutdown`), load lại tất cả, phát `session_start`, `resources_discover` với reason "reload".
11. Có, `pi.registerCommand(name, { description, handler, getArgumentCompletions })`. Handler nhận `(args, ctx)` với `ExtensionCommandContext` (có thêm session control methods).
12. `pi.events` là event bus để extensions communicate. Ví dụ: extension A emit event, extension B on.
13. Có, `pi.registerProvider(name, config)` với baseUrl, apiKey, api, models, oauth...
14. `steer`: interrupt ngay (deliver after current tool, skip remaining). `followUp`: wait until idle. Extension có thể gọi `pi.sendUserMessage(..., { deliverAs: "steer" })` hoặc `"followUp"`.
15. Có, qua `ctx.modelRegistry` và `ctx.model`. Hoặc `pi.setModel()`, `pi.getThinkingLevel()`.

---

**Lưu ý**: Quiz này dài 15 câu, bao phủDiscovery, Loading, API, Events, Tools, UI, State, Commands, Providers.
