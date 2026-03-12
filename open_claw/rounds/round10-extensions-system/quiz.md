> **Đã sửa**: Loại bỏ tất cả câu hỏi sai về `extension.json`, `init()/enable()/disable()`, dependency graph, topological sort, class instantiation, provide/consume API. Thay bằng câu hỏi đúng về factory function, `pi.on()`, `pi.registerTool()`, jiti loader, `ExtensionRunner.bindCore()`.

# Quiz: Extensions System (Round 10)

---

## Câu 1: Extension Basics

**Q1:** What is the primary purpose of an extension in pi-mono?
- A. Replace the entire agent.
- B. Provide additional tools and event handlers to extend agent capabilities.
- C. Manage user sessions.
- D. Handle LLM provider communication.

**Q2:** Where are extensions typically discovered? (multiple correct)
- A. Only in `node_modules`.
- B. In `.pi/extensions/`, `~/.pi/agent/extensions/`, settings paths, and `package.json` with `"pi"` field.
- C. Only in `src/extensions/builtin`.
- D. From a cloud registry.

**Q3:** What is the structure of a pi-mono extension?
- A. A class extending `Extension` base class.
- B. A TypeScript module exporting a default factory function (`ExtensionFactory`).
- C. A JSON manifest file (`extension.json`).
- D. A YAML configuration file.

**Q4:** What loader does pi-mono use to load extension TypeScript files?
- A. ts-node
- B. esbuild
- C. jiti
- D. webpack

---

## Câu 2: Lifecycle

**Q5:** What happens when an extension is loaded?
- A. `new Extension(context, manifest)` is called, then `init()`, then `enable()`.
- B. The factory function is called with `ExtensionAPI`, and the extension registers handlers/tools inside it.
- C. `init()` → `disable()` → `enable()`.
- D. The extension class is instantiated and `start()` is called.

**Q6:** How does an extension store private state?
- A. In `ExtensionContext.config`.
- B. On `this` (class instance fields).
- C. In closure variables inside the factory function.
- D. In a global variable.

**Q7:** What is `ExtensionRunner.bindCore()` for?
- A. It calls `init()` on all extensions.
- B. It replaces throwing stubs with real implementations when core agent is ready.
- C. It builds the dependency graph.
- D. It reads `extension.json` manifests.

**Q8:** What happens if a factory function throws?
- A. The agent stops.
- B. The extension is marked errored and its handlers/tools are not registered.
- C. It retries once.
- D. The exception is ignored.

---

## Câu 3: Event System

**Q9:** How does an extension subscribe to `turn_end`?
- A. `this.context.emit('turn_end', handler)`
- B. `pi.on('turn_end', handler)`
- C. `agent.on('turn_end', handler)`
- D. `extension.addEventListener('turn_end', handler)`

**Q10:** How many event types does pi-mono support?
- A. 5
- B. 10
- C. 27+
- D. 3

**Q11:** Which of these is a valid event type?
- A. `extension:init`
- B. `tool_execution_start`
- C. `class_construct`
- D. `manifest_load`

**Q12:** What should an extension do in an event handler to avoid crashing the agent?
- A. Return `false`.
- B. Throw a custom exception.
- C. Wrap code in try/catch.
- D. Nothing; agent catches automatically.

---

## Câu 4: Hook Points

**Q13:** Which event allows modifying messages before the LLM request is sent?
- A. `turn_start`
- B. `agent_start`
- C. `before_provider_request`
- D. `context`

**Q14:** How does an extension hook into agent events?
- A. By overriding `enable()` and mutating `agent.config.transformContext`.
- B. By calling `pi.on(eventName, handler)` in the factory function.
- C. By declaring hooks in `extension.json`.
- D. By extending the `Extension` base class.

**Q15:** The `context` event is primarily used for:
- A. Modifying the final LLM messages.
- B. Replacing the entire agent.
- C. Starting a new turn.
- D. Loading extensions.

**Q16:** If two extensions both register handlers for the same event, what determines execution order?
- A. Dependency graph topological sort.
- B. Extension discovery and load order.
- C. `priority` field in `extension.json`.
- D. Alphabetical by extension class name.

---

## Câu 5: Tools

**Q17:** How does an extension register a tool?
- A. `this.context.provide.tool('calc', fn, options)`
- B. `pi.registerTool({ name: 'calc', execute: fn, ... })`
- C. `agent.addTool('calc', fn)`
- D. `provide('tool', 'calc', fn)`

**Q18:** What shape must a tool definition have when calling `pi.registerTool()`?
- A. `{ name, description, parameters, execute }`
- B. `{ type: 'tool', text: string }`
- C. `{ template: string, vars: string[] }`
- D. `{ id, fn, options }`

**Q19:** What happens if two extensions register tools with the same name?
- A. The first one wins.
- B. The second one overwrites the first.
- C. An error is thrown.
- D. Both are kept as alternatives.

**Q20:** Does pi-mono have a provide/consume API for extensions to share resources?
- A. Yes, via `context.provide` and `context.consume`.
- B. No — extensions register tools and handlers independently, without direct inter-extension communication.
- C. Yes, via `extension.json` dependencies.
- D. Yes, via the Agent class.

