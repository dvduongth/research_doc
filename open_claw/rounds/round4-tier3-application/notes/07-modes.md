# Modes: Interactive, Print, JSON, RPC

Pi hỗ trợ nhiều modes để tương thích với các use cases khác nhau.

---

## 🎮 Interactive Mode (default)

- Full TUI: header, messages, editor, footer.
- User nhập tin nhắn, xem phản hồi, issue commands.
- Phù hợp cho terminal interactive.

**Implementation**: `src/modes/interactive/interactive-mode.ts`.

---

## 🖨️ Print Mode (`-p`)

- Non-interactive: đọc input từ stdin hoặc args, gọi agent, in kết quả ra stdout, thoát.
- Dùng trong scripts:
  ```bash
  echo "Hello" | pi -p
  pi -p "Explain quantum physics"
  ```
- Không có UI, chỉ print assistant response.

**Implementation**: `src/modes/print-mode.ts`.

---

## 📊 JSON Mode (`--mode json`)

- Event stream dưới dạng JSON lines trên stdout.
- Mỗi event được serialize thành JSON: agent_start, turn_start, message_start, text_delta, etc.
- Dùng để debug hoặc tích hợp external tools.

```bash
pi --mode json > events.jsonl
```

---

## 🔌 RPC Mode (`--mode rpc`)

-stdin/stdout protocol dạng JSON-RPC để external process điều khiển pi.

- Pi đọc messages từ stdin, gửi responses tương ứng.
- Protocols chi tiết trong `docs/rpc.md`.
- Cho phép external CLI (như OpenClaw) giao tiếp với pi như một subprocess.

**Implementation**: `src/modes/rpc-mode.ts`.

---

## 🔄 Mode Selection Flow

Trong `main.ts`:

1. Parse args.
2. Nếu `--mode` được chỉ định → dùng mode đó.
3. Nếu có piped stdin (non-TTY) và không có args → có thể mặc định là print mode? (cần check).
4. Mặc định: interactive.

---

## 📦 Common Interface

Các mode đều implement contract:

- Nhận `Agent` instance.
- Setup input/output (stdin/stdout hoặc TUI).
- Xử lý events từ agent và hiển thị/forward phù hợp.

---

**Lưu ý**: Mỗi mode phục vụ một scenario khác nhau: interactive cho user, print cho script, json cho logging, rpc cho integration.
