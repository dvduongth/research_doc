# OpenClaw — Q&A Notes & Speaker Guide
> Ghi chú cho presenter. Phần này KHÔNG hiển thị cho audience.
> Chuẩn bị cho buổi thuyết trình tháng 3/2026.

---

## SPEAKER NOTES — Theo Từng Section

### Phần Mở Đầu
- Hook bằng scenario thực tế: "lúc 2h sáng, WhatsApp nhắn đến..."
- Nhấn mạnh "gateway tự lưu trữ" — đây là khái niệm mới với nhiều người
- Đừng đi vào technical ngay — giữ energy cao cho đến khi audience đã bị hook

### Phần 1 (Tại sao nổi bật)
- Radar chart: chỉ vào góc trên trái (Privacy + Capability) — "đây là ngách của OpenClaw"
- Zalo slide: dừng lại vài giây, để audience realize — "không ai khác làm được điều này"
- Benchmark numbers: đọc slow, để audience absorb. Đừng rush qua table

### Phần 2 (Kiến trúc)
- 5-layer diagram: explain top-down, "clients ở trên, AI ở dưới"
- Routing 7-tier: ví dụ Discord #vip-support — rất concrete
- Security: nhấn mạnh **"AI model là untrusted principal"** — đây là insight key
- End-to-end example: step through slowly, audience thích concrete flows

### Phần 3 (Pi-Mono)
- Analogy "engine vs vehicle" — giữ cái này, rất effective
- 22.1K stars — đây là credibility signal quan trọng
- Minimal system prompt < 1.000 tokens — đây là philosophy rất thú vị, explain "less is more"
- Package stats table: dừng ở `agent` package — "13 files, ~1.150 dòng code, mà làm được tất cả điều đó!"

### Phần 4 (Technical)
- Live code reading nếu có màn hình — không cần chạy, chỉ cần đọc
- SKILL.md example: nhấn mạnh "không cần code" — powerful for non-engineers in audience
- LLM switching: "cùng 3 dòng code, swap provider hoàn toàn"

### Phần 5 (Why it matters)
- Decision matrix: let audience find themselves in the table
- Câu hỏi mở cuối: "Chúng ta dùng được không?" — chuyển từ education sang action

---

## Q&A NOTES — 15 CÂU HỎI THƯỜNG GẶP

### Câu Hỏi Về Business / Adoption

---

**Q1: Tại sao không dùng OpenAI API hoặc Anthropic hosted trực tiếp?**

**Trả lời ngắn**: OpenClaw cho phép bạn kiểm soát hoàn toàn — model, data, cost.

**Trả lời đầy đủ**:
- **Data sovereignty**: API calls ra ngoài có thể bị log. OpenClaw + Ollama = zero data leaves machine
- **Multi-provider**: Không bị tied vào 1 vendor — nếu OpenAI tăng giá, switch sang Gemini không thay code
- **Auto-failover**: Model A hết credit? Tự động fallback sang model B
- **Cost optimization**: Dùng cheap model (Haiku, Gemini Flash) cho simple tasks, expensive (Opus) chỉ khi cần
- **Feature gap**: API chỉ cho chat. OpenClaw thêm channels, cron, webhook, browser control, approval workflows

---

**Q2: Khác gì so với LangChain hoặc LlamaIndex?**

**Trả lời ngắn**: LangChain là library, OpenClaw là full platform.

**Trả lời đầy đủ**:
| So sánh | LangChain | OpenClaw |
|---------|----------|---------|
| Type | Python library | Full TypeScript platform |
| Channels | Không có | 22+ sẵn có |
| Security | DIY | 8-layer sẵn có |
| Deployment | Cần build | `npm install -g openclaw` |
| Skills | Custom code | 52 built-in + ClawHub |
| License | MIT | MIT |
| Community | Rất lớn | Nhỏ hơn nhưng growing |

