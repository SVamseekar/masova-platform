package com.MaSoVa.shared.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.Indexed;
import com.MaSoVa.shared.enums.ConsentType;
import com.MaSoVa.shared.enums.ConsentStatus;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "gdpr_consents")
public class GdprConsent {

    @Id
    private String id;

    @NotNull
    @Field("userId")
    @Indexed
    private String userId;

    @NotNull
    @Field("consentType")
    @Indexed
    private ConsentType consentType;

    @NotNull
    @Field("status")
    private ConsentStatus status;

    @Field("version")
    private String version;

    @Field("grantedAt")
    private LocalDateTime grantedAt;

    @Field("revokedAt")
    private LocalDateTime revokedAt;

    @Field("expiresAt")
    private LocalDateTime expiresAt;

    @Field("ipAddress")
    private String ipAddress;

    @Field("userAgent")
    private String userAgent;

    @Field("metadata")
    private Map<String, Object> metadata;

    @Field("consentText")
    private String consentText;

    @Field("createdAt")
    @Indexed
    private LocalDateTime createdAt = LocalDateTime.now();

    @Field("updatedAt")
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Constructors
    public GdprConsent() {}

    public GdprConsent(String userId, ConsentType consentType, ConsentStatus status) {
        this.userId = userId;
        this.consentType = consentType;
        this.status = status;
        if (status == ConsentStatus.GRANTED) {
            this.grantedAt = LocalDateTime.now();
        }
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public ConsentType getConsentType() { return consentType; }
    public void setConsentType(ConsentType consentType) { this.consentType = consentType; }

    public ConsentStatus getStatus() { return status; }
    public void setStatus(ConsentStatus status) {
        this.status = status;
        if (status == ConsentStatus.GRANTED) {
            this.grantedAt = LocalDateTime.now();
        } else if (status == ConsentStatus.REVOKED || status == ConsentStatus.WITHDRAWN) {
            this.revokedAt = LocalDateTime.now();
        }
    }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public LocalDateTime getGrantedAt() { return grantedAt; }
    public void setGrantedAt(LocalDateTime grantedAt) { this.grantedAt = grantedAt; }

    public LocalDateTime getRevokedAt() { return revokedAt; }
    public void setRevokedAt(LocalDateTime revokedAt) { this.revokedAt = revokedAt; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

    public String getConsentText() { return consentText; }
    public void setConsentText(String consentText) { this.consentText = consentText; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Helper methods
    public boolean isActive() {
        if (status != ConsentStatus.GRANTED) {
            return false;
        }
        if (expiresAt != null && expiresAt.isBefore(LocalDateTime.now())) {
            return false;
        }
        return true;
    }

    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }
}
