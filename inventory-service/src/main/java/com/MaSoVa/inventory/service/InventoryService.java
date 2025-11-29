package com.MaSoVa.inventory.service;

import com.MaSoVa.inventory.entity.InventoryItem;
import com.MaSoVa.inventory.repository.InventoryItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for managing inventory operations
 */
@Service
public class InventoryService {

    private static final Logger logger = LoggerFactory.getLogger(InventoryService.class);

    private final InventoryItemRepository inventoryItemRepository;

    public InventoryService(InventoryItemRepository inventoryItemRepository) {
        this.inventoryItemRepository = inventoryItemRepository;
    }

    /**
     * Create a new inventory item
     */
    @CacheEvict(value = "inventoryItems", key = "#item.storeId")
    public InventoryItem createInventoryItem(InventoryItem item) {
        logger.info("Creating new inventory item: {} for store: {}", item.getItemName(), item.getStoreId());

        // Initialize stock status
        updateStockStatus(item);

        return inventoryItemRepository.save(item);
    }

    /**
     * Get inventory item by ID
     */
    public InventoryItem getInventoryItemById(String id) {
        return inventoryItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory item not found: " + id));
    }

    /**
     * Get all inventory items for a store
     */
    @Cacheable(value = "inventoryItems", key = "#storeId")
    public List<InventoryItem> getAllInventoryItems(String storeId) {
        return inventoryItemRepository.findByStoreId(storeId);
    }

    /**
     * Get inventory items by category
     */
    public List<InventoryItem> getItemsByCategory(String storeId, String category) {
        return inventoryItemRepository.findByStoreIdAndCategory(storeId, category);
    }

    /**
     * Search inventory items by name
     */
    public List<InventoryItem> searchItems(String storeId, String searchTerm) {
        return inventoryItemRepository.searchByName(storeId, searchTerm);
    }

    /**
     * Update inventory item
     */
    @CacheEvict(value = "inventoryItems", key = "#item.storeId")
    public InventoryItem updateInventoryItem(InventoryItem item) {
        logger.info("Updating inventory item: {}", item.getId());

        // Verify item exists
        InventoryItem existing = getInventoryItemById(item.getId());

        // Update stock status
        updateStockStatus(item);

        return inventoryItemRepository.save(item);
    }

    /**
     * Adjust stock quantity
     * Positive quantity = add stock
     * Negative quantity = remove stock
     */
    @Transactional
    @CacheEvict(value = "inventoryItems", key = "#storeId")
    public InventoryItem adjustStock(String itemId, Double quantityChange, String storeId,
                                      BigDecimal newUnitCost, String updatedBy, String reason) {
        logger.info("Adjusting stock for item: {} by {} units. Reason: {}", itemId, quantityChange, reason);

        InventoryItem item = getInventoryItemById(itemId);

        // Update current stock
        Double newStock = item.getCurrentStock() + quantityChange;
        if (newStock < 0) {
            throw new RuntimeException("Cannot reduce stock below zero");
        }
        item.setCurrentStock(newStock);

        // Update average cost using weighted average
        if (quantityChange > 0 && newUnitCost != null) {
            BigDecimal oldTotalValue = item.getAverageCost() != null
                ? item.getAverageCost().multiply(BigDecimal.valueOf(item.getCurrentStock() - quantityChange))
                : BigDecimal.ZERO;

            BigDecimal newTotalValue = newUnitCost.multiply(BigDecimal.valueOf(quantityChange));
            BigDecimal totalValue = oldTotalValue.add(newTotalValue);
            BigDecimal averageCost = totalValue.divide(BigDecimal.valueOf(newStock), 2, RoundingMode.HALF_UP);

            item.setAverageCost(averageCost);
            item.setLastPurchaseCost(newUnitCost);
        }

        // Update metadata
        item.setLastUpdatedBy(updatedBy);

        // Update stock status
        updateStockStatus(item);

        return inventoryItemRepository.save(item);
    }

    /**
     * Reserve stock for an order
     */
    @Transactional
    @CacheEvict(value = "inventoryItems", key = "#storeId")
    public void reserveStock(String itemId, Double quantity, String storeId) {
        logger.info("Reserving {} units for item: {}", quantity, itemId);

        InventoryItem item = getInventoryItemById(itemId);

        // Check if enough stock available
        if (item.getAvailableStock() < quantity) {
            throw new RuntimeException("Insufficient stock available. Available: " +
                item.getAvailableStock() + ", Requested: " + quantity);
        }

        item.setReservedStock(item.getReservedStock() + quantity);
        updateStockStatus(item);

        inventoryItemRepository.save(item);
    }

    /**
     * Release reserved stock (e.g., when order is cancelled)
     */
    @Transactional
    @CacheEvict(value = "inventoryItems", key = "#storeId")
    public void releaseReservedStock(String itemId, Double quantity, String storeId) {
        logger.info("Releasing {} reserved units for item: {}", quantity, itemId);

        InventoryItem item = getInventoryItemById(itemId);

        Double newReserved = item.getReservedStock() - quantity;
        if (newReserved < 0) {
            newReserved = 0.0;
        }

        item.setReservedStock(newReserved);
        updateStockStatus(item);

        inventoryItemRepository.save(item);
    }

    /**
     * Consume reserved stock (when order is fulfilled)
     */
    @Transactional
    @CacheEvict(value = "inventoryItems", key = "#storeId")
    public void consumeReservedStock(String itemId, Double quantity, String storeId) {
        logger.info("Consuming {} reserved units for item: {}", quantity, itemId);

        InventoryItem item = getInventoryItemById(itemId);

        // Reduce both current and reserved stock
        item.setCurrentStock(item.getCurrentStock() - quantity);
        item.setReservedStock(item.getReservedStock() - quantity);

        // Ensure stocks don't go negative
        if (item.getCurrentStock() < 0) item.setCurrentStock(0.0);
        if (item.getReservedStock() < 0) item.setReservedStock(0.0);

        updateStockStatus(item);

        inventoryItemRepository.save(item);
    }

    /**
     * Get items that need reordering
     */
    public List<InventoryItem> getItemsNeedingReorder(String storeId) {
        return inventoryItemRepository.findItemsNeedingReorder(storeId);
    }

    /**
     * Get out of stock items
     */
    public List<InventoryItem> getOutOfStockItems(String storeId) {
        return inventoryItemRepository.findOutOfStockItems(storeId);
    }

    /**
     * Get items expiring soon (within specified days)
     */
    public List<InventoryItem> getItemsExpiringSoon(String storeId, Integer daysAhead) {
        LocalDate futureDate = LocalDate.now().plusDays(daysAhead);
        return inventoryItemRepository.findItemsExpiringSoon(storeId, futureDate);
    }

    /**
     * Get low stock alerts
     */
    public List<InventoryItem> getLowStockAlerts(String storeId) {
        List<InventoryItem> items = inventoryItemRepository.findByStoreIdAndStatus(storeId, "LOW_STOCK");
        logger.info("Found {} items with low stock for store: {}", items.size(), storeId);
        return items;
    }

    /**
     * Delete inventory item
     */
    @CacheEvict(value = "inventoryItems", key = "#storeId")
    public void deleteInventoryItem(String itemId, String storeId) {
        logger.info("Deleting inventory item: {}", itemId);
        inventoryItemRepository.deleteById(itemId);
    }

    /**
     * Get inventory value by store
     */
    public BigDecimal getTotalInventoryValue(String storeId) {
        List<InventoryItem> items = inventoryItemRepository.findByStoreId(storeId);

        return items.stream()
                .map(InventoryItem::getTotalStockValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Get inventory summary by category
     */
    public Map<String, BigDecimal> getInventoryValueByCategory(String storeId) {
        List<InventoryItem> items = inventoryItemRepository.findByStoreId(storeId);

        return items.stream()
                .collect(Collectors.groupingBy(
                    InventoryItem::getCategory,
                    Collectors.reducing(
                        BigDecimal.ZERO,
                        InventoryItem::getTotalStockValue,
                        BigDecimal::add
                    )
                ));
    }

    /**
     * Transfer stock between stores (placeholder for future implementation)
     */
    @Transactional
    public void transferStock(String itemId, String fromStoreId, String toStoreId, Double quantity) {
        logger.info("Transferring {} units from store {} to store {}", quantity, fromStoreId, toStoreId);

        // This would require finding the same item in both stores
        // and coordinating the stock adjustment
        throw new UnsupportedOperationException("Stock transfer not yet implemented");
    }

    /**
     * Update stock status based on current levels
     */
    private void updateStockStatus(InventoryItem item) {
        Double availableStock = item.getAvailableStock();

        if (availableStock <= 0) {
            item.setStatus("OUT_OF_STOCK");
        } else if (item.needsReorder()) {
            item.setStatus("LOW_STOCK");
        } else {
            item.setStatus("AVAILABLE");
        }

        // Check if item is expired
        if (item.isExpired()) {
            item.setStatus("EXPIRED");
        }
    }

    /**
     * Get all unique store IDs from inventory items
     * Used for scheduled tasks and bulk operations
     */
    public List<String> getAllStoreIds() {
        return inventoryItemRepository.findAll().stream()
                .map(InventoryItem::getStoreId)
                .distinct()
                .collect(Collectors.toList());
    }

    /**
     * Batch update stock (for receiving purchase orders)
     */
    @Transactional
    @CacheEvict(value = "inventoryItems", allEntries = true)
    public void batchUpdateStock(List<StockAdjustment> adjustments, String updatedBy) {
        logger.info("Performing batch stock update for {} items", adjustments.size());

        for (StockAdjustment adjustment : adjustments) {
            adjustStock(
                adjustment.getItemId(),
                adjustment.getQuantity(),
                adjustment.getStoreId(),
                adjustment.getUnitCost(),
                updatedBy,
                adjustment.getReason()
            );
        }
    }

    /**
     * Helper class for batch stock adjustments
     */
    public static class StockAdjustment {
        private String itemId;
        private String storeId;
        private Double quantity;
        private BigDecimal unitCost;
        private String reason;

        public StockAdjustment() {}

        public StockAdjustment(String itemId, String storeId, Double quantity, BigDecimal unitCost, String reason) {
            this.itemId = itemId;
            this.storeId = storeId;
            this.quantity = quantity;
            this.unitCost = unitCost;
            this.reason = reason;
        }

        // Getters and Setters
        public String getItemId() { return itemId; }
        public void setItemId(String itemId) { this.itemId = itemId; }
        public String getStoreId() { return storeId; }
        public void setStoreId(String storeId) { this.storeId = storeId; }
        public Double getQuantity() { return quantity; }
        public void setQuantity(Double quantity) { this.quantity = quantity; }
        public BigDecimal getUnitCost() { return unitCost; }
        public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
}
