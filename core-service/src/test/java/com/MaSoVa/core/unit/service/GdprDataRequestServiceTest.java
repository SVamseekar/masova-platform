package com.MaSoVa.core.unit.service;

import com.MaSoVa.shared.entity.GdprAuditLog;
import com.MaSoVa.shared.entity.GdprConsent;
import com.MaSoVa.shared.entity.GdprDataRequest;
import com.MaSoVa.shared.entity.User;
import com.MaSoVa.shared.enums.GdprRequestStatus;
import com.MaSoVa.shared.enums.GdprRequestType;
import com.MaSoVa.core.user.client.CustomerServiceClient;
import com.MaSoVa.core.user.client.DeliveryServiceClient;
import com.MaSoVa.core.user.client.OrderServiceClient;
import com.MaSoVa.core.user.client.PaymentServiceClient;
import com.MaSoVa.core.user.repository.GdprAuditLogRepository;
import com.MaSoVa.core.user.repository.GdprConsentRepository;
import com.MaSoVa.core.user.repository.GdprDataRequestRepository;
import com.MaSoVa.core.user.repository.UserRepository;
import com.MaSoVa.core.user.service.GdprDataRequestService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("GdprDataRequestService Unit Tests")
class GdprDataRequestServiceTest {

    @Mock private GdprDataRequestRepository dataRequestRepository;
    @Mock private GdprAuditLogRepository auditLogRepository;
    @Mock private UserRepository userRepository;
    @Mock private GdprConsentRepository consentRepository;
    @Mock private OrderServiceClient orderServiceClient;
    @Mock private PaymentServiceClient paymentServiceClient;
    @Mock private CustomerServiceClient customerServiceClient;
    @Mock private DeliveryServiceClient deliveryServiceClient;

    @InjectMocks private GdprDataRequestService gdprDataRequestService;

    private GdprDataRequest buildRequest(String id, String userId, GdprRequestType type) {
        GdprDataRequest req = new GdprDataRequest(userId, type);
        req.setId(id);
        req.setVerificationToken("token-" + id);
        req.setStatus(GdprRequestStatus.PENDING);
        return req;
    }

    private User buildUser(String id) {
        User user = new User();
        user.setId(id);
        User.PersonalInfo info = new User.PersonalInfo();
        info.setName("Test User");
        info.setEmail("test@masova.com");
        info.setPhone("9876543210");
        user.setPersonalInfo(info);
        user.setActive(true);
        return user;
    }

    // ===========================
    // createDataRequest
    // ===========================

    @Nested
    @DisplayName("createDataRequest")
    class CreateDataRequest {

        @Test
        @DisplayName("saves request and creates audit log")
        void savesRequestAndAuditLog() {
            GdprDataRequest saved = buildRequest("r1", "user-1", GdprRequestType.ACCESS);
            when(dataRequestRepository.save(any())).thenReturn(saved);
            when(auditLogRepository.save(any())).thenReturn(new GdprAuditLog());

            GdprDataRequest result = gdprDataRequestService.createDataRequest(
                    "user-1", GdprRequestType.ACCESS, "Test reason", "1.2.3.4", "Mozilla");

            assertThat(result.getId()).isEqualTo("r1");
            verify(dataRequestRepository).save(any());
            verify(auditLogRepository).save(any());
        }

        @Test
        @DisplayName("sets a verification token on the request")
        void setsVerificationToken() {
            when(dataRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(auditLogRepository.save(any())).thenReturn(new GdprAuditLog());

            GdprDataRequest result = gdprDataRequestService.createDataRequest(
                    "user-1", GdprRequestType.ERASURE, "Reason", null, null);

            assertThat(result.getVerificationToken()).isNotNull().isNotEmpty();
        }
    }

    // ===========================
    // verifyRequest
    // ===========================

    @Nested
    @DisplayName("verifyRequest")
    class VerifyRequest {

