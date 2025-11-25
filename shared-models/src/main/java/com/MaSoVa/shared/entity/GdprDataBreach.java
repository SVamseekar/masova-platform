package com.MaSoVa.shared.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.Indexed;
import com.MaSoVa.shared.enums.BreachSeverity;
import com.MaSoVa.shared.enums.BreachStatus;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Document(collection = "gdpr_data_breaches")
public class GdprDataBreach {

    @Id
    private String id;

    @NotNull
    @Field("title")
    private String title;

    @NotNull
    @Field("description")
    private String description;

    @NotNull
    @Field("severity")
    @Indexed
    private BreachSeverity severity;

    @NotNull
    @Field("status")
    @Indexed
    private BreachStatus status;

    @Field("detectedAt")
    @Indexed
    private LocalDateTime detectedAt = LocalDateTime.now();

    @Field("occurredAt")
    private LocalDateTime occurredAt;

    @Field("detectedBy")
    private String detectedBy;

    @Field("affectedUserIds")
    private List<String> affectedUserIds;

    @Field("affectedDataTypes")
    private List<String> affectedDataTypes;

    @Field("estimatedAffectedUsers")
    private Integer estimatedAffectedUsers;

    @Field("containedAt")
    private LocalDateTime containedAt;

    @Field("resolvedAt")
    private LocalDateTime resolvedAt;

    @Field("notifiedAuthorityAt")
    private LocalDateTime notifiedAuthorityAt;

    @Field("notifiedUsersAt")
    private LocalDateTime notifiedUsersAt;

    @Field("authorityReference")
    private String authorityReference;

    @Field("rootCause")
    private String rootCause;

    @Field("impact")
    private String impact;

    @Field("mitigationSteps")
    private List<String> mitigationSteps;

    @Field("preventionMeasures")
    private List<String> preventionMeasures;

    @Field("responsibleParty")
    private String responsibleParty;

    @Field("processingNotes")
    private String processingNotes;

    @Field("metadata")
    private Map<String, Object> metadata;

    @Field("reportGenerated")
    private boolean reportGenerated = false;

    @Field("reportUrl")
    private String reportUrl;

    @Field("createdAt")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Field("updatedAt")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Constructors
    public GdprDataBreach() {}

    public GdprDataBreach(String title, String description, BreachSeverity severity) {
        this.title = title;
        this.description = description;
        this.severity = severity;
        this.status = BreachStatus.DETECTED;
        this.detectedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BreachSeverity getSeverity() { return severity; }
    public void setSeverity(BreachSeverity severity) { this.severity = severity; }

    public BreachStatus getStatus() { return status; }
    public void setStatus(BreachStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }

    public LocalDateTime getDetectedAt() { return detectedAt; }
    public void setDetectedAt(LocalDateTime detectedAt) { this.detectedAt = detectedAt; }

    public LocalDateTime getOccurredAt() { return occurredAt; }
    public void setOccurredAt(LocalDateTime occurredAt) { this.occurredAt = occurredAt; }

    public String getDetectedBy() { return detectedBy; }
    public void setDetectedBy(String detectedBy) { this.detectedBy = detectedBy; }

    public List<String> getAffectedUserIds() { return affectedUserIds; }
    public void setAffectedUserIds(List<String> affectedUserIds) { this.affectedUserIds = affectedUserIds; }

    public List<String> getAffectedDataTypes() { return affectedDataTypes; }
    public void setAffectedDataTypes(List<String> affectedDataTypes) { this.affectedDataTypes = affectedDataTypes; }

    public Integer getEstimatedAffectedUsers() { return estimatedAffectedUsers; }
    public void setEstimatedAffectedUsers(Integer estimatedAffectedUsers) { this.estimatedAffectedUsers = estimatedAffectedUsers; }

    public LocalDateTime getContainedAt() { return containedAt; }
    public void setContainedAt(LocalDateTime containedAt) { this.containedAt = containedAt; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }

    public LocalDateTime getNotifiedAuthorityAt() { return notifiedAuthorityAt; }
    public void setNotifiedAuthorityAt(LocalDateTime notifiedAuthorityAt) { this.notifiedAuthorityAt = notifiedAuthorityAt; }

    public LocalDateTime getNotifiedUsersAt() { return notifiedUsersAt; }
    public void setNotifiedUsersAt(LocalDateTime notifiedUsersAt) { this.notifiedUsersAt = notifiedUsersAt; }

    public String getAuthorityReference() { return authorityReference; }
    public void setAuthorityReference(String authorityReference) { this.authorityReference = authorityReference; }

    public String getRootCause() { return rootCause; }
    public void setRootCause(String rootCause) { this.rootCause = rootCause; }

    public String getImpact() { return impact; }
    public void setImpact(String impact) { this.impact = impact; }

    public List<String> getMitigationSteps() { return mitigationSteps; }
    public void setMitigationSteps(List<String> mitigationSteps) { this.mitigationSteps = mitigationSteps; }

    public List<String> getPreventionMeasures() { return preventionMeasures; }
    public void setPreventionMeasures(List<String> preventionMeasures) { this.preventionMeasures = preventionMeasures; }

    public String getResponsibleParty() { return responsibleParty; }
    public void setResponsibleParty(String responsibleParty) { this.responsibleParty = responsibleParty; }

    public String getProcessingNotes() { return processingNotes; }
    public void setProcessingNotes(String processingNotes) { this.processingNotes = processingNotes; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

    public boolean isReportGenerated() { return reportGenerated; }
    public void setReportGenerated(boolean reportGenerated) { this.reportGenerated = reportGenerated; }

    public String getReportUrl() { return reportUrl; }
    public void setReportUrl(String reportUrl) { this.reportUrl = reportUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Helper methods
    public boolean requiresAuthorityNotification() {
        // Under GDPR, must notify within 72 hours if high risk
        return severity == BreachSeverity.HIGH || severity == BreachSeverity.CRITICAL;
    }

    public boolean isAuthorityNotificationOverdue() {
        if (!requiresAuthorityNotification()) return false;
        if (notifiedAuthorityAt != null) return false;
        return detectedAt.plusHours(72).isBefore(LocalDateTime.now());
    }

    public boolean requiresUserNotification() {
        // Notify users if breach is likely to result in high risk to their rights
        return severity == BreachSeverity.CRITICAL ||
               (severity == BreachSeverity.HIGH && affectedUserIds != null && !affectedUserIds.isEmpty());
    }
}
