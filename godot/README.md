# Godot Engine - Nghiên Cứu Kiến Trúc

Thư mục này chứa báo cáo phân tích chi tiết về kiến trúc Godot Engine.

Cập nhật lần cuối: **2026-03-30** (thêm source-level analysis từ godot-master 4.7-dev)

---

## 📄 Files trong thư mục

| File | Mô tả | Nguồn | Kích thước |
|------|-------|-------|------------|
| [`architecture_overview.md`](./architecture_overview.md) | Tổng quan kiến trúc Godot: layered architecture, node/scene system, rendering, physics, audio, networking, i18n, asset pipeline | Godot 4.x docs | ~22KB |
| [`class_taxonomy_api.md`](./class_taxonomy_api.md) | Chi tiết về class hierarchy, important APIs, GDScript conventions, singletons, performance, extension points | Godot 4.x docs | ~22KB |
| [`godot_source_analysis.md`](./godot_source_analysis.md) | **[MỚI]** Phân tích source code thực tế từ godot-master 4.7-dev: file counts, module structure, C++ patterns, build system, regex parsing patterns cho skill | godot-master scan | ~25KB |
| [`godot_module_deep_dive.md`](./godot_module_deep_dive.md) | **[MỚI]** Deep dive từng module: core/, scene/, servers/, modules/, editor/ — file listings, class hierarchies, key patterns, files nên đọc/skip | godot-master scan | ~20KB |

---

## 🎯 Tóm tắt

### Godot là gì?
- **Mã nguồn mở** (MIT license), hoàn toàn miễn phí
- **Hỗ trợ 2D & 3D** với hai render pipeline riêng biệt
- **Lightweight**: Binary ~20MB (vs Unity 5GB, Unreal 100GB)
- **Multi-language**: GDScript (native), C#, C++ (GDExtension)
- **Export đa nền tảng**: Desktop, Mobile, Web, Console (free, unlimited)

### Kiến trúc nổi bật

1. **Node & Scene System**
   - Composition over inheritance
   - Scene là đơn vị cơ bản (file `.tscn`)
   - Scene tree quản lý hierarchy
   - Signals để event communication

2. **Server Architecture**
   - Single-instance services (DisplayServer, PhysicsServer, AudioServer, RenderingServer)
   - Service Locator pattern
   - Tất cả servers đều kế thừa từ `Service` class

3. **Renderer linh hoạt**
   - Forward+ (default, desktop)
   - Mobile (tiled, optimized cho mobile)
   - Compatibility (OpenGL 3.3, legacy support)
   - Vulkan là render API chính từ Godot 4

4. **Resource System**
   - Reference-counted, shared, serializable
   - Textures, meshes, shaders, scenes, scripts đều là Resource
   - Preload vs Load (lazy)

### So sánh với các engine khác

| Feature | Godot | Unity | Unreal |
|---------|-------|-------|--------|
| License | MIT | Proprietary | Proprietary |
| Size | ~20MB | ~5GB | ~100GB |
| 2D Support | First-class | Sprites | Paper2D (limited) |
| 3D Renderer | Forward+, Vulkan | HDRP/URP | Nanite/Lumen |
| Node System | Scene tree | GameObject | Actor/Component |
| Export Cost | Free | Paid licenses | Royalty |

---

## 📚 Các class quan trọng nhất

### Core
- `Object` → Base của mọi thứ
- `Node` → Scene tree integration
- `Resource` → Data container, serializable
- `SceneTree` → Root của tất cả nodes

### 2D
- `Node2D`, `CanvasItem` → Base 2D
- `Sprite2D`, `AnimatedSprite2D` → Sprites
- `Area2D`, `RigidBody2D`, `CharacterBody2D` → Physics
- `CollisionShape2D` → Shapes

### 3D
- `Node3D` (Spatial) → Base 3D
- `MeshInstance3D` → Rendered mesh
- `Camera3D` → View camera
- `Light3D` (Directional/Omni/Spot) → Lights
- `RigidBody3D`, `CharacterBody3D` → 3D physics

### UI
- `Control` → Base UI
- `Button`, `Label`, `LineEdit`, `Slider`
- `Container` (VBox, HBox, Grid, Margin)
- `Theme` → Styling system

### Resources
- `Texture2D`, `AudioStream`, `Mesh`, `Shader`
- `Script`, `PackedScene`, `Animation`

### Services (Singletons)
- `OS`, `Engine`, `ProjectSettings`
- `Input`, `InputMap`
- `RenderingServer`, `PhysicsServer2D/3D`
- `AudioServer`, `TranslationServer`

---

## 🎨 Design Patterns trong Godot

| Pattern | Vị trí | Mô tả |
|---------|--------|-------|
| **Scene Composition** | Node tree | Composition over inheritance |
| **Component-like** | Nodes trên entity | Attach behaviors as nodes |
| **Service Locator** | Servers | `ServerName.get_singleton()` |
| **Resource Sharing** | Resources | Ref-counted, shared data |
| **Observer** | Signals | Decoupled event system |
| **Factory** | PackedScene.instantiate() | Scene instances |
| **State Machine** | AnimationTree | Animation state machine |
| **Object Pool** | (Manual) | Reuse objects for performance |

---

## 🔧 GDScript Conventions

```gdscript
# Class: PascalCase
class_name Player extends CharacterBody2D

# Constants: UPPER_SNAKE_CASE
const MAX_SPEED = 300.0
const STATE_IDLE = "idle"

# Variables: snake_case
var health_points: int = 100
@onready var _sprite: Sprite2D = $Sprite2D
@export var attack_power: int = 10

# Signals: snake_case (past tense)
signal health_depleted
signal enemy_killed(enemy_name: String)

# Functions: snake_case
func take_damage(amount: int) -> void:
    health_points -= amount
    if health_points <= 0:
        health_depleted.emit()
```

---

## 📈 Performance Tips

### Rendering
- ✅ **Atlas textures** — Reduce texture binds
- ✅ **Mesh merging** — Static batching
- ✅ **LOD** — Distance-based simplification
- ✅ **Occlusion culling** — Portal-based (3D)
- ✅ **Visibility rects** — 2D culling

### Memory
- ✅ **Use Resources** — Shared automatically
- ✅ **Queue free** — `queue_free()` thay `free()`
- ✅ **Preload** — Load once, reuse
- ✅ **Keep node count low** — < 5000 active nodes

### Physics
- ✅ **Simple shapes** — Circle/Box over ConvexPolygon
- ✅ **Static bodies** — Don't move static bodies
- ✅ **Layer/mask** — Reduce collision checks
- ✅ **Fixed physics FPS** — 60Hz default

---

## 🚀 Getting Started with Godot

### Installation
```bash
# Download from https://godotengine.org/download/
# Portable: unzip, run Godot_v4.x.x.windows.exe
```

### Basic Project Structure
```
my_game/
├── project.godot          # Project config
├── scenes/                # .tscn files
│   ├── main.tscn
│   ├── level_01.tscn
│   └── ui/
├── scripts/               # .gd files
│   ├── player.gd
│   ├── enemy.gd
│   └── ui/
├── assets/
│   ├── images/
│   ├── sounds/
│   └── models/
├── autoload.gd            # Singletons (Project Settings > Autoload)
└── export_presets.cfg     # Export configs
```

### First Script
```gdscript
extends CharacterBody2D

@onready var _sprite = $Sprite2D
@export var speed = 200.0

func _physics_process(delta):
    var direction = Input.get_vector("left", "right", "up", "down")
    velocity = direction * speed
    move_and_slide()
```

---

## 🔗 Tài liệu tham khảo

- **[Godot Official Docs](https://docs.godotengine.org)** — Bản tin thân thiện
- **[Class Reference](https://docs.godotengine.org/en/stable/classes/index.html)** — API chi tiết
- **[Godot GitHub](https://github.com/godotengine/godot)** — Source code
- **[Godot Recipes](https://docs.godotengine.org/en/stable/tutorials/)** — Tutorials
- **[Godot Demos](https://github.com/godotengine/godot-demo-projects)** — Example projects

---

## 📝 Notes

- Báo cáo này được tạo tự động bởi AI Assistant dựa trên **Godot 4.x stable documentation** (March 2025)
- Tất cả diagrams được tạo bằng **Mermaid**
- Kiến trúc Godot có thể thay đổi qua các version, kiểm tra docs chính thức cho thông tin mới nhất
- Godot Engine là open-source MIT, hoàn toàn FREE — Không có royalty, không subscription

---

*© 2025 — Phân tích cho dự án CCN2 research*