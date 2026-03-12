# Package Integration
**Round 8: Resource Loading**

---

## Overview

Pi supports installing resource bundles via `pi install`. Packages can provide extensions, skills, prompts, themes.

---

## Package Manifest

Package phải có `package.json` với trường `pi`:

```json
{
  "name": "my-pi-package",
  "version": "1.0.0",
  "pi": {
    "extensions": ["./dist/extensions/ext1.js", "./dist/extensions/ext2.ts"],
    "skills": ["./dist/skills/my-skill.js"],
    "prompts": ["./prompts/*.md"],
    "themes": ["./themes/dark.theme.json"]
  }
}
```

Paths tương đối với package root.

---

## Install Locations

- **Global**: `~/.pi/agent/git/` (git clones) và `~/.pi/agent/npm/` (npm tarballs).
- **Project-local**: `.pi/git/`, `.pi/npm/`.

`PackageManager` biết các location này và sẽ:

- Clone/extract package vào thư mục phù hợp.
- Lưu metadata về package (source, version) trong settings (dưới `packages` array).

---

## Resolution

`DefaultPackageManager.resolve()` thực hiện:

1. Đọc `settings.json` (global + project) để lấy `packages` array. Mỗi entry có thể:
   - `"npm:package-name"` (với optional version)
   - `"git:github.com/user/repo"` (và optional ref)
   - `"/local/path"`
2. Với mỗi package entry, gọi `ensurePackage()` nếu chưa install hoặc cần update (dựa trên version).
3. Sau khi package sẵn sàng, đọc `package.json` từ package directory.
4. Kiểm tra field `pi`. Với mỗi resource type (extensions, skills, prompts, themes), lưu `{ path: resolve(entryPath), enabled: true (ban đầu), metadata: { source: "package", origin: packageName, originalPath: entryPath } }`.
5. Trả về `LoadExtensionsResult` với arrays.

---

## Enable/Disable Package Resources

Resources từ packages được filter qua settings **giống filesystem resources**.

Ví dụ: nếu `extensions.disabled` chứa path của một extension từ package, nó sẽ bị skip.

Người dùng có thể disable entire package bằng cách thêm package directory vào disabled list.

---

## Dynamic Addition: `extendResources()`

Sau khi `pi install` một package mới, `PackageManager` sẽ gọi `resourceLoader.extendResources()` với paths từ package mới.

`extendResources(paths: ResourceExtensionPaths)`:

- `paths` có thể chứa `skillPaths`, `promptPaths`, `themePaths`.
- Merge vào `lastSkillPaths`, `lastPromptPaths`, `lastThemePaths`.
- Gọi `updateSkillsFromPaths()`, `updatePromptsFromPaths()`, `updateThemesFromPaths()` để load resources mới và merge vào arrays hiện tại.
- Không replace, mà append (và deduplicate by path).

Điều này cho phép thêm resources mà không cần full reload (extensions vẫn cần reload vì extensions dùng `loadExtensions` với path list mới? Thực tế, `extendResources` không xử lý extensions, chỉ skills/prompts/themes. Extensions từ package mới vẫn cần `/reload` để load. Cần check code: `ResourceExtensionPaths` interface includes `skillPaths`, `promptPaths`, `themePaths`; không có extensions. Vậy extensions từ packages cần full reload. Tuy nhiên, `additionalExtensionPaths` có thể được thêm trực tiếp và gọi `reload()` để load.

Tóm lại: sau `pi install`, user cần `/reload` để load extensions mới. Skills/prompts/themes có thể được auto-load qua `extendResources`? Code trong `PackageManager.installPackage()` sau khi install sẽ gọi `this.extendResources(pkgResources)` với `pkgResources` gồm extensions, skills, prompts, themes. Nhưng `extendResources` chỉ accept `ResourceExtensionPaths` (skills, prompts, themes). Vậy extensions từ package mới sẽ không được load ngay, mà phải chờ `/reload`. Có lẽ design: `pi install` chỉ install package, không load extensions; `/reload` để load tất cả resources mới. Như vậy thống nhất.

---

## Version Management

Settings `packages` array lưu package source và version (nếu có). Ví dụ:

```json
{
  "packages": [
    "npm:my-package@1.2.3",
    "git:github.com/user/repo@v1"
  ]
}
```

`PackageManager` sẽ:
- Lưu package metadata (version, source) trong `.pi/state.json`? (có thể).
- Khi `resolve()`, check nếu package đã install và version khớp thì dùng cached; nếu không thì update (tuân theo semver).
- Update: `npm update` tương tự.

Điều này đảm bảo consistency.

---

## Uninstall

`pi remove <source>`:
- Xóa package metadata khỏi settings (`packages` array).
- Xóa thư mục package (có thể giữ để cache?).
- Gọi `resourceLoader.reload()` để bỏ resources từ package đã xóa.

---

## Diagnostics

Package integration có thể gây lỗi:
- Package không có `pi` field.
- Entry path không tồn tại.
- Resource parse errors (skill class not found, theme invalid JSON).
- Version conflicts.

Các lỗi được thu thập vào `diagnostics` của từng resource type.

---

## Security

- Packages install từ npm/git chạy arbitrary code trong install script (preinstall, postinstall). Cần tin tưởng author.
- Extensions từ packages chạy với quyền user.
- Không có sandbox.

---

## Best Practices for Packages

- Keep `pi` field minimal, chỉ khai báo resources thực sự cần.
- Distribute compiled JavaScript (dist/) để không cần compile ở runtime.
- Nếu package có npm dependencies, list chúng trong `dependencies` (không `devDependencies`).
- Test package với vài phiên bản pi.

---

**End of package integration**.
