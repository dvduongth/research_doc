# Godot Engine — Module Deep Dive

*Ngày: 2026-03-30 | Source: godot-master 4.7-dev*

---

## 1. core/ — Foundational Layer

### core/object/ (32 files)

**Mục đích**: Class system, memory management, reflection.

```
core/object/
├── object.h / object.cpp          — Base class toàn bộ engine
├── ref_counted.h / ref_counted.cpp — Smart pointer base
├── class_db.h / class_db.cpp      — ClassDB: runtime reflection
├── object_db.h / object_db.cpp    — Instance tracking (global ID table)
├── callable.h / callable.cpp      — Function pointers + method binding
├── method_bind.h                   — Method binding templates
├── script_instance.h               — Script instance interface
├── worker_thread_pool.h            — Thread pool
└── ...
```

**Patterns chính**:
- `GDCLASS(DerivedClass, BaseClass)` — Đăng ký class với runtime
- `_bind_methods()` — Expose API cho scripts/editor
- `Ref<T>` smart pointer — Automatic memory via reference counting

### core/variant/ (37 files)

**Mục đích**: Dynamic type system — "the glue between C++ and scripts".

```
core/variant/
├── variant.h / variant.cpp        — Union type (có thể hold bất kỳ Godot type nào)
├── variant_op.cpp                 — Operators (+, -, *, /, ==, <, ...)
├── variant_call.cpp               — Method dispatch (variant.call("method"))
├── variant_construct.cpp          — Type constructors
├── variant_setget.cpp             — Property get/set
└── typed_array.h                  — Typed Array<T> wrapper
```

**Variant types** (44 types):
- Primitives: `NIL`, `BOOL`, `INT`, `FLOAT`
- Strings: `STRING`, `STRING_NAME`, `NODE_PATH`
- Math: `VECTOR2`, `VECTOR3`, `COLOR`, `RECT2`, `TRANSFORM2D`, `TRANSFORM3D`, ...
- Compound: `ARRAY`, `DICTIONARY`, `PACKED_*_ARRAY`
- Objects: `OBJECT`, `CALLABLE`, `SIGNAL`

### core/io/ (103 files) — Lớn nhất trong core/

**Mục đích**: File I/O, resource loading/saving, network, formats.

```
core/io/
├── file_access.h              — Virtual file access (res://, user://, abs)
├── dir_access.h               — Directory operations
├── resource.h                 — Resource base class + loader/saver
├── resource_loader.h          — Load .tscn, .png, .ogg, etc.
├── resource_saver.h           — Save resources to disk
├── image.h / image.cpp        — Pixel data + format conversions
├── json.h                     — JSON parsing
├── marshalls.h                — Binary serialization
├── compression.h              — LZ4, Zstd, Gzip
├── http_client.h              — HTTP requests
├── stream_peer.h              — TCP/SSL streams
├── config_file.h              — .cfg file (INI-like)
├── translation.h              — Localization / i18n
└── pack_source.h / pck_packer.h — PCK archive format
```

### core/math/ (75 files)

**Mục đích**: Math types — tất cả đều là value types (stack-allocated, không ref-counted).

| Header | Defines |
|--------|---------|
| `vector2.h` | `Vector2`, `Vector2i` |
| `vector3.h` | `Vector3`, `Vector3i` |
| `vector4.h` | `Vector4` |
| `quaternion.h` | `Quaternion` |
| `transform_2d.h` | `Transform2D` |
| `transform_3d.h` | `Transform3D` |
| `basis.h` | `Basis` (3x3 rotation matrix) |
| `projection.h` | `Projection` (4x4 camera matrix) |
| `plane.h` | `Plane` |
| `aabb.h` | `AABB` (Axis-Aligned Bounding Box) |
| `color.h` | `Color` (RGBA float) |
| `geometry_2d.h` | Polygon, intersection, convex hull |
| `geometry_3d.h` | Ray/AABB/triangle intersection |
| `random_number_generator.h` | PCG random + noise |

