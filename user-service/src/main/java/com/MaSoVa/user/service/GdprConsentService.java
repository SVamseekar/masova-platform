package com.MaSoVa.user.service;

import com.MaSoVa.shared.entity.GdprConsent;
import com.MaSoVa.shared.entity.GdprAuditLog;
import com.MaSoVa.shared.enums.ConsentType;
import com.MaSoVa.shared.enums.ConsentStatus;
import com.MaSoVa.shared.enums.GdprActionType;
import com.MaSoVa.user.repository.GdprConsentRepository;
import com.MaSoVa.user.repository.GdprAuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class GdprConsentService {

    private static final Logger logger = LoggerFactory.getLogger(GdprConsentService.class);

    @Autowired
    private GdprConsentRepository consentRepository;

    @Autowired
    private GdprAuditLogRepository auditLogRepository;

    public GdprConsent grantConsent(String userId, ConsentType consentType, String version,
                                     String ipAddress, String userAgent, String consentText) {
        logger.info("Granting consent for user: {}, type: {}", userId, consentType);

        Optional<GdprConsent> existing = consentRepository.findByUserIdAndConsentTypeAndStatus(
            userId, consentType, ConsentStatus.GRANTED
        );

        if (existing.isPresent()) {
            logger.info("Consent already exists for user: {}, type: {}", userId, consentType);
            return existing.get();
        }

        GdprConsent consent = new GdprConsent(userId, consentType, ConsentStatus.GRANTED);
        consent.setVersion(version);
        consent.setIpAddress(ipAddress);
        consent.setUserAgent(userAgent);
        consent.setConsentText(consentText);
        consent.setGrantedAt(LocalDateTime.now());

        if (consentType == ConsentType.MARKETING_COMMUNICATIONS ||
            consentType == ConsentType.ANALYTICS_TRACKING) {
            consent.setExpiresAt(LocalDateTime.now().plusYears(2));
        }

        GdprConsent saved = consentRepository.save(consent);

        createAuditLog(userId, GdprActionType.CONSENT_GRANTED, userId,
            "Consent granted for: " + consentType, ipAddress, userAgent);

        logger.info("Consent granted successfully for user: {}, type: {}", userId, consentType);
        return saved;
    }

    public GdprConsent revokeConsent(String userId, ConsentType consentType,
                                      String ipAddress, String userAgent) {
        logger.info("Revoking consent for user: {}, type: {}", userId, consentType);

        Optional<GdprConsent> existing = consentRepository.findByUserIdAndConsentTypeAndStatus(
            userId, consentType, ConsentStatus.GRANTED
        );

        if (existing.isEmpty()) {
            throw new IllegalStateException("No active consent found to revoke");
        }

        GdprConsent consent = existing.get();
        consent.setStatus(ConsentStatus.REVOKED);
        consent.setRevokedAt(LocalDateTime.now());
        consent.setUpdatedAt(LocalDateTime.now());

        GdprConsent saved = consentRepository.save(consent);

        createAuditLog(userId, GdprActionType.CONSENT_REVOKED, userId,
            "Consent revoked for: " + consentType, ipAddress, userAgent);

        logger.info("Consent revoked successfully for user: {}, type: {}", userId, consentType);
        return saved;
    }

    public List<GdprConsent> getUserConsents(String userId) {
        logger.info("Fetching consents for user: {}", userId);
        return consentRepository.findByUserId(userId);
    }

    public boolean hasActiveConsent(String userId, ConsentType consentType) {
        Optional<GdprConsent> consent = consentRepository.findByUserIdAndConsentTypeAndStatus(
            userId, consentType, ConsentStatus.GRANTED
        );

        if (consent.isEmpty()) {
            return false;
        }

        return consent.get().isActive();
    }

    public void expireOldConsents() {
        logger.info("Running consent expiration job");
        List<GdprConsent> expiredConsents = consentRepository.findByExpiresAtBefore(LocalDateTime.now());

        for (GdprConsent consent : expiredConsents) {
            if (consent.getStatus() == ConsentStatus.GRANTED) {
                consent.setStatus(ConsentStatus.EXPIRED);
                consent.setUpdatedAt(LocalDateTime.now());
                consentRepository.save(consent);

                createAuditLog(consent.getUserId(), GdprActionType.CONSENT_UPDATED, "SYSTEM",
                    "Consent expired for: " + consent.getConsentType(), null, null);
            }
        }

        logger.info("Expired {} consents", expiredConsents.size());
    }

    private void createAuditLog(String userId, GdprActionType actionType, String performedBy,
                                 String description, String ipAddress, String userAgent) {
        GdprAuditLog auditLog = new GdprAuditLog(userId, actionType, performedBy);
        auditLog.setDescription(description);
        auditLog.setIpAddress(ipAddress);
        auditLog.setUserAgent(userAgent);
        auditLog.setPerformedByType("USER");
        auditLogRepository.save(auditLog);
    }
}
