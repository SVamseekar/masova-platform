package com.MaSoVa.user.service;

import com.MaSoVa.shared.entity.GdprConsent;
import com.MaSoVa.shared.entity.GdprDataRequest;
import com.MaSoVa.shared.entity.GdprAuditLog;
import com.MaSoVa.shared.entity.User;
import com.MaSoVa.shared.enums.GdprRequestType;
import com.MaSoVa.shared.enums.GdprRequestStatus;
import com.MaSoVa.shared.enums.GdprActionType;
import com.MaSoVa.user.client.CustomerServiceClient;
import com.MaSoVa.user.client.DeliveryServiceClient;
import com.MaSoVa.user.client.OrderServiceClient;
import com.MaSoVa.user.client.PaymentServiceClient;
import com.MaSoVa.user.dto.GdprExportPackage;
import com.MaSoVa.user.repository.GdprConsentRepository;
import com.MaSoVa.user.repository.GdprDataRequestRepository;
import com.MaSoVa.user.repository.GdprAuditLogRepository;
import com.MaSoVa.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * GDPR Data Request Service - Handles all GDPR Article 15, 17, 20, 21 requests.
 * GDPR-004: Complete GDPR data export across all services.
 */
@Service
public class GdprDataRequestService {

    private static final Logger logger = LoggerFactory.getLogger(GdprDataRequestService.class);

    @Autowired
    private GdprDataRequestRepository dataRequestRepository;

    @Autowired
    private GdprAuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GdprConsentRepository consentRepository;

    // Service clients for cross-service GDPR data export (GDPR-004)
    @Autowired
    private OrderServiceClient orderServiceClient;

    @Autowired
    private PaymentServiceClient paymentServiceClient;

    @Autowired
    private CustomerServiceClient customerServiceClient;

    @Autowired
    private DeliveryServiceClient deliveryServiceClient;

    public GdprDataRequest createDataRequest(String userId, GdprRequestType requestType,
                                               String reason, String ipAddress, String userAgent) {
        logger.info("Creating GDPR data request for user: {}, type: {}", userId, requestType);

        GdprDataRequest request = new GdprDataRequest(userId, requestType);
        request.setReason(reason);
        request.setIpAddress(ipAddress);
        request.setUserAgent(userAgent);
        request.setVerificationToken(UUID.randomUUID().toString());

        GdprDataRequest saved = dataRequestRepository.save(request);

        createAuditLog(userId, GdprActionType.REQUEST_SUBMITTED, userId,
            "GDPR request submitted: " + requestType, ipAddress, userAgent);

        logger.info("GDPR data request created successfully: {}", saved.getId());
        return saved;
    }

    public GdprDataRequest verifyRequest(String token) {
        logger.info("Verifying GDPR request with token");

        Optional<GdprDataRequest> request = dataRequestRepository.findByVerificationToken(token);
        if (request.isEmpty()) {
            throw new IllegalArgumentException("Invalid verification token");
        }

        GdprDataRequest dataRequest = request.get();
        dataRequest.setVerifiedAt(LocalDateTime.now());
        dataRequest.setStatus(GdprRequestStatus.VERIFIED);

        return dataRequestRepository.save(dataRequest);
    }

    public Map<String, Object> processAccessRequest(String requestId) {
        logger.info("Processing access request: {}", requestId);

        GdprDataRequest request = dataRequestRepository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (request.getRequestType() != GdprRequestType.ACCESS) {
            throw new IllegalArgumentException("Request is not an access request");
        }

        request.setStatus(GdprRequestStatus.IN_PROGRESS);
        dataRequestRepository.save(request);

        Map<String, Object> userData = exportUserData(request.getUserId());

        request.setStatus(GdprRequestStatus.COMPLETED);
        request.setCompletedAt(LocalDateTime.now());
        request.setDataExportUrl("gdpr-exports/" + requestId + ".json");
        request.setDataExportExpiresAt(LocalDateTime.now().plusDays(30));
        dataRequestRepository.save(request);

        createAuditLog(request.getUserId(), GdprActionType.DATA_ACCESSED, "SYSTEM",
            "Data access request processed", null, null);

        return userData;
    }

    public void processErasureRequest(String requestId) {
        logger.info("Processing erasure request: {}", requestId);

        GdprDataRequest request = dataRequestRepository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (request.getRequestType() != GdprRequestType.ERASURE) {
            throw new IllegalArgumentException("Request is not an erasure request");
        }

        request.setStatus(GdprRequestStatus.IN_PROGRESS);
        dataRequestRepository.save(request);

        anonymizeUserData(request.getUserId());

        request.setStatus(GdprRequestStatus.COMPLETED);
        request.setCompletedAt(LocalDateTime.now());
        dataRequestRepository.save(request);

        createAuditLog(request.getUserId(), GdprActionType.DATA_DELETED, "SYSTEM",
            "Data erasure request processed", null, null);

        logger.info("Erasure request completed: {}", requestId);
    }

