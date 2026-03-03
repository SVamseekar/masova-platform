package com.MaSoVa.core.notification.controller;

import com.MaSoVa.core.notification.dto.NotificationRequest;
import com.MaSoVa.core.notification.entity.Notification;
import com.MaSoVa.core.notification.service.NotificationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * GET /api/notifications?userId=&unread=&recent=
     * Replaces: /user/{userId}, /user/{userId}/unread, /user/{userId}/recent
     */
    @GetMapping
    @Operation(summary = "List notifications (query: userId, unread, recent)")
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestParam String userId,
            @RequestParam(required = false) Boolean unread,
            @RequestParam(required = false, defaultValue = "false") Boolean recent) {
        if (Boolean.TRUE.equals(unread)) {
            return ResponseEntity.ok(notificationService.getUnreadNotifications(userId));
        }
        if (Boolean.TRUE.equals(recent)) {
            return ResponseEntity.ok(notificationService.getRecentNotifications(userId, 7));
        }
        return ResponseEntity.ok(notificationService.getUserNotifications(userId, PageRequest.of(0, 50)).getContent());
    }

    @PostMapping
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
    @Operation(summary = "Mark notification as read")
    public ResponseEntity<Notification> markAsRead(@PathVariable String id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    /**
     * PATCH /api/notifications/read-all?userId=
     * Replaces: PATCH /user/{userId}/read-all
     */
    @PatchMapping("/read-all")
    @Operation(summary = "Mark all as read (query: userId)")
    public ResponseEntity<Void> markAllAsRead(@RequestParam String userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete notification")
    public ResponseEntity<Void> deleteNotification(@PathVariable String id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok().build();
    }
}
