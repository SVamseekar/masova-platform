package com.MaSoVa.core.user.controller;

import com.MaSoVa.shared.entity.Store;
import com.MaSoVa.core.user.service.StoreService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Store management — canonical endpoints at /api/stores.
 * Public GET (no auth): list, by id/code, and /public aliases for customer entry.
 * Mutations require MANAGER. Replaces: /api/stores/nearby, /api/stores/code/*,
 *           /api/stores/region/*, /api/stores/operational-status, /api/stores/metrics.
 */
@RestController
@RequestMapping("/api/stores")
@Tag(name = "Store Management", description = "Store CRUD and geo-lookup")
public class StoreController {

    @Autowired
    private StoreService storeService;

    /**
     * GET /api/stores
     * Query params: code, region, near=lat,lng, radius, lat, lng
     * Returns withinDeliveryRadius field when lat/lng provided.
     * Public — customer store picker (no JWT).
     */
    @GetMapping
    @Operation(summary = "List stores (query: code, region, near=lat,lng, radius, lat, lng) — public")
    public ResponseEntity<List<Store>> getStores(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false, defaultValue = "10") Double radius) {

        if (lat != null && lng != null) {
            return ResponseEntity.ok(storeService.getStoresInDeliveryRadius(lat, lng));
        }
        if (code != null) {
            return ResponseEntity.ok(List.of(storeService.getStoreByCode(code)));
        }
        if (region != null) {
            return ResponseEntity.ok(storeService.getStoresByRegion(region));
        }
        return ResponseEntity.ok(storeService.getActiveStores());
    }

    /**
     * GET /api/stores/public — alias for list active stores (anonymous customer path).
     */
    @GetMapping("/public")
    @Operation(summary = "List active stores (public alias)")
    public ResponseEntity<List<Store>> getPublicStores() {
        return ResponseEntity.ok(storeService.getActiveStores());
    }

    /**
     * GET /api/stores/public/{code} — store by code for anonymous customers.
     */
    @GetMapping("/public/{code}")
    @Operation(summary = "Get store by code (public alias)")
    public ResponseEntity<Store> getPublicStoreByCode(@PathVariable String code) {
        return ResponseEntity.ok(storeService.getStoreByCode(code));
    }

    @GetMapping("/{storeId}")
    @Operation(summary = "Get store by ID or code — public GET")
    public ResponseEntity<Store> getStore(@PathVariable String storeId) {
        try {
            return ResponseEntity.ok(storeService.getStoreByCode(storeId));
        } catch (RuntimeException e) {
            return ResponseEntity.ok(storeService.getStore(storeId));
        }
    }

    @PostMapping
    @Operation(summary = "Create new store")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Store> createStore(@Valid @RequestBody Store store) {
        return ResponseEntity.ok(storeService.saveStore(store));
    }

    @PatchMapping("/{storeId}")
    @Operation(summary = "Update store")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Store> updateStore(
            @PathVariable String storeId,
            @Valid @RequestBody Store store) {
        store.setId(storeId);
        return ResponseEntity.ok(storeService.saveStore(store));
    }
}
