# OpenClaw — Architecture Diagrams (Mermaid)
> Tất cả diagrams cho buổi thuyết trình. Render bằng Mermaid Live Editor (mermaid.live) hoặc VS Code Mermaid extension.

---

## Diagram 1: Feature Comparison Matrix (Radar/Table)

```mermaid
quadrantChart
    title OpenClaw vs Competitors — Feature Coverage
    x-axis Low Capability --> High Capability
    y-axis Low Privacy --> High Privacy
    quadrant-1 "Private + Capable"
    quadrant-2 "Private but Limited"
    quadrant-3 "Limited + Closed"
    quadrant-4 "Capable but Open"
    OpenClaw: [0.85, 0.90]
    ChatGPT: [0.75, 0.30]
    Claude.ai: [0.70, 0.40]
    Gemini: [0.65, 0.20]
    Siri: [0.30, 0.70]
```

---

## Diagram 2: 22+ Channels Ecosystem

```mermaid
mindmap
  root((OpenClaw<br/>Gateway))
    Messaging Chính
      WhatsApp
      Telegram
      Signal
      Discord
    Doanh Nghiệp
      Slack
      Microsoft Teams
      Google Chat
      Feishu
    Việt Nam 🇻🇳
      Zalo Business
      Zalo Personal
    Châu Á
      LINE
      WeChat
    Self-hosted
      Matrix
      Mattermost
      Nextcloud Talk
      Synology Chat
    Decentralized
      Nostr
      Tlon/Urbit
    Streaming
      Twitch
      IRC
    Platform
      WebChat
      macOS App
      iOS App
      Android App
```

---

## Diagram 3: Kiến Trúc 5 Tầng (Top-Down)

```mermaid
graph TD
    subgraph Layer5["🖥️ TẦNG 5 — CLIENTS"]
        CLI["CLI Terminal"]
        WebUI["Web Dashboard"]
        Mac["macOS App"]
        iOS["iOS App"]
        Android["Android App"]
    end

    subgraph Layer4["📱 TẦNG 4 — CHANNELS (22+)"]
        Telegram["Telegram"]
        Discord["Discord"]
        WhatsApp["WhatsApp"]
        Slack["Slack"]
        Zalo["Zalo 🇻🇳"]
        More["+ 17 kênh khác..."]
    end

    subgraph Layer3["🔀 TẦNG 3 — GATEWAY (Pi-Mono Routing)"]
        HTTP["HTTP Server (Hono)"]
        WS["WebSocket Server"]
        Auth["Auth Layer"]
        Router["7-Tier Router"]
        Sessions["Session Manager"]
    end

    subgraph Layer2["🤖 TẦNG 2 — AGENT RUNTIME (Pi-Mono)"]
        AgentCore["Pi Agent Core"]
        ContextEng["Context Engine"]
        Skills["Skills System (52)"]
        Memory["Memory (LanceDB)"]
        Security["Security (8 layers)"]
    end

    subgraph Layer1["🧠 TẦNG 1 — LLM PROVIDERS (22+)"]
        Claude["Anthropic Claude"]
        GPT["OpenAI GPT"]
        Gemini["Google Gemini"]
        Ollama["Ollama (Local)"]
        More2["+ 18 providers..."]
    end

    Layer5 --> Layer4
    Layer4 --> Layer3
    Layer3 --> Layer2
    Layer2 --> Layer1

    style Layer5 fill:#4A90D9,color:#fff
    style Layer4 fill:#7B68EE,color:#fff
    style Layer3 fill:#E8884A,color:#fff
    style Layer2 fill:#5CB85C,color:#fff
    style Layer1 fill:#D9534F,color:#fff
```

---

## Diagram 4: Gateway Routing — 7-Tier Priority

```mermaid
flowchart LR
    MSG[/"📩 Message Arrives"/] --> T1{Tier 1: binding.peer?}
    T1 -->|Match| A1["Route to peer-bound agent"]
    T1 -->|No| T2{Tier 2: binding.peer.parent?}
    T2 -->|Match| A2["Route to parent-bound agent"]
    T2 -->|No| T3{Tier 3: guild + roles?}
    T3 -->|Match| A3["Route to role-specific agent"]
    T3 -->|No| T4{Tier 4: binding.guild?}
    T4 -->|Match| A4["Route to guild-bound agent"]
    T4 -->|No| T5{Tier 5: binding.team?}
    T5 -->|Match| A5["Route to team-bound agent"]
    T5 -->|No| T6{Tier 6: binding.account?}
    T6 -->|Match| A6["Route to account-bound agent"]
    T6 -->|No| A7["Route to default 'main' agent"]

    A1 & A2 & A3 & A4 & A5 & A6 & A7 --> AGENT["🤖 Agent Runtime"]

    style MSG fill:#4A90D9,color:#fff
    style AGENT fill:#5CB85C,color:#fff
```

