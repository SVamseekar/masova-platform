package com.MaSoVa.core.notification.service;

import com.MaSoVa.core.notification.entity.Notification;
import com.MaSoVa.core.notification.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Dev/demo seed for manager notification inbox.
 * Active only when spring profiles include {@code dev} or {@code demo}.
 */
@Service
public class NotificationSeedService {

    private static final Logger log = LoggerFactory.getLogger(NotificationSeedService.class);

    private final NotificationRepository notificationRepository;
    private final Environment environment;

    public NotificationSeedService(NotificationRepository notificationRepository, Environment environment) {
        this.notificationRepository = notificationRepository;
        this.environment = environment;
    }

    public boolean isSeedAllowed() {
        return environment.acceptsProfiles(Profiles.of("dev", "demo"));
    }

    /**
     * Seed a handful of IN_APP notifications for the given manager userId.
     * Idempotent: skips creating a seed if one with the same metadata seedKey already exists.
     */
    public Map<String, Object> seedDemo(String userId) {
        if (!isSeedAllowed()) {
            throw new IllegalStateException("Notification seed is only available under dev/demo profiles");
        }
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }

        List<String> createdIds = new ArrayList<>();
        List<SeedSpec> specs = List.of(
                new SeedSpec("seed-notif-low-stock", "Low stock alert",
                        "Berlin store: mozzarella is below reorder level.",
                        Notification.NotificationType.LOW_STOCK_ALERT,
                        Notification.NotificationPriority.HIGH),
                new SeedSpec("seed-notif-kitchen", "Kitchen equipment",
                        "Main deck oven reported elevated temperature.",
                        Notification.NotificationType.KITCHEN_ALERT,
                        Notification.NotificationPriority.NORMAL),
                new SeedSpec("seed-notif-order", "Order update",
                        "Order #DEMO-1001 was marked DELIVERED.",
                        Notification.NotificationType.ORDER_DELIVERED,
                        Notification.NotificationPriority.NORMAL),
                new SeedSpec("seed-notif-system", "System",
                        "Weekly executive summary is ready in Analytics.",
                        Notification.NotificationType.SYSTEM_ALERT,
                        Notification.NotificationPriority.LOW)
        );

        for (SeedSpec spec : specs) {
            List<Notification> existing = notificationRepository.findByUserId(userId);
            boolean already = existing.stream()
                    .anyMatch(n -> n.getMetadata() != null && spec.key().equals(n.getMetadata().get("seedKey")));
            if (already) {
                continue;
            }
            Notification n = new Notification(
                    userId,
                    spec.title(),
                    spec.message(),
                    spec.type(),
                    Notification.NotificationChannel.IN_APP);
            n.setStatus(Notification.NotificationStatus.SENT);
            n.setPriority(spec.priority());
            n.setSentAt(LocalDateTime.now().minusHours(1));
            n.setRetryCount(0);
            Map<String, String> meta = new LinkedHashMap<>();
            meta.put("seedKey", spec.key());
            meta.put("storeId", "DOM001");
            n.setMetadata(meta);
            Notification saved = notificationRepository.save(n);
            createdIds.add(saved.getId());
        }

        long total = notificationRepository.findByUserId(userId).size();
        log.info("Notification seed-demo for userId={} created={} total={}", userId, createdIds.size(), total);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userId", userId);
        result.put("createdIds", createdIds);
        result.put("createdCount", createdIds.size());
        result.put("totalForUser", total);
        return result;
    }

    private record SeedSpec(
            String key,
            String title,
            String message,
            Notification.NotificationType type,
            Notification.NotificationPriority priority) {}
}
