# 04. Agent Runtime — Package pi-agent-core

## Giải thích cho người mới

### Agent là gì?
**Agent** (tác nhân) là một chương trình có khả năng **tự hành động** — không chỉ trả lời câu hỏi mà còn có thể:
- Đọc/ghi file
- Chạy lệnh terminal
- Tìm kiếm trên web
- Gọi API

Nói đơn giản: Nếu LLM là "bộ não", thì Agent là "bộ não + tay chân" — có thể suy nghĩ VÀ hành động.

### Tool Calling là gì?
**Tool calling** (gọi công cụ) là khi AI yêu cầu thực hiện một hành động cụ thể. Ví dụ:
- AI nghĩ: "Tôi cần đọc file config.json để trả lời" → Gọi tool `readFile("config.json")`
- Hệ thống đọc file → Trả kết quả cho AI → AI trả lời người dùng

---

## Tổng quan Package

| Thông tin | Chi tiết |
|-----------|---------|
| **Tên NPM** | @mariozechner/pi-agent-core |
| **Đường dẫn** | `packages/agent/` |
| **Vai trò** | Bộ điều khiển vòng đời agent |
| **File chính** | `agent-loop.ts` (180 dòng), `types.ts` (195 dòng) |
| **Phụ thuộc** | pi-ai (giao tiếp LLM) |

## Cấu trúc thư mục

```
packages/agent/src/
├── agent-loop.ts    # Vòng lặp chính (dual-loop)
├── types.ts         # Định nghĩa kiểu dữ liệu
├── proxy.ts         # Proxy cho agent orchestration
└── index.ts         # Xuất API công khai
```

---

## Kiến trúc Dual-Loop — "Vòng lặp kép"

Đây là phần **quan trọng nhất** của agent runtime. Agent hoạt động theo 2 vòng lặp lồng nhau:

### Sơ đồ hoạt động

```
Người dùng gửi yêu cầu
        │
        v
┌─ VÒNG NGOÀI (Outer Loop) ──────────────────────────┐
│  Xử lý follow-up messages (tin nhắn bổ sung)       │
│                                                      │
│   ┌─ VÒNG TRONG (Inner Loop) ────────────────────┐  │
│   │                                               │  │
│   │  1. Kiểm tra pending messages                │  │
│   │     (tin nhắn chờ xử lý)                     │  │
│   │          │                                    │  │
│   │          v                                    │  │
│   │  2. Gọi LLM (AI suy nghĩ + trả lời)        │  │
│   │          │                                    │  │
│   │          v                                    │  │
│   │  3. AI có gọi tool không?                    │  │
│   │     ├── CÓ → Thực hiện từng tool            │  │
│   │     │         ├── Sau mỗi tool: kiểm tra     │  │
│   │     │         │   steering messages          │  │
│   │     │         │   (user can thiệp?)          │  │
│   │     │         └── Thu thập kết quả           │  │
│   │     │         → Quay lại bước 1              │  │
│   │     │                                        │  │
│   │     └── KHÔNG → Kết thúc vòng trong          │  │
│   └──────────────────────────────────────────────┘  │
│                                                      │
│   4. Kiểm tra follow-up messages                    │
│      ├── CÓ → Quay lại vòng trong                  │
│      └── KHÔNG → Kết thúc agent                     │
└──────────────────────────────────────────────────────┘
        │
        v
  Agent trả kết quả cho người dùng
```

### Giải thích bằng ví dụ đời thực

Hãy tưởng tượng agent là một **đầu bếp AI** trong nhà hàng:

1. **Vòng trong**: Đầu bếp nhận order → nấu từng món → sau mỗi món kiểm tra "quản lý có thay đổi order không?" (steering) → nấu tiếp hoặc dừng
2. **Vòng ngoài**: Sau khi nấu xong → kiểm tra "có order bổ sung không?" (follow-up) → nếu có thì nấu tiếp

---

## 4 Thành phần chính

### 1. AgentState — Trạng thái agent

