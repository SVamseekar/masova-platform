package com.MaSoVa.logistics.inventory.controller;

import com.MaSoVa.logistics.inventory.dto.request.ReserveStockRequest;
import com.MaSoVa.logistics.inventory.dto.request.StockAdjustmentRequest;
import com.MaSoVa.logistics.inventory.dto.response.InventoryValueResponse;
import com.MaSoVa.logistics.inventory.dto.response.MessageResponse;
import com.MaSoVa.logistics.inventory.entity.InventoryItem;
import com.MaSoVa.logistics.inventory.service.InventoryService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Inventory — 7 canonical endpoints at /api/inventory.
 * Replaces: /items, /items/{id}, /items/category/{cat}, /items/search,
 *           /items/{id}/adjust, /items/{id}/reserve, /items/{id}/release,
 *           /items/{id}/consume, /low-stock, /out-of-stock, /expiring-soon,
 *           /alerts/low-stock, /value, /value/by-category, PUT /items/{id}
 */
@RestController
@RequestMapping("/api/inventory")
@Tag(name = "Inventory", description = "Inventory management and stock control")
@SecurityRequirement(name = "bearerAuth")
public class InventoryController {

    private static final Logger log = LoggerFactory.getLogger(InventoryController.class);

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    private String getStoreIdFromHeaders(HttpServletRequest request) {
        String userType = request.getHeader("X-User-Type");
        String selectedStoreId = request.getHeader("X-Selected-Store-Id");
        String userStoreId = request.getHeader("X-User-Store-Id");
        if ("MANAGER".equals(userType) || "CUSTOMER".equals(userType)) {
            return selectedStoreId != null ? selectedStoreId : userStoreId;
        }
        return userStoreId;
    }

    // ── LIST ──────────────────────────────────────────────────────────────────────

    /**
     * GET /api/inventory?category=&search=&lowStock=true&outOfStock=true&expiringSoon=7
     * Replaces: /items, /items/category/{cat}, /items/search, /low-stock, /out-of-stock,
     *           /expiring-soon, /alerts/low-stock
     */
    @GetMapping
    @Operation(summary = "List inventory (query: category, search, lowStock, outOfStock, expiringSoon)")
    public ResponseEntity<List<InventoryItem>> getInventory(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean lowStock,
            @RequestParam(required = false) Boolean outOfStock,
            @RequestParam(required = false) Integer expiringSoon,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        if (Boolean.TRUE.equals(outOfStock)) {
            return ResponseEntity.ok(inventoryService.getOutOfStockItems(storeId));
        }
        if (Boolean.TRUE.equals(lowStock)) {
            return ResponseEntity.ok(inventoryService.getLowStockAlerts(storeId));
        }
        if (expiringSoon != null) {
            return ResponseEntity.ok(inventoryService.getItemsExpiringSoon(storeId, expiringSoon));
        }
        if (search != null) {
            return ResponseEntity.ok(inventoryService.searchItems(storeId, search));
        }
        if (category != null) {
            return ResponseEntity.ok(inventoryService.getItemsByCategory(storeId, category));
        }
        return ResponseEntity.ok(inventoryService.getAllInventoryItems(storeId));
    }

    @PostMapping
    @Operation(summary = "Create inventory item")
    public ResponseEntity<InventoryItem> createItem(@RequestBody InventoryItem item) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.createInventoryItem(item));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get inventory item by ID")
    public ResponseEntity<InventoryItem> getItem(@PathVariable String id) {
        return ResponseEntity.ok(inventoryService.getInventoryItemById(id));
    }

    /**
     * PATCH /api/inventory/{id} — update item fields (replaces PUT)
     */
    @PatchMapping("/{id}")
    @Operation(summary = "Update inventory item")
    public ResponseEntity<InventoryItem> updateItem(@PathVariable String id, @RequestBody InventoryItem item) {
        item.setId(id);
        return ResponseEntity.ok(inventoryService.updateInventoryItem(item));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete inventory item")
    public ResponseEntity<MessageResponse> deleteItem(@PathVariable String id, HttpServletRequest request) {
        inventoryService.deleteInventoryItem(id, getStoreIdFromHeaders(request));
        return ResponseEntity.ok(new MessageResponse("Inventory item deleted successfully"));
    }

    // ── STOCK OPERATIONS ──────────────────────────────────────────────────────────

    /**
     * POST /api/inventory/{id}/stock
     * Body: { operation: "ADJUST"|"RESERVE"|"RELEASE"|"CONSUME", quantity, storeId, ... }
     * Replaces: PATCH /items/{id}/adjust, /items/{id}/reserve, /items/{id}/release, /items/{id}/consume
     */
    @PostMapping("/{id}/stock")
    @Operation(summary = "Stock operation (body: operation=ADJUST|RESERVE|RELEASE|CONSUME)")
    public ResponseEntity<?> stockOperation(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        String operation = ((String) body.getOrDefault("operation", "ADJUST")).toUpperCase();
        return switch (operation) {
            case "ADJUST" -> {
                StockAdjustmentRequest req = new StockAdjustmentRequest();
                req.setQuantityChange(((Number) body.get("quantityChange")).doubleValue());
                req.setStoreId((String) body.get("storeId"));
                if (body.containsKey("unitCost")) req.setUnitCost(new BigDecimal(body.get("unitCost").toString()));
                req.setUpdatedBy((String) body.get("updatedBy"));
                req.setReason((String) body.get("reason"));
                yield ResponseEntity.ok(inventoryService.adjustStock(id, req.getQuantityChange(),
                        req.getStoreId(), req.getUnitCost(), req.getUpdatedBy(), req.getReason()));
            }
            case "RESERVE" -> {
                double qty = ((Number) body.get("quantity")).doubleValue();
                inventoryService.reserveStock(id, qty, (String) body.get("storeId"));
                yield ResponseEntity.ok(new MessageResponse("Stock reserved"));
            }
            case "RELEASE" -> {
                double qty = ((Number) body.get("quantity")).doubleValue();
                inventoryService.releaseReservedStock(id, qty, (String) body.get("storeId"));
                yield ResponseEntity.ok(new MessageResponse("Reserved stock released"));
            }
            case "CONSUME" -> {
                double qty = ((Number) body.get("quantity")).doubleValue();
                inventoryService.consumeReservedStock(id, qty, (String) body.get("storeId"));
                yield ResponseEntity.ok(new MessageResponse("Reserved stock consumed"));
            }
            default -> ResponseEntity.badRequest().body(new MessageResponse("operation must be ADJUST|RESERVE|RELEASE|CONSUME"));
        };
    }

    // ── VALUE ─────────────────────────────────────────────────────────────────────

    /**
     * GET /api/inventory/value?byCategory=true
     * Replaces: /value, /value/by-category
     */
    @GetMapping("/value")
    @Operation(summary = "Inventory value (query: byCategory=true for breakdown)")
    public ResponseEntity<?> getValue(
            @RequestParam(required = false) Boolean byCategory,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        if (Boolean.TRUE.equals(byCategory)) {
            return ResponseEntity.ok(inventoryService.getInventoryValueByCategory(storeId));
        }
        return ResponseEntity.ok(new InventoryValueResponse(inventoryService.getTotalInventoryValue(storeId)));
    }
}
