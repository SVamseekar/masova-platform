package com.MaSoVa.inventory.controller;

import com.MaSoVa.inventory.dto.request.ReserveStockRequest;
import com.MaSoVa.inventory.dto.request.StockAdjustmentRequest;
import com.MaSoVa.inventory.dto.response.InventoryValueResponse;
import com.MaSoVa.inventory.dto.response.MessageResponse;
import com.MaSoVa.inventory.entity.InventoryItem;
import com.MaSoVa.inventory.service.InventoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Inventory Management
 */
@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private static final Logger logger = LoggerFactory.getLogger(InventoryController.class);

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    /**
     * Extract storeId from HTTP headers
     */
    private String getStoreIdFromHeaders(HttpServletRequest request) {
        String userType = request.getHeader("X-User-Type");
        String selectedStoreId = request.getHeader("X-Selected-Store-Id");
        String userStoreId = request.getHeader("X-User-Store-Id");

        // Managers/Customers use selected store
        if ("MANAGER".equals(userType) || "CUSTOMER".equals(userType)) {
            return selectedStoreId != null ? selectedStoreId : userStoreId;
        }

        // Staff/Driver use assigned store
        return userStoreId;
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
     * GET /api/inventory/items
     */
    @GetMapping("/items")
    public ResponseEntity<List<InventoryItem>> getAllInventoryItems(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
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
     * GET /api/inventory/items/category/{category}
     */
    @GetMapping("/items/category/{category}")
    public ResponseEntity<List<InventoryItem>> getItemsByCategory(
            @PathVariable String category,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting inventory items by category: {} for store: {}", category, storeId);
        List<InventoryItem> items = inventoryService.getItemsByCategory(storeId, category);
        return ResponseEntity.ok(items);
    }

    /**
     * Search inventory items
     * GET /api/inventory/items/search?q=xxx
     */
    @GetMapping("/items/search")
    public ResponseEntity<List<InventoryItem>> searchInventoryItems(
            @RequestParam String q,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
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
    public ResponseEntity<MessageResponse> reserveStock(
            @PathVariable String id,
            @RequestBody ReserveStockRequest request) {
        logger.info("Reserving {} units for item: {}", request.getQuantity(), id);

        inventoryService.reserveStock(id, request.getQuantity(), request.getStoreId());

        return ResponseEntity.ok(new MessageResponse("Stock reserved successfully"));
    }

    /**
     * Release reserved stock
     * PATCH /api/inventory/items/{id}/release
     * Body: { "quantity": 5.0, "storeId": "xxx" }
     */
    @PatchMapping("/items/{id}/release")
    public ResponseEntity<MessageResponse> releaseReservedStock(
            @PathVariable String id,
            @RequestBody ReserveStockRequest request) {
        logger.info("Releasing {} reserved units for item: {}", request.getQuantity(), id);

        inventoryService.releaseReservedStock(id, request.getQuantity(), request.getStoreId());

        return ResponseEntity.ok(new MessageResponse("Reserved stock released successfully"));
    }

    /**
     * Consume reserved stock
     * PATCH /api/inventory/items/{id}/consume
     * Body: { "quantity": 5.0, "storeId": "xxx" }
     */
    @PatchMapping("/items/{id}/consume")
    public ResponseEntity<MessageResponse> consumeReservedStock(
            @PathVariable String id,
            @RequestBody ReserveStockRequest request) {
        logger.info("Consuming {} reserved units for item: {}", request.getQuantity(), id);

        inventoryService.consumeReservedStock(id, request.getQuantity(), request.getStoreId());

        return ResponseEntity.ok(new MessageResponse("Reserved stock consumed successfully"));
    }

    /**
     * Get items needing reorder
     * GET /api/inventory/low-stock
     */
    @GetMapping("/low-stock")
    public ResponseEntity<List<InventoryItem>> getItemsNeedingReorder(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting items needing reorder for store: {}", storeId);
        List<InventoryItem> items = inventoryService.getItemsNeedingReorder(storeId);
        return ResponseEntity.ok(items);
    }

    /**
     * Get out of stock items
     * GET /api/inventory/out-of-stock
     */
    @GetMapping("/out-of-stock")
    public ResponseEntity<List<InventoryItem>> getOutOfStockItems(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting out of stock items for store: {}", storeId);
        List<InventoryItem> items = inventoryService.getOutOfStockItems(storeId);
        return ResponseEntity.ok(items);
    }

    /**
     * Get items expiring soon
     * GET /api/inventory/expiring-soon?days=7
     */
    @GetMapping("/expiring-soon")
    public ResponseEntity<List<InventoryItem>> getItemsExpiringSoon(
            @RequestParam(name = "days", defaultValue = "7") Integer days,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting items expiring within {} days for store: {}", days, storeId);
        List<InventoryItem> items = inventoryService.getItemsExpiringSoon(storeId, days);
        return ResponseEntity.ok(items);
    }

    /**
     * Get low stock alerts
     * GET /api/inventory/alerts/low-stock
     */
    @GetMapping("/alerts/low-stock")
    public ResponseEntity<List<InventoryItem>> getLowStockAlerts(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting low stock alerts for store: {}", storeId);
        List<InventoryItem> items = inventoryService.getLowStockAlerts(storeId);
        return ResponseEntity.ok(items);
    }

    /**
     * Get total inventory value
     * GET /api/inventory/value
     */
    @GetMapping("/value")
    public ResponseEntity<InventoryValueResponse> getTotalInventoryValue(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting total inventory value for store: {}", storeId);
        BigDecimal totalValue = inventoryService.getTotalInventoryValue(storeId);

        return ResponseEntity.ok(new InventoryValueResponse(totalValue));
    }

    /**
     * Get inventory value by category
     * GET /api/inventory/value/by-category
     */
    @GetMapping("/value/by-category")
    public ResponseEntity<Map<String, BigDecimal>> getInventoryValueByCategory(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting inventory value by category for store: {}", storeId);
        Map<String, BigDecimal> valueByCategory = inventoryService.getInventoryValueByCategory(storeId);
        return ResponseEntity.ok(valueByCategory);
    }

    /**
     * Delete inventory item
     * DELETE /api/inventory/items/{id}
     */
    @DeleteMapping("/items/{id}")
    public ResponseEntity<MessageResponse> deleteInventoryItem(
            @PathVariable String id,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Deleting inventory item: {}", id);
        inventoryService.deleteInventoryItem(id, storeId);

        return ResponseEntity.ok(new MessageResponse("Inventory item deleted successfully"));
    }
}
