package com.MaSoVa.notification.service;

import com.MaSoVa.notification.entity.Notification;
import com.MaSoVa.notification.entity.UserPreferences;
import com.MaSoVa.notification.repository.NotificationRepository;
import com.MaSoVa.notification.repository.UserPreferencesRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class NotificationService {
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final UserPreferencesRepository userPreferencesRepository;
    private final SmsService smsService;
    private final EmailService emailService;
    private final PushService pushService;

    public NotificationService(NotificationRepository notificationRepository,
                              UserPreferencesRepository userPreferencesRepository,
                              SmsService smsService,
                              EmailService emailService,
                              PushService pushService) {
        this.notificationRepository = notificationRepository;
        this.userPreferencesRepository = userPreferencesRepository;
        this.smsService = smsService;
        this.emailService = emailService;
        this.pushService = pushService;
    }

    public Notification createNotification(Notification notification) {
        notification.setStatus(Notification.NotificationStatus.PENDING);
        notification.setRetryCount(0);
        return notificationRepository.save(notification);
    }

    @Async
    public void sendNotification(String notificationId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        if (notificationOpt.isEmpty()) {
            logger.error("Notification not found: {}", notificationId);
            return;
        }

        Notification notification = notificationOpt.get();

        // Check user preferences
        if (!shouldSendNotification(notification)) {
            notification.setStatus(Notification.NotificationStatus.CANCELLED);
            notificationRepository.save(notification);
            logger.info("Notification cancelled due to user preferences: {}", notificationId);
            return;
        }

        boolean success = false;

        try {
            switch (notification.getChannel()) {
                case SMS:
                    success = smsService.sendSms(notification);
                    break;
                case EMAIL:
                    success = emailService.sendEmail(notification);
                    break;
                case PUSH:
                    success = pushService.sendPushNotification(notification);
                    break;
                case IN_APP:
                    success = true; // In-app notifications are just stored
                    break;
            }

            if (success) {
                notification.setStatus(Notification.NotificationStatus.SENT);
                notification.setSentAt(LocalDateTime.now());
                logger.info("Notification sent successfully: {}", notificationId);
            } else {
                handleFailedNotification(notification);
            }

        } catch (Exception e) {
            logger.error("Error sending notification: {}", e.getMessage(), e);
            notification.setErrorMessage(e.getMessage());
            handleFailedNotification(notification);
        }

        notificationRepository.save(notification);
    }

    private boolean shouldSendNotification(Notification notification) {
        Optional<UserPreferences> prefsOpt = userPreferencesRepository.findByUserId(notification.getUserId());
        if (prefsOpt.isEmpty()) {
            return true; // No preferences set, allow all
        }

        UserPreferences prefs = prefsOpt.get();

        // Check channel-level preferences
        switch (notification.getChannel()) {
            case SMS:
                if (!prefs.isSmsEnabled()) return false;
                break;
            case EMAIL:
                if (!prefs.isEmailEnabled()) return false;
                break;
            case PUSH:
                if (!prefs.isPushEnabled()) return false;
                break;
            case IN_APP:
                if (!prefs.isInAppEnabled()) return false;
                break;
        }

        // Check quiet hours
        if (prefs.isRespectQuietHours() && isQuietHours(prefs)) {
            return false;
        }

        // Check promotional preferences
        if (notification.getType() == Notification.NotificationType.PROMOTIONAL) {
            return prefs.isPromotionalEnabled();
        }

        return true;
    }

    private boolean isQuietHours(UserPreferences prefs) {
        if (prefs.getQuietHoursStart() == null || prefs.getQuietHoursEnd() == null) {
            return false;
        }

        int currentHour = LocalDateTime.now().getHour();
        int start = prefs.getQuietHoursStart();
        int end = prefs.getQuietHoursEnd();

        if (start < end) {
            return currentHour >= start && currentHour < end;
        } else {
            return currentHour >= start || currentHour < end;
        }
    }

    private void handleFailedNotification(Notification notification) {
        notification.setRetryCount(notification.getRetryCount() + 1);

        if (notification.getRetryCount() >= 3) {
            notification.setStatus(Notification.NotificationStatus.FAILED);
            logger.error("Notification failed after {} attempts: {}",
                notification.getRetryCount(), notification.getId());
        } else {
            notification.setStatus(Notification.NotificationStatus.PENDING);
            logger.warn("Notification failed, will retry: {}", notification.getId());
        }
    }

    public Notification sendImmediately(String userId, String title, String message,
                                       Notification.NotificationType type,
                                       Notification.NotificationChannel channel) {
        Notification notification = new Notification(userId, title, message, type, channel);

        // Get user contact info
        Optional<UserPreferences> prefsOpt = userPreferencesRepository.findByUserId(userId);
        if (prefsOpt.isPresent()) {
            UserPreferences prefs = prefsOpt.get();
            notification.setRecipientEmail(prefs.getEmail());
            notification.setRecipientPhone(prefs.getPhone());
            notification.setRecipientDeviceToken(prefs.getDeviceToken());
        }

        notification = createNotification(notification);
        sendNotification(notification.getId());
        return notification;
    }

    public Page<Notification> getUserNotifications(String userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public List<Notification> getUnreadNotifications(String userId) {
        return notificationRepository.findByUserIdAndReadAtIsNull(userId);
    }

    public Long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadAtIsNull(userId);
    }

    public Notification markAsRead(String notificationId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        if (notificationOpt.isEmpty()) {
            throw new RuntimeException("Notification not found");
        }

        Notification notification = notificationOpt.get();
        notification.setReadAt(LocalDateTime.now());
        notification.setStatus(Notification.NotificationStatus.READ);
        return notificationRepository.save(notification);
    }

    public void markAllAsRead(String userId) {
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndReadAtIsNull(userId);
        LocalDateTime now = LocalDateTime.now();

        for (Notification notification : unreadNotifications) {
            notification.setReadAt(now);
            notification.setStatus(Notification.NotificationStatus.READ);
        }

        notificationRepository.saveAll(unreadNotifications);
    }

    public void deleteNotification(String notificationId) {
        notificationRepository.deleteById(notificationId);
    }

    public List<Notification> getRecentNotifications(String userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return notificationRepository.findByUserIdAndCreatedAtAfter(userId, since);
    }
}
