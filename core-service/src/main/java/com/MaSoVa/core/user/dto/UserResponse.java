package com.MaSoVa.core.user.dto;

import com.MaSoVa.shared.enums.UserType;
import com.MaSoVa.shared.model.Address;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {
    private String id;
    private UserType type;
    private String name;
    private String email;
    private String phone;
    private Address address;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    private boolean isActive;
    private String storeId;
    private String role;
    private List<String> permissions;
    private String status; // Employee status: AVAILABLE, ON_DUTY, OFF_DUTY, BUSY
    private Double rating; // Driver rating
    private Integer activeDeliveryCount; // For drivers
    private String activeDeliveryId; // Current delivery ID
    private boolean isOnline; // Derived from working session status
    private String generatedPIN; // 5-digit PIN generated on employee creation (shown only once)

    public UserResponse() {}
    
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public UserType getType() { return type; }
    public void setType(UserType type) { this.type = type; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public Address getAddress() { return address; }
    public void setAddress(Address address) { this.address = address; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }
    
    public boolean getIsActive() { return isActive; }
    public void setIsActive(boolean active) { isActive = active; }
    
    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public List<String> getPermissions() { return permissions; }
    public void setPermissions(List<String> permissions) { this.permissions = permissions; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public Integer getActiveDeliveryCount() { return activeDeliveryCount; }
    public void setActiveDeliveryCount(Integer activeDeliveryCount) { this.activeDeliveryCount = activeDeliveryCount; }

    public String getActiveDeliveryId() { return activeDeliveryId; }
    public void setActiveDeliveryId(String activeDeliveryId) { this.activeDeliveryId = activeDeliveryId; }

    public boolean getIsOnline() { return isOnline; }
    public void setIsOnline(boolean isOnline) { this.isOnline = isOnline; }

    public String getGeneratedPIN() { return generatedPIN; }
    public void setGeneratedPIN(String generatedPIN) { this.generatedPIN = generatedPIN; }
}