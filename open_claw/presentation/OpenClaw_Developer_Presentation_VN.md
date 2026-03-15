# OpenClaw — Buổi Thuyết Trình Kỹ Thuật Cho Developer
> **Chủ đề**: Tại sao OpenClaw nổi bật, kiến trúc hoạt động thế nào, và vai trò của Pi-Mono.
> **Đối tượng**: Developer team.
> **Thời lượng**: ~35–45 phút nội dung + 10–15 phút Q&A.
> **Ngày**: Tháng 3/2026

---

## PHẦN MỞ ĐẦU — Hook

> *"Hãy tưởng tượng bạn nhận tin nhắn WhatsApp lúc 2 giờ sáng — AI đang chủ động thông báo kết quả deploy vừa chạy xong, đồng thời đang xử lý 3 channel Telegram khác nhau với 3 agent chuyên biệt, và toàn bộ dữ liệu không rời khỏi máy của bạn. Đó là OpenClaw."*

**OpenClaw là gì?**
- Tên chính thức: **OpenClaw — Personal AI Assistant Gateway**
- Self-hosted AI gateway chạy trên máy người dùng
- Kết nối AI với các kênh nhắn tin đang dùng hàng ngày
- License: **MIT** (miễn phí, open source hoàn toàn)
- Version mới nhất: 2026.3.11

**Vision (trích từ VISION.md của dự án):**
> "OpenClaw is the AI that actually does things. It runs on your devices, in your channels, with your rules."

---

---

## PHẦN 1: TẠI SAO OPENCLAW NỔI BẬT?

### 1.1 Con Số Ấn Tượng

| Chỉ số | Giá trị |
|--------|---------|
| Kênh nhắn tin hỗ trợ | **22+** (WhatsApp, Telegram, Discord, Zalo, iMessage...) |
| LLM providers | **22+** (Claude, GPT, Gemini, Llama, Grok, DeepSeek...) |
| Extensions sẵn có | **~40** extensions |
| Built-in skills | **52** skills |
| GitHub stars (Pi-Mono core) | **22,100+** |
| License | **MIT** |

---

### 1.2 Bảng So Sánh Tổng Quan

| Tiêu chí | **OpenClaw** | ChatGPT | Claude.ai | Siri | Gemini |
|----------|:-----------:|:-------:|:---------:|:----:|:------:|
| Self-hosted | ✅ **Bắt buộc** | ❌ | ❌ | ❌ | ❌ |
| Số kênh nhắn tin | ✅ **22+** | 1 | 1 | 2 | 3 |
| LLM providers | ✅ **22+** | 1 | 1 | 1 | 1 |
| Model failover tự động | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cron / Webhook | ✅ | ❌ | ❌ | Hạn chế | ❌ |
| Browser control | ✅ (Chrome CDP) | ❌ | ❌ | ❌ | ❌ |
| Agent-to-Agent routing | ✅ | ❌ | ❌ | ❌ | ❌ |
| Shell execution | ✅ (allowlist) | ❌ | ❌ | ❌ | ❌ |
| Zalo support | ✅ **Duy nhất** | ❌ | ❌ | ❌ | ❌ |
| MCP support | ✅ (mcporter) | ❌ | ✅ native | ❌ | ❌ |
| Chi phí | **Miễn phí + API** | $0–$200/tháng | $0–$20/tháng | Miễn phí | $0–$20/tháng |
| License | **MIT Open** | Độc quyền | Độc quyền | Độc quyền | Độc quyền |

---

### 1.3 Radar Chart — Điểm Mạnh/Yếu (thang điểm 1–10)

```
                     Quyền riêng tư
                           9
                    _____|_____
                   /     |     \
    Kênh nhắn tin 9      |      2  Trợ lý cảm xúc
                 /       |       \
               /    OpenClaw      \
LLM linh hoạt 9         |         4  Hệ sinh thái
               \         |        /
                \         |      /
    Tự động hóa  8        |   3  Tiện dùng
                 \________|____/
                         7
                      Chi phí thấp
```

