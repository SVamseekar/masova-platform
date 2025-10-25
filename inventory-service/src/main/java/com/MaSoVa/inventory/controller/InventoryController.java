package com.MaSoVa.inventory.controller;

import com.MaSoVa.inventory.entity.InventoryItem;
import com.MaSoVa.inventory.service.InventoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Inventory Management
 */
@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*")
public class InventoryController {

    private static final Logger logger = LoggerFactory.getLogger(InventoryController.class);

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    /**
     * Create a new inventory item
     * POST /api/inventory/items
     */
    @PostMapping("/items")
    public ResponseEntity<InventoryItem> createInventoryItem(@RequestBody InventoryItem item) {
        logger.info("Creating inventory item: {}", item.getItemName());
        InventoryItem created = inventoryService.createInventoryItem(item);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Get all inventory items for a store
     * GET /api/inventory/items?storeId=xxx
     */
    @GetMapping("/items")
    public ResponseEntity<List<InventoryItem>> getAllInventoryItems(@RequestParam String storeId) {
        logger.info("Getting all inventory items for store: {}", storeId);
        List<InventoryItem> items = inventoryService.getAllInventoryItems(storeId);
        return ResponseEntity.ok(items);
    }

    /**
     * Get inventory item by ID
     * GET /api/inventory/items/{id}
     */
    @GetMapping("/items/{id}")
    public ResponseEntity<InventoryItem> getInventoryItemById(@PathVariable String id) {
        logger.info("Getting inventory item: {}", id);
        InventoryItem item = inventoryService.getInventoryItemById(id);
        return ResponseEntity.ok(item);
    }

    /**
     * Get inventory items by category
     * GET /api/inventory/items/category/{category}?storeId=xxx
     */
    @GetMapping("/items/category/{category}")
    public ResponseEntity<List<InventoryItem>> getItemsByCategory(
            @PathVariable String category,
            @RequestParam String storeId) {
        logger.info("Getting inventory items by category: {} for store: {}", category, storeId);
        List<InventoryItem> items = inventoryService.getItemsByCategory(storeId, category);
        return ResponseEntity.ok(items);
    }

    /**
     * Search inventory items
     * GET /api/inventory/items/search?storeId=xxx&q=xxx
     */
    @GetMapping("/items/search")
    public ResponseEntity<List<InventoryItem>> searchInventoryItems(
            @RequestParam String storeId,
            @RequestParam String q) {
        logger.info("Searching inventory items: {} in store: {}", q, storeId);
        List<InventoryItem> items = inventoryService.searchItems(storeId, q);
        return ResponseEntity.ok(items);
    }

    /**
     * Update inventory item
     * PUT /api/inventory/items/{id}
     */
    @PutMapping("/items/{id}")
    public ResponseEntity<InventoryItem> updateInventoryItem(
            @PathVariable String id,
            @RequestBody InventoryItem item) {
        logger.info("Updating inventory item: {}", id);
        item.setId(id);
        InventoryItem updated = inventoryService.updateInventoryItem(item);
        return ResponseEntity.ok(updated);
    }

    /**
     * Adjust stock
     * PATCH /api/inventory/items/{id}/adjust
     * Body: { "quantityChange": 10.0, "storeId": "xxx", "unitCost": 100.00, "updatedBy": "userId", "reason": "Purchase" }
     */
    @PatchMapping("/items/{id}/adjust")
    public ResponseEntity<InventoryItem> adjustStock(
            @PathVariable String id,
            @RequestBody StockAdjustmentRequest request) {
        logger.info("Adjusting stock for item: {} by {}", id, request.getQuantityChange());

        InventoryItem updated = inventoryService.adjustStock(
            id,
            request.getQuantityChange(),
            request.getStoreId(),
            request.getUnitCost(),
            request.getUpdatedBy(),
            request.getReason()
        );

        return ResponseEntity.ok(updated);
    }

    /**
     * Reserve stock for an order
     * PATCH /api/inventory/items/{id}/reserve
     * Body: { "quantity": 5.0, "storeId": "xxx" }
     */
    @PatchMapping("/items/{id}/reserve")
    public ResponseEntity<Map<String, String>> reserveStock(
            @PathVariable String id,
            @RequestBody ReserveStockRequest request) {
        logger.info("Reserving {} units for item: {}", request.getQuantity(), id);

        inventoryService.reserveStock(id, request.getQuantity(), request.getStoreId());

        Map<String, String> response = new HashMap<>();
        response.put("message", "Stock reserved successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Release reserved stock
     * PATCH /api/inventory/items/{id}/release
     * Body: { "quantity": 5.0, "storeId": "xxx" }
     */
    @PatchMapping("/items/{id}/release")
    public ResponseEntity<Map<String, String>> releaseReservedStock(
            @PathVariable String id,
            @RequestBody ReserveStockRequest request) {
        logger.info("Releasing {} reserved units for item: {}", request.getQuantity(), id);

        inventoryService.releaseReservedStock(id, request.getQuantity(), request.getStoreId());

        Map<String, String> response = new HashMap<>();
        response.put("message", "Reserved stock released successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Consume reserved stock
     * PATCH /api/inventory/items/{id}/consume
     * Body: { "quantity": 5.0, "storeId": "xxx" }
     */
    @PatchMapping("/items/{id}/consume")
    public ResponseEntity<Map<String, String>> consumeReservedStock(
            @PathVariable String id,
            @RequestBody ReserveStockRequest request) {
        logger.info("Consuming {} reserved units for item: {}", request.getQuantity(), id);

        inventoryService.consumeReservedStock(id, request.getQuantity(), request.getStoreId());

        Map<String, String> response = new HashMap<>();
        response.put("message", "Reserved stock consumed successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Get items needing reorder
     * GET /api/inventory/low-stock?storeId=xxx
     */
    @GetMapping("/low-stock")
    public ResponseEntity<List<InventoryItem>> getItemsNeedingReorder(@RequestParam String storeId) {
        logger.info("Getting items needing reorder for store: {}", storeId);
        List<InventoryItem> items = inventoryService.getItemsNeedingReorder(storeId);
        return ResponseEntity.ok(items);
    }

    /**
     * Get out of stock items
     * GET /api/inventory/out-of-stock?storeId=xxx
     */
    @GetMapping("/out-of-stock")
    public ResponseEntity<List<InventoryItem>> getOutOfStockItems(@RequestParam String storeId) {
        logger.info("Getting out of stock items for store: {}", storeId);
        List<InventoryItem> items = inventoryService.getOutOfStockItems(storeId);
        return ResponseEntity.ok(items);
    }

    /**
     * Get items expiring soon
     * GET /api/inventory/expiring-soon?storeId=xxx&days=7
     */
    @GetMapping("/expiring-soon")
    public ResponseEntity<List<InventoryItem>> getItemsExpiringSoon(
            @RequestParam String storeId,
            @RequestParam(defaultValue = "7") Integer days) {
        logger.info("Getting items expiring within {} days for store: {}", days, storeId);
        List<InventoryItem> items = inventoryService.getItemsExpiringSoon(storeId, days);
        return ResponseEntity.ok(items);
    }

    /**
     * Get low stock alerts
     * GET /api/inventory/alerts/low-stock?storeId=xxx
     */
    @GetMapping("/alerts/low-stock")
    public ResponseEntity<List<InventoryItem>> getLowStockAlerts(@RequestParam String storeId) {
        logger.info("Getting low stock alerts for store: {}", storeId);
        List<InventoryItem> items = inventoryService.getLowStockAlerts(storeId);
        return ResponseEntity.ok(items);
    }

    /**
     * Get total inventory value
     * GET /api/inventory/value?storeId=xxx
     */
    @GetMapping("/value")
    public ResponseEntity<Map<String, BigDecimal>> getTotalInventoryValue(@RequestParam String storeId) {
        logger.info("Getting total inventory value for store: {}", storeId);
        BigDecimal totalValue = inventoryService.getTotalInventoryValue(storeId);

        Map<String, BigDecimal> response = new HashMap<>();
        response.put("totalValue", totalValue);
        return ResponseEntity.ok(response);
    }

    /**
     * Get inventory value by category
     * GET /api/inventory/value/by-category?storeId=xxx
     */
    @GetMapping("/value/by-category")
    public ResponseEntity<Map<String, BigDecimal>> getInventoryValueByCategory(@RequestParam String storeId) {
        logger.info("Getting inventory value by category for store: {}", storeId);
        Map<String, BigDecimal> valueByCategory = inventoryService.getInventoryValueByCategory(storeId);
        return ResponseEntity.ok(valueByCategory);
    }

    /**
     * Delete inventory item
     * DELETE /api/inventory/items/{id}?storeId=xxx
     */
    @DeleteMapping("/items/{id}")
    public ResponseEntity<Map<String, String>> deleteInventoryItem(
            @PathVariable String id,
            @RequestParam String storeId) {
        logger.info("Deleting inventory item: {}", id);
        inventoryService.deleteInventoryItem(id, storeId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Inventory item deleted successfully");
        return ResponseEntity.ok(response);
    }

    // DTOs for request bodies

    public static class StockAdjustmentRequest {
        private Double quantityChange;
        private String storeId;
        private BigDecimal unitCost;
        private String updatedBy;
        private String reason;

        // Getters and Setters
        public Double getQuantityChange() { return quantityChange; }
        public void setQuantityChange(Double quantityChange) { this.quantityChange = quantityChange; }
        public String getStoreId() { return storeId; }
        public void setStoreId(String storeId) { this.storeId = storeId; }
        public BigDecimal getUnitCost() { return unitCost; }
        public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
        public String getUpdatedBy() { return updatedBy; }
        public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class ReserveStockRequest {
        private Double quantity;
        private String storeId;

        // Getters and Setters
        public Double getQuantity() { return quantity; }
        public void setQuantity(Double quantity) { this.quantity = quantity; }
        public String getStoreId() { return storeId; }
        public void setStoreId(String storeId) { this.storeId = storeId; }
    }
}
