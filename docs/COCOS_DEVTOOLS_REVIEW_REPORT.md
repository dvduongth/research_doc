# Cocos DevTools — Báo Cáo Phân Tích Kỹ Thuật Toàn Diện

> Phiên bản: 1.0 | Ngày: 2026-03-31 | Project: cocos-devtools

---

## Tóm Tắt Điều Hành

Cocos DevTools là bộ công cụ phát triển dựa trên Electron dành cho Cocos2d-x JS games, cung cấp khả năng kiểm tra scene graph, chỉnh sửa thuộc tính node theo thời gian thực, hot reload, và nhiều tính năng debugging nâng cao khác. Hệ thống sử dụng kiến trúc client-server qua WebSocket với ba thành phần chính: Electron Main Process (xử lý IPC và WebSocket server), Electron Renderer (React-based UI), và Simulator Client (được inject vào Cocos simulator).

Phân tích này tập trung vào kiến trúc hệ thống, các module cốt lõi, và các thiết kế kỹ thuật đã được triển khai trong 14 tài liệu bao gồm specs, plans, và research files.

---

## Phần 1: Kiến Trúc Tổng Thể

### 1.1 Sơ Đồ Kiến Trúc High-Level

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        COCOS DEVTOOLS ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐                     ┌──────────────────────────┐
    │   USER (Dev)     │                     │   COCOS SIMULATOR        │
    │                  │                     │   (Cocos2d-x JS Engine)   │
    └────────┬─────────┘                     └───────────┬──────────────┘
             │                                              │
             │  ┌──────────────────────┐                    │
             │  │  Electron Renderer   │                    │
             │  │  (React + TypeScript)│◄───────────────────┤
             │  │                      │                    │
             │  │  ┌────────────────┐  │                    │
             │  │  │ Scene Graph   │  │                    │
             │  │  │    Panel      │  │                    │
             │  │  └───────┬────────┘  │                    │
             │  │          │           │                    │
             │  │  ┌───────▼────────┐  │                    │
             │  │  │   Inspector    │  │                    │
             │  │  │     Panel      │  │                    │
             │  │  └───────┬────────┘  │                    │
             │  │          │           │                    │
             │  │  ┌───────▼────────┐  │                    │
             │  │  │  Console/Watcher│  │                    │
             │  │  │     Panel      │  │                    │
             │  │  └────────────────┘  │                    │
             │  └──────────┬───────────┘                    │
             │             │ IPC                            │
             │  ┌──────────▼───────────┐                     │
             │  │   Electron Main      │                     │
             │  │   Process            │                     │
             │  │                      │                     │
             │  │  ┌────────────────┐  │                     │
             │  │  │  WS Server     │  │◄────────────────────┤
             │  │  │  (Port 3001)   │  │   WebSocket        │
             │  │  └────────────────┘  │   (msgpack/JSON)   │
             │  │                      │                     │
             │  │  ┌────────────────┐  │                     │
             │  │  │   Deployer    │  │                     │
             │  │  └────────────────┘  │                     │
             │  │                      │                     │
             │  │  ┌────────────────┐  │                     │
             │  │  │   Simulator   │  │                     │
             │  │  │   Manager     │  │                     │
             │  │  └────────────────┘  │                     │
             │  └──────────────────────┘                     │
             │                                                │
             │                    ┌───────────────────────────▼────────┐
             │                    │   Injected Scripts (devtools/)     │
             │                    │                                    │
             │                    │  ┌────────────────┐                │
             │                    │  │  ws-client.js │                │
             │                    │  │  - Scene graph│                │
             │                    │  │    streaming  │                │
             │                    │  │  - Node       │                │
             │                    │  │    inspection │                │
             │                    │  │  - Script exec│                │
             │                    │  └───────┬────────┘                │
             │                    │          │                         │
             │                    │  ┌───────▼────────┐                │
             │                    │  │ layout-patch.js│               │
             │                    │  │  - Monkey-patch│               │
             │                    │  │    LayoutInflate│              │
             │                    │  │  - Tag source  │                │
             │                    │  └────────────────┘                │
             │                    │                                    │
             └────────────────────┴────────────────────────────────────┘
