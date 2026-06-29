package com.MaSoVa.payment.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class RazorpayConfig {

    private static final Logger log = LoggerFactory.getLogger(RazorpayConfig.class);

    /** Known leaked test key — denylisted for one release to catch stale environments. */
    static final String DENYLISTED_LEAKED_KEY_ID = "rzp_test_RjYYkXMmoArj4C";

    /** Known leaked test secret — denylisted for one release to catch stale environments. */
    static final String DENYLISTED_LEAKED_KEY_SECRET = "Asbe0hf12kZn0VSX4ykn3Nvq";

    static final String PLACEHOLDER_WEBHOOK_SECRET = "whsec_YOUR_WEBHOOK_SECRET_HERE";

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    @Value("${razorpay.webhook-secret}")
    private String webhookSecret;

    private final Environment environment;

    public RazorpayConfig(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    void validateConfiguration() {
        validateRazorpayConfig(keyId, keySecret, webhookSecret, isProdProfile());
    }

    @Bean
    public RazorpayClient razorpayClient() {
        try {
            log.info("Initializing Razorpay client with key ID: {}", keyId);
            return new RazorpayClient(keyId, keySecret);
        } catch (RazorpayException e) {
            log.error("Failed to initialize Razorpay client", e);
            throw new RuntimeException("Failed to initialize Razorpay client", e);
        }
    }

    public String getKeyId() {
        return keyId;
    }

    public String getKeySecret() {
        return keySecret;
    }

    public String getWebhookSecret() {
        return webhookSecret;
    }

    /**
     * Fail-fast validation for Razorpay credentials (security remediation Task 9).
     *
     * @param prodProfile when true, webhook secret must not be the documented placeholder
     */
    static void validateRazorpayConfig(
            String keyId, String keySecret, String webhookSecret, boolean prodProfile) {
        if (keyId == null || keyId.isBlank()) {
            throw new IllegalStateException(
                    "RAZORPAY_KEY_ID is not configured. Set RAZORPAY_KEY_ID or razorpay.key-id.");
        }
        if (keySecret == null || keySecret.isBlank()) {
            throw new IllegalStateException(
                    "RAZORPAY_KEY_SECRET is not configured. Set RAZORPAY_KEY_SECRET or razorpay.key-secret.");
        }
        if (webhookSecret == null || webhookSecret.isBlank()) {
            throw new IllegalStateException(
                    "RAZORPAY_WEBHOOK_SECRET is not configured. Set RAZORPAY_WEBHOOK_SECRET or "
                            + "razorpay.webhook-secret.");
        }
        if (DENYLISTED_LEAKED_KEY_ID.equals(keyId)) {
            throw new IllegalStateException(
                    "RAZORPAY_KEY_ID matches a known leaked default. Rotate the key in the "
                            + "Razorpay dashboard and set a new RAZORPAY_KEY_ID.");
        }
        if (DENYLISTED_LEAKED_KEY_SECRET.equals(keySecret)) {
            throw new IllegalStateException(
                    "RAZORPAY_KEY_SECRET matches a known leaked default. Rotate the key in the "
                            + "Razorpay dashboard and set a new RAZORPAY_KEY_SECRET.");
        }
        if (prodProfile && PLACEHOLDER_WEBHOOK_SECRET.equals(webhookSecret)) {
            throw new IllegalStateException(
                    "RAZORPAY_WEBHOOK_SECRET is the documented placeholder. Set a real webhook "
                            + "secret from the Razorpay dashboard for production.");
        }
    }

    private boolean isProdProfile() {
        for (String profile : environment.getActiveProfiles()) {
            if ("prod".equals(profile)) {
                return true;
            }
        }
        return false;
    }
}