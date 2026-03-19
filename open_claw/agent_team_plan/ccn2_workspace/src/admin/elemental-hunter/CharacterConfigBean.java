package com.ccn2.admin.elementalhunter;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * CharacterConfigBean - Data model for Character (Pillow) configuration.
 * Defines base stats and affinity for playable characters.
 */
public class CharacterConfigBean {
    
    @NotNull(message = "Character ID is required")
    private String characterId;
    
    @NotNull(message = "Element affinity is required")
    private String affinity; // Fire, Ice, Grass, Rock
    
    @NotNull(message = "Base ATK is required")
    @Min(value = 0, message = "Base ATK must be non-negative")
    private Integer baseAtk;
    
    @NotNull(message = "Base MAG is required")
    @Min(value = 0, message = "Base MAG must be non-negative")
    private Integer baseMag;
    
    @NotNull(message = "Base HP is required")
    @Positive(message = "Base HP must be positive")
    private Integer baseHp;
    
    @NotNull(message = "Ultimate type is required")
    private String ultimateType; // e.g., "Extra Roll"
    
    @NotNull(message = "Ultimate cost is required")
    @Min(value = 0, message = "Ultimate cost must be non-negative")
    private Integer ultimateCost;
    
    // Constructors
    public CharacterConfigBean() {}
    
    public CharacterConfigBean(String characterId, String affinity, Integer baseAtk, 
                              Integer baseMag, Integer baseHp, String ultimateType, 
                              Integer ultimateCost) {
        this.characterId = characterId;
        this.affinity = affinity;
        this.baseAtk = baseAtk;
        this.baseMag = baseMag;
        this.baseHp = baseHp;
        this.ultimateType = ultimateType;
        this.ultimateCost = ultimateCost;
    }

    // Getters and Setters
    public String getCharacterId() { return characterId; }
    public void setCharacterId(String characterId) { this.characterId = characterId; }
    
    public String getAffinity() { return affinity; }
    public void setAffinity(String affinity) { this.affinity = affinity; }
    
    public Integer getBaseAtk() { return baseAtk; }
    public void setBaseAtk(Integer baseAtk) { this.baseAtk = baseAtk; }
    
    public Integer getBaseMag() { return baseMag; }
    public void setBaseMag(Integer baseMag) { this.baseMag = baseMag; }
    
    public Integer getBaseHp() { return baseHp; }
    public void setBaseHp(Integer baseHp) { this.baseHp = baseHp; }
    
    public String getUltimateType() { return ultimateType; }
    public void setUltimateType(String ultimateType) { this.ultimateType = ultimateType; }
    
    public Integer getUltimateCost() { return ultimateCost; }
    public void setUltimateCost(Integer ultimateCost) { this.ultimateCost = ultimateCost; }
}
