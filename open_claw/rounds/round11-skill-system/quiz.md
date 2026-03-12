# Quiz: Skill System (Round 11)

> **Lưu ý**: Quiz này đã viết lại hoàn toàn dựa trên source code pi-mono v0.57.1. Phiên bản cũ mô tả hệ thống "OpenClaw"/"ClawHub" không tồn tại.

---

## Phần 1: Skill Basics

**Q1:** Skill trong pi-mono là gì?
- A. TypeScript module đăng ký event handlers
- B. File SKILL.md với YAML frontmatter chứa hướng dẫn cho agent
- C. Binary executable cài qua npm
- D. JSON config file

**Đáp án: B** — Skill là file Markdown với metadata, agent đọc nội dung khi cần hướng dẫn.

**Q2:** Frontmatter field nào **bắt buộc** trong SKILL.md?
- A. `name` và `version`
- B. `name` và `description`
- C. `description` và `license`
- D. `name` và `metadata`

**Đáp án: B** — `name` và `description` đều required. Thiếu `description` → skill bị chặn load.

**Q3:** Tên skill phải tuân theo quy tắc nào?
- A. CamelCase, tối đa 128 ký tự
- B. Lowercase a-z, 0-9, gạch ngang, tối đa 64 ký tự, khớp tên thư mục cha
- C. Bất kỳ chuỗi Unicode nào
- D. snake_case, tối đa 32 ký tự

**Đáp án: B** — Regex: lowercase + digits + hyphens, 1-64 chars, phải match parent directory name.

**Q4:** Khi tên skill vi phạm quy tắc (vd: chứa uppercase), điều gì xảy ra?
- A. Skill bị chặn load hoàn toàn
- B. Skill vẫn load nhưng tạo warning diagnostic
- C. Skill bị rename tự động
- D. Error và agent crash

**Đáp án: B** — Name validation violations chỉ tạo warning. Chỉ thiếu description hoặc YAML lỗi mới chặn load.

**Q5:** `MAX_DESCRIPTION_LENGTH` trong pi-mono là bao nhiêu?
- A. 256
- B. 512
- C. 1024
- D. 2048

**Đáp án: C** — `MAX_DESCRIPTION_LENGTH = 1024` ký tự.

---

## Phần 2: Discovery & Loading

**Q6:** Thứ tự discovery skills (ưu tiên cao → thấp)?
- A. Global → Project → CLI args
- B. CLI args → Project → Global → Settings → Packages
- C. Packages → Global → Project → CLI args
- D. Settings → CLI args → Project → Global

**Đáp án: B** — CLI args ưu tiên cao nhất, sau đó project-level, global, settings, packages.

**Q7:** Field `source` trong Skill interface có giá trị nào?
- A. `"npm"`, `"local"`, `"remote"`
- B. `"user"`, `"project"`, `"path"`
- C. `"global"`, `"project"`, `"cli"`
- D. `"default"`, `"custom"`, `"override"`

**Đáp án: B** — `"user"` = global ~/.pi/agent/, `"project"` = .pi/skills/, `"path"` = explicit paths.

**Q8:** Khi 2 skills có cùng name, điều gì xảy ra?
- A. Error và cả hai bị bỏ qua
- B. Skill load sau ghi đè skill trước
- C. Skill đầu tiên thắng, collision report dạng diagnostic
- D. Agent hỏi user chọn

**Đáp án: C** — First-wins strategy. Collision tạo diagnostic với type "collision".

**Q9:** Skill discovery tôn trọng file ignore nào?
- A. Chỉ `.gitignore`
- B. `.gitignore`, `.ignore`, `.fdignore`
- C. Không có file ignore nào
- D. `.skillignore`

**Đáp án: B** — Ba loại ignore files: `.gitignore`, `.ignore`, `.fdignore`.

