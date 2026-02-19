package com.MaSoVa.core.user.controller;

import com.MaSoVa.shared.entity.GdprConsent;
import com.MaSoVa.shared.entity.GdprDataRequest;
import com.MaSoVa.shared.entity.GdprAuditLog;
import com.MaSoVa.shared.enums.ConsentType;
import com.MaSoVa.core.user.dto.GdprConsentRequest;
import com.MaSoVa.core.user.dto.GdprDataRequestDto;
import com.MaSoVa.core.user.dto.GdprExportPackage;
import com.MaSoVa.core.user.repository.GdprAuditLogRepository;
import com.MaSoVa.core.user.service.GdprConsentService;
import com.MaSoVa.core.user.service.GdprDataRequestService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gdpr")
public class GdprController {

    private static final Logger logger = LoggerFactory.getLogger(GdprController.class);

    @Autowired
    private GdprConsentService consentService;

    @Autowired
    private GdprDataRequestService dataRequestService;

    @Autowired
    private GdprAuditLogRepository auditLogRepository;

    @PostMapping("/consent/grant")
    public ResponseEntity<?> grantConsent(
            @Valid @RequestBody GdprConsentRequest request,
            HttpServletRequest httpRequest) {

        try {
            String ipAddress = getClientIP(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");

            GdprConsent consent = consentService.grantConsent(
                request.getUserId(),
                request.getConsentType(),
                request.getVersion(),
                ipAddress,
                userAgent,
                request.getConsentText()
            );

            return ResponseEntity.ok(consent);
        } catch (Exception e) {
            logger.error("Error granting consent", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/consent/revoke")
    public ResponseEntity<?> revokeConsent(
            @RequestParam String userId,
            @RequestParam ConsentType consentType,
            HttpServletRequest httpRequest) {

        try {
            String ipAddress = getClientIP(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");

            GdprConsent consent = consentService.revokeConsent(
                userId, consentType, ipAddress, userAgent
            );

            return ResponseEntity.ok(consent);
        } catch (Exception e) {
            logger.error("Error revoking consent", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/consent/user/{userId}")
    public ResponseEntity<?> getUserConsents(@PathVariable String userId) {
        try {
            List<GdprConsent> consents = consentService.getUserConsents(userId);
            return ResponseEntity.ok(consents);
        } catch (Exception e) {
            logger.error("Error fetching user consents", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/consent/check")
    public ResponseEntity<?> checkConsent(
            @RequestParam String userId,
            @RequestParam ConsentType consentType) {

        try {
            boolean hasConsent = consentService.hasActiveConsent(userId, consentType);
            return ResponseEntity.ok(Map.of(
                "userId", userId,
                "consentType", consentType,
                "hasActiveConsent", hasConsent
            ));
        } catch (Exception e) {
            logger.error("Error checking consent", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/request")
    public ResponseEntity<?> createDataRequest(
            @Valid @RequestBody GdprDataRequestDto request,
            HttpServletRequest httpRequest) {

        try {
            String ipAddress = getClientIP(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");

            GdprDataRequest dataRequest = dataRequestService.createDataRequest(
                request.getUserId(),
                request.getRequestType(),
                request.getReason(),
                ipAddress,
                userAgent
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(dataRequest);
        } catch (Exception e) {
            logger.error("Error creating GDPR request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/request/{requestId}/verify")
    public ResponseEntity<?> verifyRequest(
            @PathVariable String requestId,
            @RequestParam String token) {

        try {
            GdprDataRequest request = dataRequestService.verifyRequest(token);
            return ResponseEntity.ok(request);
        } catch (Exception e) {
            logger.error("Error verifying request", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/request/{requestId}/access")
    public ResponseEntity<?> processAccessRequest(@PathVariable String requestId) {
        try {
            Map<String, Object> userData = dataRequestService.processAccessRequest(requestId);
            return ResponseEntity.ok(userData);
        } catch (Exception e) {
            logger.error("Error processing access request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/request/{requestId}/erasure")
    public ResponseEntity<?> processErasureRequest(@PathVariable String requestId) {
        try {
            dataRequestService.processErasureRequest(requestId);
            return ResponseEntity.ok(Map.of("message", "Erasure request processed successfully"));
        } catch (Exception e) {
            logger.error("Error processing erasure request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/request/{requestId}/portability")
    public ResponseEntity<?> processPortabilityRequest(@PathVariable String requestId) {
        try {
            Map<String, Object> userData = dataRequestService.processPortabilityRequest(requestId);
            return ResponseEntity.ok(userData);
        } catch (Exception e) {
            logger.error("Error processing portability request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/request/{requestId}/rectification")
    public ResponseEntity<?> processRectificationRequest(
            @PathVariable String requestId,
            @RequestBody Map<String, Object> updates) {

        try {
            dataRequestService.processRectificationRequest(requestId, updates);
            return ResponseEntity.ok(Map.of("message", "Rectification request processed successfully"));
        } catch (Exception e) {
            logger.error("Error processing rectification request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/request/user/{userId}")
    public ResponseEntity<?> getUserRequests(@PathVariable String userId) {
        try {
            List<GdprDataRequest> requests = dataRequestService.getUserRequests(userId);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            logger.error("Error fetching user requests", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/audit/{userId}")
    public ResponseEntity<?> getUserAuditLogs(@PathVariable String userId) {
        try {
            List<GdprAuditLog> logs = auditLogRepository.findByUserId(userId);
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            logger.error("Error fetching audit logs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/privacy-policy")
    public ResponseEntity<?> getPrivacyPolicy() {
        Map<String, Object> privacyPolicy = new HashMap<>();
        privacyPolicy.put("version", "1.0");
        privacyPolicy.put("effectiveDate", "2025-01-01");
        privacyPolicy.put("dataController", "MaSoVa Restaurant Management System");
        privacyPolicy.put("dpo", "dpo@masova.com");
        privacyPolicy.put("gdprCompliant", true);

        return ResponseEntity.ok(privacyPolicy);
    }

    /**
     * GDPR-004: Comprehensive data export endpoint.
     * Exports all customer data from all services for GDPR Article 15 compliance.
     */
    @GetMapping("/export/{userId}")
    public ResponseEntity<?> exportAllCustomerData(
            @PathVariable String userId,
            HttpServletRequest httpRequest) {

        try {
            // Get auth token from request for cross-service calls
            String authToken = extractAuthToken(httpRequest);

            GdprExportPackage exportPackage = dataRequestService.exportAllCustomerData(userId, authToken);

            return ResponseEntity.ok(exportPackage);
        } catch (Exception e) {
            logger.error("Error exporting customer data for user {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GDPR-004: Comprehensive data erasure endpoint.
     * Anonymizes all customer data across all services for GDPR Article 17 compliance.
     */
    @DeleteMapping("/erase/{userId}")
    public ResponseEntity<?> eraseAllCustomerData(
            @PathVariable String userId,
            HttpServletRequest httpRequest) {

        try {
            String authToken = extractAuthToken(httpRequest);

            dataRequestService.anonymizeAllCustomerData(userId, authToken);

            return ResponseEntity.ok(Map.of(
                "message", "Customer data anonymized across all services",
                "userId", userId,
                "timestamp", java.time.LocalDateTime.now()
            ));
        } catch (Exception e) {
            logger.error("Error erasing customer data for user {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Extract auth token from request header
     */
    private String extractAuthToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