    public Map<String, Object> processPortabilityRequest(String requestId) {
        logger.info("Processing portability request: {}", requestId);

        GdprDataRequest request = dataRequestRepository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (request.getRequestType() != GdprRequestType.DATA_PORTABILITY) {
            throw new IllegalArgumentException("Request is not a portability request");
        }

        request.setStatus(GdprRequestStatus.IN_PROGRESS);
        dataRequestRepository.save(request);

        Map<String, Object> userData = exportUserDataPortable(request.getUserId());

        request.setStatus(GdprRequestStatus.COMPLETED);
        request.setCompletedAt(LocalDateTime.now());
        request.setDataExportUrl("gdpr-exports/" + requestId + ".json");
        request.setDataExportExpiresAt(LocalDateTime.now().plusDays(30));
        dataRequestRepository.save(request);

        createAuditLog(request.getUserId(), GdprActionType.DATA_EXPORTED, "SYSTEM",
            "Data portability request processed", null, null);

        return userData;
    }

    public void processRectificationRequest(String requestId, Map<String, Object> updates) {
        logger.info("Processing rectification request: {}", requestId);

        GdprDataRequest request = dataRequestRepository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        if (request.getRequestType() != GdprRequestType.RECTIFICATION) {
            throw new IllegalArgumentException("Request is not a rectification request");
        }

        request.setStatus(GdprRequestStatus.IN_PROGRESS);
        dataRequestRepository.save(request);

        updateUserData(request.getUserId(), updates);

        request.setStatus(GdprRequestStatus.COMPLETED);
        request.setCompletedAt(LocalDateTime.now());
        dataRequestRepository.save(request);

        createAuditLog(request.getUserId(), GdprActionType.DATA_RECTIFIED, "SYSTEM",
            "Data rectification request processed", null, null);

        logger.info("Rectification request completed: {}", requestId);
    }

    public List<GdprDataRequest> getUserRequests(String userId) {
        return dataRequestRepository.findByUserId(userId);
    }

    public List<GdprDataRequest> getOverdueRequests() {
        return dataRequestRepository.findByDueDateBefore(LocalDateTime.now());
    }

    /**
     * GDPR-004: Export all customer data across all services.
     * Complies with GDPR Article 15 (Right of Access) and Article 20 (Right to Data Portability).
     *
     * @param userId The customer's user ID
     * @param authToken Authentication token for cross-service calls
     * @return Complete GDPR export package with data from all services
     */
    public GdprExportPackage exportAllCustomerData(String userId, String authToken) {
        logger.info("Starting comprehensive GDPR data export for user: {}", userId);

        GdprExportPackage exportPackage = new GdprExportPackage(userId);
        List<String> errors = new ArrayList<>();

        // 1. Export User Service Data
        try {
            exportPackage.setUserProfile(exportUserData(userId));
            exportPackage.setConsentHistory(exportConsentHistory(userId));
            exportPackage.setAuditHistory(exportAuditHistory(userId));
        } catch (Exception e) {
            logger.error("Error exporting user service data: {}", e.getMessage());
            errors.add("User Service: " + e.getMessage());
        }

        // 2. Export Customer Service Data
        try {
            Map<String, Object> customerProfile = customerServiceClient.getCustomerProfile(userId, authToken);
            exportPackage.setCustomerProfile(customerProfile);

            List<Map<String, Object>> addresses = customerServiceClient.getCustomerAddresses(userId, authToken);
            exportPackage.setSavedAddresses(addresses);

            Map<String, Object> loyalty = customerServiceClient.getCustomerLoyalty(userId, authToken);
            exportPackage.setLoyaltyInfo(loyalty);

            Map<String, Object> preferences = customerServiceClient.getCommunicationPreferences(userId, authToken);
            exportPackage.setCommunicationPreferences(preferences);
        } catch (Exception e) {
            logger.error("Error exporting customer service data: {}", e.getMessage());
            errors.add("Customer Service: " + e.getMessage());
        }

        // 3. Export Order Service Data
        try {
            List<Map<String, Object>> orders = orderServiceClient.getCustomerOrders(userId, authToken);
            exportPackage.setOrderHistory(orders);
            exportPackage.setTotalOrders(orders.size());
        } catch (Exception e) {
            logger.error("Error exporting order service data: {}", e.getMessage());
            errors.add("Order Service: " + e.getMessage());
        }

        // 4. Export Payment Service Data
        try {
            List<Map<String, Object>> transactions = paymentServiceClient.getCustomerTransactions(userId, authToken);
            exportPackage.setPaymentTransactions(sanitizePaymentData(transactions));

            List<Map<String, Object>> paymentMethods = paymentServiceClient.getCustomerPaymentMethods(userId, authToken);
            exportPackage.setSavedPaymentMethods(sanitizePaymentMethodData(paymentMethods));
        } catch (Exception e) {
            logger.error("Error exporting payment service data: {}", e.getMessage());
            errors.add("Payment Service: " + e.getMessage());
        }

        // 5. Export Delivery Service Data
        try {
            List<Map<String, Object>> deliveries = deliveryServiceClient.getCustomerDeliveries(userId, authToken);
            exportPackage.setDeliveryHistory(deliveries);
        } catch (Exception e) {
            logger.error("Error exporting delivery service data: {}", e.getMessage());
            errors.add("Delivery Service: " + e.getMessage());
        }

        exportPackage.setErrors(errors);
        exportPackage.setComplete(errors.isEmpty());

        logger.info("GDPR data export completed for user: {}. Errors: {}", userId, errors.size());

        // Create audit log for the export
        createAuditLog(userId, GdprActionType.DATA_EXPORTED, "SYSTEM",
            "Comprehensive GDPR data export completed. Services with errors: " + errors.size(), null, null);

        return exportPackage;
    }

