package com.MaSoVa.core.notification.entity;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Document(collection = "user_preferences")
public class UserPreferences {
    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;
    private String email;
    private String phone;
    private String deviceToken;

    private boolean smsEnabled;
    private boolean emailEnabled;
    private boolean pushEnabled;
    private boolean inAppEnabled;

    // Notification type preferences
    private Map<String, ChannelPreference> typePreferences;

    // Quiet hours
    private Integer quietHoursStart; // 0-23 hour
    private Integer quietHoursEnd; // 0-23 hour
    private boolean respectQuietHours;

    // Marketing preferences
    private boolean marketingEnabled;
    private boolean promotionalEnabled;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // Constructors
    public UserPreferences() {
        this.typePreferences = new HashMap<>();
        this.smsEnabled = true;
        this.emailEnabled = true;
        this.pushEnabled = true;
        this.inAppEnabled = true;
        this.marketingEnabled = false;
        this.promotionalEnabled = false;
        this.respectQuietHours = true;
    }

    public UserPreferences(String userId) {
        this();
        this.userId = userId;
    }

    // Inner class for channel preferences
    public static class ChannelPreference {
        private boolean sms;
        private boolean email;
        private boolean push;
        private boolean inApp;

        public ChannelPreference() {
            this.sms = true;
            this.email = true;
            this.push = true;
            this.inApp = true;
        }

        // Getters and Setters
        public boolean isSms() {
            return sms;
        }

        public void setSms(boolean sms) {
            this.sms = sms;
        }

        public boolean isEmail() {
            return email;
        }

        public void setEmail(boolean email) {
            this.email = email;
        }

        public boolean isPush() {
            return push;
        }

        public void setPush(boolean push) {
            this.push = push;
        }

        public boolean isInApp() {
            return inApp;
        }

        public void setInApp(boolean inApp) {
            this.inApp = inApp;
        }
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

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

    public String getDeviceToken() {
        return deviceToken;
    }

    public void setDeviceToken(String deviceToken) {
        this.deviceToken = deviceToken;
    }

    public boolean isSmsEnabled() {
        return smsEnabled;
    }

    public void setSmsEnabled(boolean smsEnabled) {
        this.smsEnabled = smsEnabled;
    }

    public boolean isEmailEnabled() {
        return emailEnabled;
    }

    public void setEmailEnabled(boolean emailEnabled) {
        this.emailEnabled = emailEnabled;
    }

    public boolean isPushEnabled() {
        return pushEnabled;
    }

    public void setPushEnabled(boolean pushEnabled) {
        this.pushEnabled = pushEnabled;
    }

    public boolean isInAppEnabled() {
        return inAppEnabled;
    }

    public void setInAppEnabled(boolean inAppEnabled) {
        this.inAppEnabled = inAppEnabled;
    }

    public Map<String, ChannelPreference> getTypePreferences() {
        return typePreferences;
    }

    public void setTypePreferences(Map<String, ChannelPreference> typePreferences) {
        this.typePreferences = typePreferences;
    }

    public Integer getQuietHoursStart() {
        return quietHoursStart;
    }

    public void setQuietHoursStart(Integer quietHoursStart) {
        this.quietHoursStart = quietHoursStart;
    }

    public Integer getQuietHoursEnd() {
        return quietHoursEnd;
    }

    public void setQuietHoursEnd(Integer quietHoursEnd) {
        this.quietHoursEnd = quietHoursEnd;
    }

    public boolean isRespectQuietHours() {
        return respectQuietHours;
    }

    public void setRespectQuietHours(boolean respectQuietHours) {
        this.respectQuietHours = respectQuietHours;
    }

    public boolean isMarketingEnabled() {
        return marketingEnabled;
    }

    public void setMarketingEnabled(boolean marketingEnabled) {
        this.marketingEnabled = marketingEnabled;
    }

    public boolean isPromotionalEnabled() {
        return promotionalEnabled;
    }

    public void setPromotionalEnabled(boolean promotionalEnabled) {
        this.promotionalEnabled = promotionalEnabled;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
