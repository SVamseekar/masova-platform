package com.MaSoVa.core.notification.controller;

import com.MaSoVa.core.notification.dto.NotificationRequest;
import com.MaSoVa.core.notification.entity.Notification;
import com.MaSoVa.core.notification.service.NotificationSeedService;
import com.MaSoVa.core.notification.service.NotificationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Notifications — 5 canonical endpoints at /api/notifications.
 * Replaces: /api/notifications/user/{userId}, /user/{userId}/unread,
 *           /user/{userId}/unread-count, /user/{userId}/read-all,
 *           /user/{userId}/recent, /send
 */
@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications", description = "Send and manage notifications")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationSeedService notificationSeedService;

    public NotificationController(NotificationService notificationService,
                                  NotificationSeedService notificationSeedService) {
        this.notificationService = notificationService;
        this.notificationSeedService = notificationSeedService;
    }

    /**
     * GET /api/notifications?userId=&unread=&recent=
     * userId optional — defaults to authenticated principal (JWT sub).
     * Replaces: /user/{userId}, /user/{userId}/unread, /user/{userId}/recent
     */
    @GetMapping
    @PreAuthorize("(#userId == null or #userId == authentication.name) or hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    @Operation(summary = "List notifications (query: userId optional, unread, recent)")
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) Boolean unread,
            @RequestParam(required = false, defaultValue = "false") Boolean recent,
            Authentication authentication) {
        String resolvedUserId = resolveUserId(userId, authentication);
        if (Boolean.TRUE.equals(unread)) {
            return ResponseEntity.ok(notificationService.getUnreadNotifications(resolvedUserId));
        }
        if (Boolean.TRUE.equals(recent)) {
            return ResponseEntity.ok(notificationService.getRecentNotifications(resolvedUserId, 7));
        }
        return ResponseEntity.ok(notificationService.getUserNotifications(resolvedUserId, PageRequest.of(0, 50)).getContent());
    }

    private static String resolveUserId(String userId, Authentication authentication) {
        if (userId != null && !userId.isBlank()) {
            return userId;
        }
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new IllegalArgumentException("userId is required when not authenticated");
        }
        return authentication.getName();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER', 'STAFF')")
    @Operation(summary = "Send notification")
    public ResponseEntity<Notification> sendNotification(@RequestBody NotificationRequest request) {
        Notification notification = new Notification(
                request.getUserId(),
                request.getTitle(),
                request.getMessage(),
                request.getType(),
                request.getChannel());
        if (request.getPriority() != null) notification.setPriority(request.getPriority());
        if (request.getRecipientEmail() != null) notification.setRecipientEmail(request.getRecipientEmail());
        if (request.getRecipientPhone() != null) notification.setRecipientPhone(request.getRecipientPhone());
        if (request.getRecipientDeviceToken() != null) notification.setRecipientDeviceToken(request.getRecipientDeviceToken());
        Notification created = notificationService.createNotification(notification);
        notificationService.sendNotification(created.getId());
        return ResponseEntity.ok(created);
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mark notification as read")
    public ResponseEntity<Notification> markAsRead(@PathVariable String id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    /**
     * PATCH /api/notifications/read-all?userId=
     * userId optional — defaults to authenticated principal.
     * Replaces: PATCH /user/{userId}/read-all
     */
    @PatchMapping("/read-all")
    @PreAuthorize("(#userId == null or #userId == authentication.name) or hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    @Operation(summary = "Mark all as read (query: userId optional)")
    public ResponseEntity<Void> markAllAsRead(
            @RequestParam(required = false) String userId,
            Authentication authentication) {
        notificationService.markAllAsRead(resolveUserId(userId, authentication));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Delete notification")
    public ResponseEntity<Void> deleteNotification(@PathVariable String id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok().build();
    }

    /**
     * POST /api/notifications/seed-demo — sample IN_APP notifications for manager inbox.
     * Active when spring profile is {@code dev} or {@code demo}; otherwise 404.
     */
    @PostMapping({"/seed-demo", "/test-data/seed-demo"})
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Seed sample notifications for demo (dev/demo profile only)")
    public ResponseEntity<?> seedDemo(
            @RequestParam(required = false) String userId,
            Authentication authentication) {
        if (!notificationSeedService.isSeedAllowed()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Seed only available with spring profile dev or demo"));
        }
        try {
            String resolved = resolveUserId(userId, authentication);
            return ResponseEntity.ok(notificationSeedService.seedDemo(resolved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Seed failed", "detail", e.getMessage() != null ? e.getMessage() : "unknown"));
        }
    }
}
