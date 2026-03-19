package com.ccn2.admin.elementalhunter;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

/**
 * GameLogController - REST endpoints for retrieving and searching game replay logs.
 * Read-only access for admin replay viewer.
 * 
 * Base path: /api/admin/elemental-hunter/logs
 */
@RestController
@RequestMapping("/api/admin/elemental-hunter/logs")
public class GameLogController {
    
    /**
     * GET /logs
     * Search completed game logs.
     * Query params:
     *   - matchId (optional): exact match ID filter
     *   - from (optional): ISO date string start
     *   - to (optional): ISO date string end
     *   - limit (optional, default 50): max results
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getGameLogs(
            @RequestParam(required = false) String matchId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "50") int limit) {
        
        // Stub implementation - in production, this would query persisted game logs
        List<Map<String, Object>> logs = new ArrayList<>();
        
        // Generate 5 fake logs
        for (int i = 1; i <= 5; i++) {
            Map<String, Object> log = new LinkedHashMap<>();
            String id = matchId != null ? matchId : "EH-" + (1000 + i);
            log.put("matchId", id);
            log.put("status", "completed");
            log.put("winner", i % 2 == 0 ? "P1" : "P2");
            log.put("endReason", i % 3 == 0 ? "round_limit" : "ko");
            log.put("totalRounds", 5 + i);
            log.put("createdAt", new Date());
            log.put("players", List.of(
                Map.of(
                    "playerId", "P1",
                    "characterId", "pillow",
                    "finalHp", 200 + i * 50
                ),
                Map.of(
                    "playerId", "P2",
                    "characterId", "pillow",
                    "finalHp", Math.max(0, 1000 - (200 + i * 50))
                )
            ));
            
            // Generate fake turns
            List<Map<String, Object>> turns = new ArrayList<>();
            int turnNum = 1;
            for (int r = 1; r <= (5 + i); r++) {
                for (String player : List.of("P1", "P2")) {
                    if (turnNum > 12) break; // limit turns for stub
                    Map<String, Object> turn = new LinkedHashMap<>();
                    turn.put("turnNumber", turnNum);
                    turn.put("round", r);
                    turn.put("playerId", player);
                    turn.put("action", turnNum % 4 == 0 ? "MOVE" : (turnNum % 3 == 0 ? "ROLL" : "SELECT_TOKEN"));
                    turn.put("timestamp", new Date());
                    turn.put("details", Map.of(
                        "dice", List.of(3, 4),
                        "tokenId", "token-" + ((turnNum % 3) + 1),
                        "steps", 6
                    ));
                    turn.put("gameStateSnapshot", Map.of(
                        "players", List.of(
                            Map.of(
                                "playerId", "P1",
                                "hp", Math.max(0, 1000 - r * 30),
                                "mag", r * 15,
                                "elementQueue", List.of("Fire", "Fire", "Ice"),
                                "comboCount", Math.max(0, r - 2),
                                "consecutiveRollsThisTurn", r % 3,
                                "doubleRollCooldown", Math.max(0, 2 - r)
                            ),
                            Map.of(
                                "playerId", "P2",
                                "hp", Math.max(0, 1000 - r * 25),
                                "mag", r * 10,
                                "elementQueue", List.of("Ice", "Grass"),
                                "comboCount", r % 2,
                                "consecutiveRollsThisTurn", 0,
                                "doubleRollCooldown", 1
                            )
                        ),
                        "tokens", List.of(
                            Map.of("tokenId", "P1-T1", "owner", "P1", "tileId", 10 + r, "atk", 15 + r, "frozenRounds", 0),
                            Map.of("tokenId", "P2-T1", "owner", "P2", "tileId", 20 + r, "atk", 12 + r, "frozenRounds", 0)
                        ),
                        "currentTurn", player
                    ));
                    turns.add(turn);
                    turnNum++;
                }
            }
            log.put("turns", turns);
            logs.add(log);
        }
        
        return ResponseEntity.ok(logs);
    }
}
