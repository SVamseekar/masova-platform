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

/**
 * Razorpay (India) credentials. MaSoVa is EU-primary: Stripe is the default gateway for
 * non-IN stores. Razorpay is optional — disabled by default so local/EU boot does not
 * require real Indian PSP keys.
 */
@Configuration
public class RazorpayConfig {

    private static final Logger log = LoggerFactory.getLogger(RazorpayConfig.class);

    /** Known leaked test key — denylisted to catch stale environments. */
    static final String DENYLISTED_LEAKED_KEY_ID = "rzp_test_RjYYkXMmoArj4C";

    /** Known leaked test secret — denylisted to catch stale environments. */
    static final String DENYLISTED_LEAKED_KEY_SECRET = "Asbe0hf12kZn0VSX4ykn3Nvq";

    static final String PLACEHOLDER_WEBHOOK_SECRET = "whsec_YOUR_WEBHOOK_SECRET_HERE";

    /** Non-operational stub credentials used only when Razorpay is disabled (DI still needs a client). */
    private static final String DISABLED_KEY_ID = "rzp_test_disabled_eu_primary";
    private static final String DISABLED_KEY_SECRET = "disabled_not_for_live_use_eu_primary_ok";

    @Value("${razorpay.enabled:false}")
    private boolean enabledProperty;

    @Value("${razorpay.key-id:}")
    private String keyId;

    @Value("${razorpay.key-secret:}")
    private String keySecret;

    @Value("${razorpay.webhook-secret:whsec_disabled_dev}")
    private String webhookSecret;

    private final Environment environment;

    /** True only when real, non-denylisted credentials are loaded and enabled. */
    private boolean razorpayOperational;

    public RazorpayConfig(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    void validateConfiguration() {
        if (!enabledProperty) {
            razorpayOperational = false;
            log.warn(
                    "Razorpay disabled (razorpay.enabled=false). EU/Stripe is primary. "
                            + "Set RAZORPAY_ENABLED=true and real keys only if you need India (IN) payments.");
            return;
        }

        if (isDenylisted(keyId, keySecret)) {
            if (isProdProfile()) {
                validateRazorpayConfig(keyId, keySecret, webhookSecret, true);
            }
            razorpayOperational = false;
            log.warn(
                    "Razorpay credentials match a known leaked default — client not activated. "
                            + "Rotate keys or leave Razorpay disabled; EU stores use Stripe.");
            return;
        }

        validateRazorpayConfig(keyId, keySecret, webhookSecret, isProdProfile());
        razorpayOperational = true;
        log.info("Razorpay client credentials accepted (India gateway ready)");
    }

    @Bean
    public RazorpayClient razorpayClient() {
        try {
            if (!razorpayOperational) {
                log.info("Creating non-operational Razorpay client stub (EU-primary / Razorpay off)");
                return new RazorpayClient(DISABLED_KEY_ID, DISABLED_KEY_SECRET);
            }
            log.info("Initializing Razorpay client with key ID: {}", keyId);
            return new RazorpayClient(keyId, keySecret);
        } catch (RazorpayException e) {
            log.error("Failed to initialize Razorpay client", e);
            throw new RuntimeException("Failed to initialize Razorpay client", e);
        }
    }

    public boolean isRazorpayOperational() {
        return razorpayOperational;
    }

    public String getKeyId() {
        return razorpayOperational ? keyId : DISABLED_KEY_ID;
    }

    public String getKeySecret() {
        return razorpayOperational ? keySecret : DISABLED_KEY_SECRET;
    }

    public String getWebhookSecret() {
        return webhookSecret != null && !webhookSecret.isBlank()
                ? webhookSecret
                : PLACEHOLDER_WEBHOOK_SECRET;
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

    private static boolean isDenylisted(String keyId, String keySecret) {
        return DENYLISTED_LEAKED_KEY_ID.equals(keyId)
                || DENYLISTED_LEAKED_KEY_SECRET.equals(keySecret);
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