- LangChain phù hợp khi cần custom ML pipeline phức tạp
- OpenClaw phù hợp khi cần AI agent production-ready với channels

---

**Q3: Độ khó setup như thế nào?**

**Trả lời thực tế**:
- **Basic setup**: 30–60 phút (Node.js ≥22, npm install, config API keys)
- **Thêm channel mới**: 15 phút (configure token, restart)
- **Custom skill (SKILL.md only)**: 30 phút (không cần code)
- **Custom channel extension**: 2–4 giờ (cần TypeScript)
- **Yêu cầu**: Terminal comfort, Node.js knowledge là đủ

**Lưu ý**: Đây là trade-off so với ChatGPT (setup 0 phút). OpenClaw đổi convenience lấy control.

---

**Q4: Có thể deploy cho team / nhiều user không?**

**Trả lời**: Có, nhưng với caveat.

- Architecture: "one user per machine, one gateway for that user" — designed for personal use
- Multi-tenant: Có thể dùng **multi-agent routing** — mỗi binding → agent riêng
- Team setup: Chạy trên VPS, config bindings per-user
- Giới hạn: Session isolation per-account, không có user management UI sẵn có
- Enterprise: Cần tự build thêm user management layer nếu cần full multi-tenant

---

**Q5: Chi phí thực tế như thế nào?**

**Trả lời**:
- **Phần mềm**: Miễn phí (MIT open source)
- **Chi phí thực**: API usage của LLM provider
  - Gemini Flash: $0.075/1M input tokens (gần miễn phí)
  - Claude Haiku: $0.80/1M input tokens
  - GPT-4o-mini: $0.15/1M input tokens
  - Ollama local: $0 (nhưng cần GPU/hardware)
- **VPS cho 24/7**: $5–20/tháng (nếu không muốn chạy trên máy cá nhân)
- **Ước tính**: Sử dụng nhẹ (personal) ≈ $2–10/tháng API cost

---

### Câu Hỏi Về Kiến Trúc / Technical

---

**Q6: Pi-Mono có thể dùng riêng không cần OpenClaw không?**

**Trả lời**: Có, hoàn toàn độc lập.

- `@mariozechner/pi-agent-core` là NPM package độc lập
- OpenClaw dùng nó làm dependency
- Có thể import trực tiếp: `npm install @mariozechner/pi-agent-core`
- Use case: Build custom CLI agent, embed vào ứng dụng của mình
- Không có web dashboard, channels, security model — phải tự build

---

**Q7: Tại sao chọn TypeScript thay vì Python (như LangChain)?**

**Trả lời**:
- Pi-Mono (author: Mario Zechner) chọn TypeScript vì: full-stack (server + web UI cùng 1 language)
- **Strict mode**: TypeScript strict = type safety, bắt lỗi lúc compile
- **Performance**: Node.js event loop phù hợp với streaming/WebSocket
- **Ecosystem**: npm ecosystem lớn hơn nhiều so với PyPI cho web tooling
- Trade-off: Python có scikit-learn, PyTorch nếu cần ML. OpenClaw không phải ML framework.

---

**Q8: Có phải chạy liên tục 24/7 không?**

**Trả lời**: Đúng, gateway cần chạy để nhận messages.

**Các options**:
1. **Personal machine**: Gateway chạy khi máy bật — OK cho personal use
2. **VPS/Cloud**: Deploy lên server để 24/7 (DigitalOcean, Hetzner $5/tháng)
3. **Tailscale integration**: OpenClaw có built-in Tailscale support cho secure remote access
4. **Health monitoring**: Auto-restart channel extensions nếu crash (max 10 restarts/giờ, cooldown 2 cycles)

---

**Q9: Security có đủ không? AI có thể tự làm gì nguy hiểm không?**

**Trả lời**: Đây là điểm mạnh của OpenClaw — security-first by design.