| Tiêu chí | **OpenClaw** | ChatGPT | Claude | Siri | Gemini |
|----------|:-----------:|:-------:|:------:|:----:|:------:|
| Quyền riêng tư | **9** | 3 | 4 | 7 | 2 |
| Kênh nhắn tin | **9** | 2 | 2 | 3 | 3 |
| LLM linh hoạt | **9** | 3 | 2 | 1 | 2 |
| Tự động hóa | **8** | 2 | 2 | 4 | 3 |
| Khả năng mở rộng | **8** | 5 | 4 | 2 | 4 |
| Chi phí thấp | 7 | 5 | 5 | **9** | 7 |
| Tiện dùng | 3 | **9** | 8 | **9** | 8 |
| Hệ sinh thái | 4 | **9** | 7 | **9** | **9** |

**Nhận xét**: OpenClaw dẫn đầu về privacy, multi-channel, LLM flexibility và automation — nhưng cần technical knowledge để setup.

---

### 1.4 USP #1: Zalo — Không Ai Làm Được

```
Các AI khác → Telegram, WhatsApp, Discord ✅
OpenClaw    → Telegram, WhatsApp, Discord ✅ + Zalo + Zalo Personal ✅✅
```

Duy nhất hỗ trợ Zalo cá nhân lẫn Zalo doanh nghiệp — không có đối thủ trực tiếp trong ngách này.

---

### 1.5 Danh Sách 22+ Kênh Hỗ Trợ

| Nhóm | Kênh |
|------|------|
| **Messaging** | WhatsApp, Telegram, Discord, Signal, Slack, Microsoft Teams |
| **Việt Nam** | **Zalo Business**, **Zalo Personal** |
| **Châu Á** | LINE (Nhật/Thái/ĐL), Feishu (TQ), WeChat |
| **Self-hosted** | Matrix, Mattermost, Nextcloud Talk, Synapse |
| **Decentralized** | Nostr, Tlon/Urbit |
| **Streaming** | Twitch |
| **Legacy** | IRC |
| **Web** | WebChat (nhúng website) |
| **Native Apps** | macOS, iOS (TestFlight beta), Android |
| **Social** | iMessage (cần thiết bị Apple) |

---

---

## PHẦN 2: KIẾN TRÚC

### 2.1 Kiến Trúc 5 Tầng

```
┌─────────────────────────────────────────────────────────┐
│  TẦNG 5 — CLIENTS                                       │
│  CLI | Web UI | macOS App | iOS App | Android App        │
├─────────────────────────────────────────────────────────┤
│  TẦNG 4 — CHANNELS (~35 platforms)                       │
│  Telegram | Discord | Slack | WhatsApp | Signal          │
│  iMessage | LINE | Matrix | MS Teams | Zalo | Twitch...  │
├─────────────────────────────────────────────────────────┤
│  TẦNG 3 — GATEWAY                                        │
│  HTTP (Hono) + WebSocket (ws) + Auth + Routing + Session │
│  Endpoints: /health, /api/hooks/*, /openai/*, /ws        │
├─────────────────────────────────────────────────────────┤
│  TẦNG 2 — AGENT RUNTIME (Pi-Mono Core)                   │
│  Pi Agent Core + Tool Executor + Memory (LanceDB)        │
│  Context Engine + Skills System + ACP Protocol           │
├─────────────────────────────────────────────────────────┤
│  TẦNG 1 — LLM PROVIDERS                                  │
│  Anthropic | OpenAI | Google | AWS Bedrock | Ollama      │
│  Azure | xAI (Grok) | Groq | Cerebras | OpenRouter...    │
└─────────────────────────────────────────────────────────┘
```

**Luồng dữ liệu**: Client/Channel → Gateway → Agent Runtime → LLM → kết quả ngược lại

---

### 2.2 Gateway — Trái Tim Của Hệ Thống

**Gateway là gì?** Server WebSocket + HTTP chạy local tại `ws://127.0.0.1:18789`

**3 nhiệm vụ chính của Gateway:**
1. **Lắng nghe** — nhận messages từ tất cả channels đồng thời
2. **Xác thực** — 4 auth modes (none | token | password | trusted-proxy)
3. **Định tuyến** — phân phối đến đúng agent theo rules

**Quy trình khởi động Gateway (9 bước):**
```
1. Load config
2. Migrate cấu hình cũ (backward compat)
3. Khởi tạo auth rate limiter
4. Apply lane concurrency limits
5. Start sidecars (browser controller, Gmail watcher, plugins)
6. Connect channels (Slack, Discord, Telegram...)
7. runBootOnce() → đọc BOOT.md → chạy agent initialization
8. Start HTTP server (/health, /api/hooks/*, /openai/*)
9. Enable health monitor (check mỗi 5 phút)
```

---