    /**
     * Export consent history for a user
     */
    private List<Map<String, Object>> exportConsentHistory(String userId) {
        List<GdprConsent> consents = consentRepository.findByUserId(userId);
        return consents.stream()
            .map(consent -> {
                Map<String, Object> map = new HashMap<>();
                map.put("consentType", consent.getConsentType());
                map.put("status", consent.getStatus());
                map.put("isActive", consent.isActive());
                map.put("grantedAt", consent.getGrantedAt());
                map.put("revokedAt", consent.getRevokedAt());
                map.put("version", consent.getVersion());
                map.put("ipAddress", consent.getIpAddress());
                return map;
            })
            .collect(Collectors.toList());
    }

    /**
     * Export audit history for a user
     */
    private List<Map<String, Object>> exportAuditHistory(String userId) {
        List<GdprAuditLog> logs = auditLogRepository.findByUserId(userId);
        return logs.stream()
            .map(log -> {
                Map<String, Object> map = new HashMap<>();
                map.put("actionType", log.getActionType());
                map.put("timestamp", log.getTimestamp());
                map.put("description", log.getDescription());
                map.put("performedBy", log.getPerformedBy());
                return map;
            })
            .collect(Collectors.toList());
    }

    /**
     * Sanitize payment transaction data for export (mask sensitive info)
     */
    private List<Map<String, Object>> sanitizePaymentData(List<Map<String, Object>> transactions) {
        return transactions.stream()
            .map(tx -> {
                Map<String, Object> sanitized = new HashMap<>(tx);
                // Mask card numbers if present
                if (sanitized.containsKey("cardNumber")) {
                    String cardNum = (String) sanitized.get("cardNumber");
                    if (cardNum != null && cardNum.length() >= 4) {
                        sanitized.put("cardNumber", "****-****-****-" + cardNum.substring(cardNum.length() - 4));
                    }
                }
                // Remove sensitive payment gateway tokens
                sanitized.remove("razorpayPaymentId");
                sanitized.remove("razorpaySignature");
                return sanitized;
            })
            .collect(Collectors.toList());
    }

    /**
     * Sanitize payment method data for export
     */
    private List<Map<String, Object>> sanitizePaymentMethodData(List<Map<String, Object>> methods) {
        return methods.stream()
            .map(method -> {
                Map<String, Object> sanitized = new HashMap<>(method);
                // Mask card numbers
                if (sanitized.containsKey("cardNumber")) {
                    String cardNum = (String) sanitized.get("cardNumber");
                    if (cardNum != null && cardNum.length() >= 4) {
                        sanitized.put("cardNumber", "****-****-****-" + cardNum.substring(cardNum.length() - 4));
                    }
                }
                // Remove CVV and other sensitive fields
                sanitized.remove("cvv");
                sanitized.remove("token");
                return sanitized;
            })
            .collect(Collectors.toList());
    }

    private Map<String, Object> exportUserData(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found");
        }

        User user = userOpt.get();
        Map<String, Object> data = new HashMap<>();