**Trust model**: "AI model is always an untrusted principal"
- AI không thể tự approve cho chính nó
- Dangerous tools (`exec`, `fs_write`, `spawn`) luôn cần user approval
- Fields `approved` bị xóa khỏi mọi input → AI không thể fake approval
- Sandbox mode: Docker container (non-root, no sudo)
- Prompt injection defense: External content wrapping + 13 regex patterns

**Thực tế**: AI sẽ HỎI "Bạn có muốn tôi chạy lệnh này không?" trước khi thực thi gì đó nguy hiểm.

---

**Q10: Memory system hoạt động thế nào? AI nhớ được bao nhiêu?**

**Trả lời — 2-tier memory:**

**Short-term** (Context Engine):
- Scope: 1 session (JSON file tại ~/.openclaw/sessions/)
- Giới hạn: Token budget (thường 100K–200K tokens)
- Khi đầy: Compaction algorithm (40% base chunk ratio) — tóm tắt, không xóa

**Long-term** (Vector Memory - LanceDB):
- Semantic search: text → embedding → cosine similarity
- Algorithm: MMR (Maximal Marginal Relevance) — đa dạng kết quả
- 6 embedding providers: OpenAI, Gemini, Voyage, local ONNX, Ollama, auto
- Sync strategies: onSessionStart | onSearch | watch | intervalMinutes

**Ví dụ**: Nếu bạn nói "Tôi thích café sữa đá" vào tháng trước, AI sẽ remember khi bạn hỏi "quán nào anh ơi?"

---

### Câu Hỏi Về Giới Hạn

---

**Q11: Giới hạn nào của OpenClaw?**

**Trả lời thành thật**:

| Giới hạn | Mức độ | Workaround |
|---------|--------|------------|
| Cần Node.js ≥22, terminal | **Cao** | Không có GUI installer |
| Gateway phải chạy liên tục | Trung bình | Deploy VPS |
| iOS app vẫn beta | Thấp | TestFlight |
| ClawHub marketplace nhỏ | Trung bình | Tự viết SKILL.md |
| Chưa có image generation tích hợp | Thấp | Dùng skill openai-image-gen |
| Community nhỏ hơn Claude Code/Aider | Trung bình | Growing fast |
| Chất lượng AI phụ thuộc API key có | Trung bình | Feature, không phải bug |

---

**Q12: OpenClaw scale được không nếu cần cho 1000 users?**

**Trả lời**:
- **Thiết kế hiện tại**: Personal use (1 user, 1 gateway)
- **Scale options**:
  - Gateway stateless → có thể horizontal scale (nhưng session phải shared storage)
  - Chạy nhiều instances với load balancer
  - Multi-agent routing xử lý nhiều bindings/users
- **Không nên dùng nếu**: Cần user management, billing, SSO cho enterprise scale
- **Phù hợp**: Team nhỏ, internal tools, personal productivity

---

**Q13: CVE/Security vulnerabilities có không?**

**Trả lời**: Có 7+ CVE trong Unreleased (chưa public), đây là điều bình thường.

- OpenClaw đã có security audit process sẵn (detect-secrets, dangerous-config scan)
- Benchmark docs đề cập điều này một cách minh bạch
- Security trade-off: Feature-rich system = larger attack surface
- Khuyến nghị: Monitor changelog, cập nhật regular, không expose gateway ra internet nếu không cần

---

### Câu Hỏi Về Adoption / Hành Động

---

**Q14: Chúng ta nên adopt OpenClaw cho project không?**

**Gợi ý trả lời** (tuỳ context team):

**Nên adopt nếu**:
- Cần AI integration vào Telegram/Zalo/Discord của team
- Muốn thử nhiều LLM providers không commit 1 vendor
- Team có TypeScript knowledge
- Cần automation (cron, webhook, email triggers)

**Chưa nên adopt nếu**:
- Cần enterprise-grade user management ngay
- Team không muốn maintain gateway
- Chỉ cần simple chatbot (dùng Botpress/Dialogflow đơn giản hơn)

