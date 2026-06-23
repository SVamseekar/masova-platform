package com.MaSoVa.logistics.unit.service;

import com.MaSoVa.logistics.delivery.client.OrderServiceClient;
import com.MaSoVa.logistics.delivery.dto.DeliveryVerificationRequest;
import com.MaSoVa.logistics.delivery.dto.DeliveryVerificationResponse;
import com.MaSoVa.logistics.delivery.entity.DeliveryTracking;
import com.MaSoVa.logistics.delivery.repository.DeliveryTrackingRepository;
import com.MaSoVa.logistics.delivery.service.ProofOfDeliveryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProofOfDeliveryService Unit Tests")
class ProofOfDeliveryServiceTest {

    @Mock private DeliveryTrackingRepository deliveryTrackingRepository;
    @Mock private OrderServiceClient orderServiceClient;

    @InjectMocks private ProofOfDeliveryService proofOfDeliveryService;

    private DeliveryVerificationRequest buildRequest(String orderId, String otp) {
        DeliveryVerificationRequest req = new DeliveryVerificationRequest();
        req.setOrderId(orderId);
        req.setOtp(otp);
        return req;
    }

    private DeliveryTracking buildTracking(String status) {
        DeliveryTracking t = new DeliveryTracking();
        t.setId("track-1");
        t.setOrderId("order-1");
        t.setDriverId("driver-1");
        t.setDriverName("John Driver");
        t.setStatus(status);
        t.setPickedUpAt(LocalDateTime.now().minusMinutes(15));
        t.setEstimatedDeliveryMinutes(30);
        return t;
    }

    @Nested
    @DisplayName("generateDeliveryOtp")
    class GenerateDeliveryOtp {

        @Test
        @DisplayName("generates 4-digit OTP and stores it via OrderServiceClient")
        void generatesOtp() {
            doNothing().when(orderServiceClient).setDeliveryOtp(anyString(), anyString(), any(), any());

            String otp = proofOfDeliveryService.generateDeliveryOtp("order-1");

            assertThat(otp).hasSize(4);
            assertThat(Integer.parseInt(otp)).isBetween(1000, 9999);
            verify(orderServiceClient).setDeliveryOtp(eq("order-1"), anyString(), any(), any());
        }
    }

    @Nested
    @DisplayName("verifyDeliveryOtp")
    class VerifyDeliveryOtp {

