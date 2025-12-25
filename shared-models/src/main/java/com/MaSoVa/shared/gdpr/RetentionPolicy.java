package com.MaSoVa.shared.gdpr;

import java.time.LocalDateTime;
import java.time.Period;

/**
 * GDPR Data Retention Policy Configuration
 *
 * Defines retention periods for different data categories as per GDPR Article 5(1)(e)
 * "Storage Limitation" - personal data should be kept only as long as necessary.
 *
 * These values should be reviewed annually with legal/compliance team.
 *
 * Reference periods:
 * - Tax records: 7 years (Indian Income Tax Act requirement)
 * - Customer data: 3 years after last activity
 * - Audit logs: 1 year (can be extended for investigations)
 */
public final class RetentionPolicy {

    private RetentionPolicy() {
        // Utility class - prevent instantiation
    }

    // ==========================================
    // RETENTION PERIODS (in years unless noted)
    // ==========================================

    /**
     * Customer profile data retention after last activity.
     * Includes: name, email, phone, addresses, preferences.
     * After this period, data should be anonymized or deleted.
     */
    public static final int CUSTOMER_DATA_YEARS = 3;

    /**
     * Payment transaction retention for tax/audit compliance.
     * Indian Income Tax Act requires 7 years retention.
     * Includes: transaction records, receipts, payment method details.
     */
    public static final int PAYMENT_TRANSACTIONS_YEARS = 7;

    /**
     * Loyalty points expiration after account inactivity.
     * Points expire if no qualifying activity in this period.
     */
    public static final int LOYALTY_POINTS_YEARS = 2;

    /**
     * Order history retention period.
     * Includes: order details, items, delivery info.
     * After this period, orders should be anonymized.
     */
    public static final int ORDER_HISTORY_YEARS = 3;

    /**
     * Customer review data retention.
     * Reviews can be kept longer if anonymized.
     */
    public static final int REVIEW_DATA_YEARS = 2;

    /**
     * System audit logs retention.
     * Includes: access logs, security events, admin actions.
     */
    public static final int AUDIT_LOGS_YEARS = 1;

    /**
     * Soft-deleted customer records retention before hard delete.
     * GDPR allows keeping anonymized data, but original PII must be purged.
     */
    public static final int SOFT_DELETE_RETENTION_DAYS = 30;

    /**
     * Session data retention.
     * Working sessions, login history.
     */
    public static final int SESSION_DATA_MONTHS = 6;

    /**
     * Marketing campaign data retention.
     * Campaign performance, customer targeting data.
     */
    public static final int MARKETING_DATA_YEARS = 2;

    /**
     * Driver/delivery tracking data retention.
     * GPS coordinates, delivery routes.
     */
    public static final int DELIVERY_TRACKING_MONTHS = 6;

    /**
     * Analytics aggregated data retention.
     * Anonymized/aggregated data can be kept indefinitely.
     */
    public static final int ANALYTICS_AGGREGATED_YEARS = 10;

    // ==========================================
    // HELPER METHODS
    // ==========================================

    /**
     * Get cutoff date for customer data purge.
     * Data older than this date should be anonymized/deleted.
     */
    public static LocalDateTime getCustomerDataCutoff() {
        return LocalDateTime.now().minus(Period.ofYears(CUSTOMER_DATA_YEARS));
    }

    /**
     * Get cutoff date for payment transaction purge.
     */
    public static LocalDateTime getPaymentTransactionCutoff() {
        return LocalDateTime.now().minus(Period.ofYears(PAYMENT_TRANSACTIONS_YEARS));
    }

    /**
     * Get cutoff date for order history purge.
     */
    public static LocalDateTime getOrderHistoryCutoff() {
        return LocalDateTime.now().minus(Period.ofYears(ORDER_HISTORY_YEARS));
    }

    /**
     * Get cutoff date for loyalty points expiration.
     */
    public static LocalDateTime getLoyaltyPointsCutoff() {
        return LocalDateTime.now().minus(Period.ofYears(LOYALTY_POINTS_YEARS));
    }

    /**
     * Get cutoff date for review data purge.
     */
    public static LocalDateTime getReviewDataCutoff() {
        return LocalDateTime.now().minus(Period.ofYears(REVIEW_DATA_YEARS));
    }

    /**
     * Get cutoff date for audit logs purge.
     */
    public static LocalDateTime getAuditLogsCutoff() {
        return LocalDateTime.now().minus(Period.ofYears(AUDIT_LOGS_YEARS));
    }

    /**
     * Get cutoff date for soft-deleted records hard deletion.
     */
    public static LocalDateTime getSoftDeleteCutoff() {
        return LocalDateTime.now().minusDays(SOFT_DELETE_RETENTION_DAYS);
    }

    /**
     * Get cutoff date for session data purge.
     */
    public static LocalDateTime getSessionDataCutoff() {
        return LocalDateTime.now().minusMonths(SESSION_DATA_MONTHS);
    }

    /**
     * Get cutoff date for delivery tracking data purge.
     */
    public static LocalDateTime getDeliveryTrackingCutoff() {
        return LocalDateTime.now().minusMonths(DELIVERY_TRACKING_MONTHS);
    }

    /**
     * Check if a date is past the customer data retention period.
     */
    public static boolean isCustomerDataExpired(LocalDateTime lastActivityDate) {
        return lastActivityDate != null && lastActivityDate.isBefore(getCustomerDataCutoff());
    }

    /**
     * Check if a date is past the order history retention period.
     */
    public static boolean isOrderHistoryExpired(LocalDateTime orderDate) {
        return orderDate != null && orderDate.isBefore(getOrderHistoryCutoff());
    }

    /**
     * Check if loyalty points have expired due to inactivity.
     */
    public static boolean areLoyaltyPointsExpired(LocalDateTime lastActivityDate) {
        return lastActivityDate != null && lastActivityDate.isBefore(getLoyaltyPointsCutoff());
    }

    /**
     * Check if soft-deleted record should be hard deleted.
     */
    public static boolean shouldHardDelete(LocalDateTime deletedAt) {
        return deletedAt != null && deletedAt.isBefore(getSoftDeleteCutoff());
    }
}