        data.put("userId", user.getId());
        data.put("personalInfo", user.getPersonalInfo());
        data.put("preferences", user.getPreferences());
        data.put("createdAt", user.getCreatedAt());
        data.put("lastLogin", user.getLastLogin());
        data.put("userType", user.getType());
        data.put("isActive", user.isActive());

        return data;
    }

    private Map<String, Object> exportUserDataPortable(String userId) {
        Map<String, Object> data = exportUserData(userId);
        data.put("format", "JSON");
        data.put("version", "1.0");
        data.put("exportedAt", LocalDateTime.now());
        data.put("standardCompliance", "GDPR Article 20");

        return data;
    }

    /**
     * GDPR-004: Anonymize customer data across all services for GDPR erasure.
     * Complies with GDPR Article 17 (Right to Erasure).
     */
    public void anonymizeAllCustomerData(String userId, String authToken) {
        logger.info("Starting comprehensive GDPR data anonymization for user: {}", userId);
        List<String> errors = new ArrayList<>();

        // 1. Anonymize in Order Service
        try {
            boolean success = orderServiceClient.anonymizeCustomerData(userId, authToken);
            if (!success) {
                errors.add("Order Service: Anonymization returned false");
            }
        } catch (Exception e) {
            logger.error("Error anonymizing order data: {}", e.getMessage());
            errors.add("Order Service: " + e.getMessage());
        }

        // 2. Anonymize in Payment Service
        try {
            boolean success = paymentServiceClient.anonymizeCustomerData(userId, authToken);
            if (!success) {
                errors.add("Payment Service: Anonymization returned false");
            }
        } catch (Exception e) {
            logger.error("Error anonymizing payment data: {}", e.getMessage());
            errors.add("Payment Service: " + e.getMessage());
        }

        // 3. Anonymize in Customer Service
        try {
            boolean success = customerServiceClient.anonymizeCustomerData(userId, authToken);
            if (!success) {
                errors.add("Customer Service: Anonymization returned false");
            }
        } catch (Exception e) {
            logger.error("Error anonymizing customer data: {}", e.getMessage());
            errors.add("Customer Service: " + e.getMessage());
        }

        // 4. Anonymize in Delivery Service
        try {
            boolean success = deliveryServiceClient.anonymizeCustomerData(userId, authToken);
            if (!success) {
                errors.add("Delivery Service: Anonymization returned false");
            }
        } catch (Exception e) {
            logger.error("Error anonymizing delivery data: {}", e.getMessage());
            errors.add("Delivery Service: " + e.getMessage());
        }

        // 5. Anonymize local user data
        anonymizeUserData(userId);

        if (!errors.isEmpty()) {
            logger.warn("GDPR anonymization completed with errors for user: {}. Errors: {}", userId, errors);
        } else {
            logger.info("GDPR anonymization completed successfully for user: {}", userId);
        }

        createAuditLog(userId, GdprActionType.DATA_DELETED, "SYSTEM",
            "Comprehensive GDPR erasure completed. Errors: " + errors.size(), null, null);
    }

    private void anonymizeUserData(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return;
        }

        User user = userOpt.get();
        user.setActive(false);

        if (user.getPersonalInfo() != null) {
            user.getPersonalInfo().setName("DELETED_USER_" + UUID.randomUUID().toString().substring(0, 8));
            user.getPersonalInfo().setEmail("deleted_" + UUID.randomUUID().toString() + "@deleted.local");
            user.getPersonalInfo().setPhone("0000000000");
            user.getPersonalInfo().setAddress(null);
            user.getPersonalInfo().setPasswordHash(null);
        }

        user.setPreferences(null);

        userRepository.save(user);
        logger.info("User data anonymized: {}", userId);
    }

    private void updateUserData(String userId, Map<String, Object> updates) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found");
        }

        User user = userOpt.get();

        if (updates.containsKey("name") && user.getPersonalInfo() != null) {
            user.getPersonalInfo().setName((String) updates.get("name"));
        }
        if (updates.containsKey("phone") && user.getPersonalInfo() != null) {
            user.getPersonalInfo().setPhone((String) updates.get("phone"));
        }

        userRepository.save(user);
        logger.info("User data updated: {}", userId);
    }

    private void createAuditLog(String userId, GdprActionType actionType, String performedBy,
                                 String description, String ipAddress, String userAgent) {
        GdprAuditLog auditLog = new GdprAuditLog(userId, actionType, performedBy);
        auditLog.setDescription(description);
        auditLog.setIpAddress(ipAddress);
        auditLog.setUserAgent(userAgent);
        auditLog.setPerformedByType(performedBy.equals("SYSTEM") ? "SYSTEM" : "USER");
        auditLogRepository.save(auditLog);
    }
}
