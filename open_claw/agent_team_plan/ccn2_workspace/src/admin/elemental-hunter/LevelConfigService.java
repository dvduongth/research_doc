package com.ccn2.admin.elementalhunter;

import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.time.Instant;

/**
 * LevelConfigService - Business logic for level difficulty configuration management.
 * In-memory store with CRUD operations and audit trail.
 */
@Service
public class LevelConfigService {
    
    // In-memory storage: levelId -> LevelConfigBean
    private final Map<String, LevelConfigBean> levelStore = new ConcurrentHashMap<>();
    private final List<LevelAuditEntry> auditHistory = new ArrayList<>();
    
    public LevelConfigService() {
        // Initialize with default levels from GDD Table in section 2.15
        LevelConfigBean lv1 = new LevelConfigBean("Lv1", 12, 1, 1, 100);
        LevelConfigBean lv2 = new LevelConfigBean("Lv2", 15, 2, 2, 100);
        LevelConfigBean lv3 = new LevelConfigBean("Lv3", 15, 3, 3, 100);
        
        levelStore.put("Lv1", lv1);
        levelStore.put("Lv2", lv2);
        levelStore.put("Lv3", lv3);
    }
    
    public List<LevelConfigBean> getAllLevels() {
        return new ArrayList<>(levelStore.values());
    }
    
    public Optional<LevelConfigBean> getLevel(String levelId) {
        return Optional.ofNullable(levelStore.get(levelId));
    }
    
    public LevelConfigBean createLevel(LevelConfigBean level) {
        if (level.getLevelId() == null) {
            throw new IllegalArgumentException("levelId is required");
        }
        String id = level.getLevelId();
        if (levelStore.containsKey(id)) {
            throw new IllegalArgumentException("Level with ID '" + id + "' already exists");
        }
        
        LevelConfigBean created = cloneLevel(level);
        levelStore.put(id, created);
        
        logAudit("CREATE", null, created, "Created level " + id);
        return created;
    }
    
    public Optional<LevelConfigBean> updateLevel(String levelId, LevelConfigBean updates) {
        String id = levelId;
        LevelConfigBean existing = levelStore.get(id);
        if (existing == null) {
            return Optional.empty();
        }
        
        // Apply updates
        LevelConfigBean updated = cloneLevel(existing);
        if (updates.getMaxRounds() != null) updated.setMaxRounds(updates.getMaxRounds());
        if (updates.getComboTierMax() != null) updated.setComboTierMax(updates.getComboTierMax());
        if (updates.getArtifactSlots() != null) updated.setArtifactSlots(updates.getArtifactSlots());
        if (updates.getHpMultiplier() != null) updated.setHpMultiplier(updates.getHpMultiplier());
        
        levelStore.put(id, updated);
        
        logAudit("UPDATE", existing, updated, "Updated level " + id);
        return Optional.of(updated);
    }
    
    public boolean deleteLevel(String levelId) {
        // Cannot delete built-in levels: Lv1, Lv2, Lv3
        if ("Lv1".equals(levelId) || "Lv2".equals(levelId) || "Lv3".equals(levelId)) {
            return false;
        }
        
        LevelConfigBean deleted = levelStore.remove(levelId);
        if (deleted != null) {
            logAudit("DELETE", deleted, null, "Deleted level " + levelId);
            return true;
        }
        return false;
    }
    
    public LevelConfigBean getDefaultLevel(String levelId) {
        LevelConfigBean level = levelStore.get(levelId);
        return level != null ? cloneLevel(level) : null;
    }
    
    // Audit logging
    private void logAudit(String action, LevelConfigBean oldLevel, 
                         LevelConfigBean newLevel, String notes) {
        LevelAuditEntry entry = new LevelAuditEntry();
        entry.setTimestamp(Instant.now().toString());
        entry.setAction(action);
        entry.setOldLevel(oldLevel != null ? cloneLevel(oldLevel) : null);
        entry.setNewLevel(newLevel != null ? cloneLevel(newLevel) : null);
        entry.setNotes(notes);
        entry.setAdminId("admin");
        
        auditHistory.add(entry);
    }
    
    // Deep clone
    private LevelConfigBean cloneLevel(LevelConfigBean original) {
        if (original == null) return null;
        return new LevelConfigBean(
            original.getLevelId(),
            original.getMaxRounds(),
            original.getComboTierMax(),
            original.getArtifactSlots(),
            original.getHpMultiplier()
        );
    }
}

/**
 * Audit entry DTO for level changes.
 */
class LevelAuditEntry {
    private String timestamp;
    private String adminId;
    private String action;
    private LevelConfigBean oldLevel;
    private LevelConfigBean newLevel;
    private String notes;
    
    // Getters and setters
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public String getAdminId() { return adminId; }
    public void setAdminId(String adminId) { this.adminId = adminId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public LevelConfigBean getOldLevel() { return oldLevel; }
    public void setOldLevel(LevelConfigBean oldLevel) { this.oldLevel = oldLevel; }
    public LevelConfigBean getNewLevel() { return newLevel; }
    public void setNewLevel(LevelConfigBean newLevel) { this.newLevel = newLevel; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
