package com.MaSoVa.payment.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Stripe SDK configuration. Secret key is set once at startup via Stripe.apiKey.
 * Keys are injected from environment variables — never hardcoded.
 */
@Configuration
@ConfigurationProperties(prefix = "stripe")
public class StripeConfig {

    private static final Logger log = LoggerFactory.getLogger(StripeConfig.class);

    private String secretKey;
    private String webhookSecret;
    private String publishableKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
        log.info("Stripe SDK initialised. Publishable key prefix: {}",
                 publishableKey != null && publishableKey.length() > 7
                     ? publishableKey.substring(0, 7) + "..."
                     : "NOT_SET");
    }

    public String getSecretKey() { return secretKey; }
    public void setSecretKey(String secretKey) { this.secretKey = secretKey; }

    public String getWebhookSecret() { return webhookSecret; }
    public void setWebhookSecret(String webhookSecret) { this.webhookSecret = webhookSecret; }

    public String getPublishableKey() { return publishableKey; }
    public void setPublishableKey(String publishableKey) { this.publishableKey = publishableKey; }
}
