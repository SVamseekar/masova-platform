package com.MaSoVa.order.entity;

import java.time.LocalDateTime;

public class QualityCheckpoint {

    private String checkpointName;
    private CheckpointType type;
    private CheckpointStatus status;
    private String checkedByStaffId;
    private String checkedByStaffName;
    private LocalDateTime checkedAt;
    private String notes;

    public QualityCheckpoint() {}

    public QualityCheckpoint(String checkpointName, CheckpointType type, CheckpointStatus status,
                             String checkedByStaffId, String checkedByStaffName,
                             LocalDateTime checkedAt, String notes) {
        this.checkpointName = checkpointName;
        this.type = type;
        this.status = status;
        this.checkedByStaffId = checkedByStaffId;
        this.checkedByStaffName = checkedByStaffName;
        this.checkedAt = checkedAt;
        this.notes = notes;
    }

    // Getters and Setters
    public String getCheckpointName() { return checkpointName; }
    public void setCheckpointName(String checkpointName) { this.checkpointName = checkpointName; }

    public CheckpointType getType() { return type; }
    public void setType(CheckpointType type) { this.type = type; }

    public CheckpointStatus getStatus() { return status; }
    public void setStatus(CheckpointStatus status) { this.status = status; }

    public String getCheckedByStaffId() { return checkedByStaffId; }
    public void setCheckedByStaffId(String checkedByStaffId) { this.checkedByStaffId = checkedByStaffId; }

    public String getCheckedByStaffName() { return checkedByStaffName; }
    public void setCheckedByStaffName(String checkedByStaffName) { this.checkedByStaffName = checkedByStaffName; }

    public LocalDateTime getCheckedAt() { return checkedAt; }
    public void setCheckedAt(LocalDateTime checkedAt) { this.checkedAt = checkedAt; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    // Builder pattern
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String checkpointName;
        private CheckpointType type;
        private CheckpointStatus status;
        private String checkedByStaffId;
        private String checkedByStaffName;
        private LocalDateTime checkedAt;
        private String notes;

        public Builder checkpointName(String checkpointName) { this.checkpointName = checkpointName; return this; }
        public Builder type(CheckpointType type) { this.type = type; return this; }
        public Builder status(CheckpointStatus status) { this.status = status; return this; }
        public Builder checkedByStaffId(String checkedByStaffId) { this.checkedByStaffId = checkedByStaffId; return this; }
        public Builder checkedByStaffName(String checkedByStaffName) { this.checkedByStaffName = checkedByStaffName; return this; }
        public Builder checkedAt(LocalDateTime checkedAt) { this.checkedAt = checkedAt; return this; }
        public Builder notes(String notes) { this.notes = notes; return this; }

        public QualityCheckpoint build() {
            return new QualityCheckpoint(checkpointName, type, status, checkedByStaffId, checkedByStaffName, checkedAt, notes);
        }
    }

    public enum CheckpointType {
        INGREDIENT_QUALITY,
        PORTION_SIZE,
        TEMPERATURE,
        PRESENTATION,
        TASTE_TEST,
        PACKAGING,
        FINAL_INSPECTION
    }

    public enum CheckpointStatus {
        PENDING,
        PASSED,
        FAILED,
        SKIPPED
    }
}