### 2.3 Routing Engine — 7-Tier Priority

Khi message đến, Gateway thử từng tier theo thứ tự ưu tiên:

| Tier | Tiêu chí | Ví dụ thực tế |
|------|----------|----------------|
| **1** | `binding.peer` | Kênh Slack #vip-support → agent "vip-handler" |
| **2** | `binding.peer.parent` | Thread Discord → kế thừa từ parent channel |
| **3** | `binding.guild + roles` | Discord server + role "admin" → agent chuyên |
| **4** | `binding.guild` | Discord server (bất kỳ role) |
| **5** | `binding.team` | Toàn bộ Slack workspace |
| **6** | `binding.account` | Tài khoản cụ thể |
| **7** | `default` | Fallback → agent "main" |

**Session Key Format**: `agent:{agentId}:{channel}:{peerKind}:{peerId}`
> Ví dụ: `agent:main:telegram:group:111222333`

---

### 2.4 Dual-Loop Agent Execution

Đây là cơ chế cốt lõi giúp OpenClaw "làm được nhiều thứ":

```
VÒNG NGOÀI (Follow-up Loop):
┌─────────────────────────────────────────────────┐
│  Chạy tiếp sau inner loop nếu còn follow-ups    │
│                                                 │
│  VÒNG TRONG (Tool + Steering Loop):             │
│  ┌───────────────────────────────────────────┐  │
│  │ 1. Inject steering/pending messages       │  │
│  │ 2. Gọi LLM → nhận streaming response     │  │
│  │ 3. Nếu có tool calls:                     │  │
│  │    a. Chạy tools tuần tự                  │  │
│  │    b. Sau mỗi tool: kiểm tra steering     │  │
│  │    c. Nếu có steering → skip tools còn lại│  │
│  │ 4. Kiểm tra follow-up queue               │  │
│  │ 5. Nếu còn → vòng ngoài tiếp tục         │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Tại sao quan trọng?**
- Vòng trong: xử lý tools phức tạp, self-correcting
- Vòng ngoài: agent có thể chủ động tiếp tục mà không cần user trigger
- Steering: user có thể can thiệp giữa chừng

---

### 2.5 Extension System — 40+ Extensions

```
Plugin SDK (40+ sub-paths tại openclaw/plugin-sdk)
│
├── Channel Extensions (~35 platforms)
│   ├── Mỗi channel = 1 extension độc lập trong monorepo
│   ├── Unified ChannelExtension interface
│   └── Hot-reload: thêm channel không cần restart gateway
│
├── Built-in Skills (52 skills)
│   ├── Productivity: notion, obsidian, apple-notes, trello...
│   ├── Communication: slack, discord, himalaya (email)...
│   ├── Development: coding-agent, github, gh-issues, tmux...
│   └── Media: canvas, openai-image-gen, whisper, nano-pdf...
│
└── LLM Providers (~22+)
    ├── Abstraction layer: 1 interface → swap models at runtime
    └── Auto-failover: model A lỗi → tự chuyển sang model B
```

**Key insight về Skills**: Bất kỳ ai cũng có thể thêm skill mới chỉ bằng tạo file `SKILL.md` — không cần code!

---

### 2.6 Security Model — 8 Lớp Bảo Vệ

```
Layer 1: Authentication    → none | token | password | trusted-proxy
Layer 2: Role & Scopes     → admin > approvals > write
Layer 3: Tool Policy       → 3 profiles: messaging | minimal | full
Layer 4: Approval System   → lệnh nguy hiểm phải xin phép user
Layer 5: Prompt Injection  → external content wrapping + 13 regex patterns
Layer 6: Sandbox           → Docker container (non-root, no sudo)
Layer 7: Secrets Mgmt      → $ref pattern, không hardcode API keys
Layer 8: Security Audit    → detect-secrets scan, dangerous-config flags
```

**Trust Model**: "one user per machine, one gateway for that user"
- Host machine: trusted hoàn toàn
- Authenticated operator: trusted
- **AI model/agent: KHÔNG trusted** — always untrusted principal

**Tools luôn cần approval của user:**
`exec`, `spawn`, `shell`, `fs_write`, `fs_delete`, `fs_move`, `apply_patch`

**Cơ chế chống bypass approval**: Fields `approved` và `approvalDecision` bị xóa khỏi mọi user input, chỉ được thêm lại sau khi gateway verify approval record hợp lệ.

---

### 2.7 Ví Dụ Thực Tế — Message Flow End-to-End

**Scenario**: User nhắn Telegram hỏi "Thời tiết Hà Nội hôm nay?"

```
User (Telegram) ──→ Telegram Channel Extension
                         ↓
                    Gateway receives message
                         ↓
                    Auth check ✅
                         ↓
                    Routing: tier 6 (account match)
                         ↓
                    Agent Runtime (Pi-Mono)
                         ↓
                    Context Engine assembles history
                         ↓
                    LLM call (Claude/GPT/Gemini)
                         ↓
                    Tool call: weather skill
                         ↓ (with approval if sensitive)
                    Skill executes: fetchWeatherAPI("Hà Nội")
                         ↓
                    Result → LLM → response text
                         ↓
                    Streaming output → Telegram
                         ↓
