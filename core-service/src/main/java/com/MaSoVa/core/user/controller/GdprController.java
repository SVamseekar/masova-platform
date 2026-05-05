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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * GDPR — 8 canonical endpoints at /api/gdpr.
 * Replaces: /consent/grant, /consent/revoke, /consent/user/{id}, /consent/check,
 *           /request/{id}/verify, /request/{id}/access, /request/{id}/erasure,
 *           /request/{id}/portability, /request/{id}/rectification,
 *           /request/user/{id}, /privacy-policy, /erase/{id}
 */
@RestController
@RequestMapping("/api/gdpr")
@Tag(name = "GDPR", description = "Consent management, data requests, export and audit")
@SecurityRequirement(name = "bearerAuth")
public class GdprController {

    private static final Logger log = LoggerFactory.getLogger(GdprController.class);

    @Autowired
    private GdprConsentService consentService;

    @Autowired
    private GdprDataRequestService dataRequestService;

    @Autowired
    private GdprAuditLogRepository auditLogRepository;

    // ── CONSENT ──────────────────────────────────────────────────────────────────

    /**
     * GET /api/gdpr/consent?userId=
     * Replaces: /consent/user/{userId} and /consent/check
     */
    @GetMapping("/consent")
    @PreAuthorize("hasRole('MANAGER') or #userId == authentication.name")
    @Operation(summary = "Get consents (query: userId)")
    public ResponseEntity<?> getConsents(@RequestParam String userId) {
        try {
            List<GdprConsent> consents = consentService.getUserConsents(userId);
            return ResponseEntity.ok(consents);
        } catch (Exception e) {
            log.error("Error fetching user consents", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/gdpr/consent — grant consent
     * Replaces: /consent/grant
     */
    @PostMapping("/consent")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Grant consent")
    public ResponseEntity<?> grantConsent(
            @Valid @RequestBody GdprConsentRequest request,
            HttpServletRequest httpRequest) {
        try {
            GdprConsent consent = consentService.grantConsent(
                    request.getUserId(),
                    request.getConsentType(),
                    request.getVersion(),
                    getClientIp(httpRequest),
                    httpRequest.getHeader("User-Agent"),
                    request.getConsentText());
            return ResponseEntity.ok(consent);
        } catch (Exception e) {
            log.error("Error granting consent", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * DELETE /api/gdpr/consent — revoke consent (body: userId, consentType)
     * Replaces: /consent/revoke
     */
    @DeleteMapping("/consent")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Revoke consent (body: userId, consentType)")
    public ResponseEntity<?> revokeConsent(
            @RequestBody Map<String, String> body,
            HttpServletRequest httpRequest) {
        try {
            String userId = body.get("userId");
            ConsentType consentType = ConsentType.valueOf(body.get("consentType"));
            GdprConsent consent = consentService.revokeConsent(
                    userId, consentType, getClientIp(httpRequest), httpRequest.getHeader("User-Agent"));
            return ResponseEntity.ok(consent);
        } catch (Exception e) {
            log.error("Error revoking consent", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // ── DATA REQUESTS ─────────────────────────────────────────────────────────────

    /**
     * POST /api/gdpr/request — submit GDPR data request
     * Replaces: /request (POST)
     */
    @PostMapping("/request")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Submit GDPR request (body: userId, requestType=access|erasure|portability|rectification, reason)")
    public ResponseEntity<?> createRequest(
            @Valid @RequestBody GdprDataRequestDto request,
            HttpServletRequest httpRequest) {
        try {
            GdprDataRequest dataRequest = dataRequestService.createDataRequest(
                    request.getUserId(),
                    request.getRequestType(),
                    request.getReason(),
                    getClientIp(httpRequest),
                    httpRequest.getHeader("User-Agent"));
            return ResponseEntity.status(HttpStatus.CREATED).body(dataRequest);
        } catch (Exception e) {
            log.error("Error creating GDPR request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/gdpr/request?userId=
     * Replaces: /request/user/{userId}
     */
    @GetMapping("/request")
    @PreAuthorize("hasRole('MANAGER') or #userId == authentication.name")
    @Operation(summary = "Get user's GDPR requests (query: userId)")
    public ResponseEntity<?> getUserRequests(@RequestParam String userId) {
        try {
            List<GdprDataRequest> requests = dataRequestService.getUserRequests(userId);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            log.error("Error fetching user requests", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/gdpr/request/{id}/process — process request
     * Body: { type: "access"|"erasure"|"portability"|"rectification", updates?: {} }
     * Replaces: /request/{id}/access, /request/{id}/erasure,
     *           /request/{id}/portability, /request/{id}/rectification
     */
    @PostMapping("/request/{requestId}/process")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Process GDPR request (body: type=access|erasure|portability|rectification)")
    public ResponseEntity<?> processRequest(
            @PathVariable String requestId,
            @RequestBody Map<String, Object> body) {
        try {
            String type = (String) body.getOrDefault("type", "");
            return switch (type.toLowerCase()) {
                case "access" -> ResponseEntity.ok(dataRequestService.processAccessRequest(requestId));
                case "erasure" -> {
                    dataRequestService.processErasureRequest(requestId);
                    yield ResponseEntity.ok(Map.of("message", "Erasure request processed successfully"));
                }
                case "portability" -> ResponseEntity.ok(dataRequestService.processPortabilityRequest(requestId));
                case "rectification" -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> updates = (Map<String, Object>) body.getOrDefault("updates", Map.of());
                    dataRequestService.processRectificationRequest(requestId, updates);
                    yield ResponseEntity.ok(Map.of("message", "Rectification request processed successfully"));
                }
                default -> ResponseEntity.badRequest().body(Map.of("error", "type must be access|erasure|portability|rectification"));
            };
        } catch (Exception e) {
            log.error("Error processing GDPR request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // ── EXPORT AND AUDIT ──────────────────────────────────────────────────────────

    @GetMapping("/export/{userId}")
    @PreAuthorize("hasRole('MANAGER') or #userId == authentication.name")
    @Operation(summary = "Export all user data (GDPR Article 15)")
    public ResponseEntity<?> exportData(@PathVariable String userId, HttpServletRequest request) {
        try {
            String authToken = extractAuthToken(request);
            GdprExportPackage pkg = dataRequestService.exportAllCustomerData(userId, authToken);
            return ResponseEntity.ok(pkg);
        } catch (Exception e) {
            log.error("Error exporting customer data for user {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/audit/{userId}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Audit log for user")
    public ResponseEntity<?> getAuditLog(@PathVariable String userId) {
        try {
            List<GdprAuditLog> logs = auditLogRepository.findByUserId(userId);
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            log.error("Error fetching audit logs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    private String extractAuthToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) return authHeader.substring(7);
        return null;
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        return xfHeader != null ? xfHeader.split(",")[0] : request.getRemoteAddr();
    }
}