```
AgentState {
  systemPrompt    ← Hướng dẫn ban đầu cho AI (ví dụ: "Bạn là trợ lý code")
  model           ← Model AI đang dùng (Claude, GPT-4, ...)
  thinkingLevel   ← Mức suy nghĩ: off / minimal / low / medium / high / xhigh
  tools           ← Danh sách công cụ (đọc file, ghi file, chạy lệnh, ...)
  messages        ← Lịch sử hội thoại
  isStreaming      ← Đang nhận phản hồi từ AI?
  streamMessage   ← Tin nhắn đang được stream
  pendingToolCalls← Các tool đang chờ thực hiện
  error           ← Lỗi (nếu có)
}
```

### 2. AgentTool — Công cụ của agent

Mỗi tool (công cụ) gồm:

```
AgentTool {
  name: "readFile"                ← Tên kỹ thuật
  label: "Đọc file"              ← Tên hiển thị cho người dùng
  description: "Đọc nội dung..." ← Mô tả để AI hiểu khi nào dùng
  parameters: { path: string }   ← Tham số đầu vào (kiểm tra kiểu)
  execute: async (id, params) => ← Hàm thực hiện
    { content: [...], details: ... }
}
```

**Điểm đặc biệt**:
- Tham số được **kiểm tra kiểu** bằng TypeBox (schema validation)
- Nếu tool **thất bại**, lỗi không dừng agent mà được gửi lại cho AI → AI tự **thử lại** hoặc **xử lý khác**

### 3. AgentMessage — Hệ thống tin nhắn mở rộng

Pi-agent cho phép **tự định nghĩa loại tin nhắn riêng** ngoài 3 loại chuẩn (user, assistant, toolResult):

```
AgentMessage = Message (chuẩn LLM)
             + CustomAgentMessages (tùy chỉnh)

Ví dụ mở rộng:
- ArtifactMessage    ← Tin nhắn chứa code/HTML artifact
- NotificationMessage← Tin nhắn thông báo (chỉ hiển thị UI)
- StatusMessage      ← Tin nhắn trạng thái (không gửi cho AI)
```

**Quy tắc chuyển đổi**: Trước khi gửi cho AI, tất cả AgentMessage phải được **chuyển đổi** sang Message chuẩn qua hàm `convertToLlm()`. Tin nhắn UI-only bị **lọc bỏ**.

### 4. Steering & Follow-up — Can thiệp và bổ sung

#### Steering (Can thiệp giữa chừng)
- **Khi nào**: Sau mỗi lần tool thực hiện xong
- **Ví dụ**: User gõ "Dừng lại!" trong khi agent đang chạy → Agent nhận tin → bỏ qua các tool còn lại → xử lý yêu cầu mới
- **Cách hoạt động**: `getSteeringMessages()` được gọi sau mỗi tool execution

#### Follow-up (Bổ sung sau khi xong)
- **Khi nào**: Sau khi agent hoàn thành tất cả
- **Ví dụ**: Queue tin nhắn chờ → agent xong task hiện tại → xử lý tin nhắn tiếp
- **Cách hoạt động**: `getFollowUpMessages()` được gọi khi agent sắp dừng

---

## AgentEvent — Sự kiện vòng đời

Agent phát ra sự kiện ở mọi giai đoạn, giúp UI cập nhật thời gian thực:

```
Dòng thời gian sự kiện:

agent_start                     ← Agent bắt đầu
│
├── turn_start                  ← Lượt mới bắt đầu
│   ├── message_start           ← Tin nhắn bắt đầu (user/assistant)
│   ├── message_update          ← Tin nhắn đang stream (từng từ)
│   ├── message_end             ← Tin nhắn hoàn thành
│   │
│   ├── tool_execution_start    ← Tool bắt đầu chạy
│   ├── tool_execution_update   ← Tool đang chạy (cập nhật tiến độ)
│   ├── tool_execution_end      ← Tool chạy xong
│   │
│   └── turn_end                ← Lượt kết thúc
│
├── turn_start (lượt 2)         ← Lặp lại nếu có tool calls
│   └── ...
│
└── agent_end                   ← Agent kết thúc
    └── messages: [...]         ← Tất cả tin nhắn đã tạo
```

