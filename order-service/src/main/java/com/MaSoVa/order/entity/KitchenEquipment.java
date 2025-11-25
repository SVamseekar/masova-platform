package com.MaSoVa.order.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Document(collection = "kitchen_equipment")
public class KitchenEquipment {

    @Id
    private String id;

    @Indexed
    private String storeId;

    private String equipmentName;
    private EquipmentType type;
    private EquipmentStatus status;

    private Integer temperature;
    private Boolean isOn;
    private Integer usageCount;

    private LocalDateTime lastMaintenanceDate;
    private LocalDateTime nextMaintenanceDate;
    private String maintenanceNotes;

    private LocalDateTime lastStatusChange;
    private String statusChangedBy;
    private String statusNotes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public KitchenEquipment() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }

    public String getEquipmentName() { return equipmentName; }
    public void setEquipmentName(String equipmentName) { this.equipmentName = equipmentName; }

    public EquipmentType getType() { return type; }
    public void setType(EquipmentType type) { this.type = type; }

    public EquipmentStatus getStatus() { return status; }
    public void setStatus(EquipmentStatus status) { this.status = status; }

    public Integer getTemperature() { return temperature; }
    public void setTemperature(Integer temperature) { this.temperature = temperature; }

    public Boolean getIsOn() { return isOn; }
    public void setIsOn(Boolean isOn) { this.isOn = isOn; }

    public Integer getUsageCount() { return usageCount; }
    public void setUsageCount(Integer usageCount) { this.usageCount = usageCount; }

    public LocalDateTime getLastMaintenanceDate() { return lastMaintenanceDate; }
    public void setLastMaintenanceDate(LocalDateTime lastMaintenanceDate) { this.lastMaintenanceDate = lastMaintenanceDate; }

    public LocalDateTime getNextMaintenanceDate() { return nextMaintenanceDate; }
    public void setNextMaintenanceDate(LocalDateTime nextMaintenanceDate) { this.nextMaintenanceDate = nextMaintenanceDate; }

    public String getMaintenanceNotes() { return maintenanceNotes; }
    public void setMaintenanceNotes(String maintenanceNotes) { this.maintenanceNotes = maintenanceNotes; }

    public LocalDateTime getLastStatusChange() { return lastStatusChange; }
    public void setLastStatusChange(LocalDateTime lastStatusChange) { this.lastStatusChange = lastStatusChange; }

    public String getStatusChangedBy() { return statusChangedBy; }
    public void setStatusChangedBy(String statusChangedBy) { this.statusChangedBy = statusChangedBy; }

    public String getStatusNotes() { return statusNotes; }
    public void setStatusNotes(String statusNotes) { this.statusNotes = statusNotes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Builder pattern
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final KitchenEquipment equipment = new KitchenEquipment();

        public Builder id(String id) { equipment.id = id; return this; }
        public Builder storeId(String storeId) { equipment.storeId = storeId; return this; }
        public Builder equipmentName(String equipmentName) { equipment.equipmentName = equipmentName; return this; }
        public Builder type(EquipmentType type) { equipment.type = type; return this; }
        public Builder status(EquipmentStatus status) { equipment.status = status; return this; }
        public Builder temperature(Integer temperature) { equipment.temperature = temperature; return this; }
        public Builder isOn(Boolean isOn) { equipment.isOn = isOn; return this; }
        public Builder usageCount(Integer usageCount) { equipment.usageCount = usageCount; return this; }
        public Builder lastMaintenanceDate(LocalDateTime lastMaintenanceDate) { equipment.lastMaintenanceDate = lastMaintenanceDate; return this; }
        public Builder nextMaintenanceDate(LocalDateTime nextMaintenanceDate) { equipment.nextMaintenanceDate = nextMaintenanceDate; return this; }
        public Builder maintenanceNotes(String maintenanceNotes) { equipment.maintenanceNotes = maintenanceNotes; return this; }
        public Builder createdAt(LocalDateTime createdAt) { equipment.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { equipment.updatedAt = updatedAt; return this; }

        public KitchenEquipment build() { return equipment; }
    }

    public enum EquipmentType {
        OVEN,
        STOVE,
        GRILL,
        FRYER,
        REFRIGERATOR,
        FREEZER,
        MIXER,
        DISHWASHER,
        OTHER
    }

    public enum EquipmentStatus {
        AVAILABLE,
        IN_USE,
        MAINTENANCE,
        BROKEN,
        CLEANING
    }
}