        @Test
        @DisplayName("throws when verification token not found")
        void throwsOnInvalidToken() {
            when(dataRequestRepository.findByVerificationToken("bad-token"))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> gdprDataRequestService.verifyRequest("bad-token"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid verification token");
        }

        @Test
        @DisplayName("sets status to VERIFIED on valid token")
        void setsVerifiedStatus() {
            GdprDataRequest request = buildRequest("r1", "user-1", GdprRequestType.ACCESS);
            when(dataRequestRepository.findByVerificationToken("token-r1"))
                    .thenReturn(Optional.of(request));
            when(dataRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            GdprDataRequest result = gdprDataRequestService.verifyRequest("token-r1");

            assertThat(result.getStatus()).isEqualTo(GdprRequestStatus.VERIFIED);
            assertThat(result.getVerifiedAt()).isNotNull();
        }
    }

    // ===========================
    // processAccessRequest
    // ===========================

    @Nested
    @DisplayName("processAccessRequest")
    class ProcessAccessRequest {

        @Test
        @DisplayName("throws when request not found")
        void throwsWhenNotFound() {
            when(dataRequestRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> gdprDataRequestService.processAccessRequest("missing"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("throws when request is not ACCESS type")
        void throwsOnWrongType() {
            GdprDataRequest request = buildRequest("r1", "user-1", GdprRequestType.ERASURE);
            when(dataRequestRepository.findById("r1")).thenReturn(Optional.of(request));

            assertThatThrownBy(() -> gdprDataRequestService.processAccessRequest("r1"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("not an access request");
        }

        @Test
        @DisplayName("exports user data and marks COMPLETED")
        void exportsDataAndCompletes() {
            GdprDataRequest request = buildRequest("r1", "user-1", GdprRequestType.ACCESS);
            User user = buildUser("user-1");
            when(dataRequestRepository.findById("r1")).thenReturn(Optional.of(request));
            when(dataRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
            when(consentRepository.findByUserId("user-1")).thenReturn(List.of());
            when(auditLogRepository.findByUserId("user-1")).thenReturn(List.of());
            when(auditLogRepository.save(any())).thenReturn(new GdprAuditLog());

            Map<String, Object> result = gdprDataRequestService.processAccessRequest("r1");

            assertThat(result).isNotEmpty();
            verify(dataRequestRepository, atLeast(2)).save(argThat(r ->
                    r.getStatus() == GdprRequestStatus.IN_PROGRESS ||
                    r.getStatus() == GdprRequestStatus.COMPLETED));
        }
    }

    // ===========================
    // processErasureRequest
    // ===========================

    @Nested
    @DisplayName("processErasureRequest")
    class ProcessErasureRequest {

        @Test
        @DisplayName("throws when request is not ERASURE type")
        void throwsOnWrongType() {
            GdprDataRequest request = buildRequest("r1", "user-1", GdprRequestType.ACCESS);
            when(dataRequestRepository.findById("r1")).thenReturn(Optional.of(request));

            assertThatThrownBy(() -> gdprDataRequestService.processErasureRequest("r1"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("not an erasure request");
        }

        @Test
        @DisplayName("anonymizes user data and marks COMPLETED")
        void anonymizesAndCompletes() {
            GdprDataRequest request = buildRequest("r1", "user-1", GdprRequestType.ERASURE);
            User user = buildUser("user-1");
            when(dataRequestRepository.findById("r1")).thenReturn(Optional.of(request));
            when(dataRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
            when(userRepository.save(any())).thenReturn(user);
            when(auditLogRepository.save(any())).thenReturn(new GdprAuditLog());

            gdprDataRequestService.processErasureRequest("r1");

            verify(dataRequestRepository, atLeast(1)).save(argThat(r ->
                    r.getStatus() == GdprRequestStatus.COMPLETED));
        }
    }

    // ===========================
    // processPortabilityRequest
    // ===========================

    @Nested
    @DisplayName("processPortabilityRequest")
    class ProcessPortabilityRequest {

        @Test
        @DisplayName("throws when request is not DATA_PORTABILITY type")
        void throwsOnWrongType() {
            GdprDataRequest request = buildRequest("r1", "user-1", GdprRequestType.ACCESS);
            when(dataRequestRepository.findById("r1")).thenReturn(Optional.of(request));

            assertThatThrownBy(() -> gdprDataRequestService.processPortabilityRequest("r1"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("not a portability request");
        }

        @Test
        @DisplayName("exports portable data with GDPR Article 20 metadata")
        void exportsPortableData() {
            GdprDataRequest request = buildRequest("r1", "user-1", GdprRequestType.DATA_PORTABILITY);
            User user = buildUser("user-1");
            when(dataRequestRepository.findById("r1")).thenReturn(Optional.of(request));
            when(dataRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
            when(consentRepository.findByUserId("user-1")).thenReturn(List.of());
            when(auditLogRepository.findByUserId("user-1")).thenReturn(List.of());
            when(auditLogRepository.save(any())).thenReturn(new GdprAuditLog());

            Map<String, Object> result = gdprDataRequestService.processPortabilityRequest("r1");

            assertThat(result).containsKey("format");
            assertThat(result.get("standardCompliance")).isEqualTo("GDPR Article 20");
        }
    }

    // ===========================
    // processRectificationRequest
    // ===========================

    @Nested
    @DisplayName("processRectificationRequest")
    class ProcessRectificationRequest {

        @Test
        @DisplayName("updates user name and phone from request")
        void updatesUserData() {
            GdprDataRequest request = buildRequest("r1", "user-1", GdprRequestType.RECTIFICATION);
            User user = buildUser("user-1");
            when(dataRequestRepository.findById("r1")).thenReturn(Optional.of(request));
            when(dataRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
            when(userRepository.save(any())).thenReturn(user);
            when(auditLogRepository.save(any())).thenReturn(new GdprAuditLog());

            Map<String, Object> updates = new HashMap<>();
            updates.put("name", "Updated Name");
            updates.put("phone", "9999999999");

            gdprDataRequestService.processRectificationRequest("r1", updates);

            verify(userRepository).save(argThat(u ->
                    "Updated Name".equals(u.getPersonalInfo().getName()) &&
                    "9999999999".equals(u.getPersonalInfo().getPhone())));
        }
    }

    // ===========================
    // exportAllCustomerData — partial failures
    // ===========================

    @Nested
    @DisplayName("exportAllCustomerData")
    class ExportAllCustomerData {

        @Test
        @DisplayName("marks export incomplete when a service client fails")
        void marksIncompleteOnClientFailure() {
            User user = buildUser("user-1");
            when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
            when(consentRepository.findByUserId("user-1")).thenReturn(List.of());
            when(auditLogRepository.findByUserId("user-1")).thenReturn(List.of());
            when(auditLogRepository.save(any())).thenReturn(new GdprAuditLog());
            when(customerServiceClient.getCustomerProfile(any(), any()))
                    .thenThrow(new RuntimeException("Customer service down"));
            when(orderServiceClient.getCustomerOrders(any(), any())).thenReturn(List.of());
            when(paymentServiceClient.getCustomerTransactions(any(), any())).thenReturn(List.of());
            when(paymentServiceClient.getCustomerPaymentMethods(any(), any())).thenReturn(List.of());
            when(deliveryServiceClient.getCustomerDeliveries(any(), any())).thenReturn(List.of());

            var result = gdprDataRequestService.exportAllCustomerData("user-1", "auth-token");

            assertThat(result.isComplete()).isFalse();
            assertThat(result.getErrors()).isNotEmpty();
        }

        @Test
        @DisplayName("marks export complete when all services succeed")
        void marksCompleteWhenAllSucceed() {
            User user = buildUser("user-1");
            when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
            when(consentRepository.findByUserId("user-1")).thenReturn(List.of());
            when(auditLogRepository.findByUserId("user-1")).thenReturn(List.of());
            when(auditLogRepository.save(any())).thenReturn(new GdprAuditLog());
            when(customerServiceClient.getCustomerProfile(any(), any())).thenReturn(Map.of());
            when(customerServiceClient.getCustomerAddresses(any(), any())).thenReturn(List.of());
            when(customerServiceClient.getCustomerLoyalty(any(), any())).thenReturn(Map.of());
            when(customerServiceClient.getCommunicationPreferences(any(), any())).thenReturn(Map.of());
            when(orderServiceClient.getCustomerOrders(any(), any())).thenReturn(List.of());
            when(paymentServiceClient.getCustomerTransactions(any(), any())).thenReturn(List.of());
            when(paymentServiceClient.getCustomerPaymentMethods(any(), any())).thenReturn(List.of());
            when(deliveryServiceClient.getCustomerDeliveries(any(), any())).thenReturn(List.of());

            var result = gdprDataRequestService.exportAllCustomerData("user-1", "auth-token");

            assertThat(result.isComplete()).isTrue();
            assertThat(result.getErrors()).isEmpty();
        }
    }

    // ===========================
    // anonymizeAllCustomerData — partial failures
    // ===========================

    @Nested
    @DisplayName("anonymizeAllCustomerData")
    class AnonymizeAllCustomerData {

        @Test
        @DisplayName("continues anonymizing other services when one fails")
        void continuesOnPartialFailure() {
            User user = buildUser("user-1");
            when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
            when(userRepository.save(any())).thenReturn(user);
            when(auditLogRepository.save(any())).thenReturn(new GdprAuditLog());
            when(orderServiceClient.anonymizeCustomerData(any(), any()))
                    .thenThrow(new RuntimeException("Order service down"));
            when(paymentServiceClient.anonymizeCustomerData(any(), any())).thenReturn(true);
            when(customerServiceClient.anonymizeCustomerData(any(), any())).thenReturn(true);
            when(deliveryServiceClient.anonymizeCustomerData(any(), any())).thenReturn(true);

            assertThatCode(() ->
                    gdprDataRequestService.anonymizeAllCustomerData("user-1", "auth-token"))
                    .doesNotThrowAnyException();

            // Verify local user data was still anonymized despite order service failure
            verify(userRepository).save(argThat(u -> !u.isActive()));
        }
    }

    // ===========================
    // getUserRequests / getOverdueRequests
    // ===========================

    @Nested
    @DisplayName("getUserRequests and getOverdueRequests")
    class Queries {

        @Test
        @DisplayName("getUserRequests returns requests for user")
        void getUserRequests() {
            GdprDataRequest req = buildRequest("r1", "user-1", GdprRequestType.ACCESS);
            when(dataRequestRepository.findByUserId("user-1")).thenReturn(List.of(req));

            List<GdprDataRequest> result = gdprDataRequestService.getUserRequests("user-1");

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("getOverdueRequests returns past-due requests")
        void getOverdueRequests() {
            GdprDataRequest req = buildRequest("r1", "user-1", GdprRequestType.ACCESS);
            when(dataRequestRepository.findByDueDateBefore(any())).thenReturn(List.of(req));

            List<GdprDataRequest> result = gdprDataRequestService.getOverdueRequests();

            assertThat(result).hasSize(1);
        }
    }
}