**Ứng dụng**: Giao diện terminal hiển thị loading khi `tool_execution_start`, hiển thị kết quả khi `tool_execution_end`, v.v.

---

## Pipeline chuyển đổi tin nhắn

```
AgentMessage[] (tin nhắn app)
      │
      ▼ transformContext() [tùy chọn]
      │ (ví dụ: cắt bớt tin cũ nếu quá dài)
      │
AgentMessage[] (đã transform)
      │
      ▼ convertToLlm()
      │ (lọc bỏ tin UI-only, chuyển đổi tin custom)
      │
Message[] (tin nhắn chuẩn LLM)
      │
      ▼ Gửi cho LLM
      │
AssistantMessage (phản hồi từ AI)
```

**Tại sao có 2 bước?**
1. `transformContext()`: Thao tác ở mức **ứng dụng** — cắt bớt context, thêm thông tin ngoài
2. `convertToLlm()`: Thao tác ở mức **LLM** — chuyển đổi kiểu dữ liệu

---

## AgentLoopConfig — Cấu hình vòng lặp

```
AgentLoopConfig {
  model               ← Model AI sử dụng
  convertToLlm()      ← [BẮT BUỘC] Hàm chuyển AgentMessage → Message
  transformContext()   ← [Tùy chọn] Biến đổi context trước khi gọi AI
  getApiKey()          ← [Tùy chọn] Lấy API key động (cho OAuth tokens hết hạn)
  getSteeringMessages()← [Tùy chọn] Lấy tin nhắn can thiệp giữa chừng
  getFollowUpMessages()← [Tùy chọn] Lấy tin nhắn bổ sung sau khi xong
  + tất cả StreamOptions (temperature, maxTokens, signal, ...)
}
```

---

## Xử lý lỗi — Self-Correcting

Khi tool thất bại, agent **không dừng** mà tự xử lý:

```
1. Tool "readFile" thất bại (file không tồn tại)
       │
       ▼
2. Lỗi được gói thành ToolResultMessage { isError: true }
       │
       ▼
3. AI nhận lỗi trong context
       │
       ▼
4. AI quyết định:
   ├── Thử lại với đường dẫn khác
   ├── Dùng tool khác
   └── Báo lỗi cho user
```

**Ví dụ đời thực**: Giống GPS khi gặp đường cấm — không dừng lại mà **tìm đường khác**.

---

## So sánh với cách tiếp cận khác

| Đặc điểm | Pi Agent | Cách đơn giản (1 vòng) |
|-----------|---------|------------------------|
| Vòng lặp | Dual-loop (lồng nhau) | Single loop |
| Can thiệp | Steering messages giữa tool | Chờ agent xong mới nói |
| Follow-up | Tự động xử lý tin nhắn chờ | Phải gọi agent mới |
| Lỗi tool | Self-correcting (AI thử lại) | Dừng toàn bộ |
| Custom messages | Mở rộng được | Cố định 3 loại |
| Context transform | 2 bước (transform + convert) | 1 bước |

---

## Tóm tắt

Pi-agent-core là **bộ điều khiển agent** với 5 đặc điểm nổi bật:

| Đặc điểm | Giải thích đơn giản |
|-----------|---------------------|
| **Dual-Loop** | 2 vòng lặp: vòng trong (tool execution) + vòng ngoài (follow-up) |
| **Steering** | User có thể can thiệp giữa chừng khi agent đang chạy |
| **Self-Correcting** | Lỗi tool không dừng agent, AI tự tìm cách xử lý |
| **Extensible Messages** | Tự định nghĩa loại tin nhắn riêng cho ứng dụng |
| **Event-Driven** | Phát sự kiện chi tiết ở mọi giai đoạn, UI cập nhật real-time |

Thiết kế này cho phép xây dựng agent **phản hồi nhanh**, **chống lỗi**, và **tương tác được** — không phải kiểu "gửi đi rồi chờ".

---

*Nguồn: `pi-mono/packages/agent/src/` — agent-loop.ts, types.ts*
*Ngày thu thập: 2026-03-11*
