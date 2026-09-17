package com.MaSoVa.commerce.menu.controller;

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
 * Dev/demo menu-only seed. Full commerce seed also available at POST /api/orders/seed-demo.
 */
@RestController
@RequestMapping("/api/menu")
@Tag(name = "Menu Seed", description = "Dev/demo menu bulk seed")
public class MenuSeedController {

    private static final Logger log = LoggerFactory.getLogger(MenuSeedController.class);

    private final CommerceSeedService commerceSeedService;

    public MenuSeedController(CommerceSeedService commerceSeedService) {
        this.commerceSeedService = commerceSeedService;
    }

    @PostMapping({"/seed-demo", "/test-data/seed-demo"})
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Seed demo menu items for a store — dev/demo only")
    public ResponseEntity<?> seedDemo(@RequestParam(defaultValue = "DOM001") String storeId) {
        if (!commerceSeedService.isSeedAllowed()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Seed only available with spring profile dev or demo"));
        }
        try {
            return ResponseEntity.ok(commerceSeedService.seedMenuOnly(storeId));
        } catch (Exception e) {
            log.error("Menu seed-demo failed for store {}", storeId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Seed failed",
                            "detail", e.getMessage() != null ? e.getMessage() : "unknown"));
        }
    }
}
