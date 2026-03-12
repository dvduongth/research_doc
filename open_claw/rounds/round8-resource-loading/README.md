# Round 8: Resource Loading
**Mục tiêu**: Hiểu chi tiết hệ thống Resource Loading của pi-coding-agent: cách extensions, skills, prompts, themes, context files, system prompt được discovered, loaded, filtered, overridden, và reloaded.

---

## 🎯 Mục tiêu chi tiết

- [ ] Resource types: skills, extensions, prompt templates, themes, context files (AGENTS.md, CLAUDE.md), system prompt, append system prompt.
- [ ] Discovery paths cho mỗi resource type (global vs project vs packages).
- [ ] Loading order và precedence.
- [ ] Override mechanisms: `*_Override` functions trong `DefaultResourceLoaderOptions`.
- [ ] Settings-based filtering: `skills.enabled/disabled`, `extensions.enabled/disabled`, etc.
- [ ] Hot reload: `reload()` workflow.
- [ ] Package resource integration (`PackageManager`).
- [ ] Path metadata và diagnostics.
- [ ] Vẽ diagrams: loading pipeline, filtering, override.
- [ ] Phân tích implications: performance, caching, errors.

---

## 📂 Files

```
round8-resource-loading/
├── README.md
├── checklist.md
├── quiz.md
├── PROGRESS.md
├── diagrams/
│   ├── loading-pipeline.mmd
│   ├── filtering.mmd
│   └── override-flow.mmd
└── notes/
    ├── 01-discovery-paths.md
    ├── 02-override-system.md
    ├── 03-filtering-settings.md
    ├── 04-hot-reload.md
    ├── 05-package-integration.md
    └── 06-diagnostics-metadata.md
```

---

## 📚 Sources

- `packages/coding-agent/src/core/resource-loader.ts`
- `packages/coding-agent/src/core/package-manager.ts`
- `packages/coding-agent/src/core/settings-manager.ts`
- `packages/coding-agent/docs/extensions.md` (partially)
- `src/modes/interactive/theme/theme.ts` (for themes)

---

## 📋 Checklist (các phase)

- [ ] Phase 1: Discovery paths (filesystem + packages)
- [ ] Phase 2: Loading order & precedence
- [ ] Phase 3: Override system
- [ ] Phase 4: Settings filtering
- [ ] Phase 5: Hot reload process
- [ ] Phase 6: Package integration
- [ ] Phase 7: Diagnostics & metadata
- [ ] Phase 8: Diagrams
- [ ] Phase 9: Quiz
- [ ] Phase 10: PROGRESS

---

**Tiến độ**: 0%
