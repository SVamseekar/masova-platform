package com.MaSoVa.notification.controller;

import com.MaSoVa.notification.entity.UserPreferences;
import com.MaSoVa.notification.service.UserPreferencesService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/preferences")
@CrossOrigin(origins = "*")
public class UserPreferencesController {

    private final UserPreferencesService userPreferencesService;

    public UserPreferencesController(UserPreferencesService userPreferencesService) {
        this.userPreferencesService = userPreferencesService;
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
