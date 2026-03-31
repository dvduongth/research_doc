# Analysis Plan — Cocos DevTools

**Project**: cocos-devtools
**Nguồn**: D:\PROJECT\CCN2\agent-teams\shared\playtest\ccn2-ai\cocos-devtools
**Output**: D:\PROJECT\CCN2\research_doc\docs\review\
**Tài liệu**: 14 files (3 specs, 9 plans, 1 README, 1 package.json)
**Mục tiêu**: Phân tích kiến trúc Cocos DevTools, tạo UML diagrams cho hệ thống
**Ngày**: 2026-03-31

---

## Tổng Quan

Project Cocos DevTools là bộ công cụ phát triển cho Cocos2d-x JS client, bao gồm:
- Devtools runtime (Node.js)
- WebSocket client cho communication
- Inspector UI với các tính năng nâng cao
- Scene graph visualization
- Layout debugging

## Phân Chia Waves

| Wave | Theme | Files | Est. Tokens |
|------|-------|-------|-------------|
| 1 | Foundation & Entry | README.md, dev.js, start.js, package.json | ~15k |
| 2 | Core Modules | msgpack.js, ws-client.js, layout-patch.js | ~12k |
| 3 | Design Specs | 3 specs + 1 plan (superpowers) | ~18k |
| 4 | Implementation Plans | 9 plans (phases + research) | ~22k |

**Tổng ước tính**: ~67k tokens

## Model Strategy

- **Wave 1, 3, 4**: sonnet-4-6 (deep analysis + synthesis)
- **Wave 2**: haiku-4-5 (code reading + format)