**Q10:** Skill catalog được refresh bằng cách nào?
- A. Tự động qua file watcher
- B. Chạy `/reload` command hoặc extension gọi `ctx.reload()`
- C. Restart agent bắt buộc
- D. Tự động mỗi 5 phút

**Đáp án: B** — Trigger thủ công qua `/reload` hoặc `ctx.reload()`. Không có file watcher.

---

## Phần 3: Execution

**Q11:** Agent gọi skill bằng mấy cách?
- A. 1: chỉ qua system prompt
- B. 2: auto-invocation qua system prompt + `/skill:name` slash command
- C. 3: system prompt + slash command + API call
- D. 1: chỉ qua slash command

**Đáp án: B** — Hai cách: model tự gọi read tool khi thấy skill phù hợp, hoặc user gõ `/skill:name`.

**Q12:** `formatSkillsForPrompt()` lọc bỏ skills nào?
- A. Skills không có `license` field
- B. Skills có `disableModelInvocation: true`
- C. Skills từ global directory
- D. Skills có description quá ngắn

**Đáp án: B** — Skills với `disableModelInvocation: true` bị ẩn khỏi system prompt.

**Q13:** Skill được inject vào system prompt chỉ khi?
- A. User bật setting `enableSkillCommands`
- B. Tool `read` available
- C. Agent đang ở interactive mode
- D. Luôn được inject

**Đáp án: B** — Skill injection yêu cầu tool `read` available (agent cần đọc file SKILL.md).

**Q14:** Khi user gõ `/skill:pdf Analyze report.pdf`, phần "Analyze report.pdf" trở thành?
- A. System prompt
- B. User message bên dưới skill XML block
- C. Tool arguments
- D. Bị bỏ qua

**Đáp án: B** — Arguments sau skill name trở thành user message append sau XML skill block.

**Q15:** Đường dẫn tương đối trong SKILL.md được resolve dựa trên?
- A. Current working directory
- B. Thư mục cha của SKILL.md
- C. Home directory
- D. Agent binary directory

**Đáp án: B** — "Resolve against the skill directory (parent of SKILL.md)."

---

## Phần 4: Configuration & Security

**Q16:** Cách tắt skill slash commands?
- A. Xóa file SKILL.md
- B. Set `enableSkillCommands: false` trong settings.json
- C. Dùng `--no-skills` flag
- D. Không thể tắt

**Đáp án: B** — `enableSkillCommands` setting kiểm soát registration.

**Q17:** `--no-skills --skill /path/to/my-skill` sẽ?
- A. Error vì mâu thuẫn
- B. Tắt tất cả default skills, chỉ load `/path/to/my-skill`
- C. Bỏ qua `--skill` vì `--no-skills` ưu tiên
- D. Load tất cả skills bình thường

**Đáp án: B** — `--skill` là additive ngay cả với `--no-skills`.

**Q18:** `allowed-tools` trong frontmatter dùng để?
- A. Khai báo tools skill cung cấp
- B. Giới hạn tools agent được dùng khi skill active (thử nghiệm)
- C. Liệt kê dependencies
- D. Override tool permissions

**Đáp án: B** — Field thử nghiệm cho phép pre-approve danh sách tools cụ thể.

**Q19:** Rủi ro bảo mật chính của skills?
- A. Skills chạy code trong agent process
- B. Nội dung SKILL.md có thể ảnh hưởng hành vi agent qua prompt
- C. Skills truy cập network trực tiếp
- D. Skills modify system files

**Đáp án: B** — Skills là text nhưng ảnh hưởng behavior qua prompt injection.

**Q20:** SDK `skillsOverride` cho phép làm gì?
- A. Chỉ thêm skills mới
- B. Lọc, thêm, thay đổi metadata, hoặc thay thế hoàn toàn skill catalog
- C. Chỉ xóa skills
- D. Không thể override

**Đáp án: B** — Override function nhận skills mặc định → trả về skills muốn dùng. Hoàn toàn linh hoạt.

---

**End of quiz**.
