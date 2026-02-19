package com.MaSoVa.logistics.delivery.service;

import com.MaSoVa.logistics.delivery.client.OrderServiceClient;
import com.MaSoVa.logistics.delivery.dto.DeliveryVerificationRequest;
import com.MaSoVa.logistics.delivery.dto.DeliveryVerificationResponse;
import com.MaSoVa.logistics.delivery.entity.DeliveryTracking;
import com.MaSoVa.logistics.delivery.repository.DeliveryTrackingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

/**
 * Service for Proof of Delivery (POD) operations
 * Implements DELIV-002: OTP generation, verification, photo/signature handling
 */
@Service
public class ProofOfDeliveryService {

    private static final Logger log = LoggerFactory.getLogger(ProofOfDeliveryService.class);

    private final DeliveryTrackingRepository deliveryTrackingRepository;
    private final OrderServiceClient orderServiceClient;
    private final SecureRandom secureRandom;

    @Value("${delivery.otp.validity-minutes:15}")
    private int otpValidityMinutes;

    public ProofOfDeliveryService(
            DeliveryTrackingRepository deliveryTrackingRepository,
            OrderServiceClient orderServiceClient) {
        this.deliveryTrackingRepository = deliveryTrackingRepository;
        this.orderServiceClient = orderServiceClient;
        this.secureRandom = new SecureRandom();
    }

    /**
     * Generate a 4-digit OTP for delivery verification
     * Called when order is dispatched
     */
    public String generateDeliveryOtp(String orderId) {
        log.info("Generating delivery OTP for order: {}", orderId);

        // Generate random 4-digit OTP
        int otp = secureRandom.nextInt(9000) + 1000; // 1000-9999
        String otpString = String.format("%04d", otp);

        // Store OTP in order via OrderServiceClient
        LocalDateTime generatedAt = LocalDateTime.now();
        LocalDateTime expiresAt = generatedAt.plusMinutes(otpValidityMinutes);

        orderServiceClient.setDeliveryOtp(orderId, otpString, generatedAt, expiresAt);

        log.info("Delivery OTP generated for order {}. Expires at {}", orderId, expiresAt);
        return otpString;
    }

    /**
     * Verify delivery using OTP
     */
    public DeliveryVerificationResponse verifyDeliveryOtp(DeliveryVerificationRequest request) {
        log.info("Verifying delivery OTP for order: {}", request.getOrderId());

        // Get order details
        Map<String, Object> order = orderServiceClient.getOrderDetails(request.getOrderId());

        if (order == null || order.isEmpty()) {
            return buildErrorResponse(request.getOrderId(), "Order not found");
        }

        String storedOtp = (String) order.get("deliveryOtp");
        String orderNumber = (String) order.get("orderNumber");

        // Check if OTP matches
        if (storedOtp == null || !storedOtp.equals(request.getOtp())) {
            log.warn("Invalid OTP for order: {}", request.getOrderId());
            return buildErrorResponse(request.getOrderId(), "Invalid OTP");
        }

        // Check if OTP is expired
        Object expiresAtObj = order.get("deliveryOtpExpiresAt");
        if (expiresAtObj != null) {
            LocalDateTime expiresAt = parseDateTime(expiresAtObj);
            if (expiresAt != null && LocalDateTime.now().isAfter(expiresAt)) {
                log.warn("OTP expired for order: {}", request.getOrderId());
                return buildErrorResponse(request.getOrderId(), "OTP has expired. Please request a new one.");
            }
        }

        // Mark delivery as verified
        return completeDeliveryVerification(request, orderNumber, "OTP");
    }

    /**
     * Verify delivery with photo proof (no OTP required)
     */
    public DeliveryVerificationResponse verifyDeliveryWithPhoto(DeliveryVerificationRequest request) {
        log.info("Verifying delivery with photo for order: {}", request.getOrderId());

        if (request.getDeliveryPhotoBase64() == null || request.getDeliveryPhotoBase64().isEmpty()) {
            return buildErrorResponse(request.getOrderId(), "Delivery photo is required");
        }

        Map<String, Object> order = orderServiceClient.getOrderDetails(request.getOrderId());
        if (order == null || order.isEmpty()) {
            return buildErrorResponse(request.getOrderId(), "Order not found");
        }

        String orderNumber = (String) order.get("orderNumber");

        // Upload photo and get URL (in production, upload to S3/GCS)
        String photoUrl = uploadDeliveryPhoto(request.getOrderId(), request.getDeliveryPhotoBase64());

        // Update order with photo URL
        orderServiceClient.setDeliveryProof(request.getOrderId(), "PHOTO", photoUrl, null, request.getDeliveryNotes());

        return completeDeliveryVerification(request, orderNumber, "PHOTO");
    }

    /**
     * Verify delivery with signature
     */
    public DeliveryVerificationResponse verifyDeliveryWithSignature(DeliveryVerificationRequest request) {
        log.info("Verifying delivery with signature for order: {}", request.getOrderId());

        if (request.getSignatureBase64() == null || request.getSignatureBase64().isEmpty()) {
            return buildErrorResponse(request.getOrderId(), "Signature is required");
        }

        Map<String, Object> order = orderServiceClient.getOrderDetails(request.getOrderId());
        if (order == null || order.isEmpty()) {
            return buildErrorResponse(request.getOrderId(), "Order not found");
        }

        String orderNumber = (String) order.get("orderNumber");

        // Upload signature and get URL
        String signatureUrl = uploadSignature(request.getOrderId(), request.getSignatureBase64());

        // Update order with signature URL
        orderServiceClient.setDeliveryProof(request.getOrderId(), "SIGNATURE", null, signatureUrl, request.getDeliveryNotes());

        return completeDeliveryVerification(request, orderNumber, "SIGNATURE");
    }

    /**
     * Mark delivery as contactless (no verification required)
     */
    public DeliveryVerificationResponse markContactlessDelivery(DeliveryVerificationRequest request) {
        log.info("Marking contactless delivery for order: {}", request.getOrderId());

        Map<String, Object> order = orderServiceClient.getOrderDetails(request.getOrderId());
        if (order == null || order.isEmpty()) {
            return buildErrorResponse(request.getOrderId(), "Order not found");
        }

        // Check if order was marked for contactless delivery
        Boolean isContactless = (Boolean) order.get("contactlessDelivery");
        if (isContactless == null || !isContactless) {
            // For contactless, still recommend taking a photo
            if (request.getDeliveryPhotoBase64() != null && !request.getDeliveryPhotoBase64().isEmpty()) {
                String photoUrl = uploadDeliveryPhoto(request.getOrderId(), request.getDeliveryPhotoBase64());
                orderServiceClient.setDeliveryProof(request.getOrderId(), "CONTACTLESS", photoUrl, null, request.getDeliveryNotes());
            }
        }

        String orderNumber = (String) order.get("orderNumber");
        return completeDeliveryVerification(request, orderNumber, "CONTACTLESS");
    }

    /**
     * Regenerate OTP (if expired or customer didn't receive)
     */
    public String regenerateOtp(String orderId) {
        log.info("Regenerating OTP for order: {}", orderId);

        Map<String, Object> order = orderServiceClient.getOrderDetails(orderId);
        if (order == null || order.isEmpty()) {
            throw new RuntimeException("Order not found: " + orderId);
        }

        String status = (String) order.get("status");
        if (!"DISPATCHED".equals(status)) {
            throw new RuntimeException("OTP can only be regenerated for dispatched orders");
        }

        return generateDeliveryOtp(orderId);
    }

    /**
     * Complete the delivery verification process
     */
    private DeliveryVerificationResponse completeDeliveryVerification(
            DeliveryVerificationRequest request, String orderNumber, String proofType) {

        LocalDateTime deliveredAt = LocalDateTime.now();

        // Update order status to DELIVERED
        orderServiceClient.markOrderDelivered(request.getOrderId(), deliveredAt, proofType);

        // Update delivery tracking
        Optional<DeliveryTracking> trackingOpt = deliveryTrackingRepository.findByOrderId(request.getOrderId());
        String driverName = null;
        String driverId = null;

        if (trackingOpt.isPresent()) {
            DeliveryTracking tracking = trackingOpt.get();
            tracking.setStatus("DELIVERED");
            tracking.setDeliveredAt(deliveredAt);
            tracking.setUpdatedAt(LocalDateTime.now());

            // Calculate actual delivery time
            if (tracking.getPickedUpAt() != null) {
                long minutes = java.time.Duration.between(tracking.getPickedUpAt(), deliveredAt).toMinutes();
                tracking.setActualDeliveryMinutes((int) minutes);

                // Check if on time
                if (tracking.getEstimatedDeliveryMinutes() != null) {
                    tracking.setOnTime(minutes <= tracking.getEstimatedDeliveryMinutes());
                }
            }

            deliveryTrackingRepository.save(tracking);
            driverName = tracking.getDriverName();
            driverId = tracking.getDriverId();
        }

        log.info("Delivery verified for order {} using {} proof", request.getOrderId(), proofType);

        return DeliveryVerificationResponse.builder()
                .orderId(request.getOrderId())
                .orderNumber(orderNumber)
                .verified(true)
                .message("Delivery verified successfully")
                .proofType(proofType)
                .deliveredAt(deliveredAt)
                .deliveredBy(driverName)
                .driverId(driverId)
                .build();
    }

    /**
     * Upload delivery photo (placeholder for actual cloud storage)
     */
    private String uploadDeliveryPhoto(String orderId, String base64Photo) {
        // In production, upload to S3/GCS and return URL
        // For now, return a placeholder URL
        String fileName = "delivery-photo-" + orderId + "-" + System.currentTimeMillis() + ".jpg";
        log.info("Uploading delivery photo for order: {} (file: {})", orderId, fileName);

        // Placeholder URL - in production, this would be a real cloud storage URL
        return "/api/delivery/photos/" + fileName;
    }

    /**
     * Upload signature image (placeholder for actual cloud storage)
     */
    private String uploadSignature(String orderId, String base64Signature) {
        // In production, upload to S3/GCS and return URL
        String fileName = "signature-" + orderId + "-" + System.currentTimeMillis() + ".png";
        log.info("Uploading signature for order: {} (file: {})", orderId, fileName);

        // Placeholder URL - in production, this would be a real cloud storage URL
        return "/api/delivery/signatures/" + fileName;
    }

    private DeliveryVerificationResponse buildErrorResponse(String orderId, String message) {
        return DeliveryVerificationResponse.builder()
                .orderId(orderId)
                .verified(false)
                .message(message)
                .build();
    }

    private LocalDateTime parseDateTime(Object dateTimeObj) {
        if (dateTimeObj instanceof LocalDateTime) {
            return (LocalDateTime) dateTimeObj;
        }
        if (dateTimeObj instanceof String) {
            try {
                return LocalDateTime.parse((String) dateTimeObj);
            } catch (Exception e) {
                log.warn("Failed to parse datetime: {}", dateTimeObj);
            }
        }
        return null;
    }
}
