package com.ccn2.admin.elementalhunter;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * BalanceConfigBean - Data model for Elemental Hunter balance configuration.
 * Admin can edit these values to tune game difficulty and mechanics.
 */
public class BalanceConfigBean {
    
    @NotNull(message = "magCap is required")
    @Min(value = 0, message = "magCap must be non-negative")
    private Integer magCap;
    
    @NotNull(message = "maxElementQueue is required")
    @Min(value = 1, message = "maxElementQueue must be at least 1")
    @Max(value = 20, message = "maxElementQueue must not exceed 20")
    private Integer maxElementQueue;
    
    @NotNull(message = "doubleRollCooldownRounds is required")
    @Min(value = 0, message = "doubleRollCooldownRounds must be non-negative")
    @Max(value = 10, message = "doubleRollCooldownRounds must not exceed 10")
    private Integer doubleRollCooldownRounds;
    
    @NotNull(message = "maxConsecutiveRolls is required")
    @Min(value = 1, message = "maxConsecutiveRolls must be at least 1")
    @Max(value = 10, message = "maxConsecutiveRolls must not exceed 10")
    private Integer maxConsecutiveRolls;
    
    @NotNull(message = "comboT1AtkBonus is required")
    @Min(value = 0, message = "comboT1AtkBonus must be non-negative")
    private Integer comboT1AtkBonus;
    
    @NotNull(message = "comboT3AtkMultiplier is required")
    @DecimalMin(value = "1.0", message = "comboT3AtkMultiplier must be at least 1.0")
    @DecimalMax(value = "5.0", message = "comboT3AtkMultiplier must not exceed 5.0")
    private Double comboT3AtkMultiplier;
    
    @NotNull(message = "ultimateCostExtraRoll is required")
    @Min(value = 0, message = "ultimateCostExtraRoll must be non-negative")
    private Integer ultimateCostExtraRoll;
    
    @NotNull(message = "powerRollAccuracy is required")
    @DecimalMin(value = "0.0", message = "powerRollAccuracy must be between 0 and 1")
    @DecimalMax(value = "1.0", message = "powerRollAccuracy must be between 0 and 1")
    private Double powerRollAccuracy;
    
    @NotNull(message = "tileRewardAtk is required")
    @Min(value = 0, message = "tileRewardAtk must be non-negative")
    private Integer tileRewardAtk;
    
    @NotNull(message = "tileRewardMag is required")
    @Min(value = 0, message = "tileRewardMag must be non-negative")
    private Integer tileRewardMag;
    
    @NotNull(message = "tokenCount is required")
    @Min(value = 1, message = "tokenCount must be at least 1")
    @Max(value = 10, message = "tokenCount must not exceed 10")
    private Integer tokenCount;

    // Constructors
    public BalanceConfigBean() {}
    
    public BalanceConfigBean(Integer magCap, Integer maxElementQueue, Integer doubleRollCooldownRounds,
                           Integer maxConsecutiveRolls, Integer comboT1AtkBonus, Double comboT3AtkMultiplier,
                           Integer ultimateCostExtraRoll, Double powerRollAccuracy,
                           Integer tileRewardAtk, Integer tileRewardMag, Integer tokenCount) {
        this.magCap = magCap;
        this.maxElementQueue = maxElementQueue;
        this.doubleRollCooldownRounds = doubleRollCooldownRounds;
        this.maxConsecutiveRolls = maxConsecutiveRolls;
        this.comboT1AtkBonus = comboT1AtkBonus;
        this.comboT3AtkMultiplier = comboT3AtkMultiplier;
        this.ultimateCostExtraRoll = ultimateCostExtraRoll;
        this.powerRollAccuracy = powerRollAccuracy;
        this.tileRewardAtk = tileRewardAtk;
        this.tileRewardMag = tileRewardMag;
        this.tokenCount = tokenCount;
    }

    // Getters and Setters
    public Integer getMagCap() { return magCap; }
    public void setMagCap(Integer magCap) { this.magCap = magCap; }
    
    public Integer getMaxElementQueue() { return maxElementQueue; }
    public void setMaxElementQueue(Integer maxElementQueue) { this.maxElementQueue = maxElementQueue; }
    
    public Integer getDoubleRollCooldownRounds() { return doubleRollCooldownRounds; }
    public void setDoubleRollCooldownRounds(Integer doubleRollCooldownRounds) { 
        this.doubleRollCooldownRounds = doubleRollCooldownRounds; 
    }
    
    public Integer getMaxConsecutiveRolls() { return maxConsecutiveRolls; }
    public void setMaxConsecutiveRolls(Integer maxConsecutiveRolls) { 
        this.maxConsecutiveRolls = maxConsecutiveRolls; 
    }
    
    public Integer getComboT1AtkBonus() { return comboT1AtkBonus; }
    public void setComboT1AtkBonus(Integer comboT1AtkBonus) { this.comboT1AtkBonus = comboT1AtkBonus; }
    
    public Double getComboT3AtkMultiplier() { return comboT3AtkMultiplier; }
    public void setComboT3AtkMultiplier(Double comboT3AtkMultiplier) { 
        this.comboT3AtkMultiplier = comboT3AtkMultiplier; 
    }
    
    public Integer getUltimateCostExtraRoll() { return ultimateCostExtraRoll; }
    public void setUltimateCostExtraRoll(Integer ultimateCostExtraRoll) { 
        this.ultimateCostExtraRoll = ultimateCostExtraRoll; 
    }
    
    public Double getPowerRollAccuracy() { return powerRollAccuracy; }
    public void setPowerRollAccuracy(Double powerRollAccuracy) { this.powerRollAccuracy = powerRollAccuracy; }
    
    public Integer getTileRewardAtk() { return tileRewardAtk; }
    public void setTileRewardAtk(Integer tileRewardAtk) { this.tileRewardAtk = tileRewardAtk; }
    
    public Integer getTileRewardMag() { return tileRewardMag; }
    public void setTileRewardMag(Integer tileRewardMag) { this.tileRewardMag = tileRewardMag; }
    
    public Integer getTokenCount() { return tokenCount; }
    public void setTokenCount(Integer tokenCount) { this.tokenCount = tokenCount; }
}
