package com.MaSoVa.core.user.controller;

import com.MaSoVa.shared.entity.Store;
import com.MaSoVa.shared.util.StoreContextUtil;
import com.MaSoVa.core.user.service.StoreService;
import com.MaSoVa.core.user.service.AccessControlService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stores")
@Tag(name = "Store Management", description = "Store operations and configuration")
public class StoreController {

    @Autowired
    private StoreService storeService;

    @Autowired
    private AccessControlService accessControlService;

    // ============================================
    // PUBLIC ENDPOINTS (No Authentication)
    // ============================================

    @GetMapping("/public")
    @Operation(summary = "Get all active stores (public)")
    public ResponseEntity<List<Store>> getPublicActiveStores() {
        List<Store> stores = storeService.getActiveStores();
        return ResponseEntity.ok(stores);
    }

    @GetMapping("/public/{storeId}")
    @Operation(summary = "Get store by ID (public)")
    public ResponseEntity<Store> getPublicStore(@PathVariable("storeId") String storeId) {
        Store store = storeService.getStore(storeId);
        return ResponseEntity.ok(store);
    }

    @GetMapping("/public/code/{storeCode}")
    @Operation(summary = "Get store by code (public)")
    public ResponseEntity<Store> getPublicStoreByCode(@PathVariable("storeCode") String storeCode) {
        Store store = storeService.getStoreByCode(storeCode);
        return ResponseEntity.ok(store);
    }

    // ============================================
    // PROTECTED ENDPOINTS (Authentication Required)
    // ============================================

    @GetMapping("/{storeId}")
    @Operation(summary = "Get store by ID or code")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Store> getStore(@PathVariable("storeId") String storeId) {
        // Try to get by code first (e.g., DOM001), then fall back to MongoDB ID
        try {
            Store store = storeService.getStoreByCode(storeId);
            return ResponseEntity.ok(store);
        } catch (RuntimeException e) {
            // If not found by code, try by MongoDB _id
            Store store = storeService.getStore(storeId);
            return ResponseEntity.ok(store);
        }
    }
    
    @GetMapping("/code/{storeCode}")
    @Operation(summary = "Get store by code")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Store> getStoreByCode(@PathVariable("storeCode") String storeCode) {
        Store store = storeService.getStoreByCode(storeCode);
        return ResponseEntity.ok(store);
    }

    @GetMapping
    @Operation(summary = "Get all active stores")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<List<Store>> getActiveStores() {
        List<Store> stores = storeService.getActiveStores();
        return ResponseEntity.ok(stores);
    }

    @GetMapping("/region/{regionId}")
    @Operation(summary = "Get stores by region")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<Store>> getStoresByRegion(@PathVariable("regionId") String regionId) {
        List<Store> stores = storeService.getStoresByRegion(regionId);
        return ResponseEntity.ok(stores);
    }

    @GetMapping("/nearby")
    @Operation(summary = "Find stores in delivery radius")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<List<Store>> getNearbyStores(
            @RequestParam double latitude,
            @RequestParam double longitude) {
        List<Store> stores = storeService.getStoresInDeliveryRadius(latitude, longitude);
        return ResponseEntity.ok(stores);
    }

    @GetMapping("/{storeId}/delivery-radius-check")
    @Operation(summary = "Check if coordinates are within store's delivery radius")
    public ResponseEntity<Map<String, Object>> checkDeliveryRadius(
            @PathVariable("storeId") String storeId,
            @RequestParam double latitude,
            @RequestParam double longitude) {
        Map<String, Object> result = storeService.checkDeliveryRadius(storeId, latitude, longitude);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    @Operation(summary = "Create new store")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Store> createStore(@Valid @RequestBody Store store) {
        Store savedStore = storeService.saveStore(store);
        return ResponseEntity.ok(savedStore);
    }

    @PutMapping("/{storeId}")
    @Operation(summary = "Update store")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Store> updateStore(
            @PathVariable("storeId") String storeId,
            @Valid @RequestBody Store store) {
        store.setId(storeId);
        Store updatedStore = storeService.saveStore(store);
        return ResponseEntity.ok(updatedStore);
    }
    
    @GetMapping("/operational-status")
    @Operation(summary = "Check if store is operational")
    public ResponseEntity<Map<String, Boolean>> getOperationalStatus(HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        boolean isOperational = storeService.validateStoreOperational(storeId);
        return ResponseEntity.ok(Map.of("isOperational", isOperational));
    }
    
    @GetMapping("/metrics")
    @Operation(summary = "Get store metrics")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    public ResponseEntity<Map<String, Object>> getStoreMetrics(HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        Map<String, Object> metrics = storeService.getStoreMetrics(storeId);
        return ResponseEntity.ok(metrics);
    }
    
    @PostMapping("/access-check")
    @Operation(summary = "Validate order taking access")
    public ResponseEntity<AccessControlService.OrderTakingPermission> validateOrderAccess(
            @RequestHeader("X-User-Id") String userId,
            HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        AccessControlService.OrderTakingPermission permission =
            accessControlService.validateOrderTakingAccess(userId, storeId);
        return ResponseEntity.ok(permission);
    }
}