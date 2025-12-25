package com.MaSoVa.shared.gdpr;

import com.MaSoVa.shared.entity.GdprAuditLog;
import com.MaSoVa.shared.enums.GdprActionType;
import com.MaSoVa.shared.util.PiiMasker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.scheduling.annotation.Async;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Service for logging data access events for GDPR compliance (Article 32).
 * Provides audit trail for all PII access, modifications, and exports.
 *
 * Usage:
 * - Call logDataAccess() when reading customer/user data
 * - Call logDataModification() when updating customer/user data
 * - Call logDataExport() when exporting customer data
 * - Call logDataDeletion() when deleting customer data
 */
public abstract class DataAccessAuditService {

    private static final Logger logger = LoggerFactory.getLogger(DataAccessAuditService.class);

    // Buffer for batch inserts to reduce database load
    private final ConcurrentLinkedQueue<GdprAuditLog> auditBuffer = new ConcurrentLinkedQueue<>();
    private final AtomicInteger bufferSize = new AtomicInteger(0);
    private static final int BUFFER_FLUSH_THRESHOLD = 50;

    protected abstract MongoTemplate getMongoTemplate();
    protected abstract String getServiceName();

    /**
     * Log a data access event (READ operation).
     *
     * @param userId       The user whose data was accessed
     * @param resourceType Type of resource (CUSTOMER, ORDER, PAYMENT, etc.)
     * @param resourceId   ID of the specific resource accessed
     * @param performedBy  User ID who performed the access
     * @param purpose      Business purpose for the access
     * @param request      HTTP request for IP/User-Agent extraction (optional)
     */
    public void logDataAccess(
            String userId,
            String resourceType,
            String resourceId,
            String performedBy,
            String purpose,
            HttpServletRequest request
    ) {
        GdprAuditLog auditLog = createBaseAuditLog(userId, GdprActionType.DATA_ACCESSED, performedBy, request);
        auditLog.setDataType(resourceType);
        auditLog.setDescription(String.format("Accessed %s record: %s - Purpose: %s",
                resourceType, PiiMasker.maskId(resourceId), purpose));

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("resourceId", resourceId);
        metadata.put("resourceType", resourceType);
        metadata.put("purpose", purpose);
        metadata.put("service", getServiceName());
        auditLog.setMetadata(metadata);

        saveAuditLog(auditLog);
    }

    /**
     * Log a data modification event (CREATE/UPDATE operation).
     *
     * @param userId       The user whose data was modified
     * @param resourceType Type of resource modified
     * @param resourceId   ID of the specific resource
     * @param performedBy  User ID who performed the modification
     * @param action       Description of the modification
     * @param beforeState  State before modification (for change tracking)
     * @param afterState   State after modification
     * @param request      HTTP request (optional)
     */
    public void logDataModification(
            String userId,
            String resourceType,
            String resourceId,
            String performedBy,
            String action,
            Map<String, Object> beforeState,
            Map<String, Object> afterState,
            HttpServletRequest request
    ) {
        GdprAuditLog auditLog = createBaseAuditLog(userId, GdprActionType.DATA_RECTIFIED, performedBy, request);
        auditLog.setDataType(resourceType);
        auditLog.setDescription(String.format("Modified %s record: %s - Action: %s",
                resourceType, PiiMasker.maskId(resourceId), action));
        auditLog.setBeforeState(sanitizeStateForAudit(beforeState));
        auditLog.setAfterState(sanitizeStateForAudit(afterState));

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("resourceId", resourceId);
        metadata.put("resourceType", resourceType);
        metadata.put("action", action);
        metadata.put("service", getServiceName());
        auditLog.setMetadata(metadata);

        saveAuditLog(auditLog);
    }

    /**
     * Log a data export event (GDPR Article 15 - Right of Access).
     *
     * @param userId        The user whose data was exported
     * @param exportFormat  Format of export (JSON, CSV, PDF)
     * @param performedBy   User ID who performed the export
     * @param dataTypes     Types of data included in export
     * @param request       HTTP request (optional)
     */
    public void logDataExport(
            String userId,
            String exportFormat,
            String performedBy,
            String[] dataTypes,
            HttpServletRequest request
    ) {
        GdprAuditLog auditLog = createBaseAuditLog(userId, GdprActionType.DATA_EXPORTED, performedBy, request);
        auditLog.setDataType("FULL_EXPORT");
        auditLog.setDescription(String.format("Exported user data in %s format - %d data types",
                exportFormat, dataTypes.length));
        auditLog.setLegalBasis("GDPR Article 15 - Right of Access");

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("exportFormat", exportFormat);
        metadata.put("dataTypes", dataTypes);
        metadata.put("service", getServiceName());
        auditLog.setMetadata(metadata);

        saveAuditLog(auditLog);
    }

