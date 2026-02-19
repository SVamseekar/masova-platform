package com.MaSoVa.inventory.entity;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Inventory Item Entity
 *
 * Tracks stock levels, costs, and reorder information
 */
@Document(collection = "inventory_items")
@CompoundIndexes({
    @CompoundIndex(def = "{'storeId': 1, 'status': 1}"),
    @CompoundIndex(def = "{'storeId': 1, 'itemName': 1}"),
    @CompoundIndex(def = "{'storeId': 1, 'status': 1, 'currentStock': 1}"),
    @CompoundIndex(def = "{'isPerishable': 1, 'expiryDate': 1}")
})
public class InventoryItem {

    @Id
    private String id;

    @Version
    private Long version;

    @Indexed
    private String storeId;

    @Indexed
    private String itemName;

    private String itemCode; // SKU or internal code

    private String category; // RAW_MATERIAL, INGREDIENT, PACKAGING, BEVERAGE, etc.

    private String unit; // kg, liters, pieces, boxes, etc.

    // Stock levels
    private Double currentStock;
    private Double reservedStock; // Stock allocated for pending orders
    private Double minimumStock; // Reorder point
    private Double maximumStock; // Maximum stock level
    private Double reorderQuantity; // Standard reorder quantity

    // Costing (INR)
    private BigDecimal unitCost; // Cost per unit
    private BigDecimal averageCost; // Moving average cost
    private BigDecimal lastPurchaseCost; // Cost of last purchase

    // Supplier information
    @Indexed
    private String primarySupplierId;
    private List<String> alternativeSupplierIds = new ArrayList<>();

    // Perishable tracking
    private Boolean isPerishable;
    private LocalDate expiryDate;
    private Integer shelfLifeDays; // Shelf life in days

    // Batch tracking
    private Boolean batchTracked;
    private String currentBatchNumber;

    // Status
    @Indexed
    private String status; // AVAILABLE, LOW_STOCK, OUT_OF_STOCK, DISCONTINUED

    private Boolean autoReorder; // Enable automatic purchase order creation

    // Metadata
    private String description;
    private String storageLocation;
    private String notes;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private String lastUpdatedBy; // User ID who made the last change

    // Constructors
    public InventoryItem() {
        this.currentStock = 0.0;
        this.reservedStock = 0.0;
        this.status = "AVAILABLE";
        this.isPerishable = false;
        this.batchTracked = false;
        this.autoReorder = false;
        this.alternativeSupplierIds = new ArrayList<>();
    }

    // Business logic methods

    /**
     * Get available stock (current - reserved)
     */
    public Double getAvailableStock() {
        return currentStock - reservedStock;
    }

    /**
     * Check if stock is below reorder point
     */
    public Boolean needsReorder() {
        return getAvailableStock() <= minimumStock;
    }

    /**
     * Check if item is out of stock
     */
    public Boolean isOutOfStock() {
        return getAvailableStock() <= 0;
    }

    /**
     * Check if item is expired
     */
    public Boolean isExpired() {
        if (!isPerishable || expiryDate == null) {
            return false;
        }
        return LocalDate.now().isAfter(expiryDate);
    }

    /**
     * Calculate total value of current stock
     */
    public BigDecimal getTotalStockValue() {
        if (averageCost == null) {
            return BigDecimal.ZERO;
        }
        return averageCost.multiply(BigDecimal.valueOf(currentStock));
    }

    // Getters and Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getStoreId() {
        return storeId;
    }

    public void setStoreId(String storeId) {
        this.storeId = storeId;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getItemCode() {
        return itemCode;
    }

    public void setItemCode(String itemCode) {
        this.itemCode = itemCode;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Double getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(Double currentStock) {
        this.currentStock = currentStock;
    }

    public Double getReservedStock() {
        return reservedStock;
    }

    public void setReservedStock(Double reservedStock) {
        this.reservedStock = reservedStock;
    }

    public Double getMinimumStock() {
        return minimumStock;
    }

    public void setMinimumStock(Double minimumStock) {
        this.minimumStock = minimumStock;
    }

    public Double getMaximumStock() {
        return maximumStock;
    }

    public void setMaximumStock(Double maximumStock) {
        this.maximumStock = maximumStock;
    }

    public Double getReorderQuantity() {
        return reorderQuantity;
    }

    public void setReorderQuantity(Double reorderQuantity) {
        this.reorderQuantity = reorderQuantity;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(BigDecimal unitCost) {
        this.unitCost = unitCost;
    }

    public BigDecimal getAverageCost() {
        return averageCost;
    }

    public void setAverageCost(BigDecimal averageCost) {
        this.averageCost = averageCost;
    }

    public BigDecimal getLastPurchaseCost() {
        return lastPurchaseCost;
    }

    public void setLastPurchaseCost(BigDecimal lastPurchaseCost) {
        this.lastPurchaseCost = lastPurchaseCost;
    }

    public String getPrimarySupplierId() {
        return primarySupplierId;
    }

    public void setPrimarySupplierId(String primarySupplierId) {
        this.primarySupplierId = primarySupplierId;
    }

    public List<String> getAlternativeSupplierIds() {
        return alternativeSupplierIds;
    }

    public void setAlternativeSupplierIds(List<String> alternativeSupplierIds) {
        this.alternativeSupplierIds = alternativeSupplierIds;
    }

    public Boolean getIsPerishable() {
        return isPerishable;
    }

    public void setIsPerishable(Boolean isPerishable) {
        this.isPerishable = isPerishable;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public Integer getShelfLifeDays() {
        return shelfLifeDays;
    }

    public void setShelfLifeDays(Integer shelfLifeDays) {
        this.shelfLifeDays = shelfLifeDays;
    }

    public Boolean getBatchTracked() {
        return batchTracked;
    }

    public void setBatchTracked(Boolean batchTracked) {
        this.batchTracked = batchTracked;
    }

    public String getCurrentBatchNumber() {
        return currentBatchNumber;
    }

    public void setCurrentBatchNumber(String currentBatchNumber) {
        this.currentBatchNumber = currentBatchNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getAutoReorder() {
        return autoReorder;
    }

    public void setAutoReorder(Boolean autoReorder) {
        this.autoReorder = autoReorder;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStorageLocation() {
        return storageLocation;
    }

    public void setStorageLocation(String storageLocation) {
        this.storageLocation = storageLocation;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getLastUpdatedBy() {
        return lastUpdatedBy;
    }

    public void setLastUpdatedBy(String lastUpdatedBy) {
        this.lastUpdatedBy = lastUpdatedBy;
    }
}
