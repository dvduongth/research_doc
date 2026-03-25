# Báo Cáo Kiến Trúc Godot Engine

*Ngày phân tích: 2026-03-25*  
*Nguồn: https://docs.godotengine.org/en/stable/engine_details/architecture/index.html và classes index*  
*Người phân tích: Cốm Đào AI Assistant*

---

## 1. Tổng Quan Godot Engine

### 1.1 Giới thiệu
Godot Engine là một game engine mã nguồn mở, đa nền tảng, hỗ trợ cả 2D và 3D. Ra mắt năm 2014, Godot sử dụng license MIT, hoàn toàn miễn phí.

**Đặc điểm nổi bật:**
- **Lightweight**: Core nhỏ gọn (~20MB binary)
- **Node & Scene System**: Architecture độc đáo, dễ mở rộng
- **Multi-language**: GDScript (Python-like), C#, C++ (GDExtension), VisualScript (visual scripting)
- **Renderer linh hoạt**: Forward+, Mobile, Compatibility
- **Export đa nền tảng**: Desktop, Mobile, Web, Console

### 1.2 Triết lý thiết kế

```mermaid
mindmap
  root((Godot Triết lý thiết kế))
    All-inclusive
      Không cần marketplace
      Tất cả trong một engine
    Modular
      Có thể tắt module không dùng
      Custom build
    Community-driven
      Open source MIT
      Crowdin translation
      GitHub issues/PR
    Object-oriented
      Composition over inheritance
      Scene là đơn vị cơ bản
    Separate 2D/3D
      Hai engine riêng biệt
      Tối ưu render pipeline
```

---

## 2. Kiến Trúc Tổng Thể

### 2.1 Layered Architecture

```mermaid
graph TB
  subgraph "User Layer"
    GDScript[C#/GDScript/C++]
    Scene[Scene Files]
    Resource[Resource Files]
  end

  subgraph "Engine Layer"
    Core[Core]
    Module[Modules]
    Servers[Servers]
    Rendering[Rendering]
  end

  subgraph "Platform Layer"
    OS[OS Abstraction]
    Drivers[Graphics/Audio/Input Drivers]
    Physics[Physics Engines]
  end

  GDScript --> Core
  Scene --> Module
  Resource --> Servers
  Core --> Servers
  Module --> Servers
  Servers --> Rendering
  Rendering --> Drivers
  Servers --> Physics
  Physics --> Drivers
  OS --> Drivers
```

**Các lớp chính:**

1. **User Layer**: Code game, scenes, assets
2. **Engine Layer**:
   - **Core**: Memory management, math, OS wrappers
   - **Modules**:pharescene tree, physics, audio, networking
   - **Servers**: Single-instance systems (Display, Physics, Audio, etc.)
   - **Rendering**: 2D/3D render pipelines
3. **Platform Layer**: Platform-specific abstractions (POSIX, Windows, Android, iOS, Web)

### 2.2 Server Architecture

Godot sử dụng **server-based architecture** với **Service Locator pattern**:

```mermaid
classDiagram
  class Service {
    <<singleton>>
    +get_singleton() Service
    +init()
    +process()
    +finish()
  }

  class DisplayServer {
    +get_window_id()
    +set_screen_orientation()
    +native_video_get_id()
  }

  class PhysicsServer3D {
    +space_create()
    +body_add_space()
    +body_set_state()
    +area_set_shape()
  }

  class PhysicsServer2D {
    +space_create()
    +body_add_space()
    +body_set_state()
  }

  class AudioServer {
    +lock()
    +unlock()
    +set_bus_volume_linear()
  }

  class RenderingServer {
    +camera_allocate()
    +camera_set_transform()
    +mesh_allocate()
    +mesh_surface_allocate()
  }

  class InputServer {
    +add_input_map()
    +action_setup()
    +get_input_state()
  }

  Service <|-- DisplayServer
  Service <|-- PhysicsServer3D
  Service <|-- PhysicsServer2D
  Service <|-- AudioServer
  Service <|-- RenderingServer
  Service <|-- InputServer

  note for Service "Tất cả servers đều kế thừa từ Service class\nCó thể truy cập qua DisplayServer.get_singleton()"
```

**Các Server chính:**
- **DisplayServer**: Window management, display info, monitors
- **PhysicsServer2D/3D**: Physics simulation (Bullet3, custom)
- **AudioServer**: Audio playback, effects, buses
- **RenderingServer**: Low-level rendering commands
- **InputServer**: Input device management
- **VideoServer**: Video stream capture/playback
- **TextServer**: Font rendering, shaping (HarfBuzz)
- **TranslationServer**: i18n support

