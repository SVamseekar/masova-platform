package com.MaSoVa.core.notification.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BrevoConfig {

    @Value("${brevo.api-key}")
    private String apiKey;

    @Value("${brevo.from-email}")
    private String fromEmail;

    @Value("${brevo.from-name}")
    private String fromName;

    @Value("${brevo.enabled:true}")
    private boolean enabled;

    @Value("${brevo.api-url:https://api.brevo.com/v3/smtp/email}")
    private String apiUrl;

    @Value("${brevo.rate-limit.daily:300}")
    private int dailyLimit;

    @Value("${brevo.timeout.connect:5000}")
    private int connectTimeout;

    @Value("${brevo.timeout.read:10000}")
    private int readTimeout;

    public String getApiKey() {
        return apiKey;
    }

    public String getFromEmail() {
        return fromEmail;
    }

    public String getFromName() {
        return fromName;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public String getApiUrl() {
        return apiUrl;
    }

    public int getDailyLimit() {
        return dailyLimit;
    }

    public int getConnectTimeout() {
        return connectTimeout;
    }

    public int getReadTimeout() {
        return readTimeout;
    }
}