**Q21:** What is the recommended way to avoid tool name conflicts between extensions?
- A. Use descriptive, prefixed names like `myext_toolname`.
- B. Use the `priority` field.
- C. Declare dependencies in `extension.json`.
- D. Use CamelCase.

---

## Câu 6: Discovery & Loading

**Q22:** Which of these is a valid extension discovery source?
- A. `extension.json` in the project root.
- B. `.pi/extensions/` directory.
- C. `extension-registry.yaml`.
- D. `node_modules/.extensions/`.

**Q23:** What metadata identifies a package as a pi-mono extension?
- A. An `extension.json` file.
- B. A `"pi"` field in `package.json`.
- C. A `manifest.yaml` file.
- D. A `dependencies` entry for `pi-agent`.

**Q24:** Does pi-mono support a dependency graph between extensions?
- A. Yes, with topological sort using Kahn's algorithm.
- B. Yes, declared in `extension.json`.
- C. No — extensions are loaded in discovery order without dependency management.
- D. Yes, with version ranges and optional dependencies.

**Q25:** What is jiti?
- A. A JSON parser for extension manifests.
- B. A TypeScript loader that allows loading .ts files directly without pre-compilation.
- C. A dependency resolution algorithm.
- D. A testing framework for extensions.

---

## Câu 7: Advanced

**Q26:** What is the factory function signature for a pi-mono extension?
- A. `class MyExtension extends Extension { init(); enable(); disable(); }`
- B. `export default function(pi: ExtensionAPI): void | Promise<void>`
- C. `module.exports = { init, enable, disable }`
- D. `export default class implements ExtensionInterface`

**Q27:** What does an extension's factory function typically do?
- A. Return an Extension class instance.
- B. Call `pi.on()` to register event handlers and `pi.registerTool()` to register tools.
- C. Write to `extension.json` and return a manifest.
- D. Call `init()`, `enable()`, then return void.

**Q28:** An extension wants to react to every turn. Which event should it use?
- A. `agent_start`
- B. `turn_start` or `turn_end`
- C. `extension:turn`
- D. `before_provider_request`

**Q29:** Which of the following is **not** something extensions can do via `pi`?
- A. Register tools with `pi.registerTool()`
- B. Subscribe to events with `pi.on()`
- C. Provide themes with `pi.provide.theme()`
- D. Both A and B are valid

**Q30:** True or False: Extensions run in separate processes by default.
- A. True
- B. False

---

## Câu 8: Debugging

**Q31:** To verify an extension loaded correctly, you should:
- A. Check `extension-manager.json`.
- B. Add `console.log` at the start of the factory function.
- C. Look at `ExtensionContext.status`.
- D. Run `pi extensions info <id>`.

**Q32:** If a tool registered by an extension is not available, what is a likely cause?
- A. The extension factory function threw an error during loading.
- B. The extension's `enable()` was not called.
- C. The `extension.json` manifest is missing.
- D. The dependency graph has a cycle.

**Q33:** When testing an extension, how do you mock the API?
- A. Create a mock `ExtensionContext` and call `new MyExtension(mockContext)`.
- B. Create a mock `pi` object with `on` and `registerTool` methods, then call the factory function.
- C. Use `jest.mock('extension.json')`.
- D. Mock the `init()` and `enable()` lifecycle methods.

**Q34:** When reloading extensions, what happens?
- A. `disable()` on all → re-discover → `init()` → `enable()` on all.
- B. Extensions are unloaded, discovery locations re-scanned, factory functions re-executed with fresh ExtensionAPI.
- C. Only changed extensions are re-loaded.
- D. Just re-read manifests, no unload.

---

## Câu 9: Misc

**Q35:** What does `ExtensionRunner.bindCore()` do?
- A. Reads `extension.json` and builds dependency graph.
- B. Replaces throwing stubs in ExtensionAPI with real implementations from core agent.
- C. Calls `enable()` on all extensions.
- D. Sorts extensions by priority.

**Q36:** Which discovery path is project-local?
- A. `~/.pi/agent/extensions/`
- B. `.pi/extensions/`
- C. `/usr/lib/pi/extensions/`
- D. `node_modules/.pi/`

**Q37:** Can an extension's factory function be async?
- A. No, it must be synchronous.
- B. Yes, it can return a Promise.
- C. Only if declared in `extension.json`.
- D. Only for built-in extensions.

**Q38:** What is the correct way for an extension to register multiple event handlers?
- A. Call `pi.on()` multiple times with different event types.
- B. Pass an array to `pi.on(['event1', 'event2'], handler)`.
- C. Override `handleEvents()` method in Extension class.
- D. Declare handlers in `extension.json`.

**Q39:** Where does an extension's private state live?
- A. In `this.state` on the Extension class instance.
- B. In closure variables inside the factory function.
- C. In `context.config`.
- D. In `extension.json` config section.

**Q40:** True or False: Pi-mono extensions use `extension.json` as their manifest file.
- A. True
- B. False — extensions use `package.json` with a `"pi"` field, or are simply TypeScript modules with a default export factory function.

---

**End of quiz**.