---

## 3. Node & Scene System

### 3.1 Core Concepts

**Node** là đơn vị cơ bản nhất trong Godot. Tất cả đều kế thừa từ `Node`:

```mermaid
classDiagram
  class Node {
    <<abstract>>
    +name: String
    +parent: Node
    +children: Array[Node]
    +get_parent() Node
    +add_child(node: Node)
    +remove_child(node: Node)
    +get_children() Array
    +_ready()
    +_process(delta: float)
    +_physics_process(delta: float)
    +_input(event: InputEvent)
    +_unhandled_input(event: InputEvent)
    +queue_free()
    +has_node(path: NodePath) bool
    +get_node(path: NodePath) Node
    +emit_signal(signal: String, ...)
  }

  class Object {
    +_init()
    +_notification(what: int)
    +is_class(class_name: String) bool
    +get_class() String
    +free()
    +weakref()
  }

  class Reference {
    +ref()
    +unref()
    +reference_get_count()
  }

  Node --|> Object
  Reference --|> Object

  class CanvasItem {
    +modulate: Color
    +self_modulate: Color
    +material: Material
    +_draw()
    +_process(delta: float)
  }

  class Spatial {
    +transform: Transform3D
    +global_transform: Transform3D
    +scale: Vector3
    +_process(delta: float)
  }

  CanvasItem --|> Node
  Spatial --|> Node

  class Control {
    +rect_min_size: Vector2
    +margin_*: float
    +anchor_*: float
    +_gui_input(event: InputEvent)
    +_notification(what: int)
  }

  class Viewport {
    +size: Vector2
    +world_2d: World2D
    +world_3d: World3D
    +render_target_update_mode
    +_notification(what: int)
  }

  Control --|> CanvasItem
  Viewport --|> CanvasItem
  Viewport --|> Spatial
```

### 3.2 Scene Tree

Scene Tree là cây quản lý tất cả nodes trong game:

```mermaid
graph BT
  subgraph "Scene Tree"
    ST[Scene Tree] --> Root
    Root --> NodeA
    Root --> NodeB
    Root --> NodeC
    NodeA --> ChildA1
    NodeA --> ChildA2
    NodeB --> ChildB1
    NodeB --> ChildB2
    NodeC --> ChildC1
    ChildA2 --> GrandChildA2_1
    GrandChildA2_1 --> GGChildA2_1_1
  end

  subgraph "SceneInstance"
    SI[Scene Instance] --> Root2
    Root2 --> NodeX
    NodeX --> ChildX1
    Root2 --> NodeY
    NodeY --> ChildY1
  end

  ST -.instantiates.-> SI

  classDef scene fill:#e1f5fe,stroke:#01579b,stroke-width:2px
  classDef instance fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
  class ST,Root,NodeA,NodeB,NodeC scene
  class SI,Root2,NodeX,NodeY instance
```

**Scene là một cây Node có thể được lưu thành file `.tscn` và instantiate nhiều lần.**

### 3.3 Signals (Event System)

```mermaid
sequenceDiagram
  participant Sender
  participant Receiver
  participant Signal

  Note over Sender,Receiver: Signal connection
  Sender->>+Receiver: connect("signal_name", callable)
  Note right of Receiver: Callback registered

  Note over Sender,Receiver: Emission
  Sender->>+Signal: emit_signal("signal_name", args...)
  Signal->>+Receiver: callback(args...)
  Receiver-->>-Signal: void
  Signal-->>-Sender: void
```

**Signals là event bus của Godot, dùng để giảm coupling giữa nodes.**

---

## 4. Rendering Architecture

### 4.1 Renderer Types

Godot 4 có 3 renderer:

1. **Forward+** (Mobile+, Desktop+): Mặc định, supports VRS, clustered shading
2. **Mobile**: Tối ưu cho mobile, uses tiled forward rendering
3. **Compatibility**: OpenGL 3.3, support cho cũ

```mermaid
graph LR
  subgraph "Rendering Pipeline"
    Input[Scene Input] --> RD[RenderingDevice/Vulkan]
    RD --> VA[Vertex Processing]
    RD --> CA[Compute Shaders]
    VA --> C[Clustering/Shading]
    CA --> C
    C --> FP[Fragment Processing]
    FP --> MB[RenderBuffers]
    MB --> Output[Final Output]
  end

  subgraph "Renderer Backends"
    Forward[Forward+]
    Mobile[Forward Mobile]
    Compat[Compatibility/OpenGL]
  end

  Forward --> RD
  Mobile --> RD
  Compat --> OpenGL[OpenGL3 Driver]
  OpenGL --> Output
```

