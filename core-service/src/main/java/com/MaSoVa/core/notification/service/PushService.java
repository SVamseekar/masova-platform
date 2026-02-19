package com.MaSoVa.core.notification.service;

import com.MaSoVa.core.notification.config.FirebaseConfig;
import com.MaSoVa.core.notification.entity.Notification;
import com.google.firebase.messaging.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PushService {
    private static final Logger logger = LoggerFactory.getLogger(PushService.class);

    private final FirebaseConfig firebaseConfig;

    public PushService(FirebaseConfig firebaseConfig) {
        this.firebaseConfig = firebaseConfig;
    }

    public boolean sendPushNotification(Notification notification) {
        if (!firebaseConfig.isEnabled()) {
            logger.warn("Firebase is disabled, push notification not sent - marking as skipped");
            return true; // Return true to prevent retries when service is intentionally disabled
        }

        try {
            String deviceToken = notification.getRecipientDeviceToken();
            if (deviceToken == null || deviceToken.isEmpty()) {
                logger.error("Device token is missing");
                return false;
            }

            Message message = Message.builder()
                    .setToken(deviceToken)
                    .setNotification(com.google.firebase.messaging.Notification.builder()
                            .setTitle(notification.getTitle())
                            .setBody(notification.getMessage())
                            .build())
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            logger.info("Push notification sent successfully. Response: {}", response);
            return true;

        } catch (FirebaseMessagingException e) {
            logger.error("Failed to send push notification: {}", e.getMessage(), e);
            return false;
        }
    }

    public boolean sendBulkPushNotification(List<String> deviceTokens, String title, String body) {
        if (!firebaseConfig.isEnabled()) {
            logger.warn("Firebase is disabled, bulk push notification not sent - marking as skipped");
            return true; // Return true to prevent retries when service is intentionally disabled
        }

        try {
            MulticastMessage message = MulticastMessage.builder()
                    .setNotification(com.google.firebase.messaging.Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .addAllTokens(deviceTokens)
                    .build();

            BatchResponse response = FirebaseMessaging.getInstance().sendMulticast(message);
            logger.info("Bulk push notification sent. Success: {}, Failure: {}",
                    response.getSuccessCount(), response.getFailureCount());

            if (response.getFailureCount() > 0) {
                List<SendResponse> responses = response.getResponses();
                for (int i = 0; i < responses.size(); i++) {
                    if (!responses.get(i).isSuccessful()) {
                        logger.error("Failed to send to token {}: {}",
                                deviceTokens.get(i),
                                responses.get(i).getException().getMessage());
                    }
                }
            }

            return response.getSuccessCount() > 0;

        } catch (FirebaseMessagingException e) {
            logger.error("Failed to send bulk push notification: {}", e.getMessage(), e);
            return false;
        }
    }

    public boolean sendPushWithData(String deviceToken, String title, String body,
                                   java.util.Map<String, String> data) {
        if (!firebaseConfig.isEnabled()) {
            logger.warn("Firebase is disabled, push notification not sent - marking as skipped");
            return true; // Return true to prevent retries when service is intentionally disabled
        }

        try {
            Message message = Message.builder()
                    .setToken(deviceToken)
                    .setNotification(com.google.firebase.messaging.Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .putAllData(data)
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            logger.info("Push notification with data sent successfully. Response: {}", response);
            return true;

        } catch (FirebaseMessagingException e) {
            logger.error("Failed to send push notification with data: {}", e.getMessage(), e);
            return false;
        }
    }
}
