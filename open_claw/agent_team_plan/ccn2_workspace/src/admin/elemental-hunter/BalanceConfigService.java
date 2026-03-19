package com.ccn2.admin.elementalhunter;

import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.time.Instant;

/**
 * BalanceConfigService - Business logic for balance configuration management.
 * Handles validation, persistence (stub), and audit logging.
 */
@Service
public class BalanceConfigService {
    
    // In-memory store - TODO: Replace with persistence layer (DB)
    private BalanceConfigBean currentConfig = initializeDefault();
    private final List<BalanceConfigAuditEntry> auditHistory = new ArrayList<>();
    
    /**
     * Get the current balance configuration.
     */
    public BalanceConfigBean getCurrentConfig() {
        // Return a copy to prevent external mutation
        return cloneConfig(currentConfig);
    }
    
    /**
     * Update the balance configuration with validation.
     * @throws IllegalArgumentException if config is invalid
     */
    public BalanceConfigBean updateConfig(BalanceConfigBean newConfig) {
        // Additional business rule validation could go here
        validateConfig(newConfig);
        
        BalanceConfigBean oldConfig = cloneConfig(currentConfig);
        this.currentConfig = cloneConfig(newConfig);
        
        // Log audit entry
        logAudit("UPDATE", oldConfig, newConfig, "Configuration updated by admin");
        
        return cloneConfig(currentConfig);
    }
    
    /**
     * Reset to default configuration.
     */
    public BalanceConfigBean resetToDefault() {
        BalanceConfigBean oldConfig = cloneConfig(currentConfig);
        this.currentConfig = initializeDefault();
        
        logAudit("RESET", oldConfig, currentConfig, "Configuration reset to default");
        
        return cloneConfig(currentConfig);
    }
    
    /**
     * Get default/factory configuration values.
     */
    public BalanceConfigBean getDefaultConfig() {
        return initializeDefault();
    }
    
    /**
     * Get audit history of configuration changes.
     * @param limit Maximum number of entries to return (most recent first)
     */
    public List<BalanceConfigAuditEntry> getChangeHistory(int limit) {
        int count = Math.min(limit, auditHistory.size());
        return new ArrayList<>(auditHistory.subList(auditHistory.size() - count, auditHistory.size()));
    }
    
    // Initialize with GDD default values (from DESIGN section 6)
    private BalanceConfigBean initializeDefault() {
        return new BalanceConfigBean(
            100,      // magCap (TBD from Balance)
            8,        // maxElementQueue (TBD - default 8)
            2,        // doubleRollCooldownRounds
            3,        // maxConsecutiveRolls
            150,      // comboT1AtkBonus
            1.5,      // comboT3AtkMultiplier
            50,       // ultimateCostExtraRoll
            0.20,     // powerRollAccuracy
            30,       // tileRewardAtk (character.atk default)
            10,       // tileRewardMag (character.mag default)
            3         // tokenCount
        );
    }
    
    private void validateConfig(BalanceConfigBean config) {
        // Bean validation annotations in BalanceConfigBean provide most checks
        // Additional cross-field validation can be added here
        if (config.getMagCap() != null && config.getMaxElementQueue() != null) {
            if (config.getMagCap() < config.getMaxElementQueue()) {
                throw new IllegalArgumentException("magCap should be >= maxElementQueue for gameplay balance");
            }
        }
    }
    
    private void logAudit(String action, BalanceConfigBean oldConfig, BalanceConfigBean newConfig, String notes) {
        BalanceConfigAuditEntry entry = new BalanceConfigAuditEntry();
        entry.setTimestamp(Instant.now().toString());
        entry.setAction(action);
        entry.setOldConfig(cloneConfig(oldConfig));
        entry.setNewConfig(cloneConfig(newConfig));
        entry.setNotes(notes);
        // adminId would come from security context - stubbed here
        entry.setAdminId("admin");
        
        auditHistory.add(entry);
    }
    
    private BalanceConfigBean cloneConfig(BalanceConfigBean config) {
        if (config == null) return null;
        return new BalanceConfigBean(
            config.getMagCap(),
            config.getMaxElementQueue(),
            config.getDoubleRollCooldownRounds(),
            config.getMaxConsecutiveRolls(),
            config.getComboT1AtkBonus(),
            config.getComboT3AtkMultiplier(),
            config.getUltimateCostExtraRoll(),
            config.getPowerRollAccuracy(),
            config.getTileRewardAtk(),
            config.getTileRewardMag(),
            config.getTokenCount()
        );
    }
}