    /**
     * Log a data deletion event (GDPR Article 17 - Right to Erasure).
     *
     * @param userId        The user whose data was deleted
     * @param resourceType  Type of resource deleted
     * @param performedBy   User ID who performed the deletion
     * @param deletionType  Type of deletion (SOFT, HARD, ANONYMIZE)
     * @param reason        Reason for deletion
     * @param request       HTTP request (optional)
     */
    public void logDataDeletion(
            String userId,
            String resourceType,
            String performedBy,
            String deletionType,
            String reason,
            HttpServletRequest request
    ) {
        GdprAuditLog auditLog = createBaseAuditLog(userId, GdprActionType.DATA_DELETED, performedBy, request);
        auditLog.setDataType(resourceType);
        auditLog.setDescription(String.format("%s deletion of %s data - Reason: %s",
                deletionType, resourceType, reason));
        auditLog.setLegalBasis("GDPR Article 17 - Right to Erasure");

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("deletionType", deletionType);
        metadata.put("resourceType", resourceType);
        metadata.put("reason", reason);
        metadata.put("service", getServiceName());
        auditLog.setMetadata(metadata);

        saveAuditLog(auditLog);
    }

    /**
     * Log data anonymization event.
     *
     * @param userId       The user whose data was anonymized
     * @param resourceType Type of resource anonymized
     * @param performedBy  User ID who performed the anonymization
     * @param fieldsList   List of fields that were anonymized
     * @param request      HTTP request (optional)
     */
    public void logDataAnonymization(
            String userId,
            String resourceType,
            String performedBy,
            String[] fieldsList,
            HttpServletRequest request
    ) {
        GdprAuditLog auditLog = createBaseAuditLog(userId, GdprActionType.DATA_ANONYMIZED, performedBy, request);
        auditLog.setDataType(resourceType);
        auditLog.setDescription(String.format("Anonymized %d fields in %s record",
                fieldsList.length, resourceType));
        auditLog.setLegalBasis("GDPR Article 17 - Right to Erasure (Anonymization)");

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("anonymizedFields", fieldsList);
        metadata.put("resourceType", resourceType);
        metadata.put("service", getServiceName());
        auditLog.setMetadata(metadata);

        saveAuditLog(auditLog);
    }

    /**
     * Log consent change event.
     *
     * @param userId       The user who changed consent
     * @param consentType  Type of consent (MARKETING, SMS, DATA_PROCESSING)
     * @param granted      Whether consent was granted or revoked
     * @param version      Privacy policy version
     * @param request      HTTP request (optional)
     */
    public void logConsentChange(
            String userId,
            String consentType,
            boolean granted,
            String version,
            HttpServletRequest request
    ) {
        GdprActionType actionType = granted ? GdprActionType.CONSENT_GRANTED : GdprActionType.CONSENT_REVOKED;
        GdprAuditLog auditLog = createBaseAuditLog(userId, actionType, userId, request);
        auditLog.setDataType("CONSENT");
        auditLog.setDescription(String.format("%s consent %s - Policy version: %s",
                consentType, granted ? "granted" : "revoked", version));
        auditLog.setLegalBasis("GDPR Article 7 - Conditions for Consent");

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("consentType", consentType);
        metadata.put("granted", granted);
        metadata.put("policyVersion", version);
        metadata.put("service", getServiceName());
        auditLog.setMetadata(metadata);

        saveAuditLog(auditLog);
    }

    /**
     * Log failed access attempt (unauthorized access attempt).
     *
     * @param userId         The user whose data was attempted to be accessed
     * @param resourceType   Type of resource
     * @param attemptedBy    User ID who attempted the access
     * @param reason         Reason for denial
     * @param request        HTTP request (optional)
     */
    public void logAccessDenied(
            String userId,
            String resourceType,
            String attemptedBy,
            String reason,
            HttpServletRequest request
    ) {
        GdprAuditLog auditLog = createBaseAuditLog(userId, GdprActionType.DATA_ACCESSED, attemptedBy, request);
        auditLog.setDataType(resourceType);
        auditLog.setDescription(String.format("Access DENIED to %s - Reason: %s", resourceType, reason));
        auditLog.setSuccess(false);
        auditLog.setErrorMessage(reason);

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("resourceType", resourceType);
        metadata.put("denialReason", reason);
        metadata.put("service", getServiceName());
        auditLog.setMetadata(metadata);

        // Access denials are logged immediately (not buffered) for security
        saveAuditLogImmediate(auditLog);
        logger.warn("Access denied - User: {} attempted to access {} of user: {} - Reason: {}",
                PiiMasker.maskId(attemptedBy), resourceType, PiiMasker.maskId(userId), reason);
    }

