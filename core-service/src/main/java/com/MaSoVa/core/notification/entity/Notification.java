package com.MaSoVa.core.notification.entity;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "notifications")
@CompoundIndexes({
    @CompoundIndex(def = "{'userId': 1, 'status': 1}"),
    @CompoundIndex(def = "{'userId': 1, 'createdAt': -1}"),
    @CompoundIndex(def = "{'scheduledFor': 1, 'status': 1}"),
    @CompoundIndex(def = "{'status': 1, 'retryCount': 1}")
})
public class Notification {
    @Id
    private String id;

    @Indexed
    private String userId;
    private String title;
    private String message;
    private NotificationType type;
    private NotificationChannel channel;
    private NotificationStatus status;
    private NotificationPriority priority;

    private String templateId;
    private Map<String, Object> templateData;

    private String recipientEmail;
    private String recipientPhone;
    private String recipientDeviceToken;

    private LocalDateTime scheduledFor;
    private LocalDateTime sentAt;
    private LocalDateTime readAt;

    private String errorMessage;
    private Integer retryCount;

    private Map<String, String> metadata;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public enum NotificationType {
        ORDER_CREATED,
        ORDER_CONFIRMED,
        ORDER_PREPARING,
        ORDER_READY,
        ORDER_PICKED_UP,
        ORDER_DELIVERED,
        ORDER_CANCELLED,
        ORDER_STATUS_UPDATE,  // Generic status update for any order status change
        PAYMENT_SUCCESS,
        PAYMENT_FAILED,
        DRIVER_ASSIGNED,
        DRIVER_ARRIVED,
        REVIEW_REQUEST,
        LOW_STOCK_ALERT,
        KITCHEN_ALERT,
        PROMOTIONAL,
        SYSTEM_ALERT
    }

    public enum NotificationChannel {
        SMS,
        EMAIL,
        PUSH,
        IN_APP
    }

    public enum NotificationStatus {
        PENDING,
        SENT,
        DELIVERED,
        READ,
        FAILED,
        CANCELLED
    }

    public enum NotificationPriority {
        LOW,
        NORMAL,
        HIGH,
        URGENT
    }

    // Constructors
    public Notification() {}

    public Notification(String userId, String title, String message, NotificationType type, NotificationChannel channel) {
        this.userId = userId;
        this.title = title;
        this.message = message;
        this.type = type;
        this.channel = channel;
        this.status = NotificationStatus.PENDING;
        this.priority = NotificationPriority.NORMAL;
        this.retryCount = 0;
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public NotificationChannel getChannel() {
        return channel;
    }

    public void setChannel(NotificationChannel channel) {
        this.channel = channel;
    }

    public NotificationStatus getStatus() {
        return status;
    }

    public void setStatus(NotificationStatus status) {
        this.status = status;
    }

    public NotificationPriority getPriority() {
        return priority;
    }

    public void setPriority(NotificationPriority priority) {
        this.priority = priority;
    }

    public String getTemplateId() {
        return templateId;
    }

    public void setTemplateId(String templateId) {
        this.templateId = templateId;
    }

    public Map<String, Object> getTemplateData() {
        return templateData;
    }

    public void setTemplateData(Map<String, Object> templateData) {
        this.templateData = templateData;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getRecipientPhone() {
        return recipientPhone;
    }

    public void setRecipientPhone(String recipientPhone) {
        this.recipientPhone = recipientPhone;
    }

    public String getRecipientDeviceToken() {
        return recipientDeviceToken;
    }

    public void setRecipientDeviceToken(String recipientDeviceToken) {
        this.recipientDeviceToken = recipientDeviceToken;
    }

    public LocalDateTime getScheduledFor() {
        return scheduledFor;
    }

    public void setScheduledFor(LocalDateTime scheduledFor) {
        this.scheduledFor = scheduledFor;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }

    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public Integer getRetryCount() {
        return retryCount;
    }

    public void setRetryCount(Integer retryCount) {
        this.retryCount = retryCount;
    }

    public Map<String, String> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, String> metadata) {
        this.metadata = metadata;
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