### 4.2 RenderServer & RenderingDevice

```mermaid
classDiagram
  class RenderingServer {
    <<singleton>>
    +camera_allocate()
    +camera_set_transform()
    +mesh_allocate()
    +mesh_surface_allocate()
    +multimesh_allocate()
    +draw_list_begin()
    +draw_list_add_step()
    +draw_list_end()
  }

  class RenderingDevice {
    +device_create_buffer()
    +device_create_texture()
    +device_create_shader()
    +draw_list_begin()
    +draw_list_add()
    +draw_list_end()
    +submit()
  }

  class Mesh {
    +surface_* methods
  }

  class Texture {
    +width, height
    +format
  }

  class Shader {
    +get_shader_type()
  }

  RenderingDevice --> Mesh
  RenderingDevice --> Texture
  RenderingDevice --> Shader
  RenderingServer --> RenderingDevice
```

**Vulkan là render API chính từ Godot 4.0 (OpenGL 3.3 fallback).**

---

## 5. Physics System

### 5.2D Physics

- **Engine**: Custom physics (không dùng Box2D)
- **Bodies**: RigidBody2D, CharacterBody2D, StaticBody2D
- **Shapes**: Circle2D, Rectangle2D, Capsule2D, Polygon2D
- **Collision**: CollisionShape2D, Area2D (trigger detection)
- **Space**: PhysicsServer2D manages multiple physics spaces

```mermaid
classDiagram
  class PhysicsServer2D {
    <<singleton>>
    +space_create()
    +space_set_active()
    +space_get bodies()
    +body_create()
    +body_set_state()
    +body_apply_force()
    +body_set_velocity()
    +shape_create()
    +area_create()
    +area_set_shape()
    +joint_create()
  }

  class PhysicsDirectBodyState2D {
    +transform: Transform2D
    +linear_velocity: Vector2
    +angular_velocity: float
    +apply_force()
    +apply_impulse()
  }

  class PhysicsTestMotionResult2D {
    +collision_point: Vector2
    +collision_normal: Vector2
    +collider: Object
  }

  PhysicsServer2D --> PhysicsDirectBodyState2D
  PhysicsServer2D --> PhysicsTestMotionResult2D
```

### 5.2 3D Physics

- **Engine**: Bullet3 (có thể custom)
- **Bodies**: RigidBody3D, CharacterBody3D, StaticBody3D, Area3D
- **Shapes**: SphereShape3D, BoxShape3D, CapsuleShape3D, ConvexPolygonShape3D, ConcavePolygonShape3D
- **Space**: PhysicsServer3D (multi-space support)

---

## 6. Audio System

```mermaid
classDiagram
  class AudioServer {
    <<singleton>>
    +lock()
    +unlock()
    +set_bus_count()
    +get_bus_count()
    +set_bus_name()
    +get_bus_name()
    +set_bus_volume_linear()
    +set_bus_send()
    +set_bus_effect_enabled()
    +set_bus_effect()
    +get_bus_effects()
    +get_bus_effect_count()
  }

  class AudioEffect {
    <<abstract>>
    +get_name()
    +set_enabled()
    +is_enabled()
    +_process()
  }

  class AudioEffectReverb {
    +room_size: float
    +damping: float
    +wet: float
    +dry: float
  }

  class AudioEffectDelay {
    +dry: float
    +wet: float
    +feedback: float
    +tap1/2/3/4_delay: float
  }

  class AudioEffectCompressor {
    +threshold: float
    +ratio: float
    +attack_us: float
    +release_ms: float
    +gain: float
  }

  AudioServer --> AudioEffect
  AudioEffect <|-- AudioEffectReverb
  AudioEffect <|-- AudioEffectDelay
  AudioEffect <|-- AudioEffectCompressor
```

**Audio buses:**
- Master bus (output)
- Additional buses for SFX, Music, UI, Voice
- Send/return busses for effects
- Supports both 2D (positional) and 3D audio

---

## 7. Input System

### 7.1 InputMap

