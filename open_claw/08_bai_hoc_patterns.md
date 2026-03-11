# 08. Bài Học & Design Patterns từ Pi-Mono

## Giải thích cho người mới

### Design Pattern là gì?
**Design pattern** (mẫu thiết kế) là **giải pháp đã được chứng minh** cho các vấn đề thường gặp trong lập trình. Giống như công thức nấu ăn — bạn không cần phát minh lại cách nấu phở mỗi lần, chỉ cần theo công thức đã có.

Pi-Mono sử dụng 5 design patterns chính. Dưới đây em giải thích từng pattern bằng **ví dụ đời thực** rồi mới đi vào kỹ thuật.

---

## 5 Design Patterns chính

### Pattern 1: Provider Registry — "Ổ cắm điện đa năng"

#### Ví dụ đời thực
Hãy tưởng tượng bạn có ổ cắm điện đa năng (travel adapter). Thay vì mua dây sạc riêng cho mỗi quốc gia (Mỹ, Anh, EU, Úc...), bạn cắm adapter → dùng được ở mọi nơi.

#### Trong Pi-Mono
```
Ổ cắm đa năng = Provider Registry
Phích cắm      = LLM Provider (OpenAI, Claude, Gemini, ...)
Thiết bị       = Ứng dụng của bạn

Bạn viết code 1 lần → chạy với bất kỳ LLM nào
```

#### Cách hoạt động
```
1. Đăng ký:  registerApiProvider(anthropicProvider)
2. Sử dụng:  getApiProvider("anthropic-messages")
3. Hủy:      unregisterApiProviders("my-extension")
```

#### Bài học rút ra
- **Tách biệt giao diện khỏi triển khai**: Code sử dụng LLM không cần biết chi tiết từng provider
- **Mở rộng không cần sửa code cũ**: Thêm provider = thêm 1 file + đăng ký
- **Plugin-friendly**: Bên thứ 3 có thể tự viết provider

---

### Pattern 2: Message Polymorphism — "Chuẩn USB-C cho tin nhắn"

#### Ví dụ đời thực
USB-C là chuẩn sạc chung — dù iPhone, Android, laptop đều dùng được. Trước đây mỗi hãng một kiểu sạc riêng → rất phiền.

#### Trong Pi-Mono
```
USB-C           = Message Protocol thống nhất
Thiết bị        = Các loại tin nhắn (user, assistant, toolResult)
Adapter USB     = convertToLlm() chuyển đổi khi cần
```

#### 3 loại tin nhắn chuẩn
```
UserMessage       ← Người dùng gửi (text + hình ảnh)
AssistantMessage  ← AI trả lời (text + suy nghĩ + tool call)
ToolResultMessage ← Kết quả tool (text + hình ảnh + isError)
```

#### Điểm hay: Mở rộng được
- App có thể tự thêm loại tin nhắn riêng (ArtifactMessage, NotificationMessage, ...)
- Tin nhắn custom **chỉ tồn tại trong app**, được lọc bỏ trước khi gửi cho LLM
- Giữ được type-safety (kiểm tra kiểu dữ liệu)

#### Bài học rút ra
- **Thiết kế cho mở rộng**: Discriminated unions cho phép thêm loại mới mà không phá vỡ code cũ
- **Ranh giới chuyển đổi rõ ràng**: AgentMessage → Message chỉ diễn ra ở 1 điểm (LLM boundary)

---

### Pattern 3: Dual-Loop Execution — "Đầu bếp thông minh"

#### Ví dụ đời thực
Đầu bếp trong nhà hàng:
- **Vòng trong**: Nấu từng món trong order → sau mỗi món kiểm tra "quản lý có thay đổi gì không?"
- **Vòng ngoài**: Sau khi nấu xong → kiểm tra "có order mới không?" → nếu có thì nấu tiếp

#### Trong Pi-Mono
```
Vòng trong (Inner Loop):
  AI trả lời → Gọi tool 1 → [Kiểm tra steering] → Gọi tool 2 → [Kiểm tra steering] → ...

Vòng ngoài (Outer Loop):
  Xong tất cả tool → [Kiểm tra follow-up] → Có → Quay lại vòng trong
                                            → Không → Kết thúc
```

#### Tại sao cần 2 vòng?
| Chỉ 1 vòng | 2 vòng (Pi) |
|-------------|------------|
| User phải chờ agent xong mới nói | User can thiệp giữa chừng (steering) |
| Tin nhắn mới phải chờ agent restart | Tin nhắn mới được xử lý liền (follow-up) |
| Lỗi tool = dừng toàn bộ | Lỗi tool = AI tự thử lại |

#### Bài học rút ra
- **Responsive > Batch**: Kiểm tra input giữa các bước, không đợi xong hết
- **Graceful interruption**: Cho phép can thiệp mà không phá vỡ state
- **Self-healing**: Lỗi tool trở thành context cho AI, không phải exception

---

### Pattern 4: First-Class Tools — "Công cụ hạng nhất"

#### Ví dụ đời thực
Trong workshop chuyên nghiệp, mỗi dụng cụ có:
- **Nhãn rõ ràng** (tên + mô tả)
- **Hướng dẫn sử dụng** (parameters với validation)
- **Bảo hành** (error handling — hỏng thì sửa, không vứt cả bộ)

#### Trong Pi-Mono
```
AgentTool {
  name: "readFile"              ← Tên kỹ thuật
  label: "Đọc file"            ← Nhãn cho UI
  description: "Đọc nội dung"  ← Mô tả để AI hiểu
  parameters: TypeBox schema   ← Validation tự động
  execute: async () => ...     ← Hàm thực hiện
}
```

