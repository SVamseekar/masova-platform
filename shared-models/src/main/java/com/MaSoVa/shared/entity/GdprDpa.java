package com.MaSoVa.shared.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.Indexed;
import com.MaSoVa.shared.enums.DpaStatus;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Document(collection = "gdpr_dpa")
public class GdprDpa {

    @Id
    private String id;

    @NotNull
    @Field("processorName")
    @Indexed
    private String processorName;

    @Field("processorContact")
    private String processorContact;

    @Field("processorAddress")
    private String processorAddress;

    @NotNull
    @Field("purposeOfProcessing")
    private String purposeOfProcessing;

    @Field("dataCategories")
    private List<String> dataCategories;

    @Field("dataSubjects")
    private List<String> dataSubjects;

    @NotNull
    @Field("status")
    @Indexed
    private DpaStatus status;

    @Field("signedAt")
    private LocalDateTime signedAt;

    @Field("effectiveFrom")
    @Indexed
    private LocalDateTime effectiveFrom;

    @Field("expiresAt")
    @Indexed
    private LocalDateTime expiresAt;

    @Field("signedBy")
    private String signedBy;

    @Field("documentUrl")
    private String documentUrl;

    @Field("version")
    private String version;

    @Field("securityMeasures")
    private List<String> securityMeasures;

    @Field("subProcessors")
    private List<String> subProcessors;

    @Field("dataRetentionPeriod")
    private String dataRetentionPeriod;

    @Field("dataTransferMechanism")
    private String dataTransferMechanism;

    @Field("auditRights")
    private boolean auditRights = true;

    @Field("lastAuditedAt")
    private LocalDateTime lastAuditedAt;

    @Field("metadata")
    private Map<String, Object> metadata;

    @Field("isActive")
    private boolean isActive = true;

    @Field("createdAt")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Field("updatedAt")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Constructors
    public GdprDpa() {}

    public GdprDpa(String processorName, String purposeOfProcessing) {
        this.processorName = processorName;
        this.purposeOfProcessing = purposeOfProcessing;
        this.status = DpaStatus.DRAFT;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProcessorName() { return processorName; }
    public void setProcessorName(String processorName) { this.processorName = processorName; }

    public String getProcessorContact() { return processorContact; }
    public void setProcessorContact(String processorContact) { this.processorContact = processorContact; }

    public String getProcessorAddress() { return processorAddress; }
    public void setProcessorAddress(String processorAddress) { this.processorAddress = processorAddress; }

    public String getPurposeOfProcessing() { return purposeOfProcessing; }
    public void setPurposeOfProcessing(String purposeOfProcessing) { this.purposeOfProcessing = purposeOfProcessing; }

    public List<String> getDataCategories() { return dataCategories; }
    public void setDataCategories(List<String> dataCategories) { this.dataCategories = dataCategories; }

    public List<String> getDataSubjects() { return dataSubjects; }
    public void setDataSubjects(List<String> dataSubjects) { this.dataSubjects = dataSubjects; }

    public DpaStatus getStatus() { return status; }
    public void setStatus(DpaStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }

    public LocalDateTime getSignedAt() { return signedAt; }
    public void setSignedAt(LocalDateTime signedAt) { this.signedAt = signedAt; }

    public LocalDateTime getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(LocalDateTime effectiveFrom) { this.effectiveFrom = effectiveFrom; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public String getSignedBy() { return signedBy; }
    public void setSignedBy(String signedBy) { this.signedBy = signedBy; }

    public String getDocumentUrl() { return documentUrl; }
    public void setDocumentUrl(String documentUrl) { this.documentUrl = documentUrl; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public List<String> getSecurityMeasures() { return securityMeasures; }
    public void setSecurityMeasures(List<String> securityMeasures) { this.securityMeasures = securityMeasures; }

    public List<String> getSubProcessors() { return subProcessors; }
    public void setSubProcessors(List<String> subProcessors) { this.subProcessors = subProcessors; }

    public String getDataRetentionPeriod() { return dataRetentionPeriod; }
    public void setDataRetentionPeriod(String dataRetentionPeriod) { this.dataRetentionPeriod = dataRetentionPeriod; }

    public String getDataTransferMechanism() { return dataTransferMechanism; }
    public void setDataTransferMechanism(String dataTransferMechanism) { this.dataTransferMechanism = dataTransferMechanism; }

    public boolean isAuditRights() { return auditRights; }
    public void setAuditRights(boolean auditRights) { this.auditRights = auditRights; }

    public LocalDateTime getLastAuditedAt() { return lastAuditedAt; }
    public void setLastAuditedAt(LocalDateTime lastAuditedAt) { this.lastAuditedAt = lastAuditedAt; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Helper methods
    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }

    public boolean isEffective() {
        LocalDateTime now = LocalDateTime.now();
        return status == DpaStatus.SIGNED &&
               effectiveFrom != null &&
               effectiveFrom.isBefore(now) &&
               (expiresAt == null || expiresAt.isAfter(now));
    }
}
