package com.MaSoVa.order.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QualityCheckpoint {

    private String checkpointName;
    private CheckpointType type;
    private CheckpointStatus status;
    private String checkedByStaffId;
    private String checkedByStaffName;
    private LocalDateTime checkedAt;
    private String notes;

    public enum CheckpointType {
        INGREDIENT_QUALITY,      // Check ingredient freshness
        PORTION_SIZE,            // Verify correct portions
        TEMPERATURE,             // Check cooking temperature
        PRESENTATION,            // Visual appeal check
        TASTE_TEST,              // Quality taste check
        PACKAGING,               // Delivery packaging check
        FINAL_INSPECTION         // Final check before dispatch
    }

    public enum CheckpointStatus {
        PENDING,
        PASSED,
        FAILED,
        SKIPPED
    }
}