---

## 2. scene/ — Node & Scene Layer

### scene/main/ (34 files)

**Mục đích**: Scene tree infrastructure.

```
scene/main/
├── node.h / node.cpp        — Node base (8000+ LOC, cực kỳ central)
├── scene_tree.h             — SceneTree singleton + main loop
├── window.h                 — Window/Viewport root
├── viewport.h               — Rendering viewport
├── scene_loader.h           — Scene loading pipeline
├── packed_scene.h           — Serialized scene (.tscn)
└── instance_placeholder.h  — Lazy-loading placeholder
```

**Node** — class phức tạp nhất trong Godot:
- Parent/child tree management
- Signal connection + emission
- Group membership
- Process mode (always/pausable/disabled/inherit)
- Physics interpolation
- Multi-threading flags
- Editor metadata
- RPCs (Remote Procedure Calls cho multiplayer)

### scene/resources/ (214 files) — Lớn nhất trong scene/

**Top resources**:

```
scene/resources/
├── texture.h                — Texture2D, ImageTexture, CompressedTexture2D
├── mesh.h / array_mesh.h    — 3D geometry + ArrayMesh (dynamic)
├── material.h               — Material base
├── standard_material_3d.h   — PBR material (500+ properties!)
├── shader.h                 — Shader source code
├── shader_material.h        — Material using custom shader
├── animation.h              — Keyframe animation data
├── animation_library.h      — Set of animations
├── audio_stream.h           — Audio data base
├── font.h                   — TrueType/SDF font
├── theme.h                  — UI theme (colors, fonts, icons)
├── packed_scene.h           — Serialized scene
├── bit_map.h                — 1-bit pixel map
├── curve.h / curve_3d.h     — Math curves (bezier/linear)
├── height_map_shape_3d.h    — Physics terrain
├── navigation_mesh.h        — NavMesh data
└── world_2d.h / world_3d.h  — Physics/rendering world containers
```

### scene/3d/ (172 files)

**Node3D hierarchy quan trọng**:

```
Node3D
├── VisualInstance3D
│   ├── MeshInstance3D        — Rendered 3D mesh
│   ├── MultiMeshInstance3D   — GPU instanced rendering
│   ├── GPUParticles3D        — GPU particle system
│   ├── Decal                 — Surface decal projector
│   ├── VoxelGI               — Voxel Global Illumination
│   └── FogVolume             — Volumetric fog
├── Light3D
│   ├── DirectionalLight3D    — Sun light
│   ├── OmniLight3D           — Point light
│   └── SpotLight3D           — Spot light
├── Camera3D                  — Perspective/orthographic camera
├── PhysicsBody3D
│   ├── RigidBody3D           — Physics simulation
│   ├── CharacterBody3D       — Player movement
│   ├── StaticBody3D          — Immovable geometry
│   └── AnimatableBody3D      — Animated physics
├── Area3D                    — Overlap detection
├── CollisionShape3D          — Physics shape
├── Skeleton3D                — Bone hierarchy
├── AnimationPlayer           — Keyframe animator
├── SpringArm3D               — Camera arm (wall detection)
├── CSGShape3D                — Constructive Solid Geometry
├── Path3D                    — Bezier path
└── WorldEnvironment          — Sky + environment settings
```

### scene/gui/ (118 files)

**Control hierarchy**:

```
CanvasItem
└── Control                   — Base UI class
    ├── BaseButton → Button, CheckBox, CheckButton, LinkButton, TextureButton
    ├── Label                 — Text display
    ├── LineEdit              — Single-line input
    ├── TextEdit              — Multi-line input
    ├── RichTextLabel         — BBCode text
    ├── VideoStreamPlayer     — Video playback
    ├── Container
    │   ├── VBoxContainer / HBoxContainer / GridContainer
    │   ├── MarginContainer / PaddingContainer
    │   ├── ScrollContainer
    │   ├── TabContainer / TabBar
    │   ├── SplitContainer
    │   └── SubViewportContainer
    ├── Range
    │   ├── HSlider / VSlider
    │   ├── HScrollBar / VScrollBar
    │   ├── ProgressBar
    │   └── SpinBox
    ├── ItemList              — Scrollable item list
    ├── Tree                  — Hierarchical list
    ├── OptionButton          — Dropdown select
    ├── MenuButton            — Button with popup menu
    ├── ColorPicker           — Color selection widget
    ├── GraphEdit             — Node graph editor
    └── Popup → PopupMenu, PopupPanel, Window
```

---

## 3. servers/ — Backend Services

### servers/rendering/ — Rendering Pipeline

**Cấu trúc sub-dirs**:

```
servers/rendering/
├── rendering_server.h        — Public API (the interface game uses)
├── rendering_server_default.h — Default implementation
├── renderer_rd/              — RenderingDevice-based renderers
│   ├── forward_clustered/    — Forward+ renderer (desktop quality)
│   ├── mobile/               — Optimized for mobile
│   └── environment/          — Sky, fog, GI probes
├── renderer_scene_cull.cpp   — 176KB! Scene visibility + LOD
├── rendering_device.cpp      — 420KB! GPU command recording API
├── rendering_device_graph.cpp — 158KB! Frame dependency graph
├── renderer_viewport.cpp     — Viewport composition
└── storage/                  — GPU resource management
    ├── texture_storage.h
    ├── mesh_storage.h
    ├── material_storage.h
    └── ...
```

### servers/physics_2d/ + physics_3d/

```
servers/
├── physics_server_2d.h       — 2D physics API interface
├── physics_server_3d.h       — 3D physics API interface
└── physics_server_manager.h  — Plugin registry (Godot Physics / Jolt)
```

