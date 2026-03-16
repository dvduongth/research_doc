/**
 * generate_pptx_part2.js
 * PptxGenJS script — OpenClaw Presentation, Slides 12–22
 *
 * Usage:
 *   const { addSlides12to22 } = require('./generate_pptx_part2');
 *   addSlides12to22(pres); // pass existing pres object from part1
 *
 * Design system matches generate_pptx_part1.js exactly:
 *   - NO "#" prefix on hex colors
 *   - Shadow objects via mkShadow() factory (fresh each call)
 *   - bullet: true (not unicode bullet chars)
 *   - breakLine: true between text array items
 *   - margin: 0 when text must align with shapes
 */

"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// COLOR PALETTE (identical to part1)
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  darkBg:     "0D1B2A",
  lightBg:    "F5F7FA",
  blue:       "4A90D9",
  amber:      "F5A623",
  green:      "27AE60",
  red:        "E74C3C",
  purple:     "7B68EE",
  white:      "FFFFFF",
  mutedDark:  "A8C0D6",
  navyText:   "1E2761",
  mutedLight: "6B7A8D",
  darkCard:   "1A2D42",
  borderDark: "2A4A6A",
  codeBg:     "1A1A2E",
  codeBg2:    "1E2A3A",
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS (identical interface to part1)
// ─────────────────────────────────────────────────────────────────────────────

/** Create a fresh shadow object — NEVER reuse the same object reference */
const mkShadow = () => ({
  type:    "outer",
  color:   "000000",
  opacity: 0.35,
  blur:    4,
  offset:  2,
  angle:   45,
});

function addTopBar(slide, color) {
  slide.addShape("rect", {
    x: 0, y: 0, w: "100%", h: 0.08,
    fill: { color },
    line: { color, width: 0 },
  });
}

