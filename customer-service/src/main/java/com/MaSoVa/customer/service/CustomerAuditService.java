package com.MaSoVa.customer.service;

import com.MaSoVa.customer.entity.Customer;
import com.MaSoVa.shared.gdpr.DataAccessAuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Customer service implementation of GDPR data access audit logging.
 * Logs all access to customer PII for compliance with GDPR Article 32.
 */
@Service
public class CustomerAuditService extends DataAccessAuditService {

    private static final Logger logger = LoggerFactory.getLogger(CustomerAuditService.class);

    private final MongoTemplate mongoTemplate;

    @Autowired
    public CustomerAuditService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    protected MongoTemplate getMongoTemplate() {
        return mongoTemplate;
    }

    @Override
    protected String getServiceName() {
        return "customer-service";
    }

    /**
     * Log email change for audit trail
     */
    public void logEmailChange(Customer customer, String oldEmail, String newEmail) {
        // Simple logging - no need for complex audit trail for email updates
        logger.info("Email change audit - Customer ID: {}, Old: {}, New: {}",
                customer.getId(), oldEmail, newEmail);
    }

    /**
     * Flush audit buffer every 30 seconds.
     */
    @Scheduled(fixedRate = 30000)
    public void flushAuditBufferScheduled() {
        scheduledFlush();
    }
}