---

## Diagram 5: Dual-Loop Agent Execution (Pi-Mono Core)

```mermaid
flowchart TD
    START([agent_start]) --> OUTER_LOOP[Outer Loop: Check Follow-ups]

    OUTER_LOOP --> INJECT[Inject steering/pending messages]
    INJECT --> LLM["📡 Call LLM<br/>(streaming: text_delta events)"]
    LLM --> MSG_DONE[Build AssistantMessage]

    MSG_DONE --> HAS_TOOLS{Has tool calls?}

    HAS_TOOLS -->|No| CHECK_FOLLOWUP[Check follow-up queue]
    HAS_TOOLS -->|Yes| INNER_LOOP[Inner Loop: Execute tools]

    INNER_LOOP --> EXEC_TOOL[Execute tool N]
    EXEC_TOOL --> CHECK_STEERING{Steering messages?}
    CHECK_STEERING -->|Yes| SKIP["Skip remaining tools<br/>(inject steering)"]
    CHECK_STEERING -->|No| MORE_TOOLS{More tools?}
    MORE_TOOLS -->|Yes| EXEC_TOOL
    MORE_TOOLS -->|No| CHECK_FOLLOWUP

    SKIP --> CHECK_FOLLOWUP

    CHECK_FOLLOWUP --> HAS_FOLLOWUP{Follow-up exists?}
    HAS_FOLLOWUP -->|Yes| OUTER_LOOP
    HAS_FOLLOWUP -->|No| END([agent_end])

    style START fill:#4A90D9,color:#fff
    style END fill:#5CB85C,color:#fff
    style LLM fill:#E8884A,color:#fff
    style INNER_LOOP fill:#7B68EE,color:#fff
```

---

## Diagram 6: Extension Ecosystem Layers

```mermaid
graph TD
    subgraph Apps["📱 Applications Layer"]
        WEB["Web UI (Lit + 32 WC)"]
        CLI2["CLI (tui package)"]
        MOBILE["Native Mobile Apps"]
        SLACK_APP["Slack Bot (mom package)"]
    end

    subgraph Ext["🔌 Extensions System (40+)"]
        CHANNELS["Channel Extensions (22+ platforms)"]
        SKILLS["Skills (52 built-in + ClawHub)"]
        PLUGINS["Plugin SDK (40+ sub-paths)"]
    end

    subgraph Runtime["⚙️ Agent Runtime"]
        AGENT_CORE["Pi Agent Core (dual-loop)"]
        CTX["Context Engine"]
        MEM["Memory (LanceDB)"]
        SEC["Security (8 layers)"]
    end

    subgraph LLM["🧠 LLM Abstraction (pi-mono/ai)"]
        PROVIDERS["22+ Providers"]
        STREAM["Streaming Events"]
        FAILOVER["Auto-Failover"]
    end

    Apps --> Ext
    Ext --> Runtime
    Runtime --> LLM

    style Apps fill:#4A90D9,color:#fff
    style Ext fill:#7B68EE,color:#fff
    style Runtime fill:#5CB85C,color:#fff
    style LLM fill:#D9534F,color:#fff
```

---

## Diagram 7: Security Model — 8 Layers

```mermaid
graph TD
    USER[/"👤 User Request"/]

    subgraph SEC["🔒 8-Layer Security Stack"]
        L1["Layer 1: Authentication<br/>(none | token | password | trusted-proxy)"]
        L2["Layer 2: Role & Scopes<br/>(admin > approvals > write)"]
        L3["Layer 3: Tool Policy<br/>(messaging | minimal | full)"]
        L4["Layer 4: Approval System<br/>(dangerous tools require user OK)"]
        L5["Layer 5: Prompt Injection Defense<br/>(content wrapping + 13 regex patterns)"]
        L6["Layer 6: Sandbox Execution<br/>(Docker, non-root, no sudo)"]
        L7["Layer 7: Secrets Management<br/>($ref pattern, no hardcoded keys)"]
        L8["Layer 8: Security Audit<br/>(detect-secrets, dangerous-config scan)"]
    end

    AGENT["🤖 Agent (Always Untrusted)"]

    USER --> L1 --> L2 --> L3 --> L4 --> L5 --> L6 --> L7 --> L8 --> AGENT

    style USER fill:#4A90D9,color:#fff
    style AGENT fill:#D9534F,color:#fff
    style L4 fill:#E8884A,color:#fff
    style L6 fill:#E8884A,color:#fff
```

