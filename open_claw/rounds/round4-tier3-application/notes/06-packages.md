# Package Management

Pi hỗ trợ cài đặt gói (packages) mở rộng resources từ npm, Git, URL, SSH.

---

## 📦 Package Commands

- `pi install <source> [-l]`: Cài đặt package.
  - Source formats:
    - `npm:@foo/bar` – npm package
    - `git:github.com/user/repo` – Git repository (HTTPS)
    - `git:git@github.com:user/repo` – SSH
    - `https://...` – Tarball URL
    - `ssh://git@...` – SSH URL
    - `./local/path` – Local path
  - `-l, --local`: Install vào project (`.pi/settings.json`) thay vì global (`~/.pi/agent/settings.json`).

- `pi remove <source> [-l]`: Uninstall package.
- `pi update [source]`: Update packages (tất cả nếu không có source).
- `pi list`: Liệt kê packages đã cài đặt (user + project).

---

## 📁 Install Locations

- **Global**: `~/.pi/agent/git/` (git clones), `~/.pi/agent/npm/` (npm tarballs).
- **Project-local**: `.pi/git/`, `.pi/npm/`.

Package manifest (`package.json`) được đặt trong thư mục package.

---

## 📄 Package Manifest

Package phải có `package.json` với trường `pi`:

```json
{
  "name": "my-pi-package",
  "version": "1.0.0",
  "pi": {
    "extensions": ["dist/extension.js"],
    "skills": ["dist/skill.js"],
    "prompts": ["prompts/*.md"],
    "themes": ["themes/*.json"]
  }
}
```

`pi` field xác định entry points cho các resources. Các paths tương đối với package root.

---

## 🔧 Resource Integration

Khi package được install:

1. Package được clone/extract vào install dir.
2. Trong settings, thêm entry vào `packages` (nếu dùng `pi install`, settings được cập nhật tự động).
3. Package resources (extensions, skills, prompts, themes) sẽ được discovered và load bởi `DefaultResourceLoader` thông qua `PackageManager`.
4. Có thể filter qua settings (enable/disabled lists).

---

## 🎛️ Config Control

`pi config` command (có thể không có trong code? Check) cho phép enable/disable package resources dễ dàng.

Settings `packages` array có thể chứa:

- `"npm:package-name"`: tham chiếu npm package.
- `{ "source": "git:...", "enabled": false }`: object với filter options.

---

## 🔄 Update & Removal

- `pi update`: Cập nhật tất cả packages đến version mới nhất (theo semver).
- `pi update <source>`: Chỉ update một package.
- `pi remove`: Xóa package và loại bỏ khỏi settings.

---

**Lưu ý**: Package management cho phép chia sẻ bundles resources một cách dễ dàng, tạo ecosystem mở rộng cho pi.
