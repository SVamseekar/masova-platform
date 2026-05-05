package com.MaSoVa.core.notification.controller;

import com.MaSoVa.core.notification.entity.UserPreferences;
import com.MaSoVa.core.notification.service.UserPreferencesService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * User preferences — 3 canonical endpoints at /api/preferences/{userId}.
 * Replaces: /api/preferences/user/{userId} (wrong path), separate channel/device/contact endpoints.
 */
@RestController
@RequestMapping("/api/preferences")
@Tag(name = "User Preferences", description = "Notification channel, device token, and contact preferences")
@SecurityRequirement(name = "bearerAuth")
public class UserPreferencesController {

    private final UserPreferencesService userPreferencesService;

    public UserPreferencesController(UserPreferencesService userPreferencesService) {
        this.userPreferencesService = userPreferencesService;
    }

    @GetMapping("/{userId}")
    @PreAuthorize("#userId == authentication.name or hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    @Operation(summary = "Get preferences")
    public ResponseEntity<UserPreferences> getPreferences(@PathVariable String userId) {
        return ResponseEntity.ok(userPreferencesService.getOrCreatePreferences(userId));
    }

    /**
     * PATCH /api/preferences/{userId}
     * Body: any combination of channel, deviceToken, contact, preferredPaymentMethod fields.
     * Replaces: separate PUT /, PATCH /channel/*, PATCH /device-token, PATCH /contact endpoints.
     */
    @PatchMapping("/{userId}")
    @PreAuthorize("#userId == authentication.name or hasRole('MANAGER') or hasRole('ASSISTANT_MANAGER')")
    @Operation(summary = "Update preferences (any field: channel, deviceToken, contact, preferredPaymentMethod)")
    public ResponseEntity<UserPreferences> updatePreferences(
            @PathVariable String userId,
            @RequestBody UserPreferences preferences) {
        return ResponseEntity.ok(userPreferencesService.updatePreferences(userId, preferences));
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("#userId == authentication.name or hasRole('MANAGER')")
    @Operation(summary = "Delete preferences")
    public ResponseEntity<Void> deletePreferences(@PathVariable String userId) {
        userPreferencesService.deletePreferences(userId);
        return ResponseEntity.ok().build();
    }
}
