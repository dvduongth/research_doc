package com.ccn2.admin.elementalhunter;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.*;

/**
 * CharacterConfigController - REST endpoints for managing Character (Pillow) configurations.
 * CRUD operations for character stats, affinity, and ultimate settings.
 * 
 * Base path: /api/admin/elemental-hunter/characters
 */
@RestController
@RequestMapping("/api/admin/elemental-hunter/characters")
public class CharacterConfigController {
    
    private final CharacterConfigService service;
    
    public CharacterConfigController(CharacterConfigService service) {
        this.service = service;
    }
    
    @GetMapping
    public ResponseEntity<List<CharacterConfigBean>> getAllCharacters() {
        List<CharacterConfigBean> characters = service.getAllCharacters();
        return ResponseEntity.ok(characters);
    }
    
    @GetMapping("/{characterId}")
    public ResponseEntity<CharacterConfigBean> getCharacter(
            @PathVariable String characterId) {
        return service.getCharacter(characterId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<CharacterConfigBean> createCharacter(
            @Valid @RequestBody CharacterConfigBean character) {
        CharacterConfigBean created = service.createCharacter(character);
        return ResponseEntity.status(201).body(created);
    }
    
    @PutMapping("/{characterId}")
    public ResponseEntity<CharacterConfigBean> updateCharacter(
            @PathVariable String characterId,
            @Valid @RequestBody CharacterConfigBean character) {
        return service.updateCharacter(characterId, character)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{characterId}")
    public ResponseEntity<Void> deleteCharacter(@PathVariable String characterId) {
        boolean deleted = service.deleteCharacter(characterId);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/default")
    public ResponseEntity<CharacterConfigBean> getDefaultCharacter() {
        CharacterConfigBean defaultChar = service.getDefaultCharacter();
        return ResponseEntity.ok(defaultChar);
    }
}
