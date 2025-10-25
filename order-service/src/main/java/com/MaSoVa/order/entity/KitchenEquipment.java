package com.MaSoVa.order.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "kitchen_equipment")
public class KitchenEquipment {

    @Id
    private String id;

    @Indexed
    private String storeId;

    private String equipmentName;
    private EquipmentType type;
    private EquipmentStatus status;

    private Integer temperature; // For ovens/grills - in Celsius
    private Boolean isOn;
    private Integer usageCount; // Number of times used today

    private LocalDateTime lastMaintenanceDate;
    private LocalDateTime nextMaintenanceDate;
    private String maintenanceNotes;

    private LocalDateTime lastStatusChange;
    private String statusChangedBy; // Staff ID
    private String statusNotes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

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
        AVAILABLE,           // Ready to use
        IN_USE,             // Currently being used
        MAINTENANCE,        // Under maintenance
        BROKEN,             // Not working
        CLEANING            // Being cleaned
    }
}