        @Test
        @DisplayName("returns verified=true when OTP matches and not expired")
        void verifiesCorrectOtp() {
            when(orderServiceClient.getOrderDetails("order-1"))
                .thenReturn(Map.of("deliveryOtp", "1234", "orderNumber", "ORD-001"));
            doNothing().when(orderServiceClient).markOrderDelivered(anyString(), any(), anyString());
            when(deliveryTrackingRepository.findByOrderId("order-1"))
                .thenReturn(Optional.of(buildTracking("PICKED_UP")));
            when(deliveryTrackingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            DeliveryVerificationRequest req = buildRequest("order-1", "1234");
            DeliveryVerificationResponse result = proofOfDeliveryService.verifyDeliveryOtp(req);

            assertThat(result.isVerified()).isTrue();
            assertThat(result.getProofType()).isEqualTo("OTP");
        }

        @Test
        @DisplayName("returns verified=false when OTP does not match")
        void rejectsWrongOtp() {
            when(orderServiceClient.getOrderDetails("order-1"))
                .thenReturn(Map.of("deliveryOtp", "1234", "orderNumber", "ORD-001"));

            DeliveryVerificationRequest req = buildRequest("order-1", "9999");
            DeliveryVerificationResponse result = proofOfDeliveryService.verifyDeliveryOtp(req);

            assertThat(result.isVerified()).isFalse();
            assertThat(result.getMessage()).contains("Invalid OTP");
        }

        @Test
        @DisplayName("locks out after max failed OTP attempts")
        void locksOutAfterMaxFailedAttempts() {
            when(orderServiceClient.getOrderDetails("order-lock"))
                .thenReturn(Map.of("deliveryOtp", "1234", "orderNumber", "ORD-LOCK"));

            for (int i = 0; i < 5; i++) {
                DeliveryVerificationResponse attempt =
                        proofOfDeliveryService.verifyDeliveryOtp(buildRequest("order-lock", "9999"));
                assertThat(attempt.isVerified()).isFalse();
                assertThat(attempt.getMessage()).contains("Invalid OTP");
            }

            DeliveryVerificationResponse locked =
                    proofOfDeliveryService.verifyDeliveryOtp(buildRequest("order-lock", "9999"));
            assertThat(locked.isVerified()).isFalse();
            assertThat(locked.getMessage()).contains("Too many failed OTP attempts");
        }

        @Test
        @DisplayName("returns verified=false when order not found")
        void returnsErrorWhenOrderNotFound() {
            when(orderServiceClient.getOrderDetails("order-1")).thenReturn(Map.of());

            DeliveryVerificationRequest req = buildRequest("order-1", "1234");
            DeliveryVerificationResponse result = proofOfDeliveryService.verifyDeliveryOtp(req);

            assertThat(result.isVerified()).isFalse();
            assertThat(result.getMessage()).contains("Order not found");
        }

        @Test
        @DisplayName("returns verified=false when OTP is stored as null")
        void rejectsNullStoredOtp() {
            when(orderServiceClient.getOrderDetails("order-1"))
                .thenReturn(Map.of("orderNumber", "ORD-001")); // no deliveryOtp key

            DeliveryVerificationRequest req = buildRequest("order-1", "1234");
            DeliveryVerificationResponse result = proofOfDeliveryService.verifyDeliveryOtp(req);

            assertThat(result.isVerified()).isFalse();
        }

        @Test
        @DisplayName("returns verified=false when OTP has expired")
        void rejectsExpiredOtp() {
            LocalDateTime expired = LocalDateTime.now().minusMinutes(20);
            when(orderServiceClient.getOrderDetails("order-1"))
                .thenReturn(Map.of(
                    "deliveryOtp", "1234",
                    "orderNumber", "ORD-001",
                    "deliveryOtpExpiresAt", expired
                ));

            DeliveryVerificationRequest req = buildRequest("order-1", "1234");
            DeliveryVerificationResponse result = proofOfDeliveryService.verifyDeliveryOtp(req);

            assertThat(result.isVerified()).isFalse();
            assertThat(result.getMessage()).contains("expired");
        }

        @Test
        @DisplayName("completes verification with tracking update when tracking found")
        void updatesTrackingOnVerification() {
            when(orderServiceClient.getOrderDetails("order-1"))
                .thenReturn(Map.of("deliveryOtp", "5678", "orderNumber", "ORD-001"));
            doNothing().when(orderServiceClient).markOrderDelivered(anyString(), any(), anyString());
            DeliveryTracking tracking = buildTracking("IN_TRANSIT");
            when(deliveryTrackingRepository.findByOrderId("order-1")).thenReturn(Optional.of(tracking));
            when(deliveryTrackingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            DeliveryVerificationRequest req = buildRequest("order-1", "5678");
            DeliveryVerificationResponse result = proofOfDeliveryService.verifyDeliveryOtp(req);

            assertThat(result.isVerified()).isTrue();
            assertThat(result.getDeliveredBy()).isEqualTo("John Driver");
            verify(deliveryTrackingRepository).save(any());
        }
    }

    @Nested
    @DisplayName("verifyDeliveryWithPhoto")
    class VerifyDeliveryWithPhoto {

        @Test
        @DisplayName("returns error when no photo provided")
        void returnsErrorWhenNoPhoto() {
            DeliveryVerificationRequest req = new DeliveryVerificationRequest();
            req.setOrderId("order-1");
            req.setDeliveryPhotoBase64(null);

            DeliveryVerificationResponse result = proofOfDeliveryService.verifyDeliveryWithPhoto(req);

            assertThat(result.isVerified()).isFalse();
            assertThat(result.getMessage()).contains("photo is required");
        }

        @Test
        @DisplayName("returns error when order not found")
        void returnsErrorWhenOrderNotFound() {
            DeliveryVerificationRequest req = new DeliveryVerificationRequest();
            req.setOrderId("order-1");
            req.setDeliveryPhotoBase64("base64data");

            when(orderServiceClient.getOrderDetails("order-1")).thenReturn(Map.of());

            DeliveryVerificationResponse result = proofOfDeliveryService.verifyDeliveryWithPhoto(req);

            assertThat(result.isVerified()).isFalse();
            assertThat(result.getMessage()).contains("Order not found");
        }

        @Test
        @DisplayName("verifies delivery with photo when order found")
        void verifiesWithPhoto() {
            DeliveryVerificationRequest req = new DeliveryVerificationRequest();
            req.setOrderId("order-1");
            req.setDeliveryPhotoBase64("base64imagedata");

            when(orderServiceClient.getOrderDetails("order-1"))
                .thenReturn(Map.of("orderNumber", "ORD-001"));
            doNothing().when(orderServiceClient).setDeliveryProof(anyString(), anyString(), anyString(), any(), any());
            doNothing().when(orderServiceClient).markOrderDelivered(anyString(), any(), anyString());
            when(deliveryTrackingRepository.findByOrderId("order-1")).thenReturn(Optional.empty());

            DeliveryVerificationResponse result = proofOfDeliveryService.verifyDeliveryWithPhoto(req);

            assertThat(result.isVerified()).isTrue();
            assertThat(result.getProofType()).isEqualTo("PHOTO");
        }
    }

    @Nested
    @DisplayName("verifyDeliveryWithSignature")
    class VerifyDeliveryWithSignature {

        @Test
        @DisplayName("returns error when no signature provided")
        void returnsErrorWhenNoSignature() {
            DeliveryVerificationRequest req = new DeliveryVerificationRequest();
            req.setOrderId("order-1");
            req.setSignatureBase64(null);

            DeliveryVerificationResponse result = proofOfDeliveryService.verifyDeliveryWithSignature(req);

            assertThat(result.isVerified()).isFalse();
            assertThat(result.getMessage()).contains("Signature is required");
        }

        @Test
        @DisplayName("verifies delivery with signature when valid")
        void verifiesWithSignature() {
            DeliveryVerificationRequest req = new DeliveryVerificationRequest();
            req.setOrderId("order-1");
            req.setSignatureBase64("base64sigdata");

            when(orderServiceClient.getOrderDetails("order-1"))
                .thenReturn(Map.of("orderNumber", "ORD-001"));
            doNothing().when(orderServiceClient).setDeliveryProof(anyString(), anyString(), any(), anyString(), any());
            doNothing().when(orderServiceClient).markOrderDelivered(anyString(), any(), anyString());
            when(deliveryTrackingRepository.findByOrderId("order-1")).thenReturn(Optional.empty());

            DeliveryVerificationResponse result = proofOfDeliveryService.verifyDeliveryWithSignature(req);

            assertThat(result.isVerified()).isTrue();
            assertThat(result.getProofType()).isEqualTo("SIGNATURE");
        }
    }

    @Nested
    @DisplayName("markContactlessDelivery")
    class MarkContactlessDelivery {

        @Test
        @DisplayName("marks contactless delivery when order found")
        void marksContactless() {
            DeliveryVerificationRequest req = new DeliveryVerificationRequest();
            req.setOrderId("order-1");

            when(orderServiceClient.getOrderDetails("order-1"))
                .thenReturn(Map.of("orderNumber", "ORD-001", "contactlessDelivery", true));
            doNothing().when(orderServiceClient).markOrderDelivered(anyString(), any(), anyString());
            when(deliveryTrackingRepository.findByOrderId("order-1")).thenReturn(Optional.empty());

            DeliveryVerificationResponse result = proofOfDeliveryService.markContactlessDelivery(req);

            assertThat(result.isVerified()).isTrue();
            assertThat(result.getProofType()).isEqualTo("CONTACTLESS");
        }

        @Test
        @DisplayName("returns error when order not found")
        void returnsErrorWhenOrderNotFound() {
            DeliveryVerificationRequest req = new DeliveryVerificationRequest();
            req.setOrderId("order-1");

            when(orderServiceClient.getOrderDetails("order-1")).thenReturn(Map.of());

            DeliveryVerificationResponse result = proofOfDeliveryService.markContactlessDelivery(req);

            assertThat(result.isVerified()).isFalse();
        }

        @Test
        @DisplayName("uploads photo for non-contactless order when photo provided")
        void uploadsPhotoForNonContactless() {
            DeliveryVerificationRequest req = new DeliveryVerificationRequest();
            req.setOrderId("order-1");
            req.setDeliveryPhotoBase64("base64photo");

            when(orderServiceClient.getOrderDetails("order-1"))
                .thenReturn(Map.of("orderNumber", "ORD-001", "contactlessDelivery", false));
            doNothing().when(orderServiceClient).setDeliveryProof(anyString(), anyString(), anyString(), any(), any());
            doNothing().when(orderServiceClient).markOrderDelivered(anyString(), any(), anyString());
            when(deliveryTrackingRepository.findByOrderId("order-1")).thenReturn(Optional.empty());

            DeliveryVerificationResponse result = proofOfDeliveryService.markContactlessDelivery(req);

            assertThat(result.isVerified()).isTrue();
            verify(orderServiceClient).setDeliveryProof(anyString(), eq("CONTACTLESS"), anyString(), any(), any());
        }
    }
}