    /**
     * Create base audit log with common fields populated.
     */
    private GdprAuditLog createBaseAuditLog(
            String userId,
            GdprActionType actionType,
            String performedBy,
            HttpServletRequest request
    ) {
        GdprAuditLog auditLog = new GdprAuditLog(userId, actionType, performedBy);
        auditLog.setTimestamp(LocalDateTime.now());

        if (request != null) {
            auditLog.setIpAddress(getClientIpAddress(request));
            auditLog.setUserAgent(request.getHeader("User-Agent"));

            // Extract user type from header if available
            String userType = request.getHeader("X-User-Type");
            if (userType != null) {
                auditLog.setPerformedByType(userType);
            }
        }

        return auditLog;
    }

    /**
     * Extract client IP address, handling proxies.
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String[] headerNames = {
                "X-Forwarded-For",
                "X-Real-IP",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP"
        };

        for (String header : headerNames) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // X-Forwarded-For may contain multiple IPs; take the first
                return ip.split(",")[0].trim();
            }
        }

        return request.getRemoteAddr();
    }

    /**
     * Sanitize state maps to remove sensitive data before storing in audit log.
     */
    private Map<String, Object> sanitizeStateForAudit(Map<String, Object> state) {
        if (state == null) return null;

        Map<String, Object> sanitized = new HashMap<>();
        for (Map.Entry<String, Object> entry : state.entrySet()) {
            String key = entry.getKey().toLowerCase();
            Object value = entry.getValue();

            // Mask sensitive fields
            if (key.contains("password") || key.contains("secret") || key.contains("token")) {
                sanitized.put(entry.getKey(), "***REDACTED***");
            } else if (key.contains("email") && value instanceof String) {
                sanitized.put(entry.getKey(), PiiMasker.maskEmail((String) value));
            } else if (key.contains("phone") && value instanceof String) {
                sanitized.put(entry.getKey(), PiiMasker.maskPhone((String) value));
            } else if (key.contains("card") && value instanceof String) {
                sanitized.put(entry.getKey(), PiiMasker.maskCardNumber((String) value));
            } else {
                sanitized.put(entry.getKey(), value);
            }
        }

        return sanitized;
    }

    /**
     * Save audit log (buffered for performance).
     */
    @Async
    protected void saveAuditLog(GdprAuditLog auditLog) {
        auditBuffer.add(auditLog);
        int currentSize = bufferSize.incrementAndGet();

        if (currentSize >= BUFFER_FLUSH_THRESHOLD) {
            flushAuditBuffer();
        }

        logger.debug("Audit logged: {} - {} by {}",
                auditLog.getActionType(), auditLog.getDataType(),
                PiiMasker.maskId(auditLog.getPerformedBy()));
    }

    /**
     * Save audit log immediately (for critical events like access denials).
     */
    protected void saveAuditLogImmediate(GdprAuditLog auditLog) {
        try {
            getMongoTemplate().save(auditLog);
        } catch (Exception e) {
            logger.error("Failed to save immediate audit log: {}", e.getMessage());
        }
    }

    /**
     * Flush the audit buffer to database.
     */
    public synchronized void flushAuditBuffer() {
        if (auditBuffer.isEmpty()) return;

        try {
            java.util.List<GdprAuditLog> toFlush = new java.util.ArrayList<>();
            GdprAuditLog log;
            while ((log = auditBuffer.poll()) != null) {
                toFlush.add(log);
            }
            bufferSize.set(0);

            if (!toFlush.isEmpty()) {
                getMongoTemplate().insertAll(toFlush);
                logger.debug("Flushed {} audit logs to database", toFlush.size());
            }
        } catch (Exception e) {
            logger.error("Failed to flush audit buffer: {}", e.getMessage());
        }
    }

    /**
     * Scheduled method to flush buffer periodically (call from @Scheduled in implementing class).
     */
    public void scheduledFlush() {
        if (bufferSize.get() > 0) {
            flushAuditBuffer();
        }
    }
}
