# Round 2: AI Layer - Bộ câu hỏi xác nhận hiểu
**Dựa trên `ai-layer-checklist.md`**

Hướng dẫn: Trả lời các câu hỏi sau bằng tiếng Việt, giải thích ngắn gọn. Nếu bạn hiểu rõ, bạn có thể trả lời tự tin. Nếu chưa chắc, xem lại notes.

---

## ✅ Model System

**Q1**: Giải thích sự khác biệt giữa `getModel(provider, id)` và `getModels(provider)`? Khi nào dùng cái nào?

**Q2**: `ModelRegistry` cache models như thế nào? Custom models từ `models.json` được load khi nào?

**Q3**: Một `Model` có những trường bắt buộc nào? Ví dụ: `id`, `name`, `api`, `provider`, `reasoning`, `input`, `cost`...

**Q4**: `compat` field dùng để làm gì? Khi nào bạn cần set `compat`?

---

## ✅ Streaming API

**Q5**: Liệt kê tất cả event types trong `stream()` (ít nhất 8 loại).

**Q6**: Trong `toolcall_delta` event, tại sao `event.partial.content[contentIndex].arguments` có thể thiếu fields? Làm sao để xử lý an toàn?

**Q7**: Cách dùng `AbortController` để hủy request? Khi request bị hủy, `stopReason` là gì?

**Q8**: `streamSimple` khác gì với `stream`? Khi nào dùng `streamSimple`?

---

## ✅ Complete API

**Q9**: `complete()` trả về gì? `AssistantMessage` có cấu trúc như thế nào?

**Q10**: Khi dùng `completeSimple()` với option `{ reasoning: 'high' }`, điều gì xảy ra với model không hỗ trợ reasoning?

---

## ✅ Tool Calling

**Q11**: Tool definition cần những trường nào? Tại sao dùng `StringEnum` thay vì `Type.Enum`?

**Q12**: `validateToolCall(tools, toolCall)` làm gì? Khi nào bạn cần gọi nó (nếu tự viết loop)?

**Q13**: Tool result `ToolResultMessage` có những trường gì? `isError` dùng để làm gì?

**Q14**: Tool có thể stream progress qua `onUpdate`? Hãy mô tả flow.

---

## ✅ Thinking/Reasoning

**Q15**: Kiểm tra model có hỗ trợ reasoning bằng cách nào? Có thể override `reasoning` flag không?

**Q16**: Cách bật reasoning cho OpenAI (Responses API) khác gì với Anthropic?

**Q17**: Trong cross-provider handoff, thinking block của Claude khi gửi sang GPT trở thành gì?

---

## ✅ Providers

**Q18**: Thứ tự auth resolution là gì? Nếu bạn set cả env var và `auth.json`, cái nào được dùng?

**Q19**: Làm sao để thêm custom provider (ví dụ Ollama) vào pi-ai?

**Q20**: Bạn có thể override built-in provider (ví dụ Anthropic) bằng cách nào (giữ models nhưng đổi endpoint)?

---

## ✅ Error Handling

**Q21**: Phân biệt `stopReason: 'error'` và `'aborted'`. Khi nào mỗi cái xảy ra?

**Q22**: Sau khi request bị abort, bạn có thể tiếp tục conversation không? Làm thế nào?

**Q23**: `onPayload` callback dùng để làm gì? Ví dụ use case.

---

## ✅ Cost Tracking

**Q24**: `Usage` object có những trường nào? `cost` được tính như thế nào?

**Q25**: `cacheRead` và `cacheWrite` là gì? Khi nào chúng xuất hiện?

---

## ✅ Cross-Provider Handoff

**Q26**: Khi chuyển từ Claude sang GPT, assistant message của Claude có thinking block sẽ được transform thành gì?

**Q27**: Tất cả providers đều có thể xử lý tool calls từ provider khác không? Có cần transform gì không?

---

## ✅ Compatibility

**Q28**: `OpenAICompletionsCompat` có những flag quan trọng nào? Ví dụ: `supportsStore`, `supportsDeveloperRole`, `maxTokensField`.

**Q29**: Khi nào bạn cần đặt `compat.requiresThinkingAsText = true`?

**Q30**: Auto-detection dựa trên `baseUrl` hoạt động thế nào? Khi nào nên override `compat` thủ công?

---

## 🔧 Code Understanding

**Q31**: Đọc đoạn code sau, giải thích flow:

```typescript
const s = stream(model, context, {
  signal: controller.signal,
  onPayload: (p) => console.log(p)
});
for await (const e of s) {
  if (e.type === 'toolcall_delta') console.log(e.partial.content[e.contentIndex].arguments);
}
const final = await s.result();
```

**Q32**: Làm thế nào để set custom token budget cho thinking trên OpenAI?

**Q33**: Khi dùng `completeSimple(model, ctx, { reasoning: 'medium' })` với model là `gpt-5.2-codex`, reasoning level đó được map như thế nào?

---

**Lời nhắn**: Nếu bạn trả lời được ít nhất 25/33 câu, bạn đã hiểu Round 2 tốt! Ghi lại câu trả lời vào file `round2-answers.md` để lưu trữ.

---

*Bộ câu hỏi này được tạo để xác nhận kiến thức. Sau khi hoàn thành, hãy cập nhật checklist với [x] và đánh giá độ tự tin của bạn.*