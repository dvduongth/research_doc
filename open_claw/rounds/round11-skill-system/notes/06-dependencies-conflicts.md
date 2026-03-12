# Skill Dependencies & Conflicts
**Round 11: Skill System**

---

## Không có Dependency System

Skills trong pi-mono **không khai báo dependency** lẫn nhau. Mỗi skill là file SKILL.md độc lập — không có:
- `dependsOn` field
- Dependency graph
- Topological sort cho load order

---

## Name Collision

Source: `skills.ts` lines 382-398

Khi 2 skills có cùng `name`:

- **Skill đầu tiên thắng** (first-wins theo thứ tự discovery)
- Collision được report dạng diagnostic: `type: "collision"`
- Skill trùng bị bỏ qua

**Thứ tự ưu tiên** (do discovery order):
1. CLI args (`--skill`) — ưu tiên cao nhất
2. Project-level (`.pi/skills/`)
3. Global (`~/.pi/agent/skills/`)
4. Settings paths
5. Packages

→ Skill project-level ghi đè skill global cùng tên.

---

## Symlink Dedup

Source: `skills.ts` lines 369-379

Khi phát hiện nhiều đường dẫn trỏ đến cùng file thật (qua symlink):
- Dùng `realpathSync()` resolve canonical path
- File trùng bị skip im lặng (không tạo collision diagnostic)

---

## Ignore Files

Source: `skills.ts` lines 15-64

Skill directories tôn trọng ignore patterns từ:
- `.gitignore`
- `.ignore`
- `.fdignore`

Hỗ trợ negation: `!keep-this-skill/`

---

## Không có Version Constraints

Skills không có:
- Version field trong frontmatter
- Version ranges hay constraints
- Update/upgrade commands

Quản lý version hoàn toàn thủ công (git, copy file, packages).

---

## Conflict với Extension Tools

Skills và extension tools hoạt động ở lớp khác nhau:
- Skills: inject vào system prompt, agent tự quyết định sử dụng
- Extension tools: đăng ký trực tiếp, agent gọi qua tool calling

→ Không có conflict trực tiếp. Nhưng nếu skill hướng dẫn làm điều mâu thuẫn với extension tool, agent có thể bối rối.

---

## Best Practices

1. **Tên unique**: Đặt tên skill mô tả rõ mục đích (vd: `pdf-processing` thay vì `helper`)
2. **Description rõ ràng**: Giúp agent phân biệt khi có nhiều skills liên quan
3. **Project > Global**: Skill project-level override global → dùng để customize cho dự án
4. **disableModelInvocation**: Dùng cho skills specialist mà không muốn agent tự gọi

---

**End of dependencies & conflicts**.
