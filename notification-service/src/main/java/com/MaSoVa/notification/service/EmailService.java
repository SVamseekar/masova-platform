package com.MaSoVa.notification.service;

import com.MaSoVa.notification.config.BrevoConfig;
import com.MaSoVa.notification.entity.Notification;
import com.MaSoVa.shared.util.PiiMasker;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private static final String RATE_LIMIT_KEY_PREFIX = "brevo:email:count:";

    private final BrevoConfig brevoConfig;
    private final ObjectMapper objectMapper;
    private final RedisTemplate<String, String> redisTemplate;

    public EmailService(BrevoConfig brevoConfig,
                       ObjectMapper objectMapper,
                       RedisTemplate<String, String> redisTemplate) {
        this.brevoConfig = brevoConfig;
        this.objectMapper = objectMapper;
        this.redisTemplate = redisTemplate;
    }

    // ========== PUBLIC API METHODS (Maintain existing signatures) ==========

    public boolean sendEmail(Notification notification) {
        if (!brevoConfig.isEnabled()) {
            logger.warn("Brevo is disabled, email not sent - marking as skipped");
            return true; // Return true to prevent retries when service is intentionally disabled
        }

        try {
            String toEmail = notification.getRecipientEmail();
            if (toEmail == null || toEmail.isEmpty()) {
                logger.error("Recipient email is missing");
                return false;
            }

            // Check rate limit
            if (!checkRateLimit()) {
                logger.error("Daily email limit reached ({} emails). Email not sent to {}",
                    brevoConfig.getDailyLimit(), PiiMasker.maskEmail(toEmail));
                return false;
            }

            String subject = notification.getTitle();
            String htmlContent = notification.getMessage();

            boolean success = sendBrevoEmail(toEmail, subject, htmlContent);

            if (success) {
                incrementEmailCount();
                logger.info("Email sent successfully to {}", PiiMasker.maskEmail(toEmail));
            }

            return success;

        } catch (Exception e) {
            logger.error("Failed to send email: {}", e.getMessage(), e);
            return false;
        }
    }

    public boolean sendEmail(String toEmail, String subject, String body) {
        return sendTemplateEmail(toEmail, subject, body);
    }

    public boolean sendBulkEmail(String[] emails, String subject, String content) {
        if (!brevoConfig.isEnabled()) {
            logger.warn("Brevo is disabled, bulk email not sent - marking as skipped");
            return true; // Return true to prevent retries when service is intentionally disabled
        }

        int successCount = 0;
        int skippedCount = 0;

        for (String emailAddress : emails) {
            // Check rate limit for each email
            if (!checkRateLimit()) {
                logger.warn("Daily email limit reached. Skipping remaining {} emails",
                    emails.length - successCount - skippedCount);
                skippedCount = emails.length - successCount;
                break;
            }

            try {
                boolean success = sendBrevoEmail(emailAddress, subject, content);

                if (success) {
                    incrementEmailCount();
                    logger.info("Bulk email sent successfully to {}", PiiMasker.maskEmail(emailAddress));
                    successCount++;
                } else {
                    logger.error("Failed to send bulk email to {}", PiiMasker.maskEmail(emailAddress));
                }

            } catch (Exception e) {
                logger.error("Failed to send bulk email to {}: {}",
                    PiiMasker.maskEmail(emailAddress), e.getMessage());
            }
        }

        logger.info("Bulk email completed: {}/{} successful, {} skipped due to rate limit",
            successCount, emails.length, skippedCount);
        return successCount > 0;
    }

    public boolean sendTemplateEmail(String toEmail, String subject, String htmlContent) {
        if (!brevoConfig.isEnabled()) {
            logger.warn("Brevo is disabled, template email not sent - marking as skipped");
            return true; // Return true to prevent retries when service is intentionally disabled
        }

        try {
            if (!checkRateLimit()) {
                logger.error("Daily email limit reached. Email not sent to {}",
                    PiiMasker.maskEmail(toEmail));
                return false;
            }

            boolean success = sendBrevoEmail(toEmail, subject, htmlContent);

            if (success) {
                incrementEmailCount();
            }

            return success;

        } catch (Exception e) {
            logger.error("Failed to send template email: {}", e.getMessage(), e);
            return false;
        }
    }

    // ========== PRIVATE HELPER METHODS ==========

    /**
     * Core method to send email via Brevo REST API
     */
    private boolean sendBrevoEmail(String toEmail, String subject, String htmlContent) throws IOException {
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpPost httpPost = new HttpPost(brevoConfig.getApiUrl());

            // Set headers
            httpPost.setHeader("accept", "application/json");
            httpPost.setHeader("api-key", brevoConfig.getApiKey());
            httpPost.setHeader("content-type", "application/json");

            // Build request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("sender", Map.of(
                "name", brevoConfig.getFromName(),
                "email", brevoConfig.getFromEmail()
            ));
            requestBody.put("to", List.of(Map.of("email", toEmail)));
            requestBody.put("subject", subject);
            requestBody.put("htmlContent", htmlContent);

            String jsonBody = objectMapper.writeValueAsString(requestBody);
            httpPost.setEntity(new StringEntity(jsonBody, StandardCharsets.UTF_8));

            // Execute request
            try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
                int statusCode = response.getCode();

                if (statusCode >= 200 && statusCode < 300) {
                    logger.debug("Brevo API response: {}", statusCode);
                    return true;
                } else {
                    String errorBody = new String(response.getEntity().getContent().readAllBytes(),
                        StandardCharsets.UTF_8);
                    logger.error("Brevo API error. Status: {}, Body: {}", statusCode, errorBody);
                    return false;
                }
            }
        }
    }

    /**
     * Check if daily rate limit is reached
     */
    private boolean checkRateLimit() {
        String key = getRateLimitKey();
        String countStr = redisTemplate.opsForValue().get(key);

        int currentCount = (countStr != null) ? Integer.parseInt(countStr) : 0;

        // Log warnings at thresholds
        checkThresholdWarnings(currentCount);

        return currentCount < brevoConfig.getDailyLimit();
    }

    /**
     * Increment email count in Redis
     */
    private void incrementEmailCount() {
        String key = getRateLimitKey();
        Long count = redisTemplate.opsForValue().increment(key);

        // Set expiration at midnight
        if (count != null && count == 1) {
            redisTemplate.expire(key, 1, TimeUnit.DAYS);
        }

        logger.debug("Daily email count: {}/{}", count, brevoConfig.getDailyLimit());
    }

    /**
     * Get Redis key for rate limiting (format: brevo:email:count:2025-12-23)
     */
    private String getRateLimitKey() {
        return RATE_LIMIT_KEY_PREFIX + LocalDate.now().toString();
    }

    /**
     * Log warnings when approaching rate limits
     */
    private void checkThresholdWarnings(int count) {
        int limit = brevoConfig.getDailyLimit();
        double percentage = (count / (double) limit) * 100;

        if (percentage >= 97) {
            logger.error("CRITICAL: Email limit almost reached ({}/{})", count, limit);
        } else if (percentage >= 83) {
            logger.warn("WARNING: Email limit 83% reached ({}/{})", count, limit);
        }
    }

    /**
     * Get current daily email count
     */
    public int getDailyEmailCount() {
        String key = getRateLimitKey();
        String countStr = redisTemplate.opsForValue().get(key);
        return (countStr != null) ? Integer.parseInt(countStr) : 0;
    }

    /**
     * Get remaining emails for today
     */
    public int getRemainingDailyEmails() {
        return brevoConfig.getDailyLimit() - getDailyEmailCount();
    }
}
