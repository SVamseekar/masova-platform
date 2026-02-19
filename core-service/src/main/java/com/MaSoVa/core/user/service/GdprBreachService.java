package com.MaSoVa.core.user.service;

import com.MaSoVa.shared.entity.GdprDataBreach;
import com.MaSoVa.shared.entity.GdprAuditLog;
import com.MaSoVa.shared.enums.BreachSeverity;
import com.MaSoVa.shared.enums.BreachStatus;
import com.MaSoVa.shared.enums.GdprActionType;
import com.MaSoVa.core.user.repository.GdprDataBreachRepository;
import com.MaSoVa.core.user.repository.GdprAuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class GdprBreachService {

    private static final Logger logger = LoggerFactory.getLogger(GdprBreachService.class);

    @Autowired
    private GdprDataBreachRepository breachRepository;

    @Autowired
    private GdprAuditLogRepository auditLogRepository;

    public GdprDataBreach reportBreach(String title, String description, BreachSeverity severity,
                                        String detectedBy, List<String> affectedUserIds,
                                        List<String> affectedDataTypes) {
        logger.warn("GDPR data breach reported: {}", title);

        GdprDataBreach breach = new GdprDataBreach(title, description, severity);
        breach.setDetectedBy(detectedBy);
        breach.setDetectedAt(LocalDateTime.now());
        breach.setAffectedUserIds(affectedUserIds);
        breach.setAffectedDataTypes(affectedDataTypes);
        breach.setEstimatedAffectedUsers(affectedUserIds != null ? affectedUserIds.size() : 0);

        GdprDataBreach saved = breachRepository.save(breach);

        if (affectedUserIds != null) {
            for (String userId : affectedUserIds) {
                createAuditLog(userId, GdprActionType.BREACH_DETECTED, "SYSTEM",
                    "Data breach detected: " + title);
            }
        }

        if (saved.requiresAuthorityNotification()) {
            logger.error("HIGH/CRITICAL breach detected - Authority notification required within 72 hours");
        }

        if (saved.requiresUserNotification()) {
            logger.error("User notification required for this breach");
        }

        return saved;
    }

    public GdprDataBreach updateBreachStatus(String breachId, BreachStatus status, String notes) {
        logger.info("Updating breach status: {} to {}", breachId, status);

        GdprDataBreach breach = breachRepository.findById(breachId)
            .orElseThrow(() -> new IllegalArgumentException("Breach not found"));

        breach.setStatus(status);

        if (status == BreachStatus.CONTAINED) {
            breach.setContainedAt(LocalDateTime.now());
        } else if (status == BreachStatus.RESOLVED) {
            breach.setResolvedAt(LocalDateTime.now());
        }

        if (notes != null && !notes.isEmpty()) {
            breach.setProcessingNotes(breach.getProcessingNotes() != null ?
                breach.getProcessingNotes() + "\n" + notes : notes);
        }

        return breachRepository.save(breach);
    }

    public GdprDataBreach notifyAuthority(String breachId, String authorityReference) {
        logger.info("Recording authority notification for breach: {}", breachId);

        GdprDataBreach breach = breachRepository.findById(breachId)
            .orElseThrow(() -> new IllegalArgumentException("Breach not found"));

        breach.setNotifiedAuthorityAt(LocalDateTime.now());
        breach.setAuthorityReference(authorityReference);
        breach.setStatus(BreachStatus.AUTHORITY_NOTIFIED);

        GdprDataBreach saved = breachRepository.save(breach);

        for (String userId : breach.getAffectedUserIds()) {
            createAuditLog(userId, GdprActionType.BREACH_NOTIFIED, "SYSTEM",
                "Data protection authority notified of breach");
        }

        return saved;
    }

    public GdprDataBreach notifyUsers(String breachId) {
        logger.info("Recording user notification for breach: {}", breachId);

        GdprDataBreach breach = breachRepository.findById(breachId)
            .orElseThrow(() -> new IllegalArgumentException("Breach not found"));

        breach.setNotifiedUsersAt(LocalDateTime.now());
        if (breach.getStatus() == BreachStatus.AUTHORITY_NOTIFIED) {
            breach.setStatus(BreachStatus.USERS_NOTIFIED);
        }

        GdprDataBreach saved = breachRepository.save(breach);

        for (String userId : breach.getAffectedUserIds()) {
            createAuditLog(userId, GdprActionType.BREACH_NOTIFIED, "SYSTEM",
                "User notified of data breach");
        }

        return saved;
    }

    @Scheduled(cron = "0 0 * * * *")
    public void checkOverdueNotifications() {
        logger.info("Checking for overdue breach notifications");

        // Use dedicated query instead of findAll() + filter
        LocalDateTime overdueThreshold = java.time.LocalDateTime.now().minusHours(72);
        List<GdprDataBreach> overdueBreaches = breachRepository.findOverdueAuthorityNotifications(overdueThreshold);

        if (!overdueBreaches.isEmpty()) {
            logger.error("CRITICAL: {} breaches have overdue authority notifications (>72 hours)",
                overdueBreaches.size());

            for (GdprDataBreach breach : overdueBreaches) {
                logger.error("Overdue breach: {} - Detected at: {}", breach.getId(), breach.getDetectedAt());
            }
        }
    }

    public List<GdprDataBreach> getBreachesByStatus(BreachStatus status) {
        return breachRepository.findByStatus(status);
    }

    public List<GdprDataBreach> getBreachesForUser(String userId) {
        return breachRepository.findByAffectedUserIdsContaining(userId);
    }

    private void createAuditLog(String userId, GdprActionType actionType, String performedBy,
                                 String description) {
        GdprAuditLog auditLog = new GdprAuditLog(userId, actionType, performedBy);
        auditLog.setDescription(description);
        auditLog.setPerformedByType("SYSTEM");
        auditLogRepository.save(auditLog);
    }
}