**Bước tiếp theo gợi ý**: POC (Proof of Concept) trong 1 sprint — setup, thêm 1 channel, viết 1 skill

---

**Q15: Pi-Mono coding-agent có thể thay Claude Code/Cursor cho team không?**

**Trả lời thực tế**:
- **Technically**: Có — coding-agent là interactive CLI coding assistant
- **6.51M downloads/tháng**: Proven usage
- **Điểm mạnh vs Claude Code**:
  - MIT open source hoàn toàn
  - Session branching (unique!)
  - Minimal system prompt → fast + cheap
  - 22+ LLM providers
- **Điểm yếu vs Claude Code**:
  - Community nhỏ hơn (47K vs 22K stars)
  - Ít polish hơn cho UX
  - Ít integration hơn (Claude Code có IDE plugins)
- **Khuyến nghị**: Thử song song, compare cost/quality trong 1 tuần

---

## TALKING POINTS — Slide Transitions

| Transition từ → đến | Phrase gợi ý |
|---------------------|-------------|
| Hook → Features | "Vậy cụ thể, OpenClaw làm được gì?" |
| Features → Architecture | "Câu hỏi là: làm sao nó làm được tất cả điều đó?" |
| Architecture → Pi-Mono | "Đằng sau mọi thứ, có một framework mà ít người biết tới..." |
| Pi-Mono → Code | "Đủ lý thuyết rồi — xem code thực tế nào" |
| Code → Why it matters | "Nhưng tại sao điều này quan trọng với chúng ta?" |
| Content → Q&A | "Đó là toàn bộ overview. Tôi muốn nghe câu hỏi từ các bạn." |

---

## TIMING GUIDE

| Section | Target | Nếu nhanh | Nếu chậm |
|---------|--------|-----------|----------|
| Mở đầu | 2 min | Skip scenario | Shorten |
| Phần 1: Nổi bật | 7 min | Skip decision matrix | Skip competitor table |
| Phần 2: Kiến trúc | 10 min | Skip security detail | Skip lanes system |
| Phần 3: Pi-Mono | 12 min | Skip stats table | Skip code example |
| Phần 4: Technical | 7 min | Show only 1 code example | Add live demo |
| Phần 5: Why matters | 3 min | Skip use cases | Add team context |
| **Total** | **41 min** | **35 min** | **50 min** |
| Q&A | 10–15 min | | |

**Buffer advice**: Nếu Q&A nhiều → rút ngắn Technical (Phần 4). Phần 4 là least critical.

---

## FALLBACK — Nếu Có Sự Cố

| Sự cố | Phương án |
|-------|----------|
| Màn hình không hiện Mermaid | Dùng bảng text ASCII trong slide deck |
| Code examples không rõ | Refer đến README của repo |
| Câu hỏi ngoài phạm vi | "Tôi sẽ check và trả lời trong Slack sau buổi này" |
| Hết giờ | Skip Phần 4 Technical hoàn toàn |
| Audience không engage | Hỏi "Ai đang dùng gì cho internal automation hiện tại?" |

---

## NGUỒN THAM KHẢO

| Tài liệu | Đường dẫn | Mục đích |
|---------|-----------|---------|
| OpenClaw analysis | `research_doc/pi-mono-research/open_claw/` | Toàn bộ 12 docs |
| Benchmark data | `open_claw/10_so_sanh_benchmark.md` | Radar chart, comparison |
| Architecture deep-dive | `open_claw/02_kien_truc_tong_the.md` + `03_gateway.md` | Technical details |
| Pi-Mono packages | `v0.57.1/packages/*.md` | Package analysis |
| Existing diagrams | `rounds/*/diagrams/*.mmd` | 19 Mermaid files |
| Review report | `open_claw/review/OPENCLAW_REVIEW_REPORT.md` | Master synthesis |