#### Quy trình xử lý lỗi
```
Tool thất bại
    ↓
Gói thành ToolResultMessage { isError: true }
    ↓
AI đọc lỗi trong context
    ↓
AI tự quyết: thử lại / dùng tool khác / báo user
```

#### Bài học rút ra
- **Validation ở mọi tầng**: Schema kiểm tra params trước khi execute
- **Lỗi là thông tin, không phải thảm họa**: Tool error → AI context, không phải crash
- **UI-friendly**: Label và description riêng biệt cho human display

---

### Pattern 5: Event-Driven Updates — "Bảng tin thời gian thực"

#### Ví dụ đời thực
Bảng thông tin sân bay: Bạn không cần hỏi "máy bay tôi ở gate nào?" mỗi phút. Bảng tự cập nhật → bạn chỉ cần nhìn.

#### Trong Pi-Mono
```
Agent phát sự kiện → UI lắng nghe → Cập nhật ngay

agent_start         → Hiện loading
message_update      → Hiện text đang stream
tool_execution_start→ Hiện "Đang đọc file..."
tool_execution_end  → Hiện kết quả
agent_end           → Ẩn loading
```

#### Bài học rút ra
- **Push > Poll**: Agent đẩy sự kiện ra, UI không cần hỏi liên tục
- **Granular events**: Sự kiện chi tiết (13 loại) giúp UI phản ứng chính xác
- **Decoupled**: Agent không biết/quan tâm ai đang lắng nghe

---

## Trade-offs — Đánh đổi trong thiết kế

### Extensibility vs Security (Mở rộng vs An toàn)

```
Pi:          Mở rộng MAX → An toàn tối thiểu
             (không permission, không sandbox built-in)

Claude Code: An toàn MAX → Mở rộng vừa phải
             (permission gates, security rules nghiêm ngặt)
```

**Bài học**: Không có giải pháp hoàn hảo. Chọn dựa trên **đối tượng người dùng**:
- Developer giỏi → ưu tiên mở rộng (Pi)
- Developer phổ thông → ưu tiên an toàn (Claude Code)

### Simplicity vs Features (Đơn giản vs Đầy đủ)

```
Pi:          "Có 8 tool. Muốn thêm? Tự viết extension."
Claude Code: "Có 15+ tool. Không cần tự viết gì."
```

**Bài học**: Simplicity không phải là thiếu — mà là **cố ý bỏ bớt** để giữ core gọn nhẹ.

### Monorepo vs Multi-repo

```
Pi (monorepo):  7 packages cùng 1 repo → dễ quản lý, nhưng repo lớn
Multi-repo:     Mỗi package 1 repo → linh hoạt, nhưng khó đồng bộ
```

**Bài học**: Monorepo phù hợp khi packages **phụ thuộc chặt chẽ** lẫn nhau (như Pi-Mono).

---

## Ứng dụng cho dự án khác

### Áp dụng cho CCN2 (Dự án Board Game)

| Pattern Pi-Mono | Ứng dụng cho CCN2 |
|----------------|-------------------|
| **Provider Registry** | Config loaders: đăng ký/lookup config theo loại game |
| **Message Protocol** | Event system: thống nhất format event giữa client-server |
| **Dual-Loop** | Game loop: vòng trong (xử lý action) + vòng ngoài (check game state) |
| **First-Class Tools** | Action system: mỗi action có validation + error recovery |
| **Event-Driven** | UI updates: server push events → client render |

### Áp dụng cho dự án web/app

| Pattern | Ứng dụng |
|---------|---------|
| **Provider Registry** | Database adapter (PostgreSQL, MySQL, SQLite cùng interface) |
| **Message Protocol** | API response format thống nhất (REST, GraphQL cùng schema) |
| **Dual-Loop** | Real-time app: vòng trong (xử lý request) + vòng ngoài (check webhooks) |
| **Event-Driven** | WebSocket notifications |

---

## 10 Bài học quan trọng nhất

| # | Bài học | Ví dụ từ Pi-Mono |
|---|---------|-----------------|
| 1 | **Tách interface khỏi implementation** | Provider Registry tách AI code khỏi provider code |
| 2 | **Thiết kế cho mở rộng từ đầu** | Extension system 5 tầng, CustomAgentMessages |
| 3 | **Lỗi là context, không phải crash** | Tool error → AI tự retry, không dừng agent |
| 4 | **Push events, đừng poll** | AgentEvent stream → UI lắng nghe |
| 5 | **Validate ở mọi ranh giới** | TypeBox schemas cho tools, wrapStream kiểm tra API match |
| 6 | **Tối giản core, mở rộng periphery** | 8 tools core + extension system |
| 7 | **Lockstep versioning cho monorepo** | Tất cả packages cùng version |
| 8 | **AGENTS.md cho AI collaboration** | Quy tắc rõ ràng để nhiều AI agents làm song song |
| 9 | **Streaming-first, not batch** | text_delta events cho real-time UX |
| 10 | **Chuyển đổi ở ranh giới rõ ràng** | AgentMessage → Message chỉ ở LLM call boundary |

---

## Tóm tắt

Pi-Mono dạy chúng ta rằng một hệ thống AI agent tốt cần:
1. **Abstraction layer** mạnh (Provider Registry)
2. **Message protocol** thống nhất nhưng mở rộng được
3. **Execution model** có khả năng interrupt và self-heal
4. **Tool system** với validation và error recovery
5. **Event streaming** cho real-time UI

Và quan trọng nhất: **biết khi nào KHÔNG thêm tính năng** — đó là sức mạnh thật sự của thiết kế tối giản.

---

*Tổng hợp từ phân tích source code pi-mono (local clone)*
*Ngày: 2026-03-11*
