package com.ccn2.admin.elementalhunter;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

/**
 * MetricsController - REST endpoints for game balance and behavioral metrics.
 * Read-only analytics for admin dashboard.
 * 
 * Base path: /api/admin/elemental-hunter/metrics
 */
@RestController
@RequestMapping("/api/admin/elemental-hunter/metrics")
public class MetricsController {
    
    /**
     * GET /metrics
     * Retrieve aggregated metrics over a time window.
     * Query params: days (default 7)
     * Returns metrics object and optional time series data.
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getMetrics(
            @RequestParam(defaultValue = "7") int days) {
        
        // Stub implementation - in production, this would query MetricsCollector/DB
        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("totalGames", 1247);
        metrics.put("koRate", 68.5); // percentage
        metrics.put("avgRounds", 8.3);
        metrics.put("avgHpRemaining", 234.7);
        metrics.put("avgComboCountPerPlayer", 2.4);
        metrics.put("artifactUsage", Map.of(
            "swap", 450,
            "change", 320,
            "charge", 380
        ));
        metrics.put("ultimateActivationRate", 52.3); // percentage
        metrics.put("winRatesByCharacter", Map.of(
            "warrior", 54.2,
            "mage", 48.7,
            "archer", 51.1
        ));
        metrics.put("avgAtkByComboTier", Map.of(
            "tier1", 165.0,
            "tier2", 240.0,
            "tier3", 350.0
        ));
        
        // Generate fake time series data
        List<Map<String, Object>> timeSeries = new ArrayList<>();
        Calendar cal = Calendar.getInstance();
        for (int i = days - 1; i >= 0; i--) {
            cal.add(Calendar.DAY_OF_MONTH, -i);
            Map<String, Object> day = new LinkedHashMap<>();
            day.put("date", String.format("%1$tY-%1$tm-%1$td", cal.getTime()));
            day.put("games", 50 + (int)(Math.random() * 100));
            day.put("avgComboCount", 1.5 + Math.random() * 2);
            day.put("koRate", 60 + Math.random() * 20);
            timeSeries.add(day);
        }
        
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("metrics", metrics);
        response.put("timeSeries", timeSeries);
        response.put("periodDays", days);
        
        return ResponseEntity.ok(response);
    }
}
