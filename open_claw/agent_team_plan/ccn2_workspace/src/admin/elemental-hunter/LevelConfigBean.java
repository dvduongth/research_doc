package com.ccn2.admin.elementalhunter;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * LevelConfigBean - Data model for Level difficulty configuration.
 * Controls round limits, combo tier availability, and artifact slots.
 */
public class LevelConfigBean {
    
    @NotNull(message = "Level ID is required")
    private String levelId; // e.g., "Lv1", "Lv2", "Lv3"
    
    @NotNull(message = "Max rounds is required")
    @Min(value = 1, message = "Max rounds must be at least 1")
    @Max(value = 30, message = "Max rounds must not exceed 30")
    private Integer maxRounds;
    
    @NotNull(message = "Combo tier max is required")
    @Min(value = 1, message = "Combo tier max must be at least 1")
    @Max(value = 3, message = "Combo tier max must not exceed 3")
    private Integer comboTierMax;
    
    @NotNull(message = "Artifact slots is required")
    @Min(value = 1, message = "Artifact slots must be at least 1")
    @Max(value = 5, message = "Artifact slots must not exceed 5")
    private Integer artifactSlots;
    
    // Optional: HP multiplier for this level (if different from character base)
    @Min(value = 50, message = "HpMultiplier must be at least 50%")
    @Max(value = 200, message = "HpMultiplier must not exceed 200%")
    private Integer hpMultiplier = 100;
    
    // Constructors
    public LevelConfigBean() {}
    
    public LevelConfigBean(String levelId, Integer maxRounds, Integer comboTierMax, 
                          Integer artifactSlots) {
        this.levelId = levelId;
        this.maxRounds = maxRounds;
        this.comboTierMax = comboTierMax;
        this.artifactSlots = artifactSlots;
        this.hpMultiplier = 100;
    }
    
    public LevelConfigBean(String levelId, Integer maxRounds, Integer comboTierMax, 
                          Integer artifactSlots, Integer hpMultiplier) {
        this.levelId = levelId;
        this.maxRounds = maxRounds;
        this.comboTierMax = comboTierMax;
        this.artifactSlots = artifactSlots;
        this.hpMultiplier = hpMultiplier != null ? hpMultiplier : 100;
    }

    // Getters and Setters
    public String getLevelId() { return levelId; }
    public void setLevelId(String levelId) { this.levelId = levelId; }
    
    public Integer getMaxRounds() { return maxRounds; }
    public void setMaxRounds(Integer maxRounds) { this.maxRounds = maxRounds; }
    
    public Integer getComboTierMax() { return comboTierMax; }
    public void setComboTierMax(Integer comboTierMax) { this.comboTierMax = comboTierMax; }
    
    public Integer getArtifactSlots() { return artifactSlots; }
    public void setArtifactSlots(Integer artifactSlots) { this.artifactSlots = artifactSlots; }
    
    public Integer getHpMultiplier() { return hpMultiplier; }
    public void setHpMultiplier(Integer hpMultiplier) { this.hpMultiplier = hpMultiplier; }
}