User (Telegram) ←── "Hà Nội hôm nay 28°C, nắng, ẩm 75%..."
```

**Với approval workflow**: Nếu skill yêu cầu ghi file → gateway hỏi user "Bạn có muốn ghi file X không?" trước khi thực thi.

---

---

## PHẦN 3: PI-MONO — NỀN TẢNG CỦA OPENCLAW

### 3.1 Pi-Mono Là Gì?

**Pi-Mono = Engine. OpenClaw = Vehicle.**

| Thông tin | Chi tiết |
|-----------|---------|
| Repository | github.com/badlogic/pi-mono |
| Stars | **22,100+** |
| Language | TypeScript 96.6% |
| License | MIT |
| Tác giả | Mario Zechner (creator của **libGDX**) |
| Version | 0.57.1 (lockstep versioning) |
| npm downloads | ~6.5M/tháng |

**Triết lý cốt lõi**:
> *"What you leave out matters more than what you put in"*
> — System prompt dưới **1.000 tokens**, phần còn lại đến từ files trên disk

---

### 3.2 Kiến Trúc 3 Tầng — 7 Packages

```
╔══════════════════════════════════════════════════════════╗
║  TẦNG 3 — ỨNG DỤNG                                      ║
║  ┌──────────────┐ ┌─────┐ ┌──────┐                      ║
║  │ coding-agent │ │ mom │ │ pods │                       ║
║  │ (263 files)  │ │Slack│ │ GPU  │                       ║
║  │  6.51M dl/m  │ │bot  │ │ mgmt │                       ║
║  └──────────────┘ └─────┘ └──────┘                      ║
╠══════════════════════════════════════════════════════════╣
║  TẦNG 2 — LÕI AGENT                                      ║
║  ┌────────────────────┐  ┌─────────────────────────┐    ║
║  │ agent (13 files)   │  │ web-ui (75 files, 32 WC) │   ║
║  │ 6.57M dl/m         │  │ 7.5K dl/m               │   ║
║  └────────────────────┘  └─────────────────────────┘   ║
╠══════════════════════════════════════════════════════════╣
║  TẦNG 1 — NỀN TẢNG                                       ║
║  ┌──────────────────────────┐  ┌───────────────────────┐ ║
║  │ ai (79 files, 22+ LLMs)  │  │ tui (50 files, CLI UI) │║
║  │ 6.7M dl/m               │  │ 6.6M dl/m             │ ║
║  └──────────────────────────┘  └───────────────────────┘ ║
╚══════════════════════════════════════════════════════════╝
```

**Quy tắc dependency** (một chiều, không có cycle):
- Tầng 3 chỉ phụ thuộc vào Tầng 2
- Tầng 2 chỉ phụ thuộc vào Tầng 1
- Tầng 1 độc lập hoàn toàn

---

### 3.3 7 Packages Chi Tiết

| # | Package | Mục đích | Tích hợp OpenClaw |
|---|---------|---------|-------------------|
| **1** | **`ai`** | LLM abstraction (streaming, tool-use, multi-turn) | LLM provider layer |
| **2** | **`agent`** | Agent execution framework (dual-loop) | Core agent runtime |
| **3** | **`coding-agent`** | Interactive CLI coding assistant | Code execution skill |
| **4** | **`web-ui`** | React/Lit chat components (32 Web Components) | Web dashboard |
| **5** | **`tui`** | Terminal UI library | CLI interface |
| **6** | **`mom`** | Slack bot framework | Slack channel integration |
| **7** | **`pods`** | GPU pod management for vLLM | Resource mgmt for self-hosted AI |

---

### 3.4 Package `ai` — LLM Abstraction Layer

**22+ LLM providers qua 1 interface duy nhất:**

| Nhóm | Providers |
|------|----------|
| **Anthropic** | Claude Opus, Sonnet, Haiku |
| **OpenAI** | GPT-4o, o1, o3, Codex |
| **Google** | Gemini 2.5, Google Vertex |
| **Amazon** | AWS Bedrock (Converse Stream) |
| **Microsoft** | Azure OpenAI, GitHub Copilot |
| **Chinese AI** | Qwen, DeepSeek, Kimi |
| **Performance** | Groq, Cerebras (fast inference) |
| **Open** | Ollama (local), OpenRouter (gateway), xAI/Grok |
| **Other** | Mistral, Vercel AI Gateway |

**Streaming Event System:**
```javascript
// Mỗi LLM interaction đều streaming-first
stream() → AssistantMessageEventStream

