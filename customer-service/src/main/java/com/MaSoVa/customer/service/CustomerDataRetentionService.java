package com.MaSoVa.customer.service;

import com.MaSoVa.customer.entity.Customer;
import com.MaSoVa.customer.repository.CustomerRepository;
import com.MaSoVa.shared.gdpr.DataRetentionService;
import com.MaSoVa.shared.gdpr.RetentionPolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Customer Data Retention Service
 *
 * Implements GDPR-compliant data retention for customer-service.
 * Handles:
 * - Anonymization of inactive customers
 * - Hard deletion of soft-deleted records after retention period
 * - Expiration of loyalty points for inactive accounts
 *
 * GDPR Compliance: Article 5(1)(e) - Storage Limitation
 */
@Service
public class CustomerDataRetentionService extends DataRetentionService {

    private static final Logger log = LoggerFactory.getLogger(CustomerDataRetentionService.class);

    private final CustomerRepository customerRepository;
    private final CustomerService customerService;

    @Value("${retention.enabled:true}")
    private boolean retentionEnabled;

    @Value("${retention.dry-run:false}")
    private boolean dryRun;

    public CustomerDataRetentionService(CustomerRepository customerRepository,
                                         CustomerService customerService) {
        this.customerRepository = customerRepository;
        this.customerService = customerService;
    }

    @Override
    protected int purgeSoftDeletedRecords() {
        if (!retentionEnabled) {
            log.info("Retention disabled, skipping soft-delete purge");
            return 0;
        }

        LocalDateTime cutoff = RetentionPolicy.getSoftDeleteCutoff();
        log.info("Purging soft-deleted records older than {}", cutoff);

        // Find customers marked as deleted (active=false, deletedAt not null) past retention
        List<Customer> toDelete = customerRepository.findByActiveAndDeletedAtBefore(false, cutoff);

        if (toDelete.isEmpty()) {
            log.info("No soft-deleted records to purge");
            return 0;
        }

        log.info("Found {} soft-deleted customers to hard delete", toDelete.size());

        if (dryRun) {
            log.info("DRY RUN: Would delete {} records", toDelete.size());
            return toDelete.size();
        }

        int deleted = 0;
        for (Customer customer : toDelete) {
            try {
                customerService.hardDeleteCustomer(customer.getId());
                deleted++;
                log.debug("Hard deleted customer: {}", customer.getId());
            } catch (Exception e) {
                log.error("Failed to hard delete customer {}: {}", customer.getId(), e.getMessage());
            }
        }

        log.info("Hard deleted {} soft-deleted customer records", deleted);
        return deleted;
    }

    @Override
    protected int purgeExpiredSessions() {
        // Customer service doesn't manage sessions - handled by user-service
        return 0;
    }

    @Override
    protected int purgeExpiredAuditLogs() {
        // Audit logs handled separately - this is a placeholder
        // In production, implement audit log repository and purge logic
        return 0;
    }

    @Override
    protected int anonymizeInactiveCustomers() {
        if (!retentionEnabled) {
            log.info("Retention disabled, skipping inactive customer anonymization");
            return 0;
        }

        LocalDateTime cutoff = RetentionPolicy.getCustomerDataCutoff();
        log.info("Anonymizing customers inactive since {}", cutoff);

        // Find active customers with no activity in retention period
        List<Customer> inactiveCustomers = customerRepository.findByActiveAndLastOrderDateBefore(true, cutoff);

        // Also check customers with no orders at all but created long ago
        List<Customer> noOrderCustomers = customerRepository.findByActiveAndLastOrderDateIsNullAndCreatedAtBefore(true, cutoff);
        inactiveCustomers.addAll(noOrderCustomers);

        if (inactiveCustomers.isEmpty()) {
            log.info("No inactive customers to anonymize");
            return 0;
        }

        log.info("Found {} inactive customers to anonymize", inactiveCustomers.size());

        if (dryRun) {
            log.info("DRY RUN: Would anonymize {} customers", inactiveCustomers.size());
            return inactiveCustomers.size();
        }

        int anonymized = 0;
        for (Customer customer : inactiveCustomers) {
            try {
                customerService.anonymizeAndDeleteCustomer(customer.getId(), "RETENTION_POLICY_EXPIRY");
                anonymized++;
                log.debug("Anonymized inactive customer: {}", customer.getId());
            } catch (Exception e) {
                log.error("Failed to anonymize customer {}: {}", customer.getId(), e.getMessage());
            }
        }

        log.info("Anonymized {} inactive customers", anonymized);
        return anonymized;
    }

