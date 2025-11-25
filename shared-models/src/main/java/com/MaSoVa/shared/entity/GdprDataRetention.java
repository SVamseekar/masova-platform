package com.MaSoVa.shared.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.Indexed;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "gdpr_data_retention")
public class GdprDataRetention {

    @Id
    private String id;

    @NotNull
    @Field("dataType")
    @Indexed
    private String dataType;

    @NotNull
    @Field("retentionPeriodDays")
    private Integer retentionPeriodDays;

    @Field("legalBasis")
    private String legalBasis;

    @Field("description")
    private String description;

    @Field("autoDeleteEnabled")
    private boolean autoDeleteEnabled = true;

    @Field("lastReviewedAt")
    private LocalDateTime lastReviewedAt;

    @Field("reviewedBy")
    private String reviewedBy;

    @Field("metadata")
    private Map<String, Object> metadata;

    @Field("isActive")
    private boolean isActive = true;

    @Field("createdAt")
    @Indexed
    private LocalDateTime createdAt = LocalDateTime.now();

    @Field("updatedAt")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Constructors
    public GdprDataRetention() {}

    public GdprDataRetention(String dataType, Integer retentionPeriodDays, String legalBasis) {
        this.dataType = dataType;
        this.retentionPeriodDays = retentionPeriodDays;
        this.legalBasis = legalBasis;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDataType() { return dataType; }
    public void setDataType(String dataType) { this.dataType = dataType; }

    public Integer getRetentionPeriodDays() { return retentionPeriodDays; }
    public void setRetentionPeriodDays(Integer retentionPeriodDays) { this.retentionPeriodDays = retentionPeriodDays; }

    public String getLegalBasis() { return legalBasis; }
    public void setLegalBasis(String legalBasis) { this.legalBasis = legalBasis; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isAutoDeleteEnabled() { return autoDeleteEnabled; }
    public void setAutoDeleteEnabled(boolean autoDeleteEnabled) { this.autoDeleteEnabled = autoDeleteEnabled; }

    public LocalDateTime getLastReviewedAt() { return lastReviewedAt; }
    public void setLastReviewedAt(LocalDateTime lastReviewedAt) { this.lastReviewedAt = lastReviewedAt; }

    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