Events:
  start              → bắt đầu streaming
  text_delta         → nội dung text đang được tạo
  thinking_delta     → model đang "suy nghĩ" (reasoning)
  toolcall_delta     → model yêu cầu gọi tool
  done               → hoàn thành (stop/length/toolUse)
  error              → lỗi xảy ra
```

---

### 3.5 Package `agent` — Agent Runtime (Cực Kỳ Gọn)

**Chỉ 13 files, ~1.150 dòng code** — nhưng là trái tim của toàn bộ agent execution:

```typescript
// Dual-loop agent pattern (đơn giản hóa)
async function agentLoop(context, messages) {
  emit('agent_start');

  // VÒNG NGOÀI: follow-up loop
  while (hasMoreWork) {
    emit('turn_start');

    // Inject pending messages (steering/follow-up)
    if (pendingMessages.length > 0) injectPending();

    // Gọi LLM với streaming
    const response = await streamAssistantResponse(context);
    // → emit: message_start → message_update (x N) → message_end

    // VÒNG TRONG: tool execution loop
    if (response.hasToolCalls) {
      for (const tool of response.toolCalls) {
        await tool.execute();
        // → emit: tool_execution_start → update → end

        // Steering check: user can interrupt mid-execution
        if (hasSteeringMessages()) break; // Skip remaining tools
      }
    }

    emit('turn_end');

    // Check follow-up → continue outer loop if needed
    const followUp = await getFollowUpMessages();
    if (!followUp) break;
  }

  emit('agent_end');
}
```

**14 loại AgentEvent**: agent_start/end, turn_start/end, message_start/update/end, tool_execution_start/update/end, + custom types

---

### 3.6 Pi-Mono → OpenClaw Mapping

```
Pi-Mono Component              OpenClaw Extension
────────────────────────────────────────────────
ai package (22+ providers)  →  LLM Providers + Auto-Failover
agent package (dual-loop)   →  Agent Runtime + Session Management
tools system (8 core tools) →  Skills System (52 built-in)
event system (14 events)    →  Channel Extensions + Real-time UI
extension framework         →  Plugin SDK (40+ sub-paths)
web-ui (32 components)      →  Web Dashboard
mom (Slack framework)       →  Slack Channel Extension
pods (GPU management)       →  Self-hosted Model Support
```

**Phân tầng rõ ràng:**
- **Pi-Mono**: Core agent loop, LLM abstraction, streaming, tools
- **OpenClaw adds**: Gateway layer, 40+ channel extensions, 8-layer security, multi-tenant, mobile apps, cron/webhook, memory system

---

### 3.7 So Sánh Pi-Mono vs Các Đối Thủ

| Tiêu chí | **pi-mono** | Claude Code | Aider | Cursor |
|----------|:-----------:|:-----------:|:-----:|:------:|
| Kiến trúc | 7 packages, 3 tiers | Monolith | Single package | IDE plugin |
| Open source | MIT ✅ | Partially closed | MIT ✅ | Closed |
| LLM providers | **22+** | Anthropic only | 100+ | OpenAI + Anthropic |
| System prompt | **<1.000 tokens** | Multi-thousand | Minimal | Framework |
| Extension system | TypeScript ext ✅ | Shell hooks | ❌ | ❌ |
| Session branching | ✅ **Unique** | ❌ | ❌ | ❌ |
| Web Components | **32 WC** | ❌ | ❌ | ❌ |
| Self-hosted LLM | ✅ (pods) | ❌ | Qua config | ❌ |
| GitHub stars | 22K | 47K+ | 39K | Closed |

**Điểm độc nhất của Pi-Mono**:
1. **Session branching** — fork + tree navigation (không ai có)
2. **Minimal system prompt** < 1.000 tokens
3. **Pluggable Operations** — tool chạy ở bất kỳ đâu (host/Docker/SSH/Browser)

---

### 3.8 Ví Dụ Thực Tế — "Engine + Vehicle"

**Pi-Mono alone** (dùng trực tiếp):
```typescript
import { Agent } from '@mariozechner/pi-agent-core';
import { ClaudeProvider } from '@mariozechner/pi-ai';

