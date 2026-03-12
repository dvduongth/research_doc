# Extension Loading & Hot Reload
**Round 7: Dependency Graph - Extension System**

---

## Discovery Locations

Extensions được discover từ:

1. **Global extensions**:
   - `~/.pi/agent/extensions/*.ts` (single file)
   - `~/.pi/agent/extensions/*/index.ts` (directory)
2. **Project-local extensions**:
   - `.pi/extensions/*.ts`
   - `.pi/extensions/*/index.ts`
3. **Additional paths** từ `settings.json` (key `extensions`).
4. **Package extensions**: từ packages đã install qua `pi install`. Package manifest (`package.json`) có field `pi.extensions`.

---

## Loading Process

### Step 1: Resolve paths

`DefaultResourceLoader.reload()` gọi `packageManager.resolve()` để lấy extensions từ packages. Đồng thời, nó lấy các path từ `additionalExtensionPaths` (flags `-e`). Pairs: `{ path, enabled, metadata }`.

metadata chứa:
- `source`: "auto" (filesystem) hoặc "package"
- `origin`: package name nếu từ package
- `originalPath`: path gốc

### Step 2: Load via jiti

`loadExtensions(extensionPaths, runtime)`:
- Dùng [jiti](https://github.com/unjs/jiti) để load TypeScript dynamically mà không cần compile.
- Mỗi extension path được require.
- Expect default export: function `(pi: ExtensionAPI) => void`.
- Gọi function, truyền `pi` object (tạo từ `createExtensionRuntime()`).

### Step 3: Extension Runtime

`createExtensionRuntime()` tạo object `ExtensionRuntime` mà extensions nhận được. Runtime chứa:
- `pi` API methods (registerTool, registerCommand, etc.)
- Event bus (`events`)
- References đến sessionManager, modelRegistry, etc.
- State: extensions array, errors.

Extensions có thể gọi các methods ngay trong factory function (khi load) hoặc sau này trong event handlers.

---

## Hot Reload

Khi user gõ `/reload`:

1. `DefaultResourceLoader.reload()` được gọi.
2. Pause của agent? Thực tế, reload có thể xảy ra khi agent đang chạy. Context shutdown được xử lý:
   - Phát `session_shutdown` event cho tất cả extensions (old runtime).
   - Tắt extension runtime cũ (properties cleared).
3. Rediscover tất cả resources (extensions, skills, prompts, themes) từ paths.
4. Load extensions mới, tạo runtime mới.
5. Phát `session_start` event cho extensions mới.
6. Các commands/events tiếp theo sẽ dùng extensions mới.

Lưu ý: Nếu extension đang execute tool khi reload, tool đó có thể bị hủy? Thực tế, reload chờ đến khi agent idle (không streaming) trước khi thực hiện (theo `ctx.reload()` mô tả). Nhưng `/reload` command có thể được gọi bất kỳ lúc nào; nó sẽ deferred until idle.

---

## Extension Isolation & Security

- **No sandbox**: Extensions chạy trong cùng process với pi, có toàn quyền truy cập Node.js APIs (fs, network, etc.).
- **Trust**: Chỉ cài extensions từ nguồn tin cậy.
- **Isolation giữa các extensions**: Không có isolation. Chúng có thể chia sẻ biến toàn cục (nếu import cùng module) hoặc qua `pi.events`.
- **State**: Extensions nên tự quản lý state; không có protection chống lại malicious extensions.

---

## Error Handling

- Khi load extension, nếu extension throw error, lỗi được catch và lưu vào `extensionsResult.errors`. Tiếp tục load các extensions khác.
- Event handler errors được log nhưng không crash agent (isolated try/catch).
- Tool execution errors phải được propagate qua throw.

---

## Dynamic Registration

Extensions có thể đăng ký tools, commands, shortcuts, flags **sau khi đã load**, ngay cả trong `session_start` hoặc command handlers.

Ví dụ:
```typescript
pi.on("session_start", async (_, ctx) => {
  pi.registerTool({ name: "dynamic", ... });
});
```

Các tools mới sẽ hiển thị ngay trong system prompt và có thể được gọi.

---

## Override Rules

- **Commands**: Extension commands có precedence cao hơn prompt templates và skill commands. Nếu nhiều extension đăng ký cùng command name, later extension (theo load order) ghi đè? Thực tế, `pi.registerCommand` thêm vào internal map; later có thể overwrite.
- **Tools**: Custom tools có thể override built-in tools bằng cách dùng cùng name. Warning được hiển thị.
- **Providers**: `registerProvider` có thể override existing provider (giữ models cũ nếu không cung cấp models mới).
- **Shortcuts**: later registration có thể ghi đè.

---

## Package Integration

Extensions có thể được distribute như npm packages:

1. Tạo package với `package.json`:
   ```json
   {
     "name": "my-pi-ext",
     "pi": { "extensions": ["./src/index.ts"] }
   }
   ```
2. Install: `pi install npm:my-pi-ext`.
3. Package được clone/expand vào `~/.pi/agent/git/...` hoặc `npm/`.
4. Trong resource loader, package extensions được phát hiện và load như normal extensions.

Extensions from packages có thể có dependencies trong `package.json` của chúng; npm install trong package directory sẽ cài.

---

## Discover Order & Load Order

- Discovery: global extensions first, then project-local, then packages, then additional paths. Thứ tự này ổn định.
- Load order: alphabetically by path? Jiti sẽ require theo array order; nếu muốn control, đặt tên file với prefix số (01-, 02-).
- Handlers từ extensions được đăng ký theo thứ tự load, nên event handling order theo thứ tự đó.

---

## Reload Triggers

- `/reload` command.
- `ctx.reload()` từ extension/command.
- Sau khi `pi install` một package, extensions mới từ package chưa load ngay; cần `/reload`.

---

## Best Practices

- Keep extension factory function nhẹ; defer heavy work vào `session_start` hoặc các event.
- Clean up listeners khi `session_shutdown` nếu cần.
- Use `pi.events` để communication giữa extensions.
- Validate inputs, handle errors.
- Never block main thread; use async.
- State lưu trong tool result `details` để branch ổn.
- Truncate output nếu tool trả về large data.

---

**End of loading details**.
