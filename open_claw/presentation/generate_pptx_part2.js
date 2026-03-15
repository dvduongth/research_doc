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
      { label: "Nhan tin",         color: C.blue   },
      { label: "Context Engine",   color: C.purple },
      { label: "Memory Search",    color: C.green  },
      { label: "Skills Injection", color: C.amber  },
      { label: "LLM Suy nghi",     color: C.blue   },
      { label: "Tool Executor",    color: C.red    },
      { label: "Response",         color: C.green  },
      { label: "Luu context",      color: C.purple },
    ];

    s.addText("Luong xu ly", {
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
Thoi gian: ~90 giay

Diem chinh:
- Agent la don vi co ban — moi agent co ten rieng, model rieng, skills rieng
- Dual-loop: outer loop xu ly tin nhan, inner loop cho tool calls
- Context Engine: gom lich su hoi thoai + memory search + system prompt
- Skills duoc inject vao LLM nhu "tools" (OpenAI function calling format)
- Khi co action nguy hiem (delete, send email, shell), sandbox bat buoc approval

Cau hoi du kien:
Q: "LLM co the goi nhieu skills mot luc khong?"
A: "Co, agent ho tro parallel tool execution — LLM tra ve nhieu tool_calls cung luc, executor chay song song roi tong hop ket qua."

Q: "Memory search hoat dong nhu the nao?"
A: "LanceDB tao vector embedding cho moi tin nhan, Context Engine lay top-K related memories truoc khi gui cho LLM."`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 13 — 52 Built-in Skills
  // ───────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightBg };
    addTopBar(s, C.green);

    s.addText("52 Built-in Skills — He Thong Ky Nang", {
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
Thoi gian: ~90 giay

Diem chinh:
- 52 skills chia 6 nhom, cover tat ca use cases pho bien
- NGUY HIEM — can approval: run_bash, run_python, delete_file, send_email, create_pr
- AN TOAN — khong can approval: read_file, web_fetch, memory_recall, git_status
- ClawHub cho phep cai them skills tu cong dong (nhu npm packages)

Luu y cho nguoi dung:
- Sandbox mode: moi lan skill de thay doi trang thai (ghi file, gui tin) se hien popup xac nhan
- Co the whitelist skills cho agent cu the trong config

Cau hoi du kien:
Q: "Co the viet them skill khong?"
A: "Co, qua Plugin SDK — viet TypeScript, publish len ClawHub, cai voi mot lenh."`);
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
      { label: "Channel 22+",      color: C.blue,   sub: "Them kenh nhan tin" },
      { label: "Memory",           color: C.purple, sub: "Vector DB custom"   },
      { label: "AI Enhancement",   color: C.green,  sub: "Tool + provider"    },
      { label: "Mobile",           color: C.red,    sub: "iOS / Android ACP"  },
    ];
    s.addText("4 loai Extension:", {
      x: 6.3, y: 0.9, w: 3.2, h: 0.35,
      fontSize: 13, bold: true, fontFace: "Calibri", color: C.navyText,
    });
    extTypes.forEach((ext, i) => {
      const y = 1.3 + i * 0.62;
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
        color: "FFFFFFCC", align: "center", valign: "middle", margin: 0,
      });
    });

    // ── ClawHub Box ─────────────────────────────────────────────────────────
    s.addShape("roundRect", {
      x: 0.5, y: 3.05, w: 9.0, h: 1.05,
      rectRadius: 0.1,
      fill: { color: "EAF4FF" },
      line: { color: C.blue, width: 1 },
    });
    s.addText("ClawHub — Registry cong dong", {
      x: 0.7, y: 3.1, w: 4.0, h: 0.35,
      fontSize: 13, bold: true, fontFace: "Calibri", color: C.navyText,
    });
    s.addText("Phat hien, cai dat va chia se plugins:", {
      x: 0.7, y: 3.45, w: 4.0, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: C.mutedLight,
    });
    // Install command box
    s.addShape("roundRect", {
      x: 4.9, y: 3.15, w: 4.4, h: 0.4,
      rectRadius: 0.06,
      fill: { color: C.codeBg }, line: { color: C.borderDark, width: 1 },
    });
    s.addText("openclaw plugin install clawhub:weather-forecast", {
      x: 5.0, y: 3.15, w: 4.2, h: 0.4,
      fontSize: 11, fontFace: "Courier New", color: C.green,
      valign: "middle", margin: 0,
    });
    s.addText("mcporter cho phep ket noi voi MCP ecosystem (Model Context Protocol)", {
      x: 0.7, y: 3.78, w: 8.6, h: 0.25,
      fontSize: 10, italic: true, fontFace: "Calibri", color: C.mutedLight,
    });

    // ── Principle footer ────────────────────────────────────────────────────
    s.addShape("rect", {
      x: 0.5, y: 4.2, w: 9.0, h: 0.04,
      fill: { color: C.amber }, line: { color: C.amber, width: 0 },
    });
    s.addText("Nguyen tac: Open/Closed Principle — Mo rong khong sua doi core", {
      x: 0.5, y: 4.28, w: 9.0, h: 0.3,
      fontSize: 12, italic: true, fontFace: "Calibri", color: C.navyText, align: "center",
    });

    addPresenterNote(s, `SLIDE 14 — PLUGIN SDK & CLAWHUB
Thoi gian: ~2 phut

Diem chinh:
- Plugin interface chi 4 truong — don gian nhung manh
- tools: them skills moi cho agent (vi du: goi API rieng)
- channels: tich hop them kenh nhan tin (vi du: Zalo OA, Viber)
- providers: them LLM khac (vi du: Grok, Amazon Bedrock)
- routes: them HTTP endpoints (vi du: webhook receiver)
- ClawHub hoat dong nhu npm/PyPI cho OpenClaw plugins
- MCP (Model Context Protocol) cua Anthropic duoc ho tro qua mcporter bridge

Cau hoi du kien:
Q: "MCP la gi?"
A: "Model Context Protocol cua Anthropic — chuan thong nhat cho LLM tu truy cap external tools. OpenClaw ket noi voi MCP ecosystem qua mcporter, nen co the dung bat ky MCP server nao."

Q: "Ai co the publish plugin len ClawHub?"
A: "Bat ky ai — can dang ky, pass security review co ban, roi publish. Tuong tu npm public registry."`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 15 — Ung Dung Mobile
  // ───────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.darkBg };
    addTopBar(s, C.blue);

    s.addText("Ung Dung Mobile", {
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
      const x = 0.4 + i * 3.15;

      // Card background
      s.addShape("roundRect", {
        x, y: 0.85, w: 3.0, h: 3.5,
        rectRadius: 0.1,
        fill: { color: C.darkCard },
        line: { color: plat.color, width: 2 },
        shadow: mkShadow(),
      });
      // Header
      s.addShape("roundRect", {
        x, y: 0.85, w: 3.0, h: 0.65,
        rectRadius: 0.1,
        fill: { color: plat.color },
        line: { color: plat.color, width: 0 },
      });
      s.addText(plat.name, {
        x, y: 0.85, w: 3.0, h: 0.65,
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
          x: x + 0.35, y: fy, w: 2.55, h: 0.38,
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
    s.addText("Ket noi qua: Local WiFi / Tailscale / Relay Server", {
      x: 5.8, y: 4.6, w: 3.6, h: 0.6,
      fontSize: 10, fontFace: "Calibri", color: C.mutedDark,
      valign: "middle",
    });

    addPresenterNote(s, `SLIDE 15 — UNG DUNG MOBILE
Thoi gian: ~90 giay

Diem chinh:
- Ba nen tang native: macOS (Swift), iOS (Swift + TestFlight), Android (Kotlin)
- ACP (Agent Communication Protocol) la giao thuc noi bo de mobile app noi voi gateway
- iOS v2026.3.11 co redesign Home Canvas — giao dien moi dep hon, responsive
- Android co SMS Intercept: agent co the doc va tra loi SMS (can quyen)
- Talk Mode tren Android: roi tay hoan toan, noi chuyen nhu Siri

Luu y:
- iOS hien qua TestFlight (beta), chua co tren App Store chinh thuc
- ACP ho tro 3 kieu ket noi: Local WiFi (nhanh nhat), Tailscale VPN (an toan), Relay (luon on)

Cau hoi du kien:
Q: "Co the dung tren Android khong can cai agent tren server khong?"
A: "Co — Android Node cho phep chay agent ngay tren thiet bi Android (offline), khong can server rieng."`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 16 — So Sanh & Benchmark
  // ───────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightBg };
    addTopBar(s, C.red);

    s.addText("So Sanh & Benchmark — Phan Tich", {
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

    s.addChart("bar", chartData, {
      x: 0.5, y: 0.9, w: 6.2, h: 3.0,
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
      { label: "Duy nhat co Zalo", sub: "Kenh Vietnam", color: C.red    },
      { label: "Chay Local (Ollama)", sub: "Zero cloud",  color: C.green  },
      { label: "Agent-to-Agent", sub: "ACP Protocol",    color: C.purple },
    ];
    s.addText("3 Diem Khac Biet:", {
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
        color: "FFFFFFBB", align: "center", valign: "middle", margin: 0,
      });
    });

    // Score legend note
    s.addText("(Diem 1-10, danh gia chu quan. 10 = tot nhat cho tieu chi do)", {
      x: 0.5, y: 3.98, w: 9.0, h: 0.25,
      fontSize: 9, italic: true, fontFace: "Calibri", color: C.mutedLight, align: "center",
    });

    addPresenterNote(s, `SLIDE 16 — SO SANH & BENCHMARK
Thoi gian: ~2 phut

Diem chinh:
- OpenClaw thang tuyet doi ve: Privacy (9), Channels (9), LLM Flexibility (9)
- OpenClaw thua ve: Ease-of-Use (3) — can terminal, config files
- ChatGPT/Claude.ai tot hon cho: nguoi dung pho thong, khong quen tech

Sweet spot audience:
- Developer, DevOps, Power User co kien thuc tech
- Can privacy cao (y te, luat, tai chinh)
- Su dung Zalo cho cong viec

KHONG dung OpenClaw khi:
- Chi can chat don gian, khong code/automation
- Khong quen terminal/Node.js
- Can ket qua ngay (setup mat ~30 phut)

Cau hoi du kien:
Q: "ChatGPT co Channels rieng, tai sao diem thap?"
A: "ChatGPT co web va mobile app, nhung KHONG co Telegram bot API, khong co Zalo, khong tich hop vao Discord/Slack nhu OpenClaw. 2 diem la chi la web + mobile."`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 17 — Design Patterns — Bai Hoc Kien Truc
  // ───────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightBg };
    addTopBar(s, C.purple);

    s.addText("Design Patterns — Bai Hoc Kien Truc", {
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
        desc: "Interface chung cho tat ca channels",
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
        desc: "Mo rong khong sua doi core",
        snippet: "plugin.tools.forEach(\n  t => registry.add(t))",
        color: C.purple,
      },
      {
        name: "Approval Gate",
        desc: "Kiem tra truoc khi thuc thi",
        snippet: "cmd → isSafe()\n  ? exec() : askUser()",
        color: C.red,
      },
      {
        name: "Failover Chain",
        desc: "Tu dong chuyen khi loi",
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
Thoi gian: ~2 phut

Diem chinh:
- 6 patterns nay la xuong song cua OpenClaw architecture
- Gateway Hub: giam tu N*M ket noi xuong N+M (complexity linear thay vi quadratic)
- Adapter Pattern: them Zalo chi can viet TelegramAdapter moi, khong sua gi het
- Strategy Pattern: users co the doi LLM chi bang 1 dong config, khong restart

Anti-patterns can tranh (danh cho developers dang hoc):
- "God Agent": cho agent lam tat ca — nen chia nho subagents theo domain
- "Skip Approval": bo qua cong approval de nhanh hon — nguy hiem cho production
- "Trust AI Output": neu LLM tra ve code, phai review truoc khi exec
- "Hardcode LLM": viet code gia su luon dung GPT-4 — dung LLMFactory thay

Cau hoi du kien:
Q: "Failover Chain co tu dong khong hay phai config?"
A: "Tu dong theo thu tu trong config: primary → fallback1 → fallback2. Co timeout per attempt va jitter delay."`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 18 — Roadmap & Tuong Lai
  // ───────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.darkBg };
    addTopBar(s, C.amber);

    s.addText("Roadmap & Tuong Lai", {
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
    s.addText("Da phat hanh (v2026.3.11)", {
      x: 0.4, y: 0.85, w: 4.5, h: 0.45,
      fontSize: 13, bold: true, fontFace: "Calibri",
      color: C.white, align: "center", valign: "middle", margin: 0,
    });
    const released = [
      "7 CVE fixes bao mat nghiem trong",
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
    s.addText("Dang phat trien", {
      x: 5.1, y: 0.85, w: 4.5, h: 0.45,
      fontSize: 13, bold: true, fontFace: "Calibri",
      color: C.white, align: "center", valign: "middle", margin: 0,
    });
    const inDev = [
      "7 CVE fixes bo sung",
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
    s.addText("Dinh huong tuong lai:", {
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
Thoi gian: ~90 giay

Diem chinh:
- v2026.3.11 la phien ban ky thuat lon nhat trong 2 nam
- 7 CVE da va them 7 dang fix — security-first mindset
- iOS App Store la muc tieu chinh cua Q2 2026
- WebAssembly sandbox se thay the Node.js sandbox hien tai — an toan hon, nhanh hon

Su on dinh tai chinh:
- 22,100+ GitHub stars — du lon de thu hut sponsors
- OpenAI va Vercel dang tai tro → du tien de phat trien full-time
- MIT license: users co the dung thuong mai mien phi

Cau hoi du kien:
Q: "Bao gio co tren iOS App Store?"
A: "Target Q2 2026 — dang qua review Apple. Hien tai co qua TestFlight (beta public)."

Q: "Enterprise co on premise khong?"
A: "Co — OpenClaw da co the deploy on-prem. Enterprise tier them SSO (SAML), RBAC, audit log va support contract."`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 19 — Quick Start
  // ───────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightBg };
    addTopBar(s, C.green);

    s.addText("Quick Start — Cai Dat & Cau Hinh", {
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
        title: "Cai dat",
        cmd: "npm install -g openclaw@latest",
        desc: "Yeu cau Node.js >= 22",
        color: C.blue,
      },
      {
        num: "2",
        title: "Chay Wizard",
        cmd: "openclaw onboard --install-daemon",
        desc: "Cai dat daemon, chon kenh va LLM",
        color: C.purple,
      },
      {
        num: "3",
        title: "Kiem tra",
        cmd: "openclaw doctor",
        desc: 'Roi thu: openclaw agent --message "Hello"',
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
    s.addText("~/.openclaw/config.json — Cau hinh chinh", {
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
Thoi gian: ~90 giay

Diem chinh:
- 3 lenh la du de chay: install → onboard → doctor
- Onboard wizard tu dong hoi: chon kenh, nhap API key, chon LLM
- openclaw doctor kiem tra: daemon running, auth ok, kenh ket noi, LLM ok
- Config JSON rat don gian — port, auth mode, model, plugins

Yeu cau he thong:
- Node.js >= 22 (quan trong — khong chay tren Node 18/20)
- 512MB RAM toi thieu (khong tinh LLM local)
- Cho Ollama local: VRAM tuy model (llama3.3:70b can ~40GB VRAM)

3 use cases de demo:
1. DevOps automation: cron + Telegram alert + run_bash
2. Discord bot cho game community (CCN2 use case!)
3. Offline AI voi Ollama + Zalo (khong cloud, khong phi)

Cau hoi du kien:
Q: "Co the dung nhieu agents cung luc khong?"
A: "Co — config 'agents' la object, co the co main, coder, devops, moi agent co model va skills rieng."`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 20 — Use Cases Thuc Te
  // ───────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.darkBg };
    addTopBar(s, C.amber);

    s.addText("Use Cases Thuc Te", {
      x: 0.5, y: 0.15, w: 9.0, h: 0.55,
      fontSize: 32, bold: true, fontFace: "Arial Black", color: C.white,
    });

    const cases = [
      {
        title: "DevOps Automation",
        color: C.blue,
        features: [
          "Cron job bao cao hang ngay",
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
          "Claude Haiku (re chi phi)",
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
        x, y: 0.85, w: 3.0, h: 0.65,
        rectRadius: 0.1,
        fill: { color: c.color }, line: { color: c.color, width: 0 },
      });
      s.addText(c.title, {
        x, y: 0.85, w: 3.0, h: 0.65,
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

    addPresenterNote(s, `SLIDE 20 — USE CASES THUC TE
Thoi gian: ~2 phut

Diem chinh:
- 3 use cases thuc te, moi cai co ROI ro rang
- Use case 2 (Game Community Bot) LIEN QUAN TRUC TIEP den CCN2 project!
  → CCN2 la board game, co the dung OpenClaw lam Discord bot cho game
  → Claude Haiku re nhat ($0.25/M tokens) — phu hop cho game community (nhieu query, low budget)
  → Strict sandbox: bot chi doc (read ranking, hoi rules), KHONG ghi

Nhan manh cho khán gia developer:
- Use case 1: neu lam DevOps/SRE, tiet kiem 2-3 gio/ngay tu dong hoa bao cao
- Use case 3: privacy use case (bac si, luat su, ngan hang) — data khong bao gio roi may

Demo goi y:
- Neu co thoi gian, demo live: "openclaw agent --message 'Xin chao, ban la ai?'"

Cau hoi du kien:
Q: "Chi phi voi Claude Haiku la bao nhieu?"
A: "$0.25 per million input tokens — voi game community bot ~1000 queries/ngay, chi phi chi ~$0.01/ngay."`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 21 — Data Flow — Vi Du Thuc Te
  // ───────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightBg };
    addTopBar(s, C.blue);

    s.addText("Data Flow — Vi Du Thuc Te", {
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
    s.addText('Vi du: User Telegram hoi "Thoi tiet Ha Noi hom nay nhu the nao?"', {
      x: 0.5, y: 0.82, w: 9.0, h: 0.35,
      fontSize: 11, italic: true, fontFace: "Calibri",
      color: C.navyText, align: "center", valign: "middle",
    });

    // Flow steps
    const flowSteps = [
      { label: "User (Telegram)",    note: "Gui tin nhan",               color: C.blue,   x: 0.3  },
      { label: "Channel Extension",  note: "Parse Telegram message",      color: "2980B9", x: 1.55 },
      { label: "Gateway",            note: "Nhan WebSocket event",        color: C.purple, x: 2.8  },
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
        x: step.x - 0.05, y: 2.08, w: 1.2, h: 0.4,
        fontSize: 8, fontFace: "Calibri", color: C.mutedLight,
        align: "center", wrap: true,
      });
    });

    // Second flow row (after LLM)
    const flowSteps2 = [
      { label: "Skills Executor",    note: "web_fetch weather API",      color: C.amber,  x: 0.3  },
      { label: "LLM (Claude)",       note: "Tong hop ket qua",           color: "16A085", x: 1.55 },
      { label: "Agent Runtime",      note: "Format response",            color: C.green,  x: 2.8  },
      { label: "Gateway",            note: "Streaming response",         color: C.purple, x: 4.05 },
      { label: "Channel Extension",  note: "Format Telegram message",    color: "2980B9", x: 5.3  },
      { label: "User (Telegram)",    note: '"28 do C, nang, it may"',    color: C.blue,   x: 6.55 },
    ];

    s.addText("↓", {
      x: 8.4, y: 1.55, w: 0.5, h: 0.8,
      fontSize: 18, color: C.mutedLight, align: "center",
    });
    s.addText("↓ tiep theo", {
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
        x: step.x - 0.05, y: 3.43, w: 1.2, h: 0.4,
        fontSize: 8, fontFace: "Calibri", color: C.mutedLight,
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
      "Toan bo luong xu ly: ~800ms",
      "Approval: KHONG (weather la read-only)",
      "Context: 8,432 tokens (lich su + memory)",
      "Streaming: user thay response theo tung chu",
    ];
    insights.forEach((ins, i) => {
      s.addShape("rect", {
        x: 0.7 + i * 2.35, y: 4.12, w: 0.08, h: 0.08,
        fill: { color: C.blue }, line: { color: C.blue, width: 0 },
      });
      s.addText(ins, {
        x: 0.85 + i * 2.35, y: 4.05, w: 2.2, h: 0.55,
        fontSize: 10, fontFace: "Calibri", color: C.navyText,
        valign: "middle", wrap: true,
      });
    });

    addPresenterNote(s, `SLIDE 21 — DATA FLOW
Thoi gian: ~2 phut

Diem chinh:
- Vi du cu the: hoi thoi tiet qua Telegram → tra loi trong ~800ms
- Luong di qua 10 buoc nhung hau het < 10ms moi buoc
- Approval KHONG can vi weather la read-only skill (chi web_fetch, khong ghi gi)
- Streaming: response hien ra theo tung token, user khong phai doi full

Nhan manh:
- Server-authoritative: agent quyet dinh co thuc thi skill hay khong (khong phai LLM)
- LLM chi "de nghi" tool_call, con agent runtime validate truoc khi chay
- Context Engine giu lich su 10 tin nhan gan nhat + memory search

Cau hoi du kien:
Q: "Neu weather API het han, agent lam gi?"
A: "Failover Chain: thu provider 1 → fail → thu provider 2 → fail → bao loi thân thien cho user, khong crash."

Q: "800ms co qua cham khong?"
A: "Phu thuoc network va LLM. Voi Haiku local proxy: ~200ms. Voi Claude.ai API tu Viet Nam: ~1-2s. Streaming an buffer tot hon cai cam giac."`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SLIDE 22 — Ket Luan
  // ───────────────────────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.darkBg };
    addTopBar(s, C.amber);

    // Decorative circle (top-right)
    s.addShape("ellipse", {
      x: 8.0, y: -0.5, w: 2.8, h: 2.8,
      fill: { color: "1A2D42" }, line: { color: C.amber, width: 2 },
    });

    s.addText("Ket Luan", {
      x: 0.5, y: 0.15, w: 6.5, h: 0.55,
      fontSize: 36, bold: true, fontFace: "Arial Black", color: C.white,
      shadow: mkShadow(),
    });

    // ── 3 Summary Callout Boxes ─────────────────────────────────────────────
    const summaries = [
      {
        text: "AI Gateway tu chu — chay tren may ban, 22+ kenh, 30+ LLMs",
        color: C.blue,
        icon: "Gateway",
      },
      {
        text: "Cong cu cho power users — cron, browser control, shell, multi-agent",
        color: C.amber,
        icon: "Power",
      },
      {
        text: "Privacy-first — data khong roi may, MIT license, khong vendor lock-in",
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
        header: "Dung khi",
        color: C.green,
        items: ["Developer / DevOps", "Can su dung Zalo", "Can privacy cao", "Muon offline AI (Ollama)", "Thich tu dong hoa"],
        tick: "OK",
      },
      {
        header: "Khong dung khi",
        color: C.red,
        items: ["Muon dung ngay (setup ~30 phut)", "Khong quen terminal", "Chi can chat don gian", "Khong co server/VPS"],
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

    addPresenterNote(s, `SLIDE 22 — KET LUAN
Thoi gian: ~2 phut + Q&A

Ba diem chinh can nho:
1. GATEWAY: OpenClaw la lop middleware giua LLM va kenh nhan tin — khong phai chatbot
2. POWER: Danh cho developer/DevOps — co the chay shell script, browser, git tu nhien lieu chat
3. PRIVACY: MIT license + self-hosted = zero vendor lock-in, data o lai may ban

Keu goi hanh dong:
- "Chung ta co the thu cai dat ngay tren laptop trong 5 phut, ai muon thu sau buoi hoc?"
- "Star repo Pi-Mono tren GitHub de ho tro team — hien co 22,100+ stars"
- "Neu ban dang lam Discord bot cho CCN2 game, day la giai phap phu hop nhat"

Phan Q&A goi y:
- De mo cua: "Cac ban co cau hoi gi khong? Dac biet ve phan so sanh voi ChatGPT hay ve viec tich hop vao du an cu the?"
- Neu khong co cau hoi: demo live 2 phut (cai dat + goi agent)

Cau hoi du kien:
Q: "Co documentation tieng Viet khong?"
A: "Hien tai docs chu yeu tieng Anh, nhung community co mot so guides tieng Viet. OpenClaw GUI (Claw Desktop) co tieng Viet."

Q: "Security co audit chua?"
A: "Community audit, khong phai formal pentest. 14 CVE da fix ke tu 2024. Cho enterprise, recommend tu chay pentest truoc deploy."`);
  }

} // end addSlides12to22

module.exports = { addSlides12to22 };
