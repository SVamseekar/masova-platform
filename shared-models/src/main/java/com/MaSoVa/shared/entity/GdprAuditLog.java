package com.MaSoVa.shared.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.Indexed;
import com.MaSoVa.shared.enums.GdprActionType;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "gdpr_audit_logs")
public class GdprAuditLog {

    @Id
    private String id;

    @NotNull
    @Field("userId")
    @Indexed
    private String userId;

    @NotNull
    @Field("actionType")
    @Indexed
    private GdprActionType actionType;

    @Field("performedBy")
    @Indexed
    private String performedBy;

    @Field("performedByType")
    private String performedByType;

    @NotNull
    @Field("timestamp")
    @Indexed
    private LocalDateTime timestamp = LocalDateTime.now();

    @Field("ipAddress")
    private String ipAddress;

    @Field("userAgent")
    private String userAgent;

    @Field("dataType")
    @Indexed
    private String dataType;

    @Field("description")
    private String description;

    @Field("beforeState")
    private Map<String, Object> beforeState;

    @Field("afterState")
    private Map<String, Object> afterState;

    @Field("metadata")
    private Map<String, Object> metadata;

    @Field("legalBasis")
    private String legalBasis;

    @Field("success")
    private boolean success = true;

    @Field("errorMessage")
    private String errorMessage;

    // Constructors
    public GdprAuditLog() {}

    public GdprAuditLog(String userId, GdprActionType actionType, String performedBy) {
        this.userId = userId;
        this.actionType = actionType;
        this.performedBy = performedBy;
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public GdprActionType getActionType() { return actionType; }
    public void setActionType(GdprActionType actionType) { this.actionType = actionType; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }

    public String getPerformedByType() { return performedByType; }
    public void setPerformedByType(String performedByType) { this.performedByType = performedByType; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public String getDataType() { return dataType; }
    public void setDataType(String dataType) { this.dataType = dataType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Map<String, Object> getBeforeState() { return beforeState; }
    public void setBeforeState(Map<String, Object> beforeState) { this.beforeState = beforeState; }

    public Map<String, Object> getAfterState() { return afterState; }
    public void setAfterState(Map<String, Object> afterState) { this.afterState = afterState; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

    public String getLegalBasis() { return legalBasis; }
    public void setLegalBasis(String legalBasis) { this.legalBasis = legalBasis; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
