package com.MaSoVa.commerce.order.controller;

import com.MaSoVa.commerce.order.service.CommerceSeedService;
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
 * Dev/demo commerce seed endpoints. Runtime-gated to dev/demo profiles.
 */
@RestController
@RequestMapping("/api/orders")
@Tag(name = "Commerce Seed", description = "Dev/demo seed for menu, orders, equipment")
public class CommerceSeedController {

    private static final Logger log = LoggerFactory.getLogger(CommerceSeedController.class);

    private final CommerceSeedService commerceSeedService;

    public CommerceSeedController(CommerceSeedService commerceSeedService) {
        this.commerceSeedService = commerceSeedService;
    }

    /**
     * POST /api/orders/seed-demo — menu + multi-status orders (customerId=userId) + equipment.
     */
    @PostMapping({"/seed-demo", "/test-data/seed-demo"})
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Seed commerce demo data (menu, orders, equipment) — dev/demo only")
    public ResponseEntity<?> seedDemo(
            @RequestParam(defaultValue = "DOM001") String storeId,
            @RequestParam(required = false) String customerId) {
        if (!commerceSeedService.isSeedAllowed()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Seed only available with spring profile dev or demo"));
        }
        try {
            return ResponseEntity.ok(commerceSeedService.seedDemo(storeId, customerId));
        } catch (Exception e) {
            log.error("Commerce seed-demo failed for store {}", storeId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Seed failed",
                            "detail", e.getMessage() != null ? e.getMessage() : "unknown"));
        }
    }
}