const agent = new Agent({
  provider: new ClaudeProvider({ apiKey: '...' }),
  tools: [readTool, writeTool, bashTool]
});
// → CLI coding assistant. Chỉ vậy thôi.
```

**OpenClaw** (dùng pi-mono làm nền):
```typescript
// Cùng Agent, nhưng OpenClaw thêm:
// ✅ Gateway (22+ channels)
// ✅ 52 skills thay vì 4 tools
// ✅ 8-layer security
// ✅ Health monitoring
// ✅ Multi-tenant sessions
// ✅ Cron/webhook triggers
// ✅ Memory system (LanceDB)
// ✅ Mobile apps (iOS/Android/macOS)
```

---

---

## PHẦN 4: TECHNICAL DEEP-DIVE (5–7 phút)

### 4.1 Thêm Custom Skill — Không Cần Code

```markdown
# ~/.openclaw/skills/weather/SKILL.md

---
name: weather
description: Lấy thông tin thời tiết cho một thành phố
requires:
  env:
    - WEATHER_API_KEY
---

## Usage
Dùng skill này khi user hỏi về thời tiết.

## System
Gọi API: GET https://api.weather.io/v1?city={{city}}&key=$WEATHER_API_KEY
Format kết quả bằng tiếng Việt với: nhiệt độ, độ ẩm, gió, cảnh báo (nếu có).
```

**Kết quả**: Skill tự động available trên **tất cả 22+ channels** — không cần deploy, không cần code.

---

### 4.2 Thêm Custom Channel Extension

```typescript
import { ChannelExtension } from 'openclaw/plugin-sdk/channels';

class ZaloChannel extends ChannelExtension {
  // Tin nhắn đến → convert sang format gateway
  async handleIncoming(message: RawMessage): Promise<AgentInput> {
    return {
      text: message.body,
      peerId: message.senderId,
      channel: 'zalo',
      metadata: { groupId: message.groupId }
    };
  }

  // Kết quả agent → gửi về Zalo
  async handleOutgoing(response: AgentOutput): Promise<void> {
    await zaloApi.sendMessage({
      to: response.peerId,
      text: response.text,
      images: response.attachments
    });
  }
}

// Gateway tự động tích hợp vào routing system
```

---

### 4.3 LLM Provider Abstraction — Swap Model Không Cần Code Thay

```typescript
// pi-mono ai package: cùng interface, mọi provider
import { stream } from '@mariozechner/pi-ai';

// Dùng Claude
const result = await stream(messages, {
  model: 'anthropic:claude-opus-4-6',
  tools: [weatherTool]
});

// Chuyển sang Gemini → KHÔNG cần thay bất kỳ code nào khác
const result = await stream(messages, {
  model: 'google:gemini-2.5-pro',
  tools: [weatherTool]   // ← cùng tool, hoạt động ngay
});

// Hay Llama local (không cần internet, không mất tiền API)
const result = await stream(messages, {
  model: 'ollama:llama3.1-70b',
  tools: [weatherTool]
});

// OpenClaw thêm: auto-failover
// Model A lỗi → tự động chuyển sang Model B
```

---

### 4.4 Multi-Channel Agent — 1 Agent, 3 Kênh Đồng Thời

```typescript
// Cấu hình trong ~/.openclaw/config.yml
bindings:
  # Kênh Telegram → agent chuyên hỗ trợ user
  - peer: telegram:group:111222333
    agent: support-agent

  # Kênh Discord #dev → agent developer
  - guild: discord:999888777
    roles: [developer]
    agent: dev-agent

  # Slack workspace → agent quản lý tasks
  - team: slack:T12345678
    agent: task-agent

  # Default fallback
  - agent: main
