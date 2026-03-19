package com.ccn2.admin.elementalhunter;

import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.time.Instant;

/**
 * CharacterConfigService - Business logic for character configuration management.
 * In-memory store with CRUD operations and audit trail.
 */
@Service
public class CharacterConfigService {
    
    // In-memory storage: characterId -> CharacterConfigBean
    private final Map<String, CharacterConfigBean> characterStore = new ConcurrentHashMap<>();
    private final List<CharacterAuditEntry> auditHistory = new ArrayList<>();
    
    public CharacterConfigService() {
        // Initialize with default character (Pillow) from GDD
        CharacterConfigBean pillow = new CharacterConfigBean(
            "pillow",                    // characterId
            "TBD",                       // affinity (TBD from Character Designer)
            30,                          // baseAtk
            10,                          // baseMag
            1000,                       // baseHp
            "Extra Roll",               // ultimateType
            50                          // ultimateCost
        );
        characterStore.put("pillow", pillow);
    }
    
    public List<CharacterConfigBean> getAllCharacters() {
        return new ArrayList<>(characterStore.values());
    }
    
    public Optional<CharacterConfigBean> getCharacter(String characterId) {
        return Optional.ofNullable(characterStore.get(characterId.toLowerCase()));
    }
    
    public CharacterConfigBean createCharacter(CharacterConfigBean character) {
        if (character.getCharacterId() == null) {
            throw new IllegalArgumentException("characterId is required");
        }
        String id = character.getCharacterId().toLowerCase();
        if (characterStore.containsKey(id)) {
            throw new IllegalArgumentException("Character with ID '" + id + "' already exists");
        }
        
        CharacterConfigBean created = cloneCharacter(character);
        characterStore.put(id, created);
        
        logAudit("CREATE", null, created, "Created character " + id);
        return created;
    }
    
    public Optional<CharacterConfigBean> updateCharacter(String characterId, CharacterConfigBean updates) {
        String id = characterId.toLowerCase();
        CharacterConfigBean existing = characterStore.get(id);
        if (existing == null) {
            return Optional.empty();
        }
        
        // Cannot update default character (pillow) - protected
        if ("pillow".equals(id)) {
            throw new IllegalArgumentException("Default character 'pillow' cannot be modified");
        }
        
        // Apply updates (non-null fields only)
        CharacterConfigBean updated = cloneCharacter(existing);
        if (updates.getAffinity() != null) updated.setAffinity(updates.getAffinity());
        if (updates.getBaseAtk() != null) updated.setBaseAtk(updates.getBaseAtk());
        if (updates.getBaseMag() != null) updated.setBaseMag(updates.getBaseMag());
        if (updates.getBaseHp() != null) updated.setBaseHp(updates.getBaseHp());
        if (updates.getUltimateType() != null) updated.setUltimateType(updates.getUltimateType());
        if (updates.getUltimateCost() != null) updated.setUltimateCost(updates.getUltimateCost());
        
        characterStore.put(id, updated);
        
        logAudit("UPDATE", existing, updated, "Updated character " + id);
        return Optional.of(updated);
    }
    
    public boolean deleteCharacter(String characterId) {
        String id = characterId.toLowerCase();
        // Cannot delete default character
        if ("pillow".equals(id)) {
            return false;
        }
        
        CharacterConfigBean deleted = characterStore.remove(id);
        if (deleted != null) {
            logAudit("DELETE", deleted, null, "Deleted character " + id);
            return true;
        }
        return false;
    }
    
    public CharacterConfigBean getDefaultCharacter() {
        return cloneCharacter(characterStore.get("pillow"));
    }
    
    // Audit logging
    private void logAudit(String action, CharacterConfigBean oldChar, 
                         CharacterConfigBean newChar, String notes) {
        CharacterAuditEntry entry = new CharacterAuditEntry();
        entry.setTimestamp(Instant.now().toString());
        entry.setAction(action);
        entry.setOldCharacter(oldChar != null ? cloneCharacter(oldChar) : null);
        entry.setNewCharacter(newChar != null ? cloneCharacter(newChar) : null);
        entry.setNotes(notes);
        entry.setAdminId("admin");
        
        auditHistory.add(entry);
    }
    
    // Deep clone
    private CharacterConfigBean cloneCharacter(CharacterConfigBean original) {
        if (original == null) return null;
        return new CharacterConfigBean(
            original.getCharacterId(),
            original.getAffinity(),
            original.getBaseAtk(),
            original.getBaseMag(),
            original.getBaseHp(),
            original.getUltimateType(),
            original.getUltimateCost()
        );
    }
}

/**
 * Audit entry DTO for character changes.
 */
class CharacterAuditEntry {
    private String timestamp;
    private String adminId;
    private String action;
    private CharacterConfigBean oldCharacter;
    private CharacterConfigBean newCharacter;
    private String notes;
    
    // Getters and setters
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public String getAdminId() { return adminId; }
    public void setAdminId(String adminId) { this.adminId = adminId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public CharacterConfigBean getOldCharacter() { return oldCharacter; }
    public void setOldCharacter(CharacterConfigBean oldCharacter) { this.oldCharacter = oldCharacter; }
    public CharacterConfigBean getNewCharacter() { return newCharacter; }
    public void setNewCharacter(CharacterConfigBean newCharacter) { this.newCharacter = newCharacter; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