```mermaid
graph TB
  subgraph "InputServer (Singleton)"
    IS[InputServer]
    IM[InputMap]
    IA[InputAction]
  end

  IM --> IA1[InputAction: "ui_accept"]
  IM --> IA2[InputAction: "ui_up"]
  IM --> IA3[InputAction: "ui_down"]
  IM --> IA4[InputAction: "left_click"]

  subgraph "Input Events"
    IE[InputEvent] --> Key[KeyEvent]
    IE --> Mouse[MouseEvent]
    IE --> Joypad[JoypadButton/Motion]
    IE --> Gesture[Gesture]
  end

  IS --> IE
  IM --> IS

  subgraph "Input Actions Usage"
    Script[User Script] -->|is_action_pressed| IM
    Script -->|get_action_strength| IM
    Script -->|action_release| IM
  end
```

**InputMap cấu hình trong Project Settings:**
```json
{
  "input_map": {
    "ui_accept": [{"events": [{"type": "KEY", "device": 0, "keycode": 4194309}]}],
    "move_left": [{"events": [{"type": "KEY", "device": 0, "keycode": 4194319}]}],
    "jump": [{"events": [{"type": "KEY", "device": 0, "keycode": 32}]}]
  }
}
```

---

## 8. Scripting System

### 8.1 GDScript

GDScript là ngôn ngữ native của Godot, thiết kế cho game development:

```mermaid
classDiagram
  class GDScript {
    +_init()
    +_ready()
    +_process(delta: float)
    +_physics_process(delta: float)
    +_input(event: InputEvent)
    +_unhandled_input(event: InputEvent)
    +_enter_tree()
    +_exit_tree()
    +_notification(what: int)
    +exports (onready, export, @export)
    +signals (signal keyword)
    +yield()
    +assert()
  }

  class Variant {
    <<type>>
    +int, float, String, Vector2, Rect2, Vector3, Transform2D
    +Plane, Quaternion, AABB, Basis, Transform3D
    +Color, NodePath, RID, Object, Dictionary, Array
    +PoolByteArray, PoolIntArray, PoolRealArray, PoolStringArray, PoolVector2Array, PoolVector3Array, PoolColorArray
  }

  class NativeScript {
    +register_class()
    +create_instance()
  }

  GDScript --|> NativeScript
  GDScript --> Variant
```

**GDScript features:**
- Dynamic typing (Variant-based)
- Optional static typing (Godot 4)
- Signals với `connect()` và `emit_signal()`
- Yield pauses (`yield(get_tree(), "idle_frame")`)
- Exports (`@export var speed: float = 100.0`)
- Tool scripts (`@tool` để chạy trong editor)

### 8.2 C# Support

- .NET 6 (Godot 4)
- Mono build (separate editor)
- Full access to Godot API via GDNative
- Debugger tích hợp

### 8.3 GDExtension (C++)

```mermaid
graph LR
  subgraph "Game Process"
    GDScript[GDScript]
    NativeLib[Native Library (.dll/.so/.dylib)]
  end

  subgraph "GDExtension Interface"
    GDE[GDExtension]
    ClassDB[ClassDB]
  end

  GDScript -->|calls| NativeLib
  NativeLib -->|registers| GDE
  GDE -->|exposes| ClassDB
  ClassDB -->|available to| GDScript
```

**GDExtension:**
- Load native libraries (C/C++/Rust)
- Register classes, methods, properties
- Shared library, loaded runtime
- Không cần recompile engine

---

## 9. Resource System

**Resource là đơn vị dữ liệu có thể serializable:**

```mermaid
classDiagram
  class Resource {
    <<abstract>>
    +path: String
    +resource_name: String
    +resource_path: String
    +get_path()
    +set_path()
    +take_over_path()
    +instantiate()
    +duplicate()
    +_get_property_list()
    +_get()
    +_set()
    +_bind_methods()
  }

  class Texture2D {
    +width: int
    +height: int
    +format: Format
    +get_size()
    +load(path: String)
  }

  class AudioStream {
    +get_length(): float
    +get_sample_rate(): int
    +play()
    +stop()
  }

  class Mesh {
    +surface_get_format()
    +surface_get_array()
    +surface_set_array()
    +surface_set_material()
  }

  class Shader {
    +mode: Mode
    +get_shader_type()
    +set_code()
    +get_code()
  }

  class Script {
    +get_script_name()
    +get_instance_base_type()
    +has_method()
    +has_signal()
  }

  class PackedScene {
    +instantiate()
    +pack(PackedScene)
  }

  Resource <|-- Texture2D
  Resource <|-- AudioStream
  Resource <|-- Mesh
  Resource <|-- Shader
  Resource <|-- Script
  Resource <|-- PackedScene
```

