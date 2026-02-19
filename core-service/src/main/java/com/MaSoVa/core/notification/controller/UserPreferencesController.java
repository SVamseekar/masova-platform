package com.MaSoVa.core.notification.controller;

import com.MaSoVa.core.notification.entity.UserPreferences;
import com.MaSoVa.core.notification.service.UserPreferencesService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/preferences")
public class UserPreferencesController {

    private final UserPreferencesService userPreferencesService;

    public UserPreferencesController(UserPreferencesService userPreferencesService) {
        this.userPreferencesService = userPreferencesService;
    }

    private String getStoreIdFromHeaders(HttpServletRequest request) {
        String userType = request.getHeader("X-User-Type");
        String selectedStoreId = request.getHeader("X-Selected-Store-Id");
        String userStoreId = request.getHeader("X-User-Store-Id");

        if ("MANAGER".equals(userType) || "CUSTOMER".equals(userType)) {
            return selectedStoreId != null ? selectedStoreId : userStoreId;
        }
        return userStoreId;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<UserPreferences> getPreferences(@PathVariable String userId) {
        UserPreferences preferences = userPreferencesService.getOrCreatePreferences(userId);
        return ResponseEntity.ok(preferences);
    }

    @PutMapping("/user/{userId}")
    public ResponseEntity<UserPreferences> updatePreferences(
            @PathVariable String userId,
            @RequestBody UserPreferences preferences) {
        UserPreferences updated = userPreferencesService.updatePreferences(userId, preferences);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/user/{userId}/channel/{channel}")
    public ResponseEntity<UserPreferences> updateChannelPreference(
            @PathVariable String userId,
            @PathVariable String channel,
            @RequestParam boolean enabled) {
        UserPreferences updated = userPreferencesService.updateChannelPreference(userId, channel, enabled);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/user/{userId}/device-token")
    public ResponseEntity<UserPreferences> updateDeviceToken(
            @PathVariable String userId,
            @RequestBody DeviceTokenRequest request) {
        UserPreferences updated = userPreferencesService.updateDeviceToken(userId, request.getDeviceToken());
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/user/{userId}/contact")
    public ResponseEntity<UserPreferences> updateContactInfo(
            @PathVariable String userId,
            @RequestBody ContactInfoRequest request) {
        UserPreferences updated = userPreferencesService.updateContactInfo(
                userId, request.getEmail(), request.getPhone());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/user/{userId}")
    public ResponseEntity<Void> deletePreferences(@PathVariable String userId) {
        userPreferencesService.deletePreferences(userId);
        return ResponseEntity.ok().build();
    }

    // Inner classes for requests
    public static class DeviceTokenRequest {
        private String deviceToken;

        public String getDeviceToken() {
            return deviceToken;
        }

        public void setDeviceToken(String deviceToken) {
            this.deviceToken = deviceToken;
        }
    }

    public static class ContactInfoRequest {
        private String email;
        private String phone;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }
    }
}
