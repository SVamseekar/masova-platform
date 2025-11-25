package com.MaSoVa.shared.service;

import com.MaSoVa.shared.model.AuditLog;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Audit service for logging sensitive operations
 * Phase 14: Security Hardening - Audit logging
 */
@Service
public class AuditService {

    private static final Logger logger = LoggerFactory.getLogger(AuditService.class);

    @Autowired
    private MongoTemplate mongoTemplate;

    /**
     * Log an audit event asynchronously
     */
    @Async
    public void logAudit(AuditLog auditLog) {
        try {
            mongoTemplate.save(auditLog);
            logger.info("Audit log saved: {} - {} on {}/{}",
                    auditLog.getUsername(),
                    auditLog.getAction(),
                    auditLog.getEntityType(),
                    auditLog.getEntityId());
        } catch (Exception e) {
            logger.error("Failed to save audit log", e);
        }
    }

    /**
     * Log user login
     */
    public void logLogin(String userId, String username, HttpServletRequest request, boolean success) {
        AuditLog log = new AuditLog(userId, username, success ? "LOGIN_SUCCESS" : "LOGIN_FAILED", "USER", userId);
        enrichWithRequestInfo(log, request);
        log.setSeverity(success ? "INFO" : "WARNING");
        logAudit(log);
    }

    /**
     * Log user logout
     */
    public void logLogout(String userId, String username, HttpServletRequest request) {
        AuditLog log = new AuditLog(userId, username, "LOGOUT", "USER", userId);
        enrichWithRequestInfo(log, request);
        log.setSeverity("INFO");
        logAudit(log);
    }

    /**
     * Log data access
     */
    public void logDataAccess(String userId, String username, String entityType, String entityId,
                               HttpServletRequest request) {
        AuditLog log = new AuditLog(userId, username, "DATA_ACCESS", entityType, entityId);
        enrichWithRequestInfo(log, request);
        log.setSeverity("INFO");
        logAudit(log);
    }

    /**
     * Log data modification
     */
    public void logDataModification(String userId, String username, String action,
                                     String entityType, String entityId, HttpServletRequest request) {
        AuditLog log = new AuditLog(userId, username, action, entityType, entityId);
        enrichWithRequestInfo(log, request);
        log.setSeverity("WARNING");
        logAudit(log);
    }

    /**
     * Log security event
     */
    public void logSecurityEvent(String userId, String username, String event,
                                  HttpServletRequest request) {
        AuditLog log = new AuditLog(userId, username, event, "SECURITY", "N/A");
        enrichWithRequestInfo(log, request);
        log.setSeverity("CRITICAL");
        logAudit(log);
    }

    /**
     * Log payment transaction
     */
    public void logPaymentTransaction(String userId, String username, String paymentId,
                                       String action, HttpServletRequest request) {
        AuditLog log = new AuditLog(userId, username, action, "PAYMENT", paymentId);
        enrichWithRequestInfo(log, request);
        log.setSeverity("CRITICAL");
        logAudit(log);
    }

    /**
     * Log sensitive data access
     */
    public void logSensitiveDataAccess(String userId, String username, String dataType,
                                        HttpServletRequest request) {
        AuditLog log = new AuditLog(userId, username, "SENSITIVE_DATA_ACCESS", dataType, "N/A");
        enrichWithRequestInfo(log, request);
        log.setSeverity("CRITICAL");
        logAudit(log);
    }

    /**
     * Log permission change
     */
    public void logPermissionChange(String userId, String username, String targetUserId,
                                     String action, HttpServletRequest request) {
        AuditLog log = new AuditLog(userId, username, action, "PERMISSION", targetUserId);
        enrichWithRequestInfo(log, request);
        log.setSeverity("CRITICAL");
        logAudit(log);
    }

    /**
     * Enrich audit log with request information
     */
    private void enrichWithRequestInfo(AuditLog log, HttpServletRequest request) {
        if (request != null) {
            log.setIpAddress(getClientIpAddress(request));
            log.setUserAgent(request.getHeader("User-Agent"));
            log.setRequestMethod(request.getMethod());
            log.setRequestPath(request.getRequestURI());
        }
    }

    /**
     * Get client IP address from request
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String[] headerCandidates = {
                "X-Forwarded-For",
                "X-Real-IP",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP",
                "HTTP_X_FORWARDED_FOR",
                "HTTP_X_FORWARDED",
                "HTTP_X_CLUSTER_CLIENT_IP",
                "HTTP_CLIENT_IP",
                "HTTP_FORWARDED_FOR",
                "HTTP_FORWARDED",
                "HTTP_VIA",
                "REMOTE_ADDR"
        };

        for (String header : headerCandidates) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // Handle multiple IPs in X-Forwarded-For
                if (ip.contains(",")) {
                    ip = ip.split(",")[0].trim();
                }
                return ip;
            }
        }

        return request.getRemoteAddr();
    }
}