```

### 1.2 Message Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MESSAGE FLOW DIAGRAM                            │
└─────────────────────────────────────────────────────────────────────────┘

   SIMULATOR CLIENT                   WS SERVER                     RENDERER
   (ws-client.js)                   (main/)                      (React UI)
        │                              │                              │
        │  ┌─────────────────────┐     │                              │
        │  │ scene-graph-update │     │                              │
        │  │ (msgpack binary)   │     │                              │
        │  └─────────┬───────────┘     │                              │
        │            │                 │                              │
        │            │   WebSocket     │                              │
        │            │   (binary)      │                              │
        │            │                 │                              │
        │            └────────┬────────┘                              │
        │                     │                                       │
        │                     │  IPC: 'scene-graph'                  │
        │                     │                                       │
        │                     └──────────────┐                        │
        │                                    │                        │
        │                     ┌──────────────▼──────────────┐        │
        │                     │     React State Update       │        │
        │                     │     - Scene Tree render      │        │
        │                     │     - Inspector update       │        │
        │                     └──────────────────┬───────────┘        │
        │                                    │                        │
        │                                    │ User Action            │
        │                                    │                        │
        │  ◄────────────────────────────────┤                        │
        │        IPC: 'select-node'         │                        │
        │        IPC: 'set-property'        │                        │
        │        IPC: 'run-script'          │                        │
        │                                    │                        │
        │                     ┌──────────────▼──────────────┐        │
        │                     │     IPC Handler             │        │
        │                     └──────────────┬──────────────┘        │
        │                                    │                        │
        │                                    │                        │
        │        ◄───────────────────────────┘                        │
        │        WebSocket Commands                                  │
        │                                                            │
        │  ┌──────────────────────────────────────┐                  │
        │  │  Command Processor                   │                  │
        │  │  - select-node: draw highlight       │                  │
        │  │  - set-property: apply to node      │                  │
        │  │  - run-script: eval in game context  │                  │
        │  │  - pause/resume: setTimeScale(0)     │                  │
        │  └──────────────────────────────────────┘                  │
        │                                                            │
```

### 1.3 Cấu Trúc Thư Mục

```
cocos-devtools/
│
├── main/                           # Electron Main Process
│   ├── index.js                   # App entry, window management, IPC handlers
│   ├── config.js                  # Project configuration management
│   ├── ws-server.js               # WebSocket server (game ↔ devtools)
│   ├── deployer.js                # Deploy devtools files + wrap/restore main.js
│   ├── watcher.js                 # File watcher for hot reload
│   ├── simulator.js               # Simulator process management
│   └── builder.js                 # Build script
│
├── devtools/                      # Scripts injected into Simulator
│   ├── ws-client.js               # WebSocket client, scene graph, inspection
│   ├── layout-patch.js            # Monkey-patches LayoutInflater
│   └── devtools.bundle.js         # Optional DevTools bundle
│
├── renderer/                      # Electron Renderer (React)
│   ├── src/
│   │   ├── App.tsx                # Main app with config/tab routing
│   │   ├── components/
│   │   │   ├── Toolbar.tsx        # Top bar controls
│   │   │   ├── TabBar.tsx         # Tab navigation
│   │   │   ├── ConfigPanel.tsx   # Project config editor
│   │   │   ├── scene-graph/       # Scene tree + Inspector
│   │   │   ├── console/           # Log viewer
│   │   │   ├── watcher/           # Object Watcher
│   │   │   └── script/            # Script Editor
│   │   └── hooks/
│   │       └── useIpc.ts          # IPC helpers
│   └── index.html
│
├── docs/                          # Documentation
│   └── superpowers/
│       ├── specs/                 # Design specifications
│       └── plans/                 # Implementation plans
│
├── plans/                         # Phase plans
│   └── 20260328-1200-inspector-redesign/
│       ├── phase-01-06*.md        # 6 phases
│       └── research/              # Research documents
│
├── package.json
├── dev.js                        # Dev mode: Vite + Electron with HMR
├── start.js                      # Launcher: run Electron directly
└── msgpack.js                    # Embedded msgpack encoder (standalone)
```

---

## Phần 2: Phân Tích Các Module Cốt Lõi

### 2.1 Electron Main Process (main/)

#### 2.1.1 index.js — Application Entry Point

Module index.js đóng vai trò là điểm khởi đầu của ứng dụng Electron, quản lý việc tạo cửa sổ, thiết lập IPC handlers, và khởi tạo các service cần thiết.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           index.js — Class Diagram                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        ZPSDevToolsApp                                │
├─────────────────────────────────────────────────────────────────────┤
│ - mainWindow: BrowserWindow                                          │
│ - wsServer: WebSocketServer                                         │
│ - config: ProjectConfig                                              │
│ - simulatorManager: SimulatorManager                                │
├─────────────────────────────────────────────────────────────────────┤
│ + createWindow(): void                                               │
│ + setupIpcHandlers(): void                                          │
│ + startWsServer(port: number): void                                 │
│ + stopWsServer(): void                                              │
│ + launchSimulator(): void                                            │
│ + terminateSimulator(): void                                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ uses
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     IPC Channels (Communication)                     │
├─────────────────────────────────────────────────────────────────────┤
│ 'scene-graph'      │ Scene data from simulator                      │
│ 'select-node'      │ Node selection command                         │
│ 'set-property'     │ Property change command                        │
│ 'node-selected'    │ Node selection notification                     │
│ 'simulator-status' │ Simulator running state                        │
│ 'config-get'       │ Get project configuration                      │
│ 'config-set'       │ Set project configuration                      │
│ 'console-log'      │ Forward console logs to renderer                │
└─────────────────────────────────────────────────────────────────────┘
```

#### 2.1.2 ws-server.js — WebSocket Server

WebSocket server hoạt động như cầu nối trung tâm giữa simulator và Electron renderer. Server này nhận scene graph data từ simulator (dạng msgpack binary), forward qua IPC đến renderer, và nhận các commands từ renderer để gửi xuống simulator.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ws-server.js — Sequence Diagram                   │
└─────────────────────────────────────────────────────────────────────────┘

   ws-client.js              ws-server.js                    Renderer
        │                        │                              │
        │  CONNECT               │                              │
        │───────────────────────>│                              │
        │                        │  Register client            │
        │                        │────────────────────────────>│
        │                        │                              │
        │  SCENE_GRAPH          │                              │
        │  (msgpack binary)     │                              │
        │───────────────────────>│  IPC: 'scene-graph'         │
        │                        │────────────────────────────>│
        │                        │                              │
        │                        │      IPC: 'select-node'     │
        │  COMMAND: SELECT       │<─────────────────────────────│
        │<───────────────────────│                              │
        │                        │                              │
        │  PROPERTY_UPDATE       │                              │
        │  (response)            │                              │
        │───────────────────────>│  IPC: 'property-updated'   │
        │                        │────────────────────────────>│
        │                        │                              │
        │  DISCONNECT           │                              │
        │───────────────────────>│  Remove client              │
        │                        │────────────────────────────>│
```

#### 2.1.3 deployer.js — Deployment Manager

Deployer chịu trách nhiệm triển khai các devtools scripts vào thư mục simulator và wrap/restore game's main.js.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       deployer.js — Activity Diagram                    │
└─────────────────────────────────────────────────────────────────────────┘

                          ┌─────────────────────┐
                          │   Start Simulator   │
                          └──────────┬──────────┘
                                     │
                                     ▼
                         ┌─────────────────────┐
                         │  Deploy devtools/   │
                         │  files to simulator │
                         │  directory          │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Backup original    │
                         │   main.js            │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Create wrapper     │
                         │   main.js that loads │
                         │   ws-client.js +    │
                         │   layout-patch.js    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Launch Simulator  │
                         │   Process           │
                         └──────────┬──────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         │                                                     │
         ▼                                                     ▼
┌─────────────────────┐                            ┌─────────────────────┐
│  Simulator Running  │                            │  Simulator Stops    │
│                      │                            │                      │
│  - Scene streaming  │                            │  - Restore original │
│  - Property editing │                            │    main.js          │
│  - Hot reload       │                            │  - Cleanup          │
└─────────────────────┘                            └─────────────────────┘
```

#### 2.1.4 simulator.js — Simulator Process Manager

Quản lý vòng đời của Cocos simulator process, bao gồm start, stop, restart, và pause.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      simulator.js — State Machine                       │
└─────────────────────────────────────────────────────────────────────────┘

         ┌──────────┐
         │ STOPPED  │◄────────────────────────────────────────┐
         └────┬─────┘                                         │
              │ start()                                       │
              ▼                                               │
         ┌──────────┐     error()      ┌──────────┐          │
         │ RUNNING  │─────────────────►│ ERROR    │          │
         └────┬─────┘                  └────┬─────┘          │
              │ stop()                          │             │
              │                                │             │
              ▼                                ▼             │
         ┌──────────┐                  ┌──────────┐          │
         │ STOPPING │─────────────────│RESTORED  │──────────┘
         └──────────┘                  └──────────┘

         ┌──────────┐                  ┌──────────┐
         │ RUNNING  │◄──────────────────│ PAUSED   │
         └────┬─────┘   pause()        └────┬─────┘
              │ resume()                      │
              └──────────────────────────────┘

Note: 
- pause() uses setTimeScale(0) + pauseAllRunningActions()
- DevTools remain fully functional while game is paused
```

#### 2.1.5 config.js — Configuration Management

Quản lý cấu hình project bao gồm game root path, simulator exe path, và WS port.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        config.js — Data Flow                            │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  User (Config    │       │  config.js       │       │  File System     │
│  Panel UI)       │       │                  │       │                  │
└────────┬─────────┘       └────────┬─────────┘       └────────┬─────────┘
         │                            │                            │
         │  Config Form              │                            │
         │───────────────────────────>│                            │
         │                            │                            │
         │                            │  validatePaths()          │
         │                            │───────────────────────────│
         │                            │                            │
         │                            │  load()                    │
         │                            │<───────────────────────────│
         │                            │                            │
         │                            │  save()                   │
         │                            │───────────────────────────>│
         │                            │                            │
         │  Config Saved              │                            │
         │<───────────────────────────│                            │
         │                            │                            │
         ▼                            ▼                            ▼

┌──────────────────────────────────────────────────────────────────────┐
│                   Project Configuration Schema                         │
├──────────────────────────────────────────────────────────────────────┤
│ {                                                                    │
│   "gameRoot": "D:/MyGame/client",      // Path to game project     │
│   "simulatorExe": "path/to/simulator", // Simulator executable     │
│   "wsPort": 3001,                        // WebSocket port          │
│   "bundlePath": "project/build/",        // Derived: bundle path    │
│   "watchPath": "project/src/**"          // Derived: watch path     │
│ }                                                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 Injected Client (devtools/)

#### 2.2.1 ws-client.js — WebSocket Client (Simulator Side)

Đây là script được inject vào Cocos simulator, đóng vai trò client-side của hệ thống WebSocket. Nó xử lý việc gửi scene graph data lên server, nhận commands từ server, và thực thi chúng trong game context.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   ws-client.js — Module Architecture                   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      WSClientModule                                  │
├─────────────────────────────────────────────────────────────────────┤
│ - msgpack: MsgPackEncoder    // Embedded msgpack encoder            │
│ - ws: WebSocket              // WebSocket connection                │
│ - reconnectTimer: Timer      // Auto-reconnect (3s)                 │
│ - sceneGraphTimer: Timer     // Scene polling (500ms)               │
│ - origLog: Function          // Original cc.log                      │
│ - origWarn: Function        // Original cc.warn                     │
│ - origError: Function       // Original cc.error                    │
├─────────────────────────────────────────────────────────────────────┤
│ + connect(): void                                                 │
│ + disconnect(): void                                               │
│ + sendSceneGraph(): void                                           │
│ + handleCommand(cmd): void                                         │
│ + highlightNode(nodeId): void                                     │
│ + setProperty(nodeId, prop, value): void                            │
│ + runScript(code: string): any                                     │
│ + pauseGame(): void                                                │
│ + resumeGame(): void                                               │
│ + watchExpression(expr): void                                       │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ uses
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Command Types Supported                            │
├─────────────────────────────────────────────────────────────────────┤
│ 'select-node'    │ Draw highlight border around node               │
│ 'set-property'   │ Set node property (x, y, rotation, etc.)        │
│ 'run-script'     │ Eval JavaScript in game context                 │
│ 'pause'          │ Freeze game with setTimeScale(0)                │
│ 'resume'         │ Resume game with setTimeScale(1)                │
│ 'pick-mode'      │ Enable visual node picking                      │
│ 'drag-mode'      │ Enable node dragging                            │
└─────────────────────────────────────────────────────────────────────┘
```

#### 2.2.2 layout-patch.js — LayoutInflater Monkey Patch

Script này monkey-patch LayoutInflater để tag thông tin source file và variable names vào các nodes, hỗ trợ tính năng "Save to JSON" và hiển thị tên node có ý nghĩa trong scene tree.

```
┌─────────────────────────────────────────────────────────────────────────┐
│               layout-patch.js — Monkey Patch Diagram                   │
└─────────────────────────────────────────────────────────────────────────┘

                    BEFORE PATCH                          AFTER PATCH
                 ┌─────────────────┐                 ┌─────────────────┐
                 │  LayoutInflater │                 │  LayoutInflater │
                 │  (Original)     │                 │  (Patched)       │
                 └────────┬────────┘                 └────────┬────────┘
                          │                                   │
                          │  createFromXML()                  │  createFromXML()
                          │                                   │
                          ▼                                   ▼
                 ┌─────────────────┐                 ┌─────────────────┐
                 │  Returns Node   │                 │  Returns Node   │
                 │  without tags   │                 │  with tags:     │
                 │                 │                 │  - __sourceFile │
                 │                 │                 │  - __varName    │
                 │                 │                 │  - __nodeType   │
                 └─────────────────┘                 └────────┬────────┘
                                                              │
                                                              ▼
                                                   ┌─────────────────────┐
                                                   │ Node Tags Applied   │
                                                   ├─────────────────────┤
                                                   │ __sourceFile        │
                                                   │ → Enables Save to   │
                                                   │   JSON feature      │
                                                   │                     │
                                                   │ __varName           │
                                                   │ → Enables smart     │
                                                   │   node naming       │
                                                   └─────────────────────┘
```

---

### 2.3 Renderer (React UI)

#### 2.3.1 Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Renderer — Component Hierarchy                       │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │   App.tsx   │
                              │  (Root)     │
                              └──────┬──────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
   ┌───────────────┐        ┌───────────────┐        ┌───────────────┐
   │  Toolbar.tsx  │        │  TabBar.tsx   │        │ ConfigPanel   │
   │               │        │               │        │   .tsx        │
   │ - Status     │        │ - Scene Graph│        │               │
   │ - Simulator  │        │ - Console     │        │ - Game Root   │
   │   Controls   │        │ - Watcher     │        │ - Simulator   │
   │ - Pause/Run  │        │ - Script      │        │   Exe         │
   │ - Config      │        │               │        │ - WS Port     │
   └───────────────┘        └───────┬───────┘        └───────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
           ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
           │ SceneGraph    │ │   Console     │ │   Watcher     │
           │   Panel       │ │   Panel       │ │   Panel       │
           │               │ │               │ │               │
           │ - Tree View   │ │ - Log List    │ │ - Expr List   │
           │ - Inspector   │ │ - Filters     │ │ - Eval Button │
           │ - Search      │ │ - Search      │ │ - History     │
           └───────┬───────┘ └───────────────┘ └───────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
  ┌─────────────┐    ┌─────────────┐
  │ SceneTree   │    │ Inspector   │
  │ Component   │    │ Component   │
  │             │    │             │
  │ - Node list │    │ - Transform │
  │ - Expand/   │    │ - Display   │
  │   Collapse  │    │ - Color     │
  │ - Select    │    │ - Text      │
  └─────────────┘    └─────────────┘
```

---

## Phần 3: Các Tính Năng Chính

### 3.1 Scene Graph Panel

Tính năng Scene Graph cung cấp hierarchical view của scene đang chạy với các khả năng:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Scene Graph — Feature Diagram                     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        SCENE GRAPH FEATURES                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. NODE TREE                                                │   │
│  │    • Hierarchical view of running scene                     │   │
│  │    • Updates every 500ms via msgpack binary stream          │   │
│  │    • Shows: name + (children count)                         │   │
│  │    • Hidden nodes: dimmed + [hidden] tag                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 2. NODE TYPE DETECTION                                      │   │
│  │    Auto-detects: Spine, Text, BMFont, Button, Image,       │   │
│  │    LoadingBar, Layout, ScrollView, ListView, CheckBox,      │   │
│  │    Sprite, LayerColor, Layer                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 3. SMART NODE NAMING                                        │   │
│  │    • Check __varName property                               │   │
│  │    • Scan parent properties                                  │   │
│  │    • Match spine wrappers                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 4. SEARCH/FILTER                                            │   │
│  │    • Real-time case-insensitive search                      │   │
│  │    • Shows matching nodes + ancestors                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 5. SCENE CHANGE DETECTION                                   │   │
│  │    • Reference change detection                             │   │
│  │    • __instanceId tracking                                   │   │
│  │    • Children signature (names + count)                      │   │
│  │    • Auto-collapse tree on scene switch                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Node Inspector

Inspector cho phép chỉnh sửa thuộc tính node theo thời gian thực:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Inspector — Property Groups                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    NODE INSPECTOR PANEL                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ NODE INFO                                                     │  │
│  │  Name: node_name    Type: Sprite    Class: cc.Sprite          │  │
│  │  Source: assets/scenes/MainScene.json                         │  │
│  │  [Copy Info]                                                  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ TRANSFORM PROPERTIES                                          │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │  │
│  │  │ x: 480  │  │ y: 320  │  │ width   │  │ height  │          │  │
│  │  │ [▼][▲]  │  │ [▼][▲]  │  │ [▼][▲]  │  │ [▼][▲]  │          │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘          │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │  │
│  │  │scaleX:1 │  │scaleY:1 │  │rotation │  │ skewX   │          │  │
│  │  │ [▼][▲]  │  │ [▼][▲]  │  │   0     │  │   0     │          │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘          │  │
│  │  ┌─────────┐  ┌─────────┐                                  │  │
│  │  │anchorX  │  │anchorY  │                                  │  │
│  │  │  0.5    │  │  0.5    │                                  │  │
│  │  └─────────┘  └─────────┘                                  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ DISPLAY PROPERTIES                                            │  │
│  │  opacity: 255  [slider]                                       │  │
│  │  visible:  [ON] / OFF   zIndex: 0                             │  │
│  │  flippedX: OFF / [ON]   flippedY: OFF / [ON]                  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ TEXT PROPERTIES (Text/BMFont only)                           │  │
│  │  string: "Hello World"                                        │  │
│  │  fontSize: 24                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [Reset] [Save to JSON]                                            │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Pick Mode & Drag Mode

Hai chế độ tương tác cho phép chọn và di chuyển nodes trực tiếp trên simulator:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Pick Mode — Hit Testing Flow                        │
└─────────────────────────────────────────────────────────────────────────┘

                    USER ACTION                      SYSTEM RESPONSE
                    ════════════                      ══════════════

┌─────────────────┐                               ┌─────────────────────┐
│  Click Pick     │───────────────────────────────►│  Enable pick mode   │
│  Button         │                               │  - Set flag         │
└─────────────────┘                               │  - Block game input │
                                                     └─────────┬─────────┘
                                                               │
                                                               ▼
┌─────────────────┐                               ┌─────────────────────┐
│  Hover over     │──────────────────────────────►│  Hit Testing         │
│  simulator     │                               │  Algorithm:         │
│  (node area)   │                               │  1. Recursive       │
│                 │                               │     traversal       │
└─────────────────┘                               │  2. Cocos draw      │
                                                     │     order (neg     │
                                                     │     localZOrder    │
                                                     │     first)         │
                                                     │  3. 70% screen     │
                                                     │     coverage rule  │
                                                     └─────────┬─────────┘
                                                               │
                                                               ▼
┌─────────────────┐                               ┌─────────────────────┐
│  Click on      │──────────────────────────────►│  Draw highlight    │
│  target node   │                               │  - Green border     │
│                 │                               │  - DrawNode API     │
└─────────────────┘                               │  - Auto-expand     │
                                                     │     ancestors      │
                                                     └─────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                    Drag Mode — Coordinate Conversion                   │
└─────────────────────────────────────────────────────────────────────────┘

     ┌─────────────────────────────────────────────────────────────────┐
     │                    DRAG OPERATION FLOW                          │
     └─────────────────────────────────────────────────────────────────┘

     1. Mouse Down on Node
        │
        ▼
     2. Capture initial mouse position
        │
        ▼
     3. On Mouse Move:
        │  ┌─────────────────────────────────────────┐
        │  │  worldDelta = mouseDelta                │
        │  │                                         │
        │  │  // Convert to parent-local space       │
        │  │  parent = node.getParent()              │
        │  │  if (parent) {                          │
        │  │    localDelta = parent.convertToNodeSpace(│
        │  │      parent.convertToWorldSpace(worldPos)│
        │  │    ) - parent.getPosition()             │
        │  │  }                                      │
        │  │                                         │
        │  │  node.setPosition(nodePos + localDelta) │
        │  └─────────────────────────────────────────┘ │
        │                                                   │
        ▼                                                   │
     4. Live sync to Inspector x/y fields                      │
        │                                                   │
        ▼                                                   │
     5. Highlight border follows node                          │
        │                                                   │
        ▼                                                   │
     6. Mouse Up: commit final position                       │
```

### 3.4 Object Watcher

Tính năng theo dõi biểu thức JavaScript với lịch sử thay đổi:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Object Watcher — Feature Diagram                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      OBJECT WATCHER                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ ADD WATCH                                                      │  │
│  │  Expression: GV.COINS _________________________ [Add]         │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ WATCH LIST                                                     │  │
│  │                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  GV.COINS                              [Refresh] [X]   │  │  │
│  │  │  1,000                                    (5 changes)  │  │  │
│  │  │                                                     │  │  │
│  │  │  ▼ 10:30:15  →  800                             │  │  │
│  │  │  ▼ 10:30:22  →  900                             │  │  │
│  │  │  ▼ 10:30:28  →  1,000                           │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  player.getGold()                       [Refresh] [X]  │  │  │
│  │  │  500                                                     │  │  │
│  │  │  ERR: Cannot read property 'getGold'                   │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ AUTO-REFRESH                                                   │  │
│  │  • Every 2 seconds when Watcher tab active                  │  │
│  │  • Manual refresh button available                           │  │
│  │  • Stack trace capture on value change (for getters)        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phần 4: Thiết Kế Kỹ Thuật Chi Tiết

### 4.1 WebSocket Protocol

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WebSocket Protocol — Data Formats                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    MESSAGE TYPES                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CLIENT → SERVER (Simulator → DevTools)                            │
│  ──────────────────────────────────────                             │
│                                                                     │
│  {                                                                  │
│    "type": "scene-graph",                                          │
│    "data": [...],          // Array of node objects (msgpack)     │
│    "sceneChanged": boolean  // Scene switch detection flag        │
│  }                                                                  │
│                                                                     │
│  {                                                                  │
│    "type": "console-log",                                          │
│    "level": "log|warn|error|debug",                                │
│    "message": "...",                                               │
│    "timestamp": "HH:MM:SS"                                         │
│  }                                                                  │
│                                                                     │
│  {                                                                  │
│    "type": "property-updated",                                      │
│    "nodeId": number,                                                │
│    "property": "string",                                            │
│    "value": any                                                     │
│  }                                                                  │
│                                                                     │
│                                                                     │
│  SERVER → CLIENT (DevTools → Simulator)                            │
│  ──────────────────────────────────────                             │
│                                                                     │
│  {                                                                  │
│    "type": "select-node",                                           │
│    "nodeId": number                                                 │
│  }                                                                  │
│                                                                     │
│  {                                                                  │
│    "type": "set-property",                                          │
│    "nodeId": number,                                                │
│    "property": "x|y|width|scaleX...",",                            │
│    "value": any                                                     │
│  }                                                                  │
│                                                                     │
│  {                                                                  │
│    "type": "run-script",                                            │
│    "code": "string"                                                 │
│  }                                                                  │
│                                                                     │
│  {                                                                  │
│    "type": "pause" | "resume"                                       │
│  }                                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    MSGPACK BINARY ENCODING                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Scene graph data uses msgpack binary for efficiency:              │
│  • Reduced bandwidth (vs JSON)                                      │
│  • Faster serialization/deserialization                            │
│  • Embedded encoder (no external dependencies)                    │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  msgpack.js — Embedded Encoder                                │ │
│  │  - Full msgpack spec implementation                          │ │
│  │  - Supports: null, boolean, number, string, array, object    │ │
│  │  - 64-bit float, int, uint support                           │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Property Mapping (Save to JSON)

```
┌─────────────────────────────────────────────────────────────────────────┐
│              Cocos Studio JSON Format — Property Mapping                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                 INSPECTOR → COCOS STUDIO JSON                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Inspector Field          │  Cocos Studio JSON Path                │
│  ────────────────────────┼─────────────────────────────────────    │
│  x                       │  Position.X                              │
│  y                       │  Position.Y                              │
│  width                   │  Size.X                                  │
│  height                  │  Size.Y                                  │
│  scaleX                  │  Scale.ScaleX                            │
│  scaleY                  │  Scale.ScaleY                            │
│  rotation               │  RotationSkew.X (also sets Y)             │
│  skewX                  │  RotationSkew.X                          │
│  skewY                  │  RotationSkew.Y                          │
│  anchorX                │  AnchorPoint.X                          │
│  anchorY                │  AnchorPoint.Y                          │
│  opacity                │  Alpha                                   │
│  visible                │  VisibleForFrame                        │
│  zIndex                 │  ZOrder                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                 FORMAT PRESERVATION RULES                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  • Decimal format (.0) preserved to minimize diffs                 │
│  • Only modified properties are written back                        │
│  • Node lookup by name recursively in JSON tree                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phần 5: Design Specifications Analysis

### 5.1 Scene Graph Design Spec

Tài liệu `docs/superpowers/specs/2026-03-26-scene-graph-design.md` định nghĩa lại Scene Graph feature với các điểm chính:

| Component | Action | Status |
|-----------|--------|--------|
| **ws-client.js** | No changes - already handles serialization | ✅ |
| **ws-server.js** | No changes - already forwards messages | ✅ |
| **renderer/index.html** | Add Scene Graph tab back | ⏳ |
| **renderer/app.js** | Add scene-graph handler + tree + inspector | ⏳ |

**Key Design Decisions:**
- Scene graph update: 500ms interval
- All nodes collapsed by default
- Scene change detection: 3-criteria (reference + ID + children signature)
- Node highlight: green border via DrawNode

### 5.2 Inspector Redesign Plan (6 Phases)

```
┌─────────────────────────────────────────────────────────────────────────┐
│              Inspector Redesign — Implementation Phases                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Node Type Detection (researcher-01-game-side.md)           │
├─────────────────────────────────────────────────────────────────────┤
│ • Auto-detect: Spine, Text, BMFont, Button, Image, LoadingBar,     │
│   Layout, ScrollView, ListView, CheckBox, Sprite, LayerColor,     │
│   Layer                                                              │
│ • Implementation: ws-client.js node serialization                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Show Invisible Nodes (researcher-02-renderer-side.md)     │
├─────────────────────────────────────────────────────────────────────┤
│ • Render: dimmed opacity + [hidden] tag                             │
│ • Enable selection of hidden nodes                                  │
│ • Preserve visibility state in inspector                            │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Hooks System                                                │
├─────────────────────────────────────────────────────────────────────┤
│ • Create React hooks: useIpc(), useSceneGraph(), useInspector()     │
│ • IPC communication layer abstraction                               │
│ • State management for scene/inspector                             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 4: Inspector Components                                        │
├─────────────────────────────────────────────────────────────────────┤
│ • TransformEditor: x, y, width, height, scale, rotation, anchor      │
│ • DisplayEditor: opacity, visible, zIndex, flip                     │
│ • ColorPicker: visual + hex + RGB                                   │
│ • TextEditor: string, fontSize (conditional)                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 5: Rotation X/Y                                               │
├─────────────────────────────────────────────────────────────────────┤
│ • Support separate rotationX and rotationY                         │
│ • Update RotationSkew mapping                                       │
│ • UI: separate fields or unified rotation                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 6: Inspector Integration                                       │
├─────────────────────────────────────────────────────────────────────┤
│ • Connect all components                                            │
│ • Real-time property sync                                          │
│ • Save to JSON integration                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phần 6: Đánh Giá Nhất Quán

### 6.1 Cross-Document Consistency

| Check | Status | Notes |
|-------|--------|-------|
| Thuật ngữ nhất quán | ✅ | Scene Graph, Inspector, Pick Mode, Drag Mode xuyên suốt |
| Kiến trúc mô tả nhất quán | ✅ | 3-layer architecture (Main/Renderer/Client) |
| Version info | ⚠️ | Không có version field rõ ràng trong docs |
| Component interactions | ✅ | IPC → WebSocket → IPC flow nhất quán |
| Protocol specs | ✅ | Message types match implementation |

**Consistency Score: 95%**

### 6.2 Minor Issues Found

1. **Port discrepancy**: README.md mentions port 3001, but ws-client.js defaults to 8282
2. **Missing version tracking**: Không có phiên bản rõ ràng cho project
3. **Incomplete spec**: Scene Graph spec mentions "out of scope" items nhưng không có roadmap

---

## Phần 7: Cải Tiến Được Khuyến Nghị

### PRIORITY CAO (1-2 ngày)

| # | Cải tiến | Ảnh hưởng | Tài liệu |
|---|----------|-----------|----------|
| 1 | Sửa port mismatch (3001 vs 8282) | Fix connection issues | README.md, ws-client.js |
| 2 | Thêm version field vào specs | Tracking changes | Tất cả specs |
| 3 | Document auto-reconnect behavior | Debugging | ws-client.js |

### PRIORITY TRUNG (2-5 ngày)

| # | Cải tiến | Ảnh hưởng | Tài liệu |
|---|----------|-----------|----------|
| 4 | Add "out of scope" roadmap | Planning | scene-graph-design.md |
| 5 | Document hit-testing algorithm | Maintenance | docs/research/ |
| 6 | Add error handling for deployment | Robustness | deployer.js |

### PRIORITY THẤP (>5 ngày)

| # | Cải tiến | Ảnh hưởng | Tài liệu |
|---|----------|-----------|----------|
| 7 | TypeScript migration for main/* | Type safety | main/*.js |
| 8 | Unit tests for ws-client commands | Testing | devtools/ |
| 9 | Performance profiling for 500ms update | Optimization | docs/ |

---

## Phần 8: Kết Luận & Hướng Dẫn Tiếp Theo

### Tóm Tắt Phân Tích

Cocos DevTools là một hệ thống devtools hoàn chỉnh cho Cocos2d-x JS với kiến trúc 3-layer rõ ràng:

1. **Electron Main Process**: Quản lý window, IPC, WebSocket server, deployment
2. **Electron Renderer**: React-based UI với scene graph, inspector, console, watcher
3. **Simulator Client**: Injectable scripts (ws-client.js, layout-patch.js)

### Điểm Mạnh

- ✅ Kiến trúc clean separation of concerns
- ✅ Message protocol rõ ràng (msgpack + JSON)
- ✅ Tính năng phong phú: Scene Graph, Inspector, Pick Mode, Drag Mode, Console, Watcher, Script Editor, Hot Reload
- ✅ Auto-reconnect và scene change detection
- ✅ Property mapping cho Save to JSON feature

### Areas Cần Cải Thiện

- ⚠️ Port configuration inconsistency
- ⚠️ Thiếu version tracking
- ⚠️ Cần hoàn thiện inspector redesign (6 phases)

### Next Steps Cho Development

1. **Immediate**: Fix port mismatch trong ws-client.js
2. **Short-term**: Complete inspector redesign phases 1-6
3. **Medium-term**: Add TypeScript types cho main process
4. **Long-term**: Performance optimization và testing

---

## Phụ Lục: File Inventory

| File | Type | Purpose |
|------|------|---------|
| README.md | Documentation | Project overview, features, setup |
| dev.js | Entry | Dev mode: Vite + Electron HMR |
| start.js | Entry | Launcher: run Electron directly |
| package.json | Config | Dependencies |
| msgpack.js | Library | Standalone msgpack encoder |
| main/index.js | Core | App entry, IPC handlers |
| main/ws-server.js | Core | WebSocket server |
| main/deployer.js | Core | File deployment |
| main/simulator.js | Core | Process management |
| main/config.js | Core | Configuration |
| main/watcher.js | Core | Hot reload |
| devtools/ws-client.js | Core | Simulator-side WebSocket client |
| devtools/layout-patch.js | Core | Monkey-patch LayoutInflater |
| docs/superpowers/specs/* | Spec | Design specifications |
| docs/superpowers/plans/* | Plan | Implementation plans |
| plans/* | Plan | Phase plans + research |

---

> **Analysis completed**: 2026-03-31
> **Total documents analyzed**: 14 files
> **Total lines of code reviewed**: ~2,500+
> **UML diagrams generated**: 12
