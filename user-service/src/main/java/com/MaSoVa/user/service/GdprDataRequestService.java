package com.MaSoVa.user.service;

import com.MaSoVa.shared.entity.GdprDataRequest;
import com.MaSoVa.shared.entity.GdprAuditLog;
import com.MaSoVa.shared.entity.User;
import com.MaSoVa.shared.enums.GdprRequestType;
import com.MaSoVa.shared.enums.GdprRequestStatus;
import com.MaSoVa.shared.enums.GdprActionType;
import com.MaSoVa.user.repository.GdprDataRequestRepository;
import com.MaSoVa.user.repository.GdprAuditLogRepository;
import com.MaSoVa.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class GdprDataRequestService {

    private static final Logger logger = LoggerFactory.getLogger(GdprDataRequestService.class);

    @Autowired
    private GdprDataRequestRepository dataRequestRepository;

    @Autowired
    private GdprAuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
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

    @Transactional
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

    @Transactional
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

    @Transactional
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

    @Transactional
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

    @Transactional
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
