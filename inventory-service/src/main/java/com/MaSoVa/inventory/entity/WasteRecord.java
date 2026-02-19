package com.MaSoVa.inventory.entity;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Waste Record Entity
 *
 * Tracks inventory waste for analysis and cost control
 */
@Document(collection = "waste_records")
@CompoundIndexes({
    @CompoundIndex(def = "{'storeId': 1, 'wasteCategory': 1}"),
    @CompoundIndex(def = "{'storeId': 1, 'wasteDate': -1}")
})
public class WasteRecord {

    @Id
    private String id;

    @Indexed
    private String storeId;

    @Indexed
    private String inventoryItemId;

    private String itemName; // Denormalized
    private String itemCode;

    private Double quantity; // Quantity wasted
    private String unit;

    private BigDecimal unitCost; // Cost per unit at time of waste
    private BigDecimal totalCost; // Total waste cost

    // Waste details
    @Indexed
    private String wasteCategory; // EXPIRED, DAMAGED, SPOILED, CONTAMINATED, OVERPRODUCTION, OTHER

    private String wasteReason; // Detailed reason for waste

    @Indexed
    private LocalDate wasteDate;

    // Responsibility
    private String reportedBy; // User ID who reported the waste
    private String approvedBy; // Manager who approved/verified
    private LocalDateTime approvedAt;

    // Preventability
    private Boolean preventable; // Was this waste preventable?
    private String preventionNotes; // How it could have been prevented

    // Batch tracking
    private String batchNumber;

    private String notes;

    @CreatedDate
    private LocalDateTime createdAt;

    // Constructors
    public WasteRecord() {
        this.wasteDate = LocalDate.now();
        this.preventable = false;
    }

    // Business logic methods

    /**
     * Calculate total cost from quantity and unit cost
     */
    public void calculateTotalCost() {
        if (quantity != null && unitCost != null) {
            this.totalCost = unitCost.multiply(BigDecimal.valueOf(quantity));
        }
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

    public String getInventoryItemId() {
        return inventoryItemId;
    }

    public void setInventoryItemId(String inventoryItemId) {
        this.inventoryItemId = inventoryItemId;
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

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(BigDecimal unitCost) {
        this.unitCost = unitCost;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
    }

    public String getWasteCategory() {
        return wasteCategory;
    }

    public void setWasteCategory(String wasteCategory) {
        this.wasteCategory = wasteCategory;
    }

    public String getWasteReason() {
        return wasteReason;
    }

    public void setWasteReason(String wasteReason) {
        this.wasteReason = wasteReason;
    }

    public LocalDate getWasteDate() {
        return wasteDate;
    }

    public void setWasteDate(LocalDate wasteDate) {
        this.wasteDate = wasteDate;
    }

    public String getReportedBy() {
        return reportedBy;
    }

    public void setReportedBy(String reportedBy) {
        this.reportedBy = reportedBy;
    }

    public String getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public Boolean getPreventable() {
        return preventable;
    }

    public void setPreventable(Boolean preventable) {
        this.preventable = preventable;
    }

    public String getPreventionNotes() {
        return preventionNotes;
    }

    public void setPreventionNotes(String preventionNotes) {
        this.preventionNotes = preventionNotes;
    }

    public String getBatchNumber() {
        return batchNumber;
    }

    public void setBatchNumber(String batchNumber) {
        this.batchNumber = batchNumber;
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
}
