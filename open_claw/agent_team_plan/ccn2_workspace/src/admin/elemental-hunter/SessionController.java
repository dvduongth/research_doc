package com.ccn2.admin.elementalhunter;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

/**
 * SessionController - REST endpoints for viewing active game sessions.
 * Read-only access for admin monitoring.
 * 
 * Base path: /api/admin/elemental-hunter/sessions
 */
@RestController
@RequestMapping("/api/admin/elemental-hunter/sessions")
public class SessionController {
    
    /**
     * GET /sessions
     * List active game sessions (rooms).
     * Returns list of GameSessionDTO.
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getActiveSessions(
            @RequestParam(defaultValue = "all") String status) {
        // Stub implementation - in production, this would query the GameRoomManager
        List<Map<String, Object>> sessions = new ArrayList<>();
        
        // Example stub data
        Map<String, Object> session = new HashMap<>();
        session.put("matchId", "EH-001");
        session.put("status", "playing");
        session.put("currentTurn", "P1");
        session.put("currentRound", 3);
        session.put("maxRounds", 12);
        session.put("players", List.of(
            Map.of("playerId", "P1", "characterId", "pillow", "hp", 950, "mag", 30, "elementQueue", List.of("Fire")),
            Map.of("playerId", "P2", "characterId", "pillow", "hp", 980, "mag", 10, "elementQueue", List.of("Ice"))
        ));
        session.put("createdAt", new Date());
        session.put("lastActiveAt", new Date());
        sessions.add(session);
        
        // Filter by status if requested
        if (!"all".equals(status)) {
            sessions.removeIf(s -> !status.equals(s.get("status")));
        }
        
        return ResponseEntity.ok(sessions);
    }
}
