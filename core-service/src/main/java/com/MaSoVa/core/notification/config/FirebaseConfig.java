package com.MaSoVa.core.notification.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;

@Configuration
public class FirebaseConfig {
    private static final Logger logger = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${firebase.credentials-path}")
    private String credentialsPath;

    @Value("${firebase.enabled:false}")
    private boolean enabled;

    @PostConstruct
    public void init() {
        if (enabled && credentialsPath != null && !credentialsPath.isEmpty()) {
            try {
                FileInputStream serviceAccount = new FileInputStream(credentialsPath);
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();

                if (FirebaseApp.getApps().isEmpty()) {
                    FirebaseApp.initializeApp(options);
                    logger.info("Firebase initialized successfully");
                }
            } catch (IOException e) {
                logger.error("Failed to initialize Firebase: {}", e.getMessage());
            }
        } else {
            logger.warn("Firebase is disabled or not configured");
        }
    }

    public boolean isEnabled() {
        return enabled;
    }
}
