# Skill Isolation & Security
**Round 11: Skill System**

---

## Security Model

Skills trong pi-mono là **passive documents** — chúng không chạy code. Tuy nhiên, nội dung skill ảnh hưởng hành vi agent:

- Skill hướng dẫn agent chạy lệnh → agent thực thi qua tool `bash`
- Skill có thể chứa hướng dẫn nguy hiểm (xóa file, gửi dữ liệu, v.v.)

---

## disableModelInvocation

Source: `skills.ts` lines 290-291

Field `disable-model-invocation: true` trong frontmatter:
- Ẩn skill khỏi system prompt → agent không tự gọi
- User vẫn gọi được qua `/skill:name`
- Use case: Skills nhạy cảm mà chỉ muốn kích hoạt thủ công

---

## allowed-tools (Thử nghiệm)

Field `allowed-tools` trong frontmatter:
- Danh sách tool names phân tách bằng dấu cách
- Khi skill được gọi, chỉ các tools trong danh sách được phê duyệt trước
- **Thử nghiệm** — chưa rõ mức độ enforce trong v0.57.1

---

## Rủi ro bảo mật

### 1. Prompt Injection qua Skill Content
Skill SKILL.md có thể chứa text khiến agent:
- Bỏ qua system prompt restrictions
- Thực hiện hành động ngoài ý muốn user
- Ghi file chứa mã độc

### 2. Untrusted Skills
Skills từ nguồn không tin cậy có thể:
- Hướng dẫn agent chạy lệnh nguy hiểm
- Cung cấp hướng dẫn sai dẫn đến lỗi

### 3. Path Traversal
Nếu skill chứa đường dẫn tương đối dạng `../../sensitive-file`, agent có thể đọc file ngoài thư mục dự kiến.

---

## Biện pháp bảo vệ

1. **Trust-based**: Chỉ dùng skills từ nguồn tin cậy
2. **Review**: Đọc SKILL.md trước khi cài vào thư mục skills
3. **Project isolation**: Skills project-level chỉ ảnh hưởng dự án đó
4. **disableModelInvocation**: Kiểm soát skill nào agent tự gọi
5. **Permission system**: Agent (pi-coding-agent) có hệ thống permission riêng cho tool execution — user vẫn phải approve các tool calls nguy hiểm

---

## So sánh với Extension Security

| Aspect | Skill | Extension |
|--------|-------|-----------|
| Loại mã | Markdown (passive) | TypeScript (active code) |
| Nguy cơ | Ảnh hưởng behavior qua prompt | Truy cập trực tiếp process memory |
| Sandboxing | Không (chỉ là text) | Không (cùng process) |
| Kiểm soát | `disableModelInvocation`, `allowed-tools` | Permission system của agent |
| Review | Đọc file Markdown | Review TypeScript code |

---

## Best Practices

**Cho skill authors:**
- Viết hướng dẫn rõ ràng, tránh mơ hồ
- Ghi rõ các hành động destructive (xóa, ghi đè)
- Dùng `disableModelInvocation` cho skills nhạy cảm
- Sử dụng `allowed-tools` để giới hạn tools khi cần

**Cho users:**
- Review SKILL.md trước khi cài
- Dùng `.pi/skills/` (project-level) thay vì global khi có thể
- Kiểm tra đường dẫn trong skill content
- Chú ý khi skill hướng dẫn chạy lệnh hệ thống

---

**End of isolation & security**.
