package com.MaSoVa.shared.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.Indexed;
import com.MaSoVa.shared.enums.GdprRequestType;
import com.MaSoVa.shared.enums.GdprRequestStatus;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "gdpr_data_requests")
public class GdprDataRequest {

    @Id
    private String id;

    @NotNull
    @Field("userId")
    @Indexed
    private String userId;

    @NotNull
    @Field("requestType")
    @Indexed
    private GdprRequestType requestType;

    @NotNull
    @Field("status")
    @Indexed
    private GdprRequestStatus status;

    @Field("requestedAt")
    @Indexed
    private LocalDateTime requestedAt = LocalDateTime.now();

    @Field("completedAt")
    private LocalDateTime completedAt;

    @Field("dueDate")
    @Indexed
    private LocalDateTime dueDate;

    @Field("ipAddress")
    private String ipAddress;

    @Field("userAgent")
    private String userAgent;

    @Field("reason")
    private String reason;

    @Field("dataExportUrl")
    private String dataExportUrl;

    @Field("dataExportExpiresAt")
    private LocalDateTime dataExportExpiresAt;

    @Field("processingNotes")
    private String processingNotes;

    @Field("verificationToken")
    private String verificationToken;

    @Field("verifiedAt")
    private LocalDateTime verifiedAt;

    @Field("metadata")
    private Map<String, Object> metadata;

    @Field("processedBy")
    private String processedBy;

    @Field("createdAt")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Field("updatedAt")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Constructors
    public GdprDataRequest() {}

    public GdprDataRequest(String userId, GdprRequestType requestType) {
        this.userId = userId;
        this.requestType = requestType;
        this.status = GdprRequestStatus.PENDING;
        this.requestedAt = LocalDateTime.now();
        // GDPR requires response within 30 days
        this.dueDate = LocalDateTime.now().plusDays(30);
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public GdprRequestType getRequestType() { return requestType; }
    public void setRequestType(GdprRequestType requestType) { this.requestType = requestType; }

    public GdprRequestStatus getStatus() { return status; }
    public void setStatus(GdprRequestStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
        if (status == GdprRequestStatus.COMPLETED) {
            this.completedAt = LocalDateTime.now();
        }
    }

    public LocalDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(LocalDateTime requestedAt) { this.requestedAt = requestedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getDataExportUrl() { return dataExportUrl; }
    public void setDataExportUrl(String dataExportUrl) { this.dataExportUrl = dataExportUrl; }

    public LocalDateTime getDataExportExpiresAt() { return dataExportExpiresAt; }
    public void setDataExportExpiresAt(LocalDateTime dataExportExpiresAt) { this.dataExportExpiresAt = dataExportExpiresAt; }

    public String getProcessingNotes() { return processingNotes; }
    public void setProcessingNotes(String processingNotes) { this.processingNotes = processingNotes; }

    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }

    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

    public String getProcessedBy() { return processedBy; }
    public void setProcessedBy(String processedBy) { this.processedBy = processedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Helper methods
    public boolean isOverdue() {
        return status != GdprRequestStatus.COMPLETED &&
               dueDate != null &&
               dueDate.isBefore(LocalDateTime.now());
    }

    public boolean isVerified() {
        return verifiedAt != null;
    }

    public int getDaysUntilDue() {
        if (dueDate == null) return -1;
        return (int) java.time.temporal.ChronoUnit.DAYS.between(LocalDateTime.now(), dueDate);
    }
}
