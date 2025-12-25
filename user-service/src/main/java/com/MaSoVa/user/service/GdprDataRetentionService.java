package com.MaSoVa.user.service;

import com.MaSoVa.shared.entity.GdprDataRetention;
import com.MaSoVa.shared.entity.GdprAuditLog;
import com.MaSoVa.shared.enums.GdprActionType;
import com.MaSoVa.user.repository.GdprDataRetentionRepository;
import com.MaSoVa.user.repository.GdprAuditLogRepository;
import com.MaSoVa.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class GdprDataRetentionService {

    private static final Logger logger = LoggerFactory.getLogger(GdprDataRetentionService.class);

    @Autowired
    private GdprDataRetentionRepository retentionRepository;

    @Autowired
    private GdprAuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    public GdprDataRetention createRetentionPolicy(String dataType, Integer retentionPeriodDays,
                                                     String legalBasis, String description) {
        logger.info("Creating retention policy for data type: {}", dataType);

        Optional<GdprDataRetention> existing = retentionRepository.findByDataType(dataType);
        if (existing.isPresent()) {
            throw new IllegalStateException("Retention policy already exists for this data type");
        }

        GdprDataRetention retention = new GdprDataRetention(dataType, retentionPeriodDays, legalBasis);
        retention.setDescription(description);
        retention.setAutoDeleteEnabled(true);
        retention.setLastReviewedAt(LocalDateTime.now());

        return retentionRepository.save(retention);
    }

    public GdprDataRetention updateRetentionPolicy(String id, Integer retentionPeriodDays,
                                                     String legalBasis, String reviewedBy) {
        logger.info("Updating retention policy: {}", id);

        GdprDataRetention retention = retentionRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Retention policy not found"));

        retention.setRetentionPeriodDays(retentionPeriodDays);
        retention.setLegalBasis(legalBasis);
        retention.setLastReviewedAt(LocalDateTime.now());
        retention.setReviewedBy(reviewedBy);
        retention.setUpdatedAt(LocalDateTime.now());

        return retentionRepository.save(retention);
    }

    public Optional<GdprDataRetention> getRetentionPolicy(String dataType) {
        return retentionRepository.findByDataType(dataType);
    }

    public List<GdprDataRetention> getAllActiveRetentionPolicies() {
        return retentionRepository.findByIsActive(true);
    }

    @Scheduled(cron = "0 0 2 * * *")
    public void applyRetentionPolicies() {
        logger.info("Running automated data retention cleanup");

        List<GdprDataRetention> policies = retentionRepository.findByAutoDeleteEnabled(true);

        for (GdprDataRetention policy : policies) {
            if (!policy.isActive()) {
                continue;
            }

            switch (policy.getDataType()) {
                case "INACTIVE_USER_ACCOUNTS":
                    deleteInactiveUsers(policy.getRetentionPeriodDays());
                    break;
                case "AUDIT_LOGS":
                    deleteOldAuditLogs(policy.getRetentionPeriodDays());
                    break;
                case "SESSION_DATA":
                    deleteOldSessions(policy.getRetentionPeriodDays());
                    break;
                default:
                    logger.warn("Unknown data type for retention: {}", policy.getDataType());
            }
        }

        logger.info("Automated data retention cleanup completed");
    }

    private void deleteInactiveUsers(int retentionDays) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(retentionDays);
        logger.info("Deleting inactive users with last login before: {}", cutoffDate);

        // Use dedicated query instead of findAll() to avoid loading all users
        var inactiveUsers = userRepository.findByActiveAndLastLoginBefore(false, cutoffDate);

        for (var user : inactiveUsers) {
            createAuditLog(user.getId(), GdprActionType.RETENTION_POLICY_APPLIED, "SYSTEM",
                "Inactive user deleted per retention policy");
            userRepository.delete(user);
        }

        logger.info("Deleted {} inactive users", inactiveUsers.size());
    }

    private void deleteOldAuditLogs(int retentionDays) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(retentionDays);
        logger.info("Deleting audit logs older than: {}", cutoffDate);

        var oldLogs = auditLogRepository.findByTimestampBetween(
            LocalDateTime.MIN, cutoffDate
        );

        auditLogRepository.deleteAll(oldLogs);
        logger.info("Deleted {} old audit logs", oldLogs.size());
    }

    private void deleteOldSessions(int retentionDays) {
        logger.info("Deleting sessions older than {} days", retentionDays);
    }

    private void createAuditLog(String userId, GdprActionType actionType, String performedBy,
                                 String description) {
        GdprAuditLog auditLog = new GdprAuditLog(userId, actionType, performedBy);
        auditLog.setDescription(description);
        auditLog.setPerformedByType("SYSTEM");
        auditLogRepository.save(auditLog);
    }
}
