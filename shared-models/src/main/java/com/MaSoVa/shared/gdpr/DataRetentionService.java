package com.MaSoVa.shared.gdpr;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Data Retention Service
 *
 * Scheduled service that enforces GDPR data retention policies.
 * Runs automated purge jobs to remove/anonymize data that has exceeded
 * its retention period.
 *
 * GDPR Article 5(1)(e) - Storage Limitation:
 * "Personal data shall be kept in a form which permits identification of
 * data subjects for no longer than is necessary for the purposes for which
 * the personal data are processed."
 *
 * This is an abstract base class. Each microservice should extend this
 * and implement the actual purge logic for their specific data.
 */
@Service
public abstract class DataRetentionService {

    private static final Logger log = LoggerFactory.getLogger(DataRetentionService.class);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Daily retention job - runs at 2:00 AM every day.
     * This is the main scheduled task that triggers all retention checks.
     */
    @Scheduled(cron = "${retention.schedule.daily:0 0 2 * * ?}")
    public void runDailyRetentionJob() {
        log.info("=== Starting Daily Data Retention Job at {} ===", LocalDateTime.now().format(DATE_FORMAT));

        DataRetentionReport report = new DataRetentionReport();
        report.setStartTime(LocalDateTime.now());

        try {
            // Run all purge operations
            report.setSoftDeletedRecordsPurged(purgeSoftDeletedRecords());
            report.setExpiredSessionsPurged(purgeExpiredSessions());
            report.setExpiredAuditLogsPurged(purgeExpiredAuditLogs());

            report.setSuccess(true);
            log.info("Daily retention job completed successfully");

        } catch (Exception e) {
            report.setSuccess(false);
            report.setErrorMessage(e.getMessage());
            log.error("Daily retention job failed", e);
        }

        report.setEndTime(LocalDateTime.now());
        logRetentionReport(report);
    }

    /**
     * Weekly retention job - runs at 3:00 AM every Sunday.
     * Handles less frequent cleanup operations.
     */
    @Scheduled(cron = "${retention.schedule.weekly:0 0 3 * * SUN}")
    public void runWeeklyRetentionJob() {
        log.info("=== Starting Weekly Data Retention Job at {} ===", LocalDateTime.now().format(DATE_FORMAT));

        try {
            int anonymizedCustomers = anonymizeInactiveCustomers();
            int expiredLoyaltyPoints = expireLoyaltyPoints();
            int archivedOrders = archiveOldOrders();

            log.info("Weekly retention job completed: {} customers anonymized, {} loyalty points expired, {} orders archived",
                    anonymizedCustomers, expiredLoyaltyPoints, archivedOrders);

        } catch (Exception e) {
            log.error("Weekly retention job failed", e);
        }
    }

    /**
     * Monthly retention job - runs at 4:00 AM on the first day of each month.
     * Handles archival and deep cleanup operations.
     */
    @Scheduled(cron = "${retention.schedule.monthly:0 0 4 1 * ?}")
    public void runMonthlyRetentionJob() {
        log.info("=== Starting Monthly Data Retention Job at {} ===", LocalDateTime.now().format(DATE_FORMAT));

        try {
            int reviewsPurged = purgeExpiredReviews();
            int trackingDataPurged = purgeDeliveryTrackingData();
            int marketingDataPurged = purgeExpiredMarketingData();

            log.info("Monthly retention job completed: {} reviews, {} tracking records, {} marketing records purged",
                    reviewsPurged, trackingDataPurged, marketingDataPurged);

            // Generate monthly retention compliance report
            generateComplianceReport();

        } catch (Exception e) {
            log.error("Monthly retention job failed", e);
        }
    }

    // ==========================================
    // ABSTRACT METHODS - Implement in each service
    // ==========================================

    /**
     * Purge soft-deleted records that have passed the retention period.
     * @return Number of records hard-deleted
     */
    protected abstract int purgeSoftDeletedRecords();

    /**
     * Purge expired session data.
     * @return Number of sessions purged
     */
    protected abstract int purgeExpiredSessions();

    /**
     * Purge expired audit logs.
     * @return Number of audit log entries purged
     */
    protected abstract int purgeExpiredAuditLogs();

    /**
     * Anonymize customer records that have been inactive past retention period.
     * @return Number of customers anonymized
     */
    protected abstract int anonymizeInactiveCustomers();

    /**
     * Expire loyalty points for inactive accounts.
     * @return Number of accounts with expired points
     */
    protected abstract int expireLoyaltyPoints();

    /**
     * Archive old orders (move to archive collection/table).
     * @return Number of orders archived
     */
    protected abstract int archiveOldOrders();

    /**
     * Purge expired review data.
     * @return Number of reviews purged
     */
    protected abstract int purgeExpiredReviews();

    /**
     * Purge old delivery tracking data (GPS coordinates, routes).
     * @return Number of tracking records purged
     */
    protected abstract int purgeDeliveryTrackingData();

    /**
     * Purge expired marketing campaign data.
     * @return Number of marketing records purged
     */
    protected abstract int purgeExpiredMarketingData();

    /**
     * Generate a compliance report for auditing purposes.
     */
    protected abstract void generateComplianceReport();

    // ==========================================
    // HELPER METHODS
    // ==========================================

    /**
     * Log retention report for auditing
     */
    protected void logRetentionReport(DataRetentionReport report) {
        log.info("=== Data Retention Report ===");
        log.info("Start Time: {}", report.getStartTime().format(DATE_FORMAT));
        log.info("End Time: {}", report.getEndTime().format(DATE_FORMAT));
        log.info("Duration: {} ms", java.time.Duration.between(report.getStartTime(), report.getEndTime()).toMillis());
        log.info("Success: {}", report.isSuccess());
        log.info("Soft-deleted records purged: {}", report.getSoftDeletedRecordsPurged());
        log.info("Expired sessions purged: {}", report.getExpiredSessionsPurged());
        log.info("Expired audit logs purged: {}", report.getExpiredAuditLogsPurged());
        if (!report.isSuccess()) {
            log.error("Error: {}", report.getErrorMessage());
        }
        log.info("=== End Report ===");
    }

    /**
     * Data Retention Report DTO
     */
    public static class DataRetentionReport {
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private boolean success;
        private String errorMessage;
        private int softDeletedRecordsPurged;
        private int expiredSessionsPurged;
        private int expiredAuditLogsPurged;

        // Getters and Setters
        public LocalDateTime getStartTime() { return startTime; }
        public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

        public LocalDateTime getEndTime() { return endTime; }
        public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }

        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

        public int getSoftDeletedRecordsPurged() { return softDeletedRecordsPurged; }
        public void setSoftDeletedRecordsPurged(int count) { this.softDeletedRecordsPurged = count; }

        public int getExpiredSessionsPurged() { return expiredSessionsPurged; }
        public void setExpiredSessionsPurged(int count) { this.expiredSessionsPurged = count; }

        public int getExpiredAuditLogsPurged() { return expiredAuditLogsPurged; }
        public void setExpiredAuditLogsPurged(int count) { this.expiredAuditLogsPurged = count; }
    }
}