Physics được implement trong **modules/** (không hardcoded vào servers/):
- `modules/godot_physics_2d/` → `GodotPhysicsServer2D`
- `modules/godot_physics_3d/` → `GodotPhysicsServer3D`
- `modules/jolt_physics/` → `JoltPhysicsServer3D`

### servers/display/ (DisplayServer)

**Display server** xử lý:
- Window creation + management
- Input event routing
- Clipboard
- Accessibility (screen reader)
- IME (Input Method Editor cho CJK)
- Tablet/stylus input
- Native menus + dialogs

---

## 4. modules/ — 56 Modules

### Scripting Language Modules

#### modules/gdscript/ (62 files)

**GDScript pipeline**:
```
Source (.gd) → GDScriptTokenizer → GDScriptParser (AST)
            → GDScriptAnalyzer (type checking)
            → GDScriptCompiler (bytecode)
            → GDScriptFunction (runtime VM)
```

**Key files**:
- `gdscript.h` — GDScript class (extends Script)
- `gdscript_parser.h` — AST parser (recursive descent)
- `gdscript_compiler.h` — Bytecode compiler
- `gdscript_vm.cpp` — Virtual machine execution

#### modules/mono/ (47 files)

**C# integration**:
- Uses Mono runtime / .NET Core
- Auto-generates C# bindings from ClassDB
- Marshal types between C# and Godot Variant

### Physics Modules

#### modules/jolt_physics/ (90 files) — Biggest physics module

**Jolt Physics** (từ Horizon: Forbidden West engine):
- Khuyến nghị cho production games với physics phức tạp
- Hỗ trợ soft bodies, constraints, vehicle physics
- Faster than default Godot Physics for complex scenes

**Key files**:
- `jolt_physics_server_3d.h` — PhysicsServer3D implementation
- `jolt_shape_3d.h` — Shape types (box, sphere, capsule, convex, ...)
- `jolt_body_3d.h` — Rigid body
- `jolt_joint_3d.h` — Constraints

### Import/Export Modules

#### modules/gltf/ (64 files)

**glTF 2.0** là format 3D model hiện đại nhất:
- Import: `.gltf`, `.glb`
- Export: Godot scenes → glTF
- Hỗ trợ: PBR materials, skeletal animation, morph targets, lights, cameras

#### modules/fbx/

**FBX import** (Autodesk format):
- Support cho assets từ Maya/3ds Max/Blender

### XR Module

#### modules/openxr/ (147 files) — Lớn nhất

**OpenXR** standard cho VR/AR:
- Hỗ trợ: Meta Quest, SteamVR, Windows Mixed Reality
- Tracking: head, controllers, hands
- Rendering: stereo rendering, foveated rendering
- Haptics, passthrough

---

## 5. editor/ — Editor & Tools

### editor/scene/ (216 files) — Lớn nhất trong editor/

**Scene editor**:
- `scene_tree_editor.h` — Tree dock (left panel)
- `node_dock.h` — Node properties dock
- `canvas_item_editor_plugin.h` — 2D scene editor
- `spatial_editor_plugin.h` — 3D scene editor (gizmos)

### editor/import/ (54 files)

**Import pipeline**:
- `resource_importer_texture.h` — Texture import (format, compression, mipmaps)
- `resource_importer_mesh.h` — 3D mesh import
- `resource_importer_scene.h` — Scene import (.fbx, .gltf)
- `resource_importer_audio_stream.h` — Audio import (MP3, OGG, WAV)

### editor/debugger/ (31 files)

**Debugger features**:
- Breakpoints + stepping
- Variable inspection
- Performance monitor (frame time, physics, draw calls)
- Memory profiler
- Network profiler (RPC inspector)

---

## 6. Skill Parsing Strategy — Practical Guide

### Priority Files để đọc cho mỗi query

| Query type | Files nên đọc |
|-----------|--------------|
| "Object system" | `core/object/object.h`, `core/object/class_db.h` |
| "Node lifecycle" | `scene/main/node.h` (first 200 lines) |
| "Rendering pipeline" | `servers/rendering/rendering_server.h`, `renderer_rd/README` |
| "Physics" | `servers/physics_server_3d.h`, `modules/jolt_physics/` |
| "GUI system" | `scene/gui/control.h` |
| "Audio" | `servers/audio_server.h` |
| "Script API" | `modules/gdscript/gdscript.h` |
| "Resource loading" | `core/io/resource_loader.h` |
| "Memory management" | `core/object/ref_counted.h`, `core/templates/` |

### Module Grouping cho Overview Depth

```
group_1: core/object/, core/variant/       → "Type system"
group_2: core/math/, core/string/          → "Primitives"
group_3: core/io/, core/os/                → "I/O & Platform"
group_4: scene/main/, scene/animation/     → "Scene tree"
group_5: scene/2d/, scene/gui/             → "2D & UI"
group_6: scene/3d/, scene/resources/       → "3D & Assets"
group_7: servers/rendering/                → "Rendering"
group_8: servers/ (non-rendering)          → "Services"
group_9: modules/gdscript/, modules/mono/  → "Scripting"
group_10: platform/, drivers/              → "Platform"
```

### Files nên SKIP (quá lớn / ít insight)

| File | Size | Lý do skip |
|------|------|-----------|
| `servers/rendering/rendering_device.cpp` | 420KB | Implementation detail |
| `servers/rendering/rendering_device_graph.cpp` | 158KB | Too low-level |
| `servers/rendering/renderer_scene_cull.cpp` | 176KB | Optimization code |
| `CHANGELOG.md` | 238KB | History, không phải architecture |
| `COPYRIGHT.txt` | 100KB | Legal, không liên quan |
| `thirdparty/` | --- | External deps, không phải Godot code |

---

*Phân tích trực tiếp từ `D:\PROJECT\CCN2\godot-master\` scan — 2026-03-30*