**Resource Loading:**
- Lazy loading (khi cần)
- Preload (`preload("res://path.tres")`) — load ngay
- Load (`load("res://path.tres")`) — load tại runtime
- Resource loader cache

---

## 10. Asset Pipeline

```mermaid
flowchart TD
  subgraph "Import"
    Raw[Raw Assets<br/>png/jpg/obj/glb/wav] --> ImportServer[Import Server]
    ImportServer --> Gen[Generated Files]
    Gen --> CheckSum[Checksum]
    CheckSum --> Cache[Import Cache<br/>.import files]
  end

  subgraph "Runtime Loading"
    Cache --> Resources[Resources]
    Resources --> GPU[GPU Memory]
  end

  subgraph "Formats"
    Image[Image formats:<br/>PNG, JPG, WebP, BMP] -->|convert| Texture2D
    3D[3D formats:<br/>OBJ, GLTF/GLB, FBX] -->|import| Mesh
    Audio[Audio formats:<br/>WAV, OGG, MP3] -->|import| AudioStream
    Font[Font formats:<br/>TTF, OTF, WOFF] -->|import| FontData
  end

  Raw --> Image
  Raw --> 3D
  Raw --> Audio
  Raw --> Font
```

**Importers:**
- Texture: compression, mipmaps, filtering
- Mesh: vertex format, tangents, lights
- Audio: re-encode, loop, sample rate
- Font: dynamic (DynamicFont) vs static (BitmapFont)

---

## 11. File System & Resource Paths

```mermaid
graph LR
  subgraph "Path Schemes"
    res["res:// (packed)<br/>VFS trong .pck/.exe"]
    user["user:// (persistent)<br/>AppData/Library/Application Support"]
    sandbox["sandbox://<br/>(mobile isolated)"]
  end

  subgraph "Project Structure"
    Project["Project Folder<br/>game/"]
    Project --> res_folder["res://<br/>resources/"]
    Project --> src_folder["src/<br/>scripts/"]
    Project --> assets["assets/<br/>images, sounds, models"]
  end

  subgraph "Export"
    PCK[.pck archive] -->|optional| Exec[Executable]
    Exec -->|reads| PCK
  end

  res --> FileSystem[FileSystem API]
  user --> FileSystem
  sandbox --> FileSystem
```

**FileSystem API:**
- `file_exists()`, `dir_exists()`
- `list_dir()`, `get_directories()`
- `copy()`, `move()`, `rename()`, `remove()`
- `make_dir()`, `make_dir_recursive()`

---

## 12. Networking

### 12.1 High-level Multiplayer API

```mermaid
classDiagram
  class MultiplayerAPI {
    +root_path: NodePath
    +unique_id: int
    +is_server(): bool
    +get_remote_sender_id(): int
    +rpc(method: String, ...)
    +rpc_unreliable(method: String, ...)
    +rset(property: String, value)
    +rset_unreliable(property: String, value)
  }

  class NetworkedMultiplayerENet {
    +max_clients: int
    +max_channels: int
    +server_relay: bool
    +create_server(port: int, max_clients: int, max_channels: int)
    +create_client(address: String, port: int, max_channels: int)
  }

  class NetworkedMultiplayerWebRTC {
    +create_server()
    +create_client()
    +set_signal_peer()
  }

  class PacketPeer {
    +get_packet(): PoolByteArray
    +put_packet(data: PoolByteArray)
    +get_available_packet_count(): int
    +get_var(): Variant
    +put_var(data: Variant)
  }

  MultiplayerAPI --> PacketPeer
  NetworkedMultiplayerENet --> PacketPeer
  NetworkedMultiplayerWebRTC --> PacketPeer
```

### 12.2 HTTP & WebSocket

- **HTTPRequest**: REST API, file download, async requests
- **WebSocketClient/Server**: realtime communication
- **WebRTCLanPeer**: P2P networking (experimental)

---

## 13. Internationalization (i18n)

```mermaid
graph TB
  subgraph "TranslationServer (Singleton)"
    TS[TranslationServer]
    PO[.po/.mo files]
    Crowdin[Crowdin API]
  end

  subgraph "Translation Sources"
    CSV[CSV]
    PO[gettext .po]
    Resource[Resource translations]
  end

  subgraph "Usage in Code"
    Script -->|tr("Hello")| TS
    Button[Button text] -->|set_text(tr("Start"))| TS
  end

  TS --> PO
  TS --> Resource
  TS --> Crowdin
  CSV --> TS
```