```

**Kết quả**: Cùng 1 OpenClaw instance phục vụ 3 audience khác nhau với 3 agent chuyên biệt.

---

### 4.5 Skills System — Pipeline 4 Bước

```
1. DISCOVER  → Tìm SKILL.md trong:
               ~/.openclaw/skills/ (user-defined)
               + bundled skills (52 built-in)
               + plugin extensions (ClawHub marketplace)

2. FILTER    → Kiểm tra điều kiện:
               requires.bins (phần mềm có cài không?)
               requires.env (biến môi trường có không?)
               os (macOS only? Windows only?)
               agent whitelist (agent này có quyền không?)

3. SERIALIZE → Format vào system prompt:
               Tối đa 150 skills
               Tối đa 30.000 chars
               Tối đa 256KB/file

4. EXECUTE   → LLM quyết định → gọi tool → kết quả → context → lặp
```

---

---

## PHẦN 5: TẠI SAO ĐIỀU NÀY QUAN TRỌNG? (2–3 phút)

### 5.1 Cho Developer

| Lợi ích | Chi tiết |
|---------|---------|
| **Không vendor lock-in** | MIT license + LLM agnostic = hoàn toàn tự do |
| **Tốc độ phát triển** | 52 skills sẵn có + 40+ extensions = không cần build từ đầu |
| **Privacy** | Dùng Ollama: zero data leaves your machine |
| **Tùy biến** | Skill chỉ cần SKILL.md, extension có SDK đầy đủ |
| **Cost control** | Cheap model cho simple tasks, expensive cho complex |

### 5.2 Cho Tổ Chức

| Use Case | Giải pháp với OpenClaw |
|----------|----------------------|
| Enterprise customer support | 1 agent → 22+ channel đầu ra đồng thời |
| Internal automation | Slack bot + cron + webhook + email triggers |
| AI research platform | Swap models, run benchmarks, so sánh providers |
| Multi-tenant SaaS | Gateway abstracts customer data, per-tenant agents |
| Data sovereignty | On-premise + Ollama = không gửi data ra ngoài |

### 5.3 Decision Matrix — "Ai nên dùng gì?"

| Nhu cầu | Khuyến nghị |
|---------|------------|
| AI trong WhatsApp/Telegram chủ động | **OpenClaw** |
| AI trong Zalo cá nhân | **OpenClaw** (duy nhất!) |
| Privacy, zero-cloud | **OpenClaw** + Ollama |
| Nhiều LLM, không vendor lock | **OpenClaw** |
| Cron, webhook, email triggers | **OpenClaw** |
| AI điều khiển browser/máy tính | **OpenClaw** |
| Budget $0, AI tốt nhất | **OpenClaw** + Gemini Free |
| Chất lượng phân tích văn bản cao nhất | Claude.ai Pro |
| Không cần cài đặt, dùng ngay | ChatGPT |
| Companion AI cảm xúc | Pi / Replika |

---

### 5.4 Tóm Tắt — OpenClaw's Moat

```
"Self-hosted + Multi-channel + LLM-agnostic + Open-source"

= Không có đối thủ trực tiếp trong ngách này (tháng 3/2026)
```

**3 điểm mạnh không thể sao chép dễ dàng:**
1. **22+ channels đồng thời** — phải integrate từng platform, mất nhiều năm
2. **Pi-Mono foundation** — 22.1K stars, proven architecture, active community
3. **MIT license** — community contributions không thể bị shut down

---

---

## KẾT THÚC & MỞ Q&A

**Tóm tắt 30 giây:**
- OpenClaw = self-hosted AI gateway, 22+ channels, 22+ LLM, 40+ extensions, 52 skills
- Chạy trên Pi-Mono framework (7 packages, 3-tier architecture, 22.1K stars)
- Pi-Mono = engine. OpenClaw = complete vehicle on top of that engine
- MIT license, TypeScript, Node.js, deploy trên máy của bạn

**Câu hỏi mở cho team:**
1. Chúng ta có dùng được trực tiếp cho project hiện tại không?
2. Pi-Mono's agent package có thể extract ra dùng riêng không?
3. Custom skill nào phù hợp nhất với workflow team?

---

*📎 Diagrams chi tiết: `OpenClaw_Architecture_Diagrams.md`*
*📎 Q&A notes đầy đủ: `OpenClaw_QA_Notes.md`*
*📎 Tài liệu nguồn: `research_doc/pi-mono-research/open_claw/`, `rounds/`, `v0.57.1/packages/`*
