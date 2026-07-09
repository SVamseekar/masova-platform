package com.MaSoVa.logistics.inventory.controller;

import com.MaSoVa.logistics.inventory.service.LogisticsSeedService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Dev/demo logistics seed: inventory, suppliers, POs, waste, delivery tracking.
 */
@RestController
@RequestMapping("/api/inventory")
@Tag(name = "Logistics Seed", description = "Dev/demo logistics seed endpoints")
public class LogisticsSeedController {

    private static final Logger log = LoggerFactory.getLogger(LogisticsSeedController.class);

    private final LogisticsSeedService logisticsSeedService;

    public LogisticsSeedController(LogisticsSeedService logisticsSeedService) {
        this.logisticsSeedService = logisticsSeedService;
    }

    /**
     * POST /api/inventory/seed-demo — full logistics seed (suppliers, inventory, POs, waste, delivery).
     */
    @PostMapping({"/seed-demo", "/test-data/seed-demo"})
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Seed logistics demo data — dev/demo only")
    public ResponseEntity<?> seedDemo(
            @RequestParam(defaultValue = "DOM001") String storeId,
            @RequestParam(required = false) String driverId,
            @RequestParam(required = false) String orderIds) {
        if (!logisticsSeedService.isSeedAllowed()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Seed only available with spring profile dev or demo"));
        }
        try {
            java.util.List<String> linked = null;
            if (orderIds != null && !orderIds.isBlank()) {
                linked = java.util.Arrays.stream(orderIds.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();
            }
            return ResponseEntity.ok(logisticsSeedService.seedDemo(storeId, driverId, linked));
        } catch (Exception e) {
            log.error("Logistics seed-demo failed for store {}", storeId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Seed failed",
                            "detail", e.getMessage() != null ? e.getMessage() : "unknown"));
        }
    }
}
