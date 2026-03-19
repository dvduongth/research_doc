package com.ccn2.admin.elementalhunter;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

/**
 * BalanceConfigController - REST endpoints for managing Elemental Hunter balance configuration.
 * Admin-only endpoints to tune game mechanics parameters.
 * 
 * Base path: /api/admin/elemental-hunter/balance
 */
@RestController
@RequestMapping("/api/admin/elemental-hunter/balance")
public class BalanceConfigController {
    
    private final BalanceConfigService service;
    
    public BalanceConfigController(BalanceConfigService service) {
        this.service = service;
    }
    
    /**
     * GET /balance
     * Retrieve current balance configuration.
     * Returns 200 OK with BalanceConfigBean.
     */
    @GetMapping
    public ResponseEntity<BalanceConfigBean> getBalanceConfig() {
        BalanceConfigBean config = service.getCurrentConfig();
        return ResponseEntity.ok(config);
    }
    
    /**
     * PUT /balance
     * Update balance configuration.
     * Returns 200 OK with updated config, or 400 Bad Request if validation fails.
     */
    @PutMapping
    public ResponseEntity<BalanceConfigBean> updateBalanceConfig(
            @Valid @RequestBody BalanceConfigBean config) {
        BalanceConfigBean updated = service.updateConfig(config);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * GET /balance/default
     * Retrieve default balance configuration (factory reset values).
     * Returns 200 OK with default config.
     */
    @GetMapping("/default")
    public ResponseEntity<BalanceConfigBean> getDefaultConfig() {
        BalanceConfigBean defaultConfig = service.getDefaultConfig();
        return ResponseEntity.ok(defaultConfig);
    }
    
    /**
     * GET /balance/history
     * Retrieve configuration change history (audit log).
     * Returns 200 OK with list of historical changes.
     */
    @GetMapping("/history")
    public ResponseEntity<List<BalanceConfigAuditEntry>> getChangeHistory(
            @RequestParam(defaultValue = "20") int limit) {
        List<BalanceConfigAuditEntry> history = service.getChangeHistory(limit);
        return ResponseEntity.ok(history);
    }
    
    // Exception handling returns 400/401/404/500 as appropriate
}

/**
 * DTO for audit entries (not persisted in this layer, view only).
 */
class BalanceConfigAuditEntry {
    private String timestamp;
    private String adminId;
    private String action; // "UPDATE", "RESET"
    private BalanceConfigBean oldConfig;
    private BalanceConfigBean newConfig;
    private String notes;
    
    // Getters and setters
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public String getAdminId() { return adminId; }
    public void setAdminId(String adminId) { this.adminId = adminId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public BalanceConfigBean getOldConfig() { return oldConfig; }
    public void setOldConfig(BalanceConfigBean oldConfig) { this.oldConfig = oldConfig; }
    public BalanceConfigBean getNewConfig() { return newConfig; }
    public void setNewConfig(BalanceConfigBean newConfig) { this.newConfig = newConfig; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
