> **Đã sửa**: Loại bỏ hoàn toàn mô hình dependency graph, topological sort, `extension.json` manifest, version ranges, priority field, optional/required dependencies. Thực tế pi-mono KHÔNG có hệ thống dependency giữa extensions — extensions được load theo thứ tự discovery.

# Dependencies & Ordering
**Round 10: Extensions System**

---

## Thực tế: Không có Dependency Graph

Pi-mono **không có hệ thống dependency giữa extensions**. Không có:

- ❌ `extension.json` manifest với `dependencies` field
- ❌ Dependency graph hay topological sort
- ❌ Version ranges cho extension dependencies
- ❌ `priority` field trong manifest
- ❌ Optional vs required dependencies

---

## Discovery Order = Load Order

Extensions được load theo thứ tự discovery từ các nguồn:

1. **Project-level**: `.pi/extensions/` — extensions trong thư mục dự án.
2. **User-level**: `~/.pi/agent/extensions/` — extensions cài đặt cho user.
3. **Settings paths**: Đường dẫn cấu hình trong settings.
4. **package.json**: Packages có field `"pi"` trong `package.json`.

Thứ tự load phụ thuộc vào thứ tự quét các đường dẫn trên.

---

## Extension Discovery Chi Tiết

```
Discovery sources (theo thứ tự):
├── .pi/extensions/          ← project-local
├── ~/.pi/agent/extensions/  ← user-global
├── settings-configured paths
└── package.json "pi" field  ← npm packages
```

Mỗi extension file được load bằng **jiti** (TypeScript loader). Hệ thống gọi factory function của từng extension theo thứ tự discovery.

---

## Không có Manifest File Riêng

Extensions **không sử dụng** `extension.json`. Thay vào đó:

- Extension là một TypeScript module export default factory function.
- Nếu extension là npm package, metadata nằm trong `package.json` với field `"pi"`.
- Không cần khai báo `id`, `version`, `dependencies` riêng cho extension system.

---

## Load Process

1. **Scan** tất cả discovery locations.
2. **Load** mỗi extension file bằng jiti.
3. **Execute** factory function: `extensionDefault(pi: ExtensionAPI)`.
4. **bindCore**: `ExtensionRunner.bindCore()` thay thế throwing stubs bằng real implementations khi core agent sẵn sàng.

Không có bước "construct → init → enable" — chỉ có factory function chạy một lần.

---

## Conflicts

Nếu hai extensions đăng ký tool cùng tên, extension load sau sẽ ghi đè. Không có cảnh báo tự động — cần cẩn thận đặt tên tool unique.

Nên đặt tên tool có tính mô tả để tránh xung đột: `weather_get_forecast` thay vì `get`.

---

## Reload

Khi reload extensions:
- Extensions hiện tại bị unload.
- Re-scan discovery locations.
- Load lại tất cả extensions.

Không có "reverse order disable" vì không có dependency graph.

---

## So sánh với mô tả cũ

| Mô tả sai (cũ) | Thực tế |
|----------------|---------|
| `extension.json` với `dependencies` array | Không có manifest file riêng |
| Dependency graph + topological sort (Kahn's) | Không có — load theo discovery order |
| `priority` field quyết định thứ tự | Không có priority system |
| Version ranges (`^1.2.0`) | Không có version constraint giữa extensions |
| Optional vs required dependencies | Không có dependency concept |
| Cycle detection | Không cần — không có dependency graph |

---

**End of dependencies & ordering notes**.
