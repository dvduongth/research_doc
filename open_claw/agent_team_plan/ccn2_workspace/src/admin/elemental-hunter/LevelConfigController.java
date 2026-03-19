package com.ccn2.admin.elementalhunter;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.*;

/**
 * LevelConfigController - REST endpoints for managing Level difficulty configurations.
 * CRUD operations for level settings: max rounds, combo tiers, artifact slots.
 * 
 * Base path: /api/admin/elemental-hunter/levels
 */
@RestController
@RequestMapping("/api/admin/elemental-hunter/levels")
public class LevelConfigController {
    
    private final LevelConfigService service;
    
    public LevelConfigController(LevelConfigService service) {
        this.service = service;
    }
    
    @GetMapping
    public ResponseEntity<List<LevelConfigBean>> getAllLevels() {
        List<LevelConfigBean> levels = service.getAllLevels();
        return ResponseEntity.ok(levels);
    }
    
    @GetMapping("/{levelId}")
    public ResponseEntity<LevelConfigBean> getLevel(
            @PathVariable String levelId) {
        return service.getLevel(levelId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<LevelConfigBean> createLevel(
            @Valid @RequestBody LevelConfigBean level) {
        LevelConfigBean created = service.createLevel(level);
        return ResponseEntity.status(201).body(created);
    }
    
    @PutMapping("/{levelId}")
    public ResponseEntity<LevelConfigBean> updateLevel(
            @PathVariable String levelId,
            @Valid @RequestBody LevelConfigBean level) {
        return service.updateLevel(levelId, level)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{levelId}")
    public ResponseEntity<Void> deleteLevel(@PathVariable String levelId) {
        boolean deleted = service.deleteLevel(levelId);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/default")
    public ResponseEntity<LevelConfigBean> getDefaultLevel(
            @RequestParam(defaultValue = "Lv3") String levelId) {
        LevelConfigBean defaultLevel = service.getDefaultLevel(levelId);
        if (defaultLevel != null) {
            return ResponseEntity.ok(defaultLevel);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