---

## Diagram 8: Pi-Mono 3-Tier Architecture (Dependency Graph)

```mermaid
graph LR
    subgraph T3["Tier 3 — Applications"]
        CA["coding-agent<br/>263 files | 6.51M dl/m"]
        MOM["mom<br/>Slack bot | 17 files"]
        PODS["pods<br/>GPU management | 9 files"]
    end

    subgraph T2["Tier 2 — Core"]
        AGENT["agent<br/>13 files | 6.57M dl/m<br/>⭐ Dual-loop execution"]
        WEBUI["web-ui<br/>75 files | 32 Web Components<br/>7.5K dl/m"]
    end

    subgraph T1["Tier 1 — Foundation"]
        AI["ai<br/>79 files | 22+ LLM providers<br/>6.7M dl/m"]
        TUI["tui<br/>50 files | Terminal UI<br/>6.6M dl/m"]
    end

    CA --> AGENT
    CA --> AI
    CA --> TUI
    MOM --> AGENT
    MOM --> AI
    PODS --> AI
    WEBUI --> AGENT
    WEBUI --> AI

    AGENT --> AI

    style T3 fill:#4A90D9,color:#fff
    style T2 fill:#7B68EE,color:#fff
    style T1 fill:#5CB85C,color:#fff
    style AI fill:#D9534F,color:#fff,stroke-width:3px
    style AGENT fill:#E8884A,color:#fff,stroke-width:3px
```

---

## Diagram 9: Pi-Mono → OpenClaw Component Mapping

```mermaid
graph LR
    subgraph PIMONO["Pi-Mono Framework"]
        PM_AI["ai package<br/>(LLM abstraction)"]
        PM_AGENT["agent package<br/>(dual-loop runtime)"]
        PM_TOOLS["tools system<br/>(8 core tools)"]
        PM_EVENTS["event system<br/>(14 event types)"]
        PM_WEBUI["web-ui<br/>(32 components)"]
        PM_MOM["mom<br/>(Slack framework)"]
        PM_PODS["pods<br/>(GPU mgmt)"]
    end

    subgraph OPENCLAW["OpenClaw (extends Pi-Mono)"]
        OC_LLM["LLM Providers<br/>(22+ with failover)"]
        OC_RUNTIME["Agent Runtime<br/>+ Session Mgmt"]
        OC_SKILLS["52 Built-in Skills<br/>+ ClawHub"]
        OC_CHANNELS["22+ Channel Extensions"]
        OC_DASH["Web Dashboard"]
        OC_SLACK["Slack Channel"]
        OC_GPU["Self-hosted AI"]
    end

    PM_AI --> OC_LLM
    PM_AGENT --> OC_RUNTIME
    PM_TOOLS --> OC_SKILLS
    PM_EVENTS --> OC_CHANNELS
    PM_WEBUI --> OC_DASH
    PM_MOM --> OC_SLACK
    PM_PODS --> OC_GPU

    style PIMONO fill:#7B68EE,color:#fff
    style OPENCLAW fill:#5CB85C,color:#fff
```

---

## Diagram 10: Complete Data Flow — User to AI and Back

```mermaid
sequenceDiagram
    participant User as 👤 User (Telegram)
    participant Chan as 📱 Channel Extension
    participant GW as 🔀 Gateway
    participant Auth as 🔒 Auth Layer
    participant Router as 🗺️ 7-Tier Router
    participant Agent as 🤖 Agent Runtime
    participant CTX as 📚 Context Engine
    participant LLM as 🧠 LLM (Claude)
    participant Skill as 🛠️ Skill

    User->>Chan: "Thời tiết Hà Nội?"
    Chan->>GW: IncomingMessage{text, peerId, channel}
    GW->>Auth: validate(token)
    Auth-->>GW: ✅ authenticated
    GW->>Router: resolve_route(message)
    Router-->>GW: agent: "main"
    GW->>Agent: dispatch(message, session)
    Agent->>CTX: assemble(history, message)
    CTX-->>Agent: context[tokens: 8,432]
    Agent->>LLM: stream(context, tools=[weather_skill])
    LLM-->>Agent: text_delta × N → tool_call: weather_skill
    Agent->>Skill: execute("Hà Nội")
    Note over Skill: Approval not needed<br/>(read-only operation)
    Skill-->>Agent: {temp: 28, humid: 75%, wind: 12km/h}
    Agent->>LLM: stream(context + tool_result)
    LLM-->>Agent: "Hà Nội hôm nay 28°C, nắng..."
    Agent->>CTX: save(conversation)
    Agent->>Chan: StreamingResponse{text}
    Chan->>User: "Hà Nội hôm nay 28°C, nắng, ẩm 75%..."
```

---

## Diagram 11: Skills System Pipeline

```mermaid
flowchart TD
    subgraph DISCOVER["1. DISCOVER"]
        D1["~/.openclaw/skills/"]
        D2["Bundled (52 built-in)"]
        D3["Plugin extensions"]
        D4["ClawHub marketplace"]
    end

    subgraph FILTER["2. FILTER"]
        F1["requires.bins ✓"]
        F2["requires.env ✓"]
        F3["OS compatible ✓"]
        F4["Agent whitelist ✓"]
    end

    subgraph SERIALIZE["3. SERIALIZE"]
        S1["Max 150 skills"]
        S2["Max 30K chars"]
        S3["Max 256KB/file"]
        S4["→ System prompt"]
    end

    subgraph EXECUTE["4. EXECUTE"]
        E1["LLM decides"]
        E2["Tool call"]
        E3["Result → context"]
        E4["Loop if needed"]
    end

    DISCOVER --> FILTER --> SERIALIZE --> EXECUTE

    style DISCOVER fill:#4A90D9,color:#fff
    style FILTER fill:#7B68EE,color:#fff
    style SERIALIZE fill:#E8884A,color:#fff
    style EXECUTE fill:#5CB85C,color:#fff
```

---

## Diagram 12: LLM Provider Architecture (22+ Providers)

```mermaid
graph LR
    APP["Application Code"]
    STREAM["stream() / complete()"]

    APP --> STREAM

    STREAM --> REGISTRY["Provider Registry<br/>(map by model.api)"]

    REGISTRY --> ANTHROPIC["anthropic-messages<br/>Claude Opus/Sonnet/Haiku"]
    REGISTRY --> OPENAI["openai-completions<br/>GPT-4o, o1, o3"]
    REGISTRY --> GOOGLE["google-generative-ai<br/>Gemini 2.5 Pro"]
    REGISTRY --> BEDROCK["bedrock-converse<br/>AWS Bedrock"]
    REGISTRY --> OLLAMA["ollama<br/>Local Models (no API cost)"]
    REGISTRY --> GROQ["groq compat<br/>Fast inference"]
    REGISTRY --> MORE["+ 16 more providers..."]

    ANTHROPIC & OPENAI & GOOGLE & BEDROCK & OLLAMA & GROQ & MORE --> UNIFIED["Unified EventStream<br/>(start | text_delta | toolcall_delta | done | error)"]

    UNIFIED --> APP2["Application gets same interface<br/>regardless of provider"]

    style APP fill:#4A90D9,color:#fff
    style REGISTRY fill:#E8884A,color:#fff
    style UNIFIED fill:#5CB85C,color:#fff
    style APP2 fill:#4A90D9,color:#fff
```

---

## Diagram 13: Benchmark Scores — Bảng So Sánh Radar

```mermaid
xychart-beta
    title "OpenClaw vs Competitors (Score 1-10)"
    x-axis ["Privacy", "Channels", "LLM Flex", "Automation", "Extensibility", "Cost", "Ease-of-Use", "Ecosystem"]
    y-axis "Score" 0 --> 10
    bar [9, 9, 9, 8, 8, 7, 3, 4]
    line [3, 2, 3, 2, 5, 5, 9, 9]
```

*Lưu ý: Bar = OpenClaw, Line = ChatGPT*

---

## Sử Dụng Diagrams

**Render options:**
1. **Mermaid Live**: Copy diagram code → https://mermaid.live
2. **VS Code**: Cài extension "Mermaid Preview"
3. **GitHub**: Paste vào .md file — GitHub tự render
4. **Slides**: Export PNG từ mermaid.live → paste vào PowerPoint/Google Slides

**Gợi ý dùng theo section:**
| Section | Diagrams nên dùng |
|---------|------------------|
| 1. Tại sao nổi bật | Diagrams 1, 2, 13 |
| 2. Kiến trúc | Diagrams 3, 4, 5, 6, 7 |
| 3. Pi-Mono | Diagrams 8, 9, 10 |
| 4. Technical | Diagrams 11, 12 |