function addPresenterNote(slide, noteText) {
  slide.addNotes(noteText);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

function addSlides12to22(pres) {

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 12 — Agent Runtime & Skills
  // ───────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightBg };
    addTopBar(s, C.purple);

    // Title
    s.addText("Agent Runtime & Skills", {
      x: 0.5, y: 0.15, w: 9.0, h: 0.55,
      fontSize: 28, bold: true, fontFace: "Calibri",
      color: C.navyText,
    });
    s.addShape("rect", {
      x: 0.5, y: 0.72, w: 9.0, h: 0.04,
      fill: { color: C.purple }, line: { color: C.purple, width: 0 },
    });

    // ── LEFT COLUMN: Agent Properties ──────────────────────────────────────
    const agentProps = [
      { label: "name",       val: "my-assistant",          color: C.blue   },
      { label: "model",      val: "claude-sonnet-4-6",     color: C.green  },
      { label: "workspace",  val: "/home/user/workspace",  color: C.amber  },
      { label: "skills",     val: "52 built-in + plugins", color: C.purple },
      { label: "memory",     val: "LanceDB (local)",       color: C.blue   },
      { label: "subagents",  val: "3 concurrent max",      color: C.green  },
      { label: "sandbox",    val: "approval required",     color: C.red    },
      { label: "identity",   val: "JWT token / API key",   color: C.amber  },
    ];

    s.addText("Cấu hình Agent", {
      x: 0.5, y: 0.85, w: 4.2, h: 0.35,
      fontSize: 14, bold: true, fontFace: "Calibri", color: C.navyText,
    });

    agentProps.forEach((p, i) => {
      const y = 1.25 + i * 0.5;
      // Colored label pill
      s.addShape("roundRect", {
        x: 0.5, y, w: 1.3, h: 0.35,
        rectRadius: 0.06,
        fill: { color: p.color }, line: { color: p.color, width: 0 },
      });
      s.addText(p.label, {
        x: 0.5, y, w: 1.3, h: 0.35,
        fontSize: 11, bold: true, fontFace: "Calibri",
        color: C.white, align: "center", valign: "middle", margin: 0,
      });
      // Value
      s.addText(p.val, {
        x: 1.9, y, w: 2.7, h: 0.35,
        fontSize: 12, fontFace: "Calibri", color: C.navyText,
        valign: "middle", margin: 0,
      });
    });

    // ── RIGHT COLUMN: Execution Pipeline ───────────────────────────────────
    const steps = [
      { label: "Nhận tin",          color: C.blue   },
      { label: "Context Engine",   color: C.purple },
      { label: "Memory Search",    color: C.green  },
      { label: "Skills Injection", color: C.amber  },
      { label: "LLM Suy nghĩ",      color: C.blue   },
      { label: "Tool Executor",    color: C.red    },
      { label: "Response",         color: C.green  },
      { label: "Lưu context",       color: C.purple },
    ];

    s.addText("Luồng xử lý", {
      x: 5.4, y: 0.85, w: 4.1, h: 0.35,
      fontSize: 14, bold: true, fontFace: "Calibri", color: C.navyText,
    });

    steps.forEach((step, i) => {
      const y = 1.25 + i * 0.5;
      s.addShape("roundRect", {
        x: 5.4, y, w: 3.2, h: 0.38,
        rectRadius: 0.07,
        fill: { color: step.color }, line: { color: step.color, width: 0 },
        shadow: mkShadow(),
      });
      s.addText(step.label, {
        x: 5.4, y, w: 3.2, h: 0.38,
        fontSize: 12, bold: true, fontFace: "Calibri",
        color: C.white, align: "center", valign: "middle", margin: 0,
      });
      // Arrow down (except last)
      if (i < steps.length - 1) {
        s.addText("▼", {
          x: 6.5, y: y + 0.38, w: 1.0, h: 0.12,
          fontSize: 8, color: C.mutedLight, align: "center", margin: 0,
        });
      }
    });

    addPresenterNote(s, `SLIDE 12 — AGENT RUNTIME & SKILLS
Thời gian: ~90 giây

Điểm chính:
- Agent là đơn vị cơ bản — mỗi agent có tên riêng, model riêng, skills riêng
- Dual-loop: outer loop xử lý tin nhắn, inner loop cho tool calls
- Context Engine: gồm lịch sử hội thoại + memory search + system prompt
- Skills được inject vào LLM như "tools" (OpenAI function calling format)
- Khi có action nguy hiểm (delete, send email, shell), sandbox bắt buộc approval

Câu hỏi dự kiến:
Q: "LLM có thể gọi nhiều skills một lúc không?"
A: "Có, agent hỗ trợ parallel tool execution — LLM trả về nhiều tool_calls cùng lúc, executor chạy song song rồi tổng hợp kết quả."

Q: "Memory search hoạt động như thế nào?"
A: "LanceDB tạo vector embedding cho mỗi tin nhắn, Context Engine lấy top-K related memories trước khi gửi cho LLM."`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 13 — 52 Built-in Skills
  // ───────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightBg };
    addTopBar(s, C.green);

    s.addText("52 Built-in Skills — Hệ Thống Kỹ Năng", {
      x: 0.5, y: 0.15, w: 9.0, h: 0.55,
      fontSize: 28, bold: true, fontFace: "Calibri", color: C.navyText,
    });
    s.addShape("rect", {
      x: 0.5, y: 0.72, w: 9.0, h: 0.04,
      fill: { color: C.green }, line: { color: C.green, width: 0 },
    });

    const skillGroups = [
      {
        icon: "File & System", color: C.blue,
        skills: ["read_file", "write_file", "run_bash", "run_python", "list_dir", "delete_file"],
      },
      {
        icon: "Web & Browser", color: C.amber,
        skills: ["web_fetch", "browser_open", "browser_screenshot", "browser_click", "web_search"],
      },
      {
        icon: "Communication", color: C.green,
        skills: ["send_message", "send_email", "create_reminder", "schedule_task"],
      },
      {
        icon: "Memory", color: C.purple,
        skills: ["memory_store", "memory_recall", "memory_list"],
      },
      {
        icon: "Code & Dev", color: C.red,
        skills: ["git_status", "git_diff", "run_tests", "create_pr", "read_github_issue"],
      },
      {
        icon: "Media", color: "E67E22",
        skills: ["generate_image", "transcribe_audio", "tts", "analyze_image"],
      },
    ];

    // 2x3 grid
    skillGroups.forEach((grp, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 0.4 + col * 3.1;
      const y = 0.9 + row * 2.25;

      // Card background
      s.addShape("roundRect", {
        x, y, w: 2.9, h: 2.1,
        rectRadius: 0.1,
        fill: { color: C.white },
        line: { color: "E0E6ED", width: 1 },
        shadow: mkShadow(),
      });
      // Header bar
      s.addShape("roundRect", {
        x, y, w: 2.9, h: 0.45,
        rectRadius: 0.1,
        fill: { color: grp.color },
        line: { color: grp.color, width: 0 },
      });
      s.addText(grp.icon, {
        x, y, w: 2.9, h: 0.45,
        fontSize: 12, bold: true, fontFace: "Calibri",
        color: C.white, align: "center", valign: "middle", margin: 0,
      });
      // Skills list
      grp.skills.forEach((sk, si) => {
        s.addShape("roundRect", {
          x: x + 0.1, y: y + 0.52 + si * 0.27, w: 2.7, h: 0.24,
          rectRadius: 0.04,
          fill: { color: "F0F4F8" },
          line: { color: "D0DAE6", width: 1 },
        });
        s.addText(sk, {
          x: x + 0.1, y: y + 0.52 + si * 0.27, w: 2.7, h: 0.24,
          fontSize: 10, fontFace: "Calibri",
          color: C.navyText, align: "center", valign: "middle", margin: 0,
        });
      });
    });

    addPresenterNote(s, `SLIDE 13 — 52 BUILT-IN SKILLS
Thời gian: ~90 giây

Điểm chính:
- 52 skills chia 6 nhóm, cover tất cả use cases phổ biến
- NGUY HIỂM — cần approval: run_bash, run_python, delete_file, send_email, create_pr
- AN TOÀN — không cần approval: read_file, web_fetch, memory_recall, git_status
- ClawHub cho phép cài thêm skills từ cộng đồng (như npm packages)

Lưu ý cho người dùng:
- Sandbox mode: mỗi lần skill để thay đổi trạng thái (ghi file, gửi tin) sẽ hiện popup xác nhận
- Có thể whitelist skills cho agent cụ thể trong config

Câu hỏi dự kiến:
Q: "Có thể viết thêm skill không?"
A: "Có, qua Plugin SDK — viết TypeScript, publish lên ClawHub, cài với một lệnh."`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 14 — Plugin SDK & ClawHub
  // ───────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightBg };
    addTopBar(s, C.amber);

    s.addText("Plugin SDK & ClawHub", {
      x: 0.5, y: 0.15, w: 9.0, h: 0.55,
      fontSize: 28, bold: true, fontFace: "Calibri", color: C.navyText,
    });
    s.addShape("rect", {
      x: 0.5, y: 0.72, w: 9.0, h: 0.04,
      fill: { color: C.amber }, line: { color: C.amber, width: 0 },
    });

    // ── TypeScript Interface Code Box ───────────────────────────────────────
    s.addShape("roundRect", {
      x: 0.5, y: 0.9, w: 5.6, h: 2.0,
      rectRadius: 0.08,
      fill: { color: C.codeBg },
      line: { color: C.borderDark, width: 1 },
      shadow: mkShadow(),
    });
    // Code header bar
    s.addShape("roundRect", {
      x: 0.5, y: 0.9, w: 5.6, h: 0.3,
      rectRadius: 0.08,
      fill: { color: "2A3A5A" },
      line: { color: C.borderDark, width: 0 },
    });
    s.addText("TypeScript — Plugin Interface", {
      x: 0.5, y: 0.9, w: 5.6, h: 0.3,
      fontSize: 10, fontFace: "Calibri", color: C.mutedDark,
      align: "center", valign: "middle", margin: 0,
    });
    const codeLines = [
      "interface OpenClawPlugin {",
      "  tools?:     ToolDefinition[]",
      "  channels?:  ChannelAdapter[]",
      "  providers?: LLMProviderAdapter[]",
      "  routes?:    HttpRoute[]",
      "}",
    ];
    codeLines.forEach((line, i) => {
      s.addText(line, {
        x: 0.7, y: 1.25 + i * 0.22, w: 5.2, h: 0.22,
        fontSize: 11, fontFace: "Courier New",
        color: i === 0 || i === 5 ? C.amber : C.mutedDark,
        margin: 0,
      });
    });

    // ── Extension Types (4 pills) ───────────────────────────────────────────
    const extTypes = [
      { label: "Channel 22+",      color: C.blue,   sub: "Thêm kênh nhắn tin" },
      { label: "Memory",           color: C.purple, sub: "Vector DB custom"   },
      { label: "AI Enhancement",   color: C.green,  sub: "Tool + provider"    },
      { label: "Mobile",           color: C.red,    sub: "iOS / Android ACP"  },
    ];
    s.addText("4 loại Extension:", {
      x: 6.3, y: 0.9, w: 3.2, h: 0.35,
      fontSize: 13, bold: true, fontFace: "Calibri", color: C.navyText,
    });
    extTypes.forEach((ext, i) => {
      const y = 1.28 + i * 0.58;
      s.addShape("roundRect", {
        x: 6.3, y, w: 3.2, h: 0.52,
        rectRadius: 0.08,
        fill: { color: ext.color },
        line: { color: ext.color, width: 0 },
        shadow: mkShadow(),
      });
      s.addText(ext.label, {
        x: 6.3, y, w: 3.2, h: 0.28,
        fontSize: 12, bold: true, fontFace: "Calibri",
        color: C.white, align: "center", valign: "middle", margin: 0,
      });
      s.addText(ext.sub, {
        x: 6.3, y: y + 0.26, w: 3.2, h: 0.24,
        fontSize: 10, fontFace: "Calibri",
        color: "FFFFFF", align: "center", valign: "middle", margin: 0,
      });
    });

    // ── ClawHub Box ─────────────────────────────────────────────────────────
    s.addShape("roundRect", {
      x: 0.5, y: 3.65, w: 9.0, h: 1.05,
      rectRadius: 0.1,
      fill: { color: "EAF4FF" },
      line: { color: C.blue, width: 1 },
    });
    s.addText("ClawHub — Registry cộng đồng", {
      x: 0.7, y: 3.7, w: 4.0, h: 0.35,
      fontSize: 13, bold: true, fontFace: "Calibri", color: C.navyText,
    });
    s.addText("Phát hiện, cài đặt và chia sẻ plugins:", {
      x: 0.7, y: 4.05, w: 4.0, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: C.mutedLight,
    });
    // Install command box
    s.addShape("roundRect", {
      x: 4.9, y: 3.75, w: 4.4, h: 0.4,
      rectRadius: 0.06,
      fill: { color: C.codeBg }, line: { color: C.borderDark, width: 1 },
    });
    s.addText("openclaw plugin install clawhub:weather-forecast", {
      x: 5.0, y: 3.75, w: 4.2, h: 0.4,
      fontSize: 11, fontFace: "Courier New", color: C.green,
      valign: "middle", margin: 0,
    });
    s.addText("mcporter cho phép kết nối với MCP ecosystem (Model Context Protocol)", {
      x: 0.7, y: 4.38, w: 8.6, h: 0.25,
      fontSize: 10, italic: true, fontFace: "Calibri", color: C.mutedLight,
    });

    // ── Principle footer ────────────────────────────────────────────────────
    s.addShape("rect", {
      x: 0.5, y: 4.78, w: 9.0, h: 0.04,
      fill: { color: C.amber }, line: { color: C.amber, width: 0 },
    });
    s.addText("Nguyên tắc: Open/Closed Principle — Mở rộng không sửa đổi core", {
      x: 0.5, y: 4.86, w: 9.0, h: 0.3,
      fontSize: 12, italic: true, fontFace: "Calibri", color: C.navyText, align: "center",
    });

    addPresenterNote(s, `SLIDE 14 — PLUGIN SDK & CLAWHUB
Thời gian: ~2 phút

Điểm chính:
- Plugin interface chỉ 4 trường — đơn giản nhưng mạnh
- tools: thêm skills mới cho agent (ví dụ: gọi API riêng)
- channels: tích hợp thêm kênh nhắn tin (ví dụ: Zalo OA, Viber)
- providers: thêm LLM khác (ví dụ: Grok, Amazon Bedrock)
- routes: thêm HTTP endpoints (ví dụ: webhook receiver)
- ClawHub hoạt động như npm/PyPI cho OpenClaw plugins
- MCP (Model Context Protocol) của Anthropic được hỗ trợ qua mcporter bridge

Câu hỏi dự kiến:
Q: "MCP là gì?"
A: "Model Context Protocol của Anthropic — chuẩn thống nhất cho LLM tự truy cập external tools. OpenClaw kết nối với MCP ecosystem qua mcporter, nên có thể dùng bất kỳ MCP server nào."

Q: "Ai có thể publish plugin lên ClawHub?"
A: "Bất kỳ ai — cần đăng ký, pass security review cơ bản, rồi publish. Tương tự npm public registry."`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 15 — Ung Dung Mobile
  // ───────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.darkBg };
    addTopBar(s, C.blue);

    s.addText("Ứng Dụng Mobile", {
      x: 0.5, y: 0.15, w: 9.0, h: 0.55,
      fontSize: 32, bold: true, fontFace: "Arial Black", color: C.white,
    });

    const platforms = [
      {
        name: "macOS",
        color: C.blue,
        icon: "Apple",
        features: [
          "Menu bar icon nhanh",
          "Quick chat popup",
          "Node management UI",
          'Voice Wake "Hey Claw"',
          "Notification Center",
        ],
      },
      {
        name: "iOS",
        color: C.purple,
        icon: "iPhone",
        features: [
          "Voice Wake",
          "Push notifications",
          "iOS Node (offline)",
          "Home Canvas (v2026.3.11)",
          "ElevenLabs TTS",
          "AirDrop transfer",
        ],
      },
      {
        name: "Android",
        color: C.green,
        icon: "Android",
        features: [
          "Talk Mode (hands-free)",
          "Camera analysis",
          "SMS Intercept",
          "Android Node",
          "Background Service",
        ],
      },
    ];

    platforms.forEach((plat, i) => {
      const x = 0.35 + i * 3.2;

      // Card background
      s.addShape("roundRect", {
        x, y: 0.85, w: 2.75, h: 3.5,
        rectRadius: 0.1,
        fill: { color: C.darkCard },
        line: { color: plat.color, width: 2 },
        shadow: mkShadow(),
      });
      // Header
      s.addShape("roundRect", {
        x, y: 0.85, w: 2.75, h: 0.65,
        rectRadius: 0.1,
        fill: { color: plat.color },
        line: { color: plat.color, width: 0 },
      });
      s.addText(plat.name, {
        x, y: 0.85, w: 2.75, h: 0.65,
        fontSize: 20, bold: true, fontFace: "Arial Black",
        color: C.white, align: "center", valign: "middle", margin: 0,
      });

      // Features
      plat.features.forEach((feat, fi) => {
        const fy = 1.6 + fi * 0.47;
        s.addShape("rect", {
          x: x + 0.2, y: fy + 0.13, w: 0.06, h: 0.06,
          fill: { color: plat.color }, line: { color: plat.color, width: 0 },
        });
        s.addText(feat, {
          x: x + 0.35, y: fy, w: 2.45, h: 0.38,
          fontSize: 11, fontFace: "Calibri", color: C.mutedDark,
          valign: "middle", margin: 0,
        });
      });
    });

    // ── ACP Protocol Footer ─────────────────────────────────────────────────
    s.addShape("roundRect", {
      x: 0.4, y: 4.5, w: 9.2, h: 0.9,
      rectRadius: 0.08,
      fill: { color: "0A1525" },
      line: { color: C.blue, width: 1 },
    });
    s.addText("ACP Protocol — Agent Communication Protocol", {
      x: 0.7, y: 4.55, w: 5.0, h: 0.3,
      fontSize: 12, bold: true, fontFace: "Calibri", color: C.amber,
    });
    const acpFlow = ["Mobile", "←→ ACP ←→", "Gateway", "←→", "Agent"];
    const acpColors = [C.blue, C.mutedDark, C.green, C.mutedDark, C.amber];
    acpFlow.forEach((part, i) => {
      s.addText(part, {
        x: 0.6 + i * 1.75, y: 4.85, w: 1.6, h: 0.35,
        fontSize: 12, bold: i % 2 === 0, fontFace: "Calibri",
        color: acpColors[i], align: "center", margin: 0,
      });
    });
    s.addText("Kết nối qua: Local WiFi / Tailscale / Relay Server", {
      x: 5.8, y: 4.6, w: 3.6, h: 0.6,
      fontSize: 10, fontFace: "Calibri", color: C.mutedDark,
      valign: "middle",
    });

    addPresenterNote(s, `SLIDE 15 — ỨNG DỤNG MOBILE
Thời gian: ~90 giây

Điểm chính:
- Ba nền tảng native: macOS (Swift), iOS (Swift + TestFlight), Android (Kotlin)
- ACP (Agent Communication Protocol) là giao thức nội bộ để mobile app nối với gateway
- iOS v2026.3.11 có redesign Home Canvas — giao diện mới đẹp hơn, responsive
- Android có SMS Intercept: agent có thể đọc và trả lời SMS (cần quyền)
- Talk Mode trên Android: rảnh tay hoàn toàn, nói chuyện như Siri

Lưu ý:
- iOS hiện qua TestFlight (beta), chưa có trên App Store chính thức
- ACP hỗ trợ 3 kiểu kết nối: Local WiFi (nhanh nhất), Tailscale VPN (an toàn), Relay (luôn ổn)

Câu hỏi dự kiến:
Q: "Có thể dùng trên Android không cần cài agent trên server không?"
A: "Có — Android Node cho phép chạy agent ngay trên thiết bị Android (offline), không cần server riêng."`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 16 — So Sanh & Benchmark
  // ───────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightBg };
    addTopBar(s, C.red);

    s.addText("So Sánh & Benchmark — Phân Tích", {
      x: 0.5, y: 0.15, w: 9.0, h: 0.55,
      fontSize: 28, bold: true, fontFace: "Calibri", color: C.navyText,
    });
    s.addShape("rect", {
      x: 0.5, y: 0.72, w: 9.0, h: 0.04,
      fill: { color: C.red }, line: { color: C.red, width: 0 },
    });

    // ── Bar Chart ──────────────────────────────────────────────────────────
    const chartData = [
      {
        name: "OpenClaw",
        labels: ["Privacy", "Channels", "LLM Flex", "Automation", "Cost", "Ease-of-Use"],
        values: [9, 9, 9, 8, 7, 3],
      },
      {
        name: "ChatGPT",
        labels: ["Privacy", "Channels", "LLM Flex", "Automation", "Cost", "Ease-of-Use"],
        values: [3, 2, 1, 2, 5, 9],
      },
      {
        name: "Claude.ai",
        labels: ["Privacy", "Channels", "LLM Flex", "Automation", "Cost", "Ease-of-Use"],
        values: [4, 1, 1, 2, 6, 8],
      },
      {
        name: "Siri",
        labels: ["Privacy", "Channels", "LLM Flex", "Automation", "Cost", "Ease-of-Use"],
        values: [6, 5, 1, 3, 8, 7],
      },
    ];

    s.addChart(pres.charts.BAR, chartData, {
      x: 0.5, y: 0.9, w: 6.2, h: 3.8,
      barDir: "col",
      barGrouping: "clustered",
      chartColors: [C.blue, C.amber, C.purple, C.green],
      showLegend: true,
      legendPos: "b",
      legendFontSize: 10,
      showValue: false,
      valAxisMinVal: 0,
      valAxisMaxVal: 10,
      catAxisLabelFontSize: 10,
      valAxisLabelFontSize: 10,
      titleFontSize: 12,
    });

    // ── Key Differentiators ─────────────────────────────────────────────────
    const diffs = [
      { label: "Duy nhất có Zalo", sub: "Kênh Vietnam", color: C.red    },
      { label: "Chạy Local (Ollama)", sub: "Zero cloud",  color: C.green  },
      { label: "Agent-to-Agent", sub: "ACP Protocol",    color: C.purple },
    ];
    s.addText("3 Điểm Khác Biệt:", {
      x: 6.9, y: 0.9, w: 2.7, h: 0.35,
      fontSize: 13, bold: true, fontFace: "Calibri", color: C.navyText,
    });
    diffs.forEach((d, i) => {
      const y = 1.3 + i * 0.85;
      s.addShape("roundRect", {
        x: 6.9, y, w: 2.7, h: 0.75,
        rectRadius: 0.08,
        fill: { color: d.color }, line: { color: d.color, width: 0 },
        shadow: mkShadow(),
      });
      s.addText(d.label, {
        x: 6.9, y, w: 2.7, h: 0.42,
        fontSize: 12, bold: true, fontFace: "Calibri",
        color: C.white, align: "center", valign: "middle", margin: 0,
      });
      s.addText(d.sub, {
        x: 6.9, y: y + 0.4, w: 2.7, h: 0.32,
        fontSize: 10, fontFace: "Calibri",
        color: "FFFFFF", align: "center", valign: "middle", margin: 0,
      });
    });

    // Score legend note
    s.addText("(Điểm 1-10, đánh giá chủ quan. 10 = tốt nhất cho tiêu chí đó)", {
      x: 0.5, y: 4.75, w: 9.0, h: 0.25,
      fontSize: 9, italic: true, fontFace: "Calibri", color: C.mutedLight, align: "center",
    });

    addPresenterNote(s, `SLIDE 16 — SO SÁNH & BENCHMARK
Thời gian: ~2 phút

Điểm chính:
- OpenClaw thắng tuyệt đối về: Privacy (9), Channels (9), LLM Flexibility (9)
- OpenClaw thua về: Ease-of-Use (3) — cần terminal, config files
- ChatGPT/Claude.ai tốt hơn cho: người dùng phổ thông, không quen tech

Sweet spot audience:
- Developer, DevOps, Power User có kiến thức tech
- Cần privacy cao (y tế, luật, tài chính)
- Sử dụng Zalo cho công việc

KHÔNG dùng OpenClaw khi:
- Chỉ cần chat đơn giản, không code/automation
- Không quen terminal/Node.js
- Cần kết quả ngay (setup mất ~30 phút)

Câu hỏi dự kiến:
Q: "ChatGPT có Channels riêng, tại sao điểm thấp?"
A: "ChatGPT có web và mobile app, nhưng KHÔNG có Telegram bot API, không có Zalo, không tích hợp vào Discord/Slack như OpenClaw. 2 điểm là chỉ là web + mobile."`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 17 — Design Patterns — Bai Hoc Kien Truc
  // ───────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightBg };
    addTopBar(s, C.purple);

    s.addText("Design Patterns — Bài Học Kiến Trúc", {
      x: 0.5, y: 0.15, w: 9.0, h: 0.55,
      fontSize: 28, bold: true, fontFace: "Calibri", color: C.navyText,
    });
    s.addShape("rect", {
      x: 0.5, y: 0.72, w: 9.0, h: 0.04,
      fill: { color: C.purple }, line: { color: C.purple, width: 0 },
    });

    const patterns = [
      {
        name: "Gateway Hub Pattern",
        desc: "N channels → 1 Gateway → 1 code path",
        snippet: "channel.on(msg) → gateway.route(msg)",
        color: C.blue,
      },
      {
        name: "Adapter Pattern",
        desc: "Interface chung cho tất cả channels",
        snippet: "class TelegramAdapter\n  implements ChannelAdapter",
        color: C.green,
      },
      {
        name: "Strategy Pattern",
        desc: "Runtime chon LLM provider tu config",
        snippet: "config.model →\n  LLMFactory.get(model)",
        color: C.amber,
      },
      {
        name: "Plugin (Open/Closed)",
        desc: "Mở rộng không sửa đổi core",
        snippet: "plugin.tools.forEach(\n  t => registry.add(t))",
        color: C.purple,
      },
      {
        name: "Approval Gate",
        desc: "Kiểm tra trước khi thực thi",
        snippet: "cmd → isSafe()\n  ? exec() : askUser()",
        color: C.red,
      },
      {
        name: "Failover Chain",
        desc: "Tự động chuyển khi lỗi",
        snippet: "try(primary) ?? \n  try(fallback) ?? err",
        color: "E67E22",
      },
    ];

    patterns.forEach((p, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 0.4 + col * 3.1;
      const y = 0.9 + row * 2.3;

      // Card
      s.addShape("roundRect", {
        x, y, w: 2.9, h: 2.15,
        rectRadius: 0.1,
        fill: { color: C.white },
        line: { color: p.color, width: 2 },
        shadow: mkShadow(),
      });
      // Color top strip
      s.addShape("roundRect", {
        x, y, w: 2.9, h: 0.5,
        rectRadius: 0.1,
        fill: { color: p.color },
        line: { color: p.color, width: 0 },
      });
      s.addText(p.name, {
        x, y, w: 2.9, h: 0.5,
        fontSize: 11, bold: true, fontFace: "Calibri",
        color: C.white, align: "center", valign: "middle", margin: 0,
      });
      // Description
      s.addText(p.desc, {
        x: x + 0.1, y: y + 0.55, w: 2.7, h: 0.5,
        fontSize: 11, fontFace: "Calibri", color: C.navyText,
        wrap: true,
      });
      // Code snippet box
      s.addShape("roundRect", {
        x: x + 0.1, y: y + 1.1, w: 2.7, h: 0.85,
        rectRadius: 0.06,
        fill: { color: C.codeBg }, line: { color: C.borderDark, width: 1 },
      });
      s.addText(p.snippet, {
        x: x + 0.15, y: y + 1.15, w: 2.6, h: 0.75,
        fontSize: 9, fontFace: "Courier New", color: C.green,
        valign: "top", margin: 0,
      });
    });

    addPresenterNote(s, `SLIDE 17 — DESIGN PATTERNS
Thời gian: ~2 phút

Điểm chính:
- 6 patterns này là xương sống của OpenClaw architecture
- Gateway Hub: giảm từ N*M kết nối xuống N+M (complexity linear thay vì quadratic)
- Adapter Pattern: thêm Zalo chỉ cần viết TelegramAdapter mới, không sửa gì hết
- Strategy Pattern: users có thể đổi LLM chỉ bằng 1 dòng config, không restart

Anti-patterns cần tránh (dành cho developers đang học):
- "God Agent": cho agent làm tất cả — nên chia nhỏ subagents theo domain
- "Skip Approval": bỏ qua cổng approval để nhanh hơn — nguy hiểm cho production
- "Trust AI Output": nếu LLM trả về code, phải review trước khi exec
- "Hardcode LLM": viết code giả sử luôn dùng GPT-4 — dùng LLMFactory thay

Câu hỏi dự kiến:
Q: "Failover Chain có tự động không hay phải config?"
A: "Tự động theo thứ tự trong config: primary → fallback1 → fallback2. Có timeout per attempt và jitter delay."`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 18 — Roadmap & Tuong Lai
  // ───────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.darkBg };
    addTopBar(s, C.amber);

    s.addText("Roadmap & Tương Lai", {
      x: 0.5, y: 0.15, w: 9.0, h: 0.55,
      fontSize: 32, bold: true, fontFace: "Arial Black", color: C.white,
    });

    // ── Released (v2026.3.11) ───────────────────────────────────────────────
    s.addShape("roundRect", {
      x: 0.4, y: 0.85, w: 4.5, h: 2.55,
      rectRadius: 0.1,
      fill: { color: C.darkCard }, line: { color: C.green, width: 2 },
      shadow: mkShadow(),
    });
    s.addShape("roundRect", {
      x: 0.4, y: 0.85, w: 4.5, h: 0.45,
      rectRadius: 0.1,
      fill: { color: C.green }, line: { color: C.green, width: 0 },
    });
    s.addText("Đã phát hành (v2026.3.11)", {
      x: 0.4, y: 0.85, w: 4.5, h: 0.45,
      fontSize: 13, bold: true, fontFace: "Calibri",
      color: C.white, align: "center", valign: "middle", margin: 0,
    });
    const released = [
      "7 CVE fixes bảo mật nghiêm trọng",
      "iOS Home Canvas redesign",
      "Ollama onboard wizard",
      "Gemini multimodal support",
      "Android Talk Mode",
      "LanceDB memory upgrade",
      "Plugin SDK v2.0",
    ];
    released.forEach((item, i) => {
      s.addShape("rect", {
        x: 0.7, y: 1.4 + i * 0.29 + 0.06, w: 0.12, h: 0.12,
        fill: { color: C.green }, line: { color: C.green, width: 0 },
      });
      s.addText(item, {
        x: 0.9, y: 1.4 + i * 0.29, w: 3.8, h: 0.28,
        fontSize: 11, fontFace: "Calibri", color: C.mutedDark, margin: 0,
      });
    });

    // ── In Development ──────────────────────────────────────────────────────
    s.addShape("roundRect", {
      x: 5.1, y: 0.85, w: 4.5, h: 2.55,
      rectRadius: 0.1,
      fill: { color: C.darkCard }, line: { color: C.amber, width: 2 },
      shadow: mkShadow(),
    });
    s.addShape("roundRect", {
      x: 5.1, y: 0.85, w: 4.5, h: 0.45,
      rectRadius: 0.1,
      fill: { color: C.amber }, line: { color: C.amber, width: 0 },
    });
    s.addText("Đang phát triển", {
      x: 5.1, y: 0.85, w: 4.5, h: 0.45,
      fontSize: 13, bold: true, fontFace: "Calibri",
      color: C.white, align: "center", valign: "middle", margin: 0,
    });
    const inDev = [
      "7 CVE fixes bổ sung",
      "Enhanced ACP v2",
      "Performance optimization",
      "iOS App Store submission",
      "WebAssembly sandbox",
      "Multi-user Gateway",
      "Enterprise SSO/RBAC",
    ];
    inDev.forEach((item, i) => {
      s.addShape("rect", {
        x: 5.4, y: 1.4 + i * 0.29 + 0.06, w: 0.12, h: 0.12,
        fill: { color: C.amber }, line: { color: C.amber, width: 0 },
      });
      s.addText(item, {
        x: 5.6, y: 1.4 + i * 0.29, w: 3.8, h: 0.28,
        fontSize: 11, fontFace: "Calibri", color: C.mutedDark, margin: 0,
      });
    });

    // ── Future Vision ───────────────────────────────────────────────────────
    s.addShape("roundRect", {
      x: 0.4, y: 3.55, w: 6.0, h: 1.2,
      rectRadius: 0.1,
      fill: { color: "0A1525" }, line: { color: C.purple, width: 1 },
    });
    s.addText("Định hướng tương lai:", {
      x: 0.6, y: 3.62, w: 5.6, h: 0.3,
      fontSize: 12, bold: true, fontFace: "Calibri", color: C.amber,
    });
    const future = ["Agent Marketplace (ClawHub)", "Edge deployment / IoT", "Enterprise (SSO, RBAC, audit log)"];
    future.forEach((f, i) => {
      s.addText("→ " + f, {
        x: 0.6, y: 3.95 + i * 0.26, w: 5.6, h: 0.26,
        fontSize: 10, fontFace: "Calibri", color: C.mutedDark, margin: 0,
      });
    });

    // ── Stats Box ──────────────────────────────────────────────────────────
    s.addShape("roundRect", {
      x: 6.6, y: 3.55, w: 3.0, h: 1.2,
      rectRadius: 0.1,
      fill: { color: "0A1525" }, line: { color: C.blue, width: 1 },
    });
    s.addText("22,100+ stars", {
      x: 6.6, y: 3.65, w: 3.0, h: 0.4,
      fontSize: 18, bold: true, fontFace: "Calibri",
      color: C.amber, align: "center",
    });
    s.addText("Pi-Mono / GitHub", {
      x: 6.6, y: 4.05, w: 3.0, h: 0.28,
      fontSize: 11, fontFace: "Calibri",
      color: C.mutedDark, align: "center",
    });
    s.addText("OpenAI + Vercel sponsors", {
      x: 6.6, y: 4.33, w: 3.0, h: 0.28,
      fontSize: 10, fontFace: "Calibri",
      color: C.green, align: "center",
    });

    addPresenterNote(s, `SLIDE 18 — ROADMAP
Thời gian: ~90 giây

Điểm chính:
- v2026.3.11 là phiên bản kỹ thuật lớn nhất trong 2 năm
- 7 CVE đã vá thêm 7 đang fix — security-first mindset
- iOS App Store là mục tiêu chính của Q2 2026
- WebAssembly sandbox sẽ thay thế Node.js sandbox hiện tại — an toàn hơn, nhanh hơn

Sự ổn định tài chính:
- 22,100+ GitHub stars — đủ lớn để thu hút sponsors
- OpenAI và Vercel đang tài trợ → đủ tiền để phát triển full-time
- MIT license: users có thể dùng thương mại miễn phí

Câu hỏi dự kiến:
Q: "Bao giờ có trên iOS App Store?"
A: "Target Q2 2026 — đang qua review Apple. Hiện tại có qua TestFlight (beta public)."

Q: "Enterprise có on premise không?"
A: "Có — OpenClaw đã có thể deploy on-prem. Enterprise tier thêm SSO (SAML), RBAC, audit log và support contract."`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 19 — Quick Start
  // ───────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightBg };
    addTopBar(s, C.green);

    s.addText("Quick Start — Cài Đặt & Cấu Hình", {
      x: 0.5, y: 0.15, w: 9.0, h: 0.55,
      fontSize: 28, bold: true, fontFace: "Calibri", color: C.navyText,
    });
    s.addShape("rect", {
      x: 0.5, y: 0.72, w: 9.0, h: 0.04,
      fill: { color: C.green }, line: { color: C.green, width: 0 },
    });

    // ── 3 Steps ────────────────────────────────────────────────────────────
    const steps = [
      {
        num: "1",
        title: "Cài đặt",
        cmd: "npm install -g openclaw@latest",
        desc: "Yêu cầu Node.js >= 22",
        color: C.blue,
      },
      {
        num: "2",
        title: "Chạy Wizard",
        cmd: "openclaw onboard --install-daemon",
        desc: "Cài đặt daemon, chọn kênh và LLM",
        color: C.purple,
      },
      {
        num: "3",
        title: "Kiểm tra",
        cmd: "openclaw doctor",
        desc: 'Rồi thử: openclaw agent --message "Hello"',
        color: C.green,
      },
    ];

    steps.forEach((step, i) => {
      const x = 0.4 + i * 3.1;

      // Step card
      s.addShape("roundRect", {
        x, y: 0.9, w: 2.9, h: 2.0,
        rectRadius: 0.1,
        fill: { color: C.white },
        line: { color: step.color, width: 2 },
        shadow: mkShadow(),
      });

      // Number badge
      s.addShape("ellipse", {
        x: x + 1.1, y: 0.82, w: 0.7, h: 0.7,
        fill: { color: step.color }, line: { color: step.color, width: 0 },
        shadow: mkShadow(),
      });
      s.addText(step.num, {
        x: x + 1.1, y: 0.82, w: 0.7, h: 0.7,
        fontSize: 20, bold: true, fontFace: "Arial Black",
        color: C.white, align: "center", valign: "middle", margin: 0,
      });

      // Step title
      s.addText(step.title, {
        x, y: 1.55, w: 2.9, h: 0.35,
        fontSize: 14, bold: true, fontFace: "Calibri",
        color: C.navyText, align: "center",
      });

      // Command box
      s.addShape("roundRect", {
        x: x + 0.1, y: 1.95, w: 2.7, h: 0.45,
        rectRadius: 0.06,
        fill: { color: C.codeBg }, line: { color: C.borderDark, width: 1 },
      });
      s.addText(step.cmd, {
        x: x + 0.1, y: 1.95, w: 2.7, h: 0.45,
        fontSize: 9, fontFace: "Courier New", color: C.green,
        align: "center", valign: "middle", margin: 0,
      });

      // Description
      s.addText(step.desc, {
        x: x + 0.1, y: 2.48, w: 2.7, h: 0.35,
        fontSize: 10, fontFace: "Calibri", color: C.mutedLight,
        align: "center",
      });
    });

    // ── Config JSON Box ─────────────────────────────────────────────────────
    s.addShape("roundRect", {
      x: 0.4, y: 3.05, w: 9.2, h: 1.8,
      rectRadius: 0.1,
      fill: { color: C.codeBg },
      line: { color: C.borderDark, width: 1 },
      shadow: mkShadow(),
    });
    s.addShape("roundRect", {
      x: 0.4, y: 3.05, w: 9.2, h: 0.32,
      rectRadius: 0.1,
      fill: { color: "2A3A5A" }, line: { color: C.borderDark, width: 0 },
    });
    s.addText("~/.openclaw/config.json — Cấu hình chính", {
      x: 0.4, y: 3.05, w: 9.2, h: 0.32,
      fontSize: 10, fontFace: "Calibri", color: C.mutedDark,
      align: "center", valign: "middle", margin: 0,
    });

    const jsonLines = [
      { text: '{',                                              color: C.white  },
      { text: '  "gateway":  { "port": 18789, "auth": { "mode": "token" } },', color: C.mutedDark },
      { text: '  "agents":   { "default": { "model": "anthropic/claude-sonnet-4-6" } },', color: C.mutedDark },
      { text: '  "plugins":  ["telegram", "discord"]',         color: C.green  },
      { text: '}',                                              color: C.white  },
    ];
    jsonLines.forEach((line, i) => {
      s.addText(line.text, {
        x: 0.6, y: 3.43 + i * 0.25, w: 8.8, h: 0.25,
        fontSize: 11, fontFace: "Courier New", color: line.color, margin: 0,
      });
    });

    addPresenterNote(s, `SLIDE 19 — QUICK START
Thời gian: ~90 giây

Điểm chính:
- 3 lệnh là đủ để chạy: install → onboard → doctor
- Onboard wizard tự động hỏi: chọn kênh, nhập API key, chọn LLM
- openclaw doctor kiểm tra: daemon running, auth ok, kênh kết nối, LLM ok
- Config JSON rất đơn giản — port, auth mode, model, plugins

Yêu cầu hệ thống:
- Node.js >= 22 (quan trọng — không chạy trên Node 18/20)
- 512MB RAM tối thiểu (không tính LLM local)
- Cho Ollama local: VRAM tùy model (llama3.3:70b cần ~40GB VRAM)

3 use cases để demo:
1. DevOps automation: cron + Telegram alert + run_bash
2. Discord bot cho game community (CCN2 use case!)
3. Offline AI với Ollama + Zalo (không cloud, không phí)

Câu hỏi dự kiến:
Q: "Có thể dùng nhiều agents cùng lúc không?"
A: "Có — config 'agents' là object, có thể có main, coder, devops, mỗi agent có model và skills riêng."`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 20 — Use Cases Thuc Te
  // ───────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.darkBg };
    addTopBar(s, C.amber);

    s.addText("Use Cases Thực Tế", {
      x: 0.5, y: 0.15, w: 9.0, h: 0.55,
      fontSize: 32, bold: true, fontFace: "Arial Black", color: C.white,
    });

    const cases = [
      {
        title: "DevOps Automation",
        color: C.blue,
        features: [
          "Cron job báo cáo hàng ngày",
          "Telegram alert + Slack #ops",
          "run_bash + web_fetch",
          "Monitor server health",
          "Auto-restart services",
        ],
        tech: "Bash + Telegram + Cron",
      },
      {
        title: "Game Community Bot",
        color: C.green,
        features: [
          "Discord bot CCN2 game",
          "Claude Haiku (rẻ chi phí)",
          "Strict sandbox mode",
          "Read-only skills only",
          "Leaderboard + stats",
        ],
        tech: "Discord + Claude Haiku",
      },
      {
        title: "Offline Local AI",
        color: C.purple,
        features: [
          "Ollama + llama3.3:70b",
          "Zero cloud dependency",
          "LanceDB memory local",
          "Zalo + iMessage",
          "100% private",
        ],
        tech: "Ollama + LanceDB",
      },
    ];

    cases.forEach((c, i) => {
      const x = 0.4 + i * 3.15;

      // Card
      s.addShape("roundRect", {
        x, y: 0.85, w: 3.0, h: 4.1,
        rectRadius: 0.1,
        fill: { color: C.darkCard },
        line: { color: c.color, width: 2 },
        shadow: mkShadow(),
      });

      // Header
      s.addShape("roundRect", {
        x, y: 0.85, w: 2.85, h: 0.65,
        rectRadius: 0.1,
        fill: { color: c.color }, line: { color: c.color, width: 0 },
      });
      s.addText(c.title, {
        x, y: 0.85, w: 2.85, h: 0.65,
        fontSize: 13, bold: true, fontFace: "Calibri",
        color: C.white, align: "center", valign: "middle", margin: 0,
      });

      // Features
      c.features.forEach((feat, fi) => {
        const fy = 1.6 + fi * 0.52;
        s.addShape("rect", {
          x: x + 0.2, y: fy + 0.15, w: 0.1, h: 0.1,
          fill: { color: c.color }, line: { color: c.color, width: 0 },
        });
        s.addText(feat, {
          x: x + 0.38, y: fy, w: 2.5, h: 0.42,
          fontSize: 11, fontFace: "Calibri", color: C.mutedDark,
          valign: "middle", margin: 0,
        });
      });

      // Tech badge
      s.addShape("roundRect", {
        x: x + 0.2, y: 4.35, w: 2.6, h: 0.4,
        rectRadius: 0.06,
        fill: { color: "0A1525" }, line: { color: c.color, width: 1 },
      });
      s.addText(c.tech, {
        x: x + 0.2, y: 4.35, w: 2.6, h: 0.4,
        fontSize: 10, fontFace: "Calibri", color: c.color,
        align: "center", valign: "middle", margin: 0,
      });
    });

    addPresenterNote(s, `SLIDE 20 — USE CASES THỰC TẾ
Thời gian: ~2 phút

Điểm chính:
- 3 use cases thực tế, mỗi cái có ROI rõ ràng
- Use case 2 (Game Community Bot) LIÊN QUAN TRỰC TIẾP đến CCN2 project!
  → CCN2 là board game, có thể dùng OpenClaw làm Discord bot cho game
  → Claude Haiku rẻ nhất ($0.25/M tokens) — phù hợp cho game community (nhiều query, low budget)
  → Strict sandbox: bot chỉ đọc (read ranking, hỏi rules), KHÔNG ghi

Nhấn mạnh cho khán giả developer:
- Use case 1: nếu làm DevOps/SRE, tiết kiệm 2-3 giờ/ngày tự động hóa báo cáo
- Use case 3: privacy use case (bác sĩ, luật sư, ngân hàng) — data không bao giờ rời máy

Demo gợi ý:
- Nếu có thời gian, demo live: "openclaw agent --message 'Xin chào, bạn là ai?'"

Câu hỏi dự kiến:
Q: "Chi phí với Claude Haiku là bao nhiêu?"
A: "$0.25 per million input tokens — với game community bot ~1000 queries/ngày, chi phí chỉ ~$0.01/ngày."`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 21 — Data Flow — Vi Du Thuc Te
  // ───────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightBg };
    addTopBar(s, C.blue);

    s.addText("Data Flow — Ví Dụ Thực Tế", {
      x: 0.5, y: 0.15, w: 9.0, h: 0.55,
      fontSize: 28, bold: true, fontFace: "Calibri", color: C.navyText,
    });
    s.addShape("rect", {
      x: 0.5, y: 0.72, w: 9.0, h: 0.04,
      fill: { color: C.blue }, line: { color: C.blue, width: 0 },
    });

    // Scenario label
    s.addShape("roundRect", {
      x: 0.5, y: 0.82, w: 9.0, h: 0.35,
      rectRadius: 0.06,
      fill: { color: "EAF4FF" }, line: { color: C.blue, width: 1 },
    });
    s.addText('Ví dụ: User Telegram hỏi "Thời tiết Hà Nội hôm nay như thế nào?"', {
      x: 0.5, y: 0.82, w: 9.0, h: 0.35,
      fontSize: 11, italic: true, fontFace: "Calibri",
      color: C.navyText, align: "center", valign: "middle",
    });

    // Flow steps
    const flowSteps = [
      { label: "User (Telegram)",    note: "Gửi tin nhắn",               color: C.blue,   x: 0.3  },
      { label: "Channel Extension",  note: "Parse Telegram message",      color: "2980B9", x: 1.55 },
      { label: "Gateway",            note: "Nhận WebSocket event",        color: C.purple, x: 2.8  },
      { label: "Auth Check",         note: "Validate JWT token",          color: C.red,    x: 4.05 },
      { label: "7-Tier Router",      note: "Route: main agent",           color: C.amber,  x: 5.3  },
      { label: "Agent Runtime",      note: "8,432 tokens context",        color: C.green,  x: 6.55 },
      { label: "LLM (Claude)",       note: "tool_call: weather_fetch",    color: "16A085", x: 7.8  },
    ];

    // Draw flow row 1 (boxes with arrows)
    flowSteps.forEach((step, i) => {
      // Box
      s.addShape("roundRect", {
        x: step.x, y: 1.3, w: 1.1, h: 0.7,
        rectRadius: 0.07,
        fill: { color: step.color }, line: { color: step.color, width: 0 },
        shadow: mkShadow(),
      });
      s.addText(step.label, {
        x: step.x, y: 1.3, w: 1.1, h: 0.7,
        fontSize: 8, bold: true, fontFace: "Calibri",
        color: C.white, align: "center", valign: "middle", margin: 2,
      });
      // Arrow (except last in row)
      if (i < flowSteps.length - 1) {
        s.addText("→", {
          x: step.x + 1.12, y: 1.5, w: 0.28, h: 0.3,
          fontSize: 14, color: C.mutedLight, align: "center", margin: 0,
        });
      }
      // Note below
      s.addText(step.note, {
        x: step.x - 0.08, y: 2.08, w: 1.26, h: 0.42,
        fontSize: 7, fontFace: "Calibri", color: C.mutedLight,
        align: "center", wrap: true,
      });
    });

    // Second flow row (after LLM)
    const flowSteps2 = [
      { label: "Skills Executor",    note: "web_fetch weather API",      color: C.amber,  x: 0.3  },
      { label: "LLM (Claude)",       note: "Tổng hợp kết quả",           color: "16A085", x: 1.55 },
      { label: "Agent Runtime",      note: "Format response",            color: C.green,  x: 2.8  },
      { label: "Gateway",            note: "Streaming response",         color: C.purple, x: 4.05 },
      { label: "Channel Extension",  note: "Format Telegram message",    color: "2980B9", x: 5.3  },
      { label: "User (Telegram)",    note: '"28 độ C, nắng, ít mây"',    color: C.blue,   x: 6.55 },
    ];

    s.addText("↓", {
      x: 8.4, y: 1.55, w: 0.5, h: 0.8,
      fontSize: 18, color: C.mutedLight, align: "center",
    });
    s.addText("↓ tiếp theo", {
      x: 7.95, y: 2.0, w: 1.1, h: 0.25,
      fontSize: 8, fontFace: "Calibri", color: C.mutedLight, align: "center",
    });

    flowSteps2.forEach((step, i) => {
      s.addShape("roundRect", {
        x: step.x, y: 2.65, w: 1.1, h: 0.7,
        rectRadius: 0.07,
        fill: { color: step.color }, line: { color: step.color, width: 0 },
        shadow: mkShadow(),
      });
      s.addText(step.label, {
        x: step.x, y: 2.65, w: 1.1, h: 0.7,
        fontSize: 8, bold: true, fontFace: "Calibri",
        color: C.white, align: "center", valign: "middle", margin: 2,
      });
      if (i < flowSteps2.length - 1) {
        s.addText("→", {
          x: step.x + 1.12, y: 2.85, w: 0.28, h: 0.3,
          fontSize: 14, color: C.mutedLight, align: "center", margin: 0,
        });
      }
      s.addText(step.note, {
        x: step.x - 0.08, y: 3.43, w: 1.26, h: 0.42,
        fontSize: 7, fontFace: "Calibri", color: C.mutedLight,
        align: "center", wrap: true,
      });
    });

    // Key insight footer
    s.addShape("roundRect", {
      x: 0.4, y: 3.98, w: 9.2, h: 0.75,
      rectRadius: 0.08,
      fill: { color: "EAF4FF" }, line: { color: C.blue, width: 1 },
    });
    const insights = [
      "Toàn bộ luồng xử lý: ~800ms",
      "Approval: KHÔNG (weather là read-only)",
      "Context: 8,432 tokens (lịch sử + memory)",
      "Streaming: user thấy response theo từng chữ",
    ];
    insights.forEach((ins, i) => {
      s.addShape("rect", {
        x: 0.55 + i * 2.3, y: 4.12, w: 0.08, h: 0.08,
        fill: { color: C.blue }, line: { color: C.blue, width: 0 },
      });
      s.addText(ins, {
        x: 0.68 + i * 2.3, y: 4.05, w: 2.1, h: 0.55,
        fontSize: 9, fontFace: "Calibri", color: C.navyText,
        valign: "middle", wrap: true,
      });
    });

    addPresenterNote(s, `SLIDE 21 — DATA FLOW
Thời gian: ~2 phút

Điểm chính:
- Ví dụ cụ thể: hỏi thời tiết qua Telegram → trả lời trong ~800ms
- Luồng đi qua 10 bước nhưng hầu hết < 10ms mỗi bước
- Approval KHÔNG cần vì weather là read-only skill (chỉ web_fetch, không ghi gì)
- Streaming: response hiện ra theo từng token, user không phải đợi full

Nhấn mạnh:
- Server-authoritative: agent quyết định có thực thi skill hay không (không phải LLM)
- LLM chỉ "đề nghị" tool_call, còn agent runtime validate trước khi chạy
- Context Engine giữ lịch sử 10 tin nhắn gần nhất + memory search

Câu hỏi dự kiến:
Q: "Nếu weather API hết hạn, agent làm gì?"
A: "Failover Chain: thử provider 1 → fail → thử provider 2 → fail → báo lỗi thân thiện cho user, không crash."

Q: "800ms có quá chậm không?"
A: "Phụ thuộc network và LLM. Với Haiku local proxy: ~200ms. Với Claude.ai API từ Việt Nam: ~1-2s. Streaming ẩn buffer tốt hơn cái cảm giác."`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 22 — Ket Luan
  // ───────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.darkBg };
    addTopBar(s, C.amber);

    // Decorative circle (top-right) — pushed far off-edge to avoid content overlap
    s.addShape("ellipse", {
      x: 9.2, y: -1.6, w: 1.8, h: 1.8,
      fill: { color: "1A2D42" }, line: { color: C.amber, width: 2 },
    });

    s.addText("Kết Luận", {
      x: 0.5, y: 0.15, w: 6.5, h: 0.55,
      fontSize: 36, bold: true, fontFace: "Arial Black", color: C.white,
      shadow: mkShadow(),
    });

    // ── 3 Summary Callout Boxes ─────────────────────────────────────────────
    const summaries = [
      {
        text: "AI Gateway tự chủ — chạy trên máy bạn, 22+ kênh, 30+ LLMs",
        color: C.blue,
        icon: "Gateway",
      },
      {
        text: "Công cụ cho power users — cron, browser control, shell, multi-agent",
        color: C.amber,
        icon: "Power",
      },
      {
        text: "Privacy-first — data không rời máy, MIT license, không vendor lock-in",
        color: C.green,
        icon: "Privacy",
      },
    ];

    summaries.forEach((sum, i) => {
      const y = 0.9 + i * 0.95;
      s.addShape("roundRect", {
        x: 0.4, y, w: 6.8, h: 0.82,
        rectRadius: 0.1,
        fill: { color: C.darkCard },
        line: { color: sum.color, width: 2 },
        shadow: mkShadow(),
      });
      // Color left accent
      s.addShape("rect", {
        x: 0.4, y, w: 0.18, h: 0.82,
        fill: { color: sum.color }, line: { color: sum.color, width: 0 },
      });
      s.addText(sum.text, {
        x: 0.75, y, w: 6.3, h: 0.82,
        fontSize: 13, fontFace: "Calibri",
        color: C.white, valign: "middle", wrap: true,
      });
    });

    // ── When to Use / Not Use ──────────────────────────────────────────────
    const colData = [
      {
        header: "Dùng khi",
        color: C.green,
        items: ["Developer / DevOps", "Cần sử dụng Zalo", "Cần privacy cao", "Muốn offline AI (Ollama)", "Thích tự động hóa"],
        tick: "OK",
      },
      {
        header: "Không dùng khi",
        color: C.red,
        items: ["Muốn dùng ngay (setup ~30 phút)", "Không quen terminal", "Chỉ cần chat đơn giản", "Không có server/VPS"],
        tick: "NO",
      },
    ];

    colData.forEach((col, i) => {
      const x = 7.4;
      const y = 0.9 + i * 2.3;

      s.addShape("roundRect", {
        x, y, w: 2.15, h: 2.1,
        rectRadius: 0.1,
        fill: { color: C.darkCard },
        line: { color: col.color, width: 1 },
      });
      s.addShape("roundRect", {
        x, y, w: 2.15, h: 0.4,
        rectRadius: 0.1,
        fill: { color: col.color }, line: { color: col.color, width: 0 },
      });
      s.addText(col.header, {
        x, y, w: 2.15, h: 0.4,
        fontSize: 12, bold: true, fontFace: "Calibri",
        color: C.white, align: "center", valign: "middle", margin: 0,
      });
      col.items.forEach((item, ii) => {
        s.addText((col.tick === "OK" ? "+ " : "- ") + item, {
          x: x + 0.1, y: y + 0.5 + ii * 0.33, w: 1.95, h: 0.32,
          fontSize: 10, fontFace: "Calibri",
          color: col.tick === "OK" ? C.green : C.mutedDark,
          margin: 0,
        });
      });
    });

    // ── Bottom bar with GitHub + version ────────────────────────────────────
    s.addShape("rect", {
      x: 0, y: 5.1, w: "100%", h: 0.04,
      fill: { color: C.amber }, line: { color: C.amber, width: 0 },
    });
    s.addText("github.com/Pi-0r-Tau/pi-mono  |  OpenClaw v2026.3.11  |  MIT License  |  22,100+ stars", {
      x: 0.4, y: 5.2, w: 9.2, h: 0.3,
      fontSize: 10, fontFace: "Calibri", color: C.mutedDark, align: "center",
    });

    addPresenterNote(s, `SLIDE 22 — KẾT LUẬN
Thời gian: ~2 phút + Q&A

Ba điểm chính cần nhớ:
1. GATEWAY: OpenClaw là lớp middleware giữa LLM và kênh nhắn tin — không phải chatbot
2. POWER: Dành cho developer/DevOps — có thể chạy shell script, browser, git từ nhiên liệu chat
3. PRIVACY: MIT license + self-hosted = zero vendor lock-in, data ở lại máy bạn

Kêu gọi hành động:
- "Chúng ta có thể thử cài đặt ngay trên laptop trong 5 phút, ai muốn thử sau buổi học?"
- "Star repo Pi-Mono trên GitHub để hỗ trợ team — hiện có 22,100+ stars"
- "Nếu bạn đang làm Discord bot cho CCN2 game, đây là giải pháp phù hợp nhất"

Phần Q&A gợi ý:
- Để mở cửa: "Các bạn có câu hỏi gì không? Đặc biệt về phần so sánh với ChatGPT hay về việc tích hợp vào dự án cụ thể?"
- Nếu không có câu hỏi: demo live 2 phút (cài đặt + gọi agent)

Câu hỏi dự kiến:
Q: "Có documentation tiếng Việt không?"
A: "Hiện tại docs chủ yếu tiếng Anh, nhưng community có một số guides tiếng Việt. OpenClaw GUI (Claw Desktop) có tiếng Việt."

Q: "Security có audit chưa?"
A: "Community audit, không phải formal pentest. 14 CVE đã fix kể từ 2024. Cho enterprise, recommend tự chạy pentest trước deploy."`);
  }

} // end addSlides12to22

module.exports = { addSlides12to22 };