    @Override
    protected int expireLoyaltyPoints() {
        if (!retentionEnabled) {
            return 0;
        }

        LocalDateTime cutoff = RetentionPolicy.getLoyaltyPointsCutoff();
        log.info("Expiring loyalty points for accounts inactive since {}", cutoff);

        // Find customers with loyalty points and no activity in loyalty period
        List<Customer> customersWithExpiredPoints = customerRepository
                .findByLoyaltyInfoPointsGreaterThanAndLastOrderDateBefore(0, cutoff);

        if (customersWithExpiredPoints.isEmpty()) {
            log.info("No loyalty points to expire");
            return 0;
        }

        log.info("Found {} customers with expiring loyalty points", customersWithExpiredPoints.size());

        if (dryRun) {
            log.info("DRY RUN: Would expire points for {} customers", customersWithExpiredPoints.size());
            return customersWithExpiredPoints.size();
        }

        int expired = 0;
        for (Customer customer : customersWithExpiredPoints) {
            try {
                int pointsToExpire = customer.getLoyaltyInfo().getTotalPoints();

                // Log the expiration for audit
                log.info("Expiring {} loyalty points for customer {} due to inactivity",
                        pointsToExpire, customer.getId());

                // Reset points to zero
                customer.getLoyaltyInfo().setTotalPoints(0);
                // Keep pointsEarned as historical record
                // customer.getLoyaltyInfo().getPointsEarned() stays the same

                // Add note about expiration
                Customer.CustomerNote note = new Customer.CustomerNote(
                        String.format("Loyalty points expired (%d points) due to %d years of inactivity per retention policy",
                                pointsToExpire, RetentionPolicy.LOYALTY_POINTS_YEARS),
                        "SYSTEM",
                        "LOYALTY"
                );
                customer.getNotes().add(note);

                customerRepository.save(customer);
                expired++;

            } catch (Exception e) {
                log.error("Failed to expire loyalty points for customer {}: {}",
                        customer.getId(), e.getMessage());
            }
        }

        log.info("Expired loyalty points for {} customers", expired);
        return expired;
    }

    @Override
    protected int archiveOldOrders() {
        // Orders handled by order-service
        return 0;
    }

    @Override
    protected int purgeExpiredReviews() {
        // Reviews handled by review-service (if exists)
        return 0;
    }

    @Override
    protected int purgeDeliveryTrackingData() {
        // Delivery tracking handled by delivery-service
        return 0;
    }

    @Override
    protected int purgeExpiredMarketingData() {
        // Marketing data handled by notification-service
        return 0;
    }

    @Override
    protected void generateComplianceReport() {
        log.info("=== Customer Service Data Retention Compliance Report ===");

        long totalCustomers = customerRepository.count();
        long activeCustomers = customerRepository.countByActive(true);
        long anonymizedCustomers = customerRepository.countByActive(false);

        LocalDateTime cutoff = RetentionPolicy.getCustomerDataCutoff();
        long atRiskCustomers = customerRepository.countByActiveAndLastOrderDateBefore(true, cutoff);

        log.info("Total Customers: {}", totalCustomers);
        log.info("Active Customers: {}", activeCustomers);
        log.info("Anonymized/Deleted Customers: {}", anonymizedCustomers);
        log.info("Customers at risk of anonymization (inactive > {} years): {}",
                RetentionPolicy.CUSTOMER_DATA_YEARS, atRiskCustomers);
        log.info("Retention Policy Version: 1.0");
        log.info("Report Generated: {}", LocalDateTime.now());
        log.info("=== End Compliance Report ===");
    }

    /**
     * Manual trigger for retention job (for testing/admin purposes)
     */
    public void runManualRetention() {
        log.info("Manual retention job triggered");
        runDailyRetentionJob();
    }

    /**
     * Get retention statistics for admin dashboard
     */
    public RetentionStats getRetentionStats() {
        LocalDateTime softDeleteCutoff = RetentionPolicy.getSoftDeleteCutoff();
        LocalDateTime customerCutoff = RetentionPolicy.getCustomerDataCutoff();
        LocalDateTime loyaltyCutoff = RetentionPolicy.getLoyaltyPointsCutoff();

        RetentionStats stats = new RetentionStats();
        stats.setPendingHardDeletes(customerRepository.countByActiveAndDeletedAtBefore(false, softDeleteCutoff));
        stats.setPendingAnonymizations(customerRepository.countByActiveAndLastOrderDateBefore(true, customerCutoff));
        stats.setPendingLoyaltyExpirations(customerRepository.countByLoyaltyInfoPointsGreaterThanAndLastOrderDateBefore(0, loyaltyCutoff));
        stats.setRetentionEnabled(retentionEnabled);
        stats.setDryRunMode(dryRun);

        return stats;
    }

    /**
     * Retention statistics DTO
     */
    public static class RetentionStats {
        private long pendingHardDeletes;
        private long pendingAnonymizations;
        private long pendingLoyaltyExpirations;
        private boolean retentionEnabled;
        private boolean dryRunMode;

        // Getters and Setters
        public long getPendingHardDeletes() { return pendingHardDeletes; }
        public void setPendingHardDeletes(long count) { this.pendingHardDeletes = count; }

        public long getPendingAnonymizations() { return pendingAnonymizations; }
        public void setPendingAnonymizations(long count) { this.pendingAnonymizations = count; }

        public long getPendingLoyaltyExpirations() { return pendingLoyaltyExpirations; }
        public void setPendingLoyaltyExpirations(long count) { this.pendingLoyaltyExpirations = count; }

        public boolean isRetentionEnabled() { return retentionEnabled; }
        public void setRetentionEnabled(boolean enabled) { this.retentionEnabled = enabled; }

        public boolean isDryRunMode() { return dryRunMode; }
        public void setDryRunMode(boolean dryRun) { this.dryRunMode = dryRun; }
    }
}