**Translation workflow:**
1. Mark strings: `tr("Hello")` or `_("Hello")`
2. Extract: `godot --export-translatable-strings project.godot`
3. Translate via CSV/PO/Crowdin
4. Load `.po` files or compiled `.mo` in project settings

---

## 14. Hot Reload & Live Editing

Godot editor có thể reload script và scene thay đổi mà không cần restart:

```mermaid
sequenceDiagram
  User->>Editor: Edit script.tscn
  Editor->>FileSystem: File changed event
  FileSystem->>ScriptEditor: Notify reload
  ScriptEditor->>ResourceLoader: reload(script)
  ResourceLoader->>Script: Recompile GDScript/C#
  Script->>Node: Apply changes to instance
  Node-->>Scene: Updated
  Scene-->>Editor: Live preview
```

**Tool scripts (`@tool`):**
- Chạy trong editor context
- Có thể modify scene tree, resources trong editor
- Dùng cho custom editors, gizmos, importers

---

## 15. Performance Considerations

### 15.1 Memory Management

- **C++ objects**: `Reference` (ref-counted) và `Object` (manual)
- **GDScript**: Automatic, garbage-collected (but minimal GC)
- **Resources**: Shared, reference counted
- **Nodes**: Tree structure, parent owns children

```mermaid
graph LR
  subgraph "Memory Types"
    Man[Manual<br/>Object::free()]
    Ref[Reference Counted<br/>unref() destroys]
    GC[Garbage Collected<br/>GDScript]
    Shared[Resources<br/>shared refs]
  end

  subgraph "Examples"
    Node[Node] -->| extends| Object
    Resource[Resource] -->| extends| Reference
    GDScriptObj[GDScript] --> GC
    SharedObj[Texture2D] --> Shared
  end

  Man -.-> Node
  Ref -.-> Resource
```

### 15.2 Rendering Optimizations

- **Batching**: Static/dynamic batching (mesh merging)
- **LOD**: Distance-based mesh simplification
- **Occlusion culling**: Portal-based (3D) và manual (2D)
- **Visibility rects**: 2D culling
- **Atlas textures**: Reduce draw calls

---

## 16. Comparison với Các Game Engine Khác

| Feature | Godot | Unity | Unreal |
|---------|-------|-------|--------|
| **License** | MIT (OSS) | Proprietary | Proprietary |
| **Size** | ~20MB | ~5GB | ~100GB |
| **Languages** | GDScript, C#, C++ | C# | C++, Blueprint |
| **2D Support** | First-class | Sprites | Paper2D (limited) |
| **3D Renderer** | Forward+, Vulkan | HDRP/URP | Nanite/Lumen |
| **Node System** | Scene tree | GameObject hierarchy | Actor/Component |
| **IDE** | Lightweight editor | Heavy IDE | Very heavy IDE |
| **Export** | Free, unlimited | Paid licenses | Royalty model |
| **Mobile Size** | ~10-20MB | ~50-100MB | ~200-300MB |

---

## 17. Kết Luận

Godot Engine có kiến trúc **hiện đại, modular, dễ mở rộng** với các điểm mạnh:

1. **Node-Scene system** linh hoạt, component-like
2. **Server architecture** rõ ràng, single-instance services
3. **Renderer đa dạng** (Forward+, Mobile, Compatibility)
4. **Scripting system** đa ngôn ngữ (GDScript, C#, C++)
5. **Open source**, lightweight, không phí
6. **Export đa nền tảng** miễn phí

**Nhược điểm cần lưu ý:**
- Ecosystem nhỏ hơn Unity/Unreal
- Các module cao cấp (XR, Animation) vẫn đang phát triển
- 3D capabilities tốt nhưng không đối đầu được với Unreal (AAA)

**Phù hợp cho:**
- Indie games (2D và 3D medium)
- Mobile games
- Prototyping
- Open source projects
- Educational purposes

---

## 18. Tham Khảo

- [Godot Official Documentation](https://docs.godotengine.org)
- [Godot GitHub Repository](https://github.com/godotengine/godot)
- [Godot Architecture (Internal)](https://github.com/godotengine/godot/tree/master/core)
- [Godot Class Reference](https://docs.godotengine.org/en/stable/classes/index.html)

---

*Báo cáo được tạo tự động bởi AI Assistant dựa trên kiến thức kiến trúc Godot Engine.*