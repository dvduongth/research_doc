# Extension Discovery & Loading
**Round 10: Extensions System**

> **Đã sửa**: Phiên bản trước mô tả sai `extension.json` manifest, topological sort, `init()/enable()` lifecycle. Đã viết lại từ source code thật.

---

## Overview

Extensions trong pi-mono là **TypeScript modules** export một default function (factory). Khi được load, factory function nhận `ExtensionAPI` và đăng ký tools, events, commands.

**Source**: `packages/coding-agent/src/core/extensions/loader.ts`, `types.ts`

---

## Extension Module Structure

Extension là một trong ba dạng:

### 1. Single file
```
~/.pi/agent/extensions/my-extension.ts
```

### 2. Directory với index
```
~/.pi/agent/extensions/my-extension/
├── index.ts       ← Entry point
├── tools.ts
└── utils.ts
```

### 3. Package với package.json
```
~/.pi/agent/extensions/my-extension/
├── package.json   ← Chứa field "pi"
├── index.ts
└── src/...
```

**Factory Pattern:**
```typescript
export type ExtensionFactory = (pi: ExtensionAPI) => void | Promise<void>;

// Ví dụ:
export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (event, ctx) => { ... });
  pi.registerTool({ name: "greet", ... });
}
```

---

## Discovery Locations

Source: `loader.ts` lines 462-545

1. **Project-local**: `.pi/extensions/` (trong working directory)
2. **Global**: `~/.pi/agent/extensions/` (user home)
3. **Settings paths**: Cấu hình trong `settings.json` field `extensions`
4. **Packages**: `package.json` với field `"pi": { "extensions": [...] }`

### Discovery Rules (Mỗi thư mục)

Source: `loader.ts` lines 462-494

1. File `.ts` hoặc `.js` trực tiếp trong `extensions/` → load như extension
2. Subdirectory có `index.ts`/`index.js` → load
3. Subdirectory có `package.json` với field `"pi"` → load theo manifest

**Chỉ scan 1 cấp sâu** — không recursive. Packages phức tạp phải khai báo entry points trong `package.json`.

---

## Package.json "pi" Field (Thay thế extension.json)

Source: `loader.ts` lines 387-405

**QUAN TRỌNG**: Không có file `extension.json`. Metadata nằm trong `package.json`:

```json
{
  "name": "my-extension",
  "pi": {
    "extensions": ["./src/index.ts"],
    "themes": ["./themes/*.json"],
    "skills": ["./skills/"],
    "prompts": ["./prompts/"]
  }
}
```

Interface:
```typescript
interface PiManifest {
  extensions?: string[];
  themes?: string[];
  skills?: string[];
  prompts?: string[];
}
```

---

## Loading Process (Thực tế)

Source: `loader.ts` lines 287-340

1. **Scan directories**: Tìm files `.ts`/`.js` và directories
2. **Resolve entries**: Kiểm tra `package.json` → `pi` field, hoặc tìm `index.ts`/`index.js`
3. **Import via jiti**: Dùng `jiti` (TypeScript loader tại runtime) để import module
4. **Call factory**: Gọi `module.default(extensionAPI)` — factory function đăng ký tất cả
5. **Collect registrations**: tools, events, commands, shortcuts, flags, providers

**Không có:**
- ~~`extension.json`~~ — dùng `package.json` field `pi`
- ~~Dependency graph~~ — không có dependency declarations giữa extensions
- ~~Topological sort~~ — không cần vì không có dependencies
- ~~`new Extension()`~~ — không có class, chỉ factory function
- ~~`init()/enable()/disable()`~~ — không có lifecycle methods

---

## jiti TypeScript Loading

Source: `loader.ts` lines 287-299

```typescript
const jiti = createJiti(import.meta.url, {
  moduleCache: false,  // Hỗ trợ hot-reload
  // Bun binary: virtual modules cho bundled packages
  // Node.js: aliases cho workspace resolution
});

const module = await jiti.import(extensionPath, { default: true });
```

**Virtual Modules (Bun binary):**
```typescript
const VIRTUAL_MODULES = {
  "@sinclair/typebox": _bundledTypebox,
  "@mariozechner/pi-agent-core": _bundledPiAgentCore,
  "@mariozechner/pi-tui": _bundledPiTui,
  "@mariozechner/pi-ai": _bundledPiAi,
  "@mariozechner/pi-coding-agent": _bundledPiCodingAgent,
};
```

---

## Loaded Extension Object

Source: `types.ts` lines 1383-1391

```typescript
export interface Extension {
  path: string;              // Đường dẫn gốc
  resolvedPath: string;      // Đường dẫn tuyệt đối
  handlers: Map<string, HandlerFn[]>;        // Event handlers
  tools: Map<string, RegisteredTool>;        // Registered tools
  messageRenderers: Map<string, MessageRenderer>;
  commands: Map<string, RegisteredCommand>;
  flags: Map<string, ExtensionFlag>;
  shortcuts: Map<KeyId, ExtensionShortcut>;
}
```

---

## Error Handling

Source: `types.ts` lines 1395-1411

```typescript
export interface LoadExtensionsResult {
  extensions: Extension[];
  errors: Array<{ path: string; error: string }>;
  runtime: ExtensionRuntime;
}
```

- Module import lỗi → log error, skip extension
- Factory function throw → log error, skip extension
- Agent vẫn khởi động bình thường

---

## Hot-Reload

- User chạy `/reload` → tất cả extensions unload và reload từ disk
- `moduleCache: false` trong jiti cho phép reload module mới
- Extensions nên thiết kế stateless hoặc persist state qua `appendEntry()`

---

## Actions During Load (Lazy Binding)

Source: `loader.ts` lines 119-153

Trong quá trình load (factory execution), chỉ registration methods hoạt động:
- `pi.on()` ✅
- `pi.registerTool()` ✅
- `pi.registerCommand()` ✅
- `pi.registerShortcut()` ✅
- `pi.registerFlag()` ✅
- `pi.registerProvider()` ✅ (queued, flush sau)

Action methods throw error nếu gọi trong load:
- `pi.sendMessage()` ❌
- `pi.sendUserMessage()` ❌
- `pi.exec()` ❌
- Các action khác ❌

→ Sau `bindCore()`, action methods được thay thế bằng implementations thật.

---

**End of discovery & loading**.
