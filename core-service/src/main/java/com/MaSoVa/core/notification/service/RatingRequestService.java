package com.MaSoVa.core.notification.service;

import com.MaSoVa.core.notification.entity.Notification;
import com.MaSoVa.core.notification.entity.Notification.NotificationType;
import com.MaSoVa.core.notification.entity.Notification.NotificationChannel;
import com.MaSoVa.core.notification.entity.Notification.NotificationStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service for sending rating requests via SMS/Email after order delivery
 */
@Service
public class RatingRequestService {

    private static final Logger log = LoggerFactory.getLogger(RatingRequestService.class);

    private final EmailService emailService;
    private final SmsService smsService;

    @Value("${app.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @Value("${app.rating.enabled:true}")
    private boolean ratingRequestEnabled;

    public RatingRequestService(EmailService emailService, SmsService smsService) {
        this.emailService = emailService;
        this.smsService = smsService;
    }

    /**
     * Send rating request via SMS and Email
     * Called by Order Service after delivery is completed
     */
    public void sendRatingRequest(String orderId, String orderNumber, String customerPhone, String customerEmail, String ratingToken) {
        if (!ratingRequestEnabled) {
            log.debug("Rating requests are disabled");
            return;
        }

        String ratingUrl = String.format("%s/rate/%s/%s", frontendBaseUrl, orderId, ratingToken);

        // Send SMS (higher response rate)
        if (customerPhone != null && !customerPhone.isEmpty()) {
            sendRatingSms(customerPhone, orderNumber, ratingUrl);
        }

        // Send Email (fallback)
        if (customerEmail != null && !customerEmail.isEmpty()) {
            sendRatingEmail(customerEmail, orderNumber, ratingUrl);
        }

        log.info("Rating request sent for order {} to phone: {}, email: {}",
                 orderId,
                 customerPhone != null ? maskPhone(customerPhone) : "N/A",
                 customerEmail != null ? maskEmail(customerEmail) : "N/A");
    }

    /**
     * Send rating request via SMS
     */
    private void sendRatingSms(String phone, String orderNumber, String ratingUrl) {
        try {
            String message = buildSmsMessage(orderNumber, ratingUrl);

            // Create Notification object (required by SmsService)
            Notification notification = new Notification(
                "anonymous",  // userId (customer might not be registered)
                "Rate Your Order",  // title
                message,  // message
                NotificationType.REVIEW_REQUEST,
                NotificationChannel.SMS
            );
            notification.setRecipientPhone(phone);
            notification.setStatus(NotificationStatus.PENDING);

            smsService.sendSms(notification);
            log.info("Rating SMS sent successfully to {}", maskPhone(phone));
        } catch (Exception e) {
            log.error("Failed to send rating SMS to {}: {}", maskPhone(phone), e.getMessage());
        }
    }

    /**
     * Send rating request via Email
     */
    private void sendRatingEmail(String email, String orderNumber, String ratingUrl) {
        try {
            String subject = "How was your MaSoVa experience?";
            String body = buildEmailBody(orderNumber, ratingUrl);
            emailService.sendEmail(email, subject, body);
            log.info("Rating email sent successfully to {}", maskEmail(email));
        } catch (Exception e) {
            log.error("Failed to send rating email to {}: {}", maskEmail(email), e.getMessage());
        }
    }

    /**
     * Build SMS message with rating link
     */
    private String buildSmsMessage(String orderNumber, String ratingUrl) {
        return String.format(
            "Thanks for ordering from MaSoVa! 🍕\n\n" +
            "Order #%s\n\n" +
            "How was your experience? Rate us here:\n%s\n\n" +
            "Takes only 30 seconds!\n" +
            "- MaSoVa Team",
            orderNumber,
            ratingUrl
        );
    }

    /**
     * Build Email body with rating link
     */
    private String buildEmailBody(String orderNumber, String ratingUrl) {
        return String.format(
            "<html>" +
            "<body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>" +
            "  <div style='text-align: center; margin-bottom: 30px;'>" +
            "    <h1 style='color: #FF6B35; font-size: 32px; margin-bottom: 10px;'>🍕 MaSoVa</h1>" +
            "    <h2 style='color: #333; font-size: 24px; font-weight: normal;'>How was your experience?</h2>" +
            "  </div>" +
            "  " +
            "  <div style='background: #f9f9f9; padding: 20px; border-radius: 10px; margin-bottom: 20px;'>" +
            "    <p style='color: #666; font-size: 16px; line-height: 1.6;'>" +
            "      Hi there! 👋<br><br>" +
            "      Thank you for choosing MaSoVa for your recent order <strong>#%s</strong>.<br><br>" +
            "      We'd love to hear about your experience! Your feedback helps us improve and serve you better." +
            "    </p>" +
            "  </div>" +
            "  " +
            "  <div style='text-align: center; margin: 30px 0;'>" +
            "    <a href='%s' style='display: inline-block; background: linear-gradient(135deg, #FF6B35 0%%, #FF8C42 100%%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);'>" +
            "      ⭐ Rate Your Order" +
            "    </a>" +
            "  </div>" +
            "  " +
            "  <div style='text-align: center; color: #999; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;'>" +
            "    <p>Takes only 30 seconds | Your privacy is protected</p>" +
            "    <p style='margin-top: 10px;'>© 2025 MaSoVa. All rights reserved.</p>" +
            "  </div>" +
            "</body>" +
            "</html>",
            orderNumber,
            ratingUrl
        );
    }

    /**
     * Mask phone number for logging
     */
    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return "****";
        return phone.substring(0, 2) + "****" + phone.substring(phone.length() - 2);
    }

    /**
     * Mask email for logging
     */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "****";
        String[] parts = email.split("@");
        String localPart = parts[0];
        if (localPart.length() <= 2) {
            return "**@" + parts[1];
        }
        return localPart.substring(0, 2) + "****@" + parts[1];
    }
}
