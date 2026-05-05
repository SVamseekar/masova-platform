package com.MaSoVa.core.customer.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import jakarta.validation.constraints.*;
import org.springframework.data.annotation.*;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Document(collection = "customers")
@CompoundIndexes({
    @CompoundIndex(def = "{'storeId': 1, 'active': 1}"),
    @CompoundIndex(def = "{'storeIds': 1, 'active': 1}"),
    @CompoundIndex(def = "{'storeId': 1, 'createdAt': -1}"),
    @CompoundIndex(def = "{'storeId': 1, 'email': 1}"),
    @CompoundIndex(def = "{'storeId': 1, 'phone': 1}")
})
public class Customer implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    private String id;

    @Version
    private Long version;

    @NotBlank(message = "User ID is required")
    @Indexed(unique = true)
    private String userId; // Reference to user-service User ID

    @Indexed
    @Deprecated // Use storeIds instead for multi-store support
    private String storeId; // Legacy: Reference to store where customer is registered (kept for backward compatibility)

    @Indexed
    private Set<String> storeIds = new HashSet<>(); // Multi-store support: All stores this customer has ordered from

    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Invalid email format")
    @Indexed
    private String email;

    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid Indian phone number")
    @Indexed
    private String phone;

    @JsonSerialize(using = LocalDateSerializer.class)
    @JsonDeserialize(using = LocalDateDeserializer.class)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateOfBirth;
    private String gender; // MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY

    // Addresses
    private List<CustomerAddress> addresses = new ArrayList<>();
    private String defaultAddressId;

    // Loyalty Program
    private LoyaltyInfo loyaltyInfo = new LoyaltyInfo();

    // Preferences
    private CustomerPreferences preferences = new CustomerPreferences();

    // Order Statistics
    private OrderStats orderStats = new OrderStats();

    // Account Status
    private boolean active = true;
    private boolean emailVerified = false;
    private boolean phoneVerified = false;

    // GDPR Compliant Consent - must default to false (opt-in required)
    private boolean marketingOptIn = false;  // GDPR: Must be explicit opt-in
    private boolean smsOptIn = false;        // GDPR: Must be explicit opt-in

    // GDPR Consent Tracking
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime marketingConsentDate;
    private String marketingConsentVersion;   // Privacy policy version when consented
    private String marketingConsentMethod;    // CHECKBOX, FORM, API

    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime smsConsentDate;
    private String smsConsentVersion;
    private String smsConsentMethod;

    // GDPR Deletion tracking
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime deletedAt;          // When soft-deleted/anonymized
    private String deletionReason;            // GDPR_REQUEST, ACCOUNT_CLOSURE, etc.

    // Tags for segmentation
    private Set<String> tags = new HashSet<>();

    // Notes (manager/support notes)
    private List<CustomerNote> notes = new ArrayList<>();

    @CreatedDate
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime lastOrderDate;

    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime lastLoginDate;

    // Inner Classes

    public static class CustomerAddress implements Serializable {
        private static final long serialVersionUID = 1L;
        private String id;
        private String label; // HOME, WORK, OTHER
        private String addressLine1;
        private String addressLine2;
        private String city;
        private String state;
        private String postalCode;
        private String country = "India";
        private Double latitude;
        private Double longitude;
        private String landmark;
        private boolean isDefault = false;

        @JsonSerialize(using = LocalDateTimeSerializer.class)
        @JsonDeserialize(using = LocalDateTimeDeserializer.class)
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime createdAt = LocalDateTime.now();

        public CustomerAddress() {}

        public CustomerAddress(String label, String addressLine1, String city, String state, String postalCode) {
            this.id = java.util.UUID.randomUUID().toString();
            this.label = label;
            this.addressLine1 = addressLine1;
            this.city = city;
            this.state = state;
            this.postalCode = postalCode;
        }

        // Getters and Setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }

        public String getAddressLine1() { return addressLine1; }
        public void setAddressLine1(String addressLine1) { this.addressLine1 = addressLine1; }

        public String getAddressLine2() { return addressLine2; }
        public void setAddressLine2(String addressLine2) { this.addressLine2 = addressLine2; }

        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }

        public String getState() { return state; }
        public void setState(String state) { this.state = state; }

        public String getPostalCode() { return postalCode; }
        public void setPostalCode(String postalCode) { this.postalCode = postalCode; }

        public String getCountry() { return country; }
        public void setCountry(String country) { this.country = country; }

        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }

        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }

        public String getLandmark() { return landmark; }
        public void setLandmark(String landmark) { this.landmark = landmark; }

        public boolean isDefault() { return isDefault; }
        public void setDefault(boolean aDefault) { isDefault = aDefault; }

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }

    public static class LoyaltyInfo {
        private int totalPoints = 0;
        private int pointsEarned = 0;
        private int pointsRedeemed = 0;
        private String tier = "BRONZE"; // BRONZE, SILVER, GOLD, PLATINUM

        @JsonSerialize(using = LocalDateSerializer.class)
        @JsonDeserialize(using = LocalDateDeserializer.class)
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate tierExpiryDate;

        @JsonSerialize(using = LocalDateTimeSerializer.class)
        @JsonDeserialize(using = LocalDateTimeDeserializer.class)
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime lastPointsUpdate;
        private List<PointTransaction> pointHistory = new ArrayList<>();

        public LoyaltyInfo() {}

        // Getters and Setters
        public int getTotalPoints() { return totalPoints; }
        public void setTotalPoints(int totalPoints) { this.totalPoints = totalPoints; }

        public int getPointsEarned() { return pointsEarned; }
        public void setPointsEarned(int pointsEarned) { this.pointsEarned = pointsEarned; }

        public int getPointsRedeemed() { return pointsRedeemed; }
        public void setPointsRedeemed(int pointsRedeemed) { this.pointsRedeemed = pointsRedeemed; }

        public String getTier() { return tier; }
        public void setTier(String tier) { this.tier = tier; }

        public LocalDate getTierExpiryDate() { return tierExpiryDate; }
        public void setTierExpiryDate(LocalDate tierExpiryDate) { this.tierExpiryDate = tierExpiryDate; }

        public LocalDateTime getLastPointsUpdate() { return lastPointsUpdate; }
        public void setLastPointsUpdate(LocalDateTime lastPointsUpdate) { this.lastPointsUpdate = lastPointsUpdate; }

        public List<PointTransaction> getPointHistory() { return pointHistory; }
        public void setPointHistory(List<PointTransaction> pointHistory) { this.pointHistory = pointHistory; }
    }

    public static class PointTransaction {
        private String id = java.util.UUID.randomUUID().toString();
        private int points;
        private String type; // EARNED, REDEEMED, EXPIRED, BONUS
        private String description;
        private String orderId;

        @JsonSerialize(using = LocalDateTimeSerializer.class)
        @JsonDeserialize(using = LocalDateTimeDeserializer.class)
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime timestamp = LocalDateTime.now();

        public PointTransaction() {}

        public PointTransaction(int points, String type, String description) {
            this.points = points;
            this.type = type;
            this.description = description;
        }

        // Getters and Setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public int getPoints() { return points; }
        public void setPoints(int points) { this.points = points; }

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }

        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    }

    public static class CustomerPreferences {
        private Set<String> favoriteMenuItems = new HashSet<>();
        private Set<String> cuisinePreferences = new HashSet<>();
        private Set<String> dietaryRestrictions = new HashSet<>();
        private Set<String> allergens = new HashSet<>();
        private String preferredPaymentMethod; // CASH, CARD, UPI, WALLET
        private String spiceLevel = "MEDIUM"; // MILD, MEDIUM, HOT, EXTRA_HOT
        private boolean notifyOnOffers = true;
        private boolean notifyOnOrderStatus = true;

        public CustomerPreferences() {}

        // Getters and Setters
        public Set<String> getFavoriteMenuItems() { return favoriteMenuItems; }
        public void setFavoriteMenuItems(Set<String> favoriteMenuItems) { this.favoriteMenuItems = favoriteMenuItems; }

        public Set<String> getCuisinePreferences() { return cuisinePreferences; }
        public void setCuisinePreferences(Set<String> cuisinePreferences) { this.cuisinePreferences = cuisinePreferences; }

        public Set<String> getDietaryRestrictions() { return dietaryRestrictions; }
        public void setDietaryRestrictions(Set<String> dietaryRestrictions) { this.dietaryRestrictions = dietaryRestrictions; }

        public Set<String> getAllergens() { return allergens; }
        public void setAllergens(Set<String> allergens) { this.allergens = allergens; }

        public String getPreferredPaymentMethod() { return preferredPaymentMethod; }
        public void setPreferredPaymentMethod(String preferredPaymentMethod) { this.preferredPaymentMethod = preferredPaymentMethod; }

        public String getSpiceLevel() { return spiceLevel; }
        public void setSpiceLevel(String spiceLevel) { this.spiceLevel = spiceLevel; }

        public boolean isNotifyOnOffers() { return notifyOnOffers; }
        public void setNotifyOnOffers(boolean notifyOnOffers) { this.notifyOnOffers = notifyOnOffers; }

        public boolean isNotifyOnOrderStatus() { return notifyOnOrderStatus; }
        public void setNotifyOnOrderStatus(boolean notifyOnOrderStatus) { this.notifyOnOrderStatus = notifyOnOrderStatus; }
    }

    public static class OrderStats {
        private int totalOrders = 0;
        private int completedOrders = 0;
        private int cancelledOrders = 0;
        private double totalSpent = 0.0;
        private double averageOrderValue = 0.0;
        private String favoriteOrderType; // DINE_IN, TAKEAWAY, DELIVERY

        @JsonSerialize(using = LocalDateTimeSerializer.class)
        @JsonDeserialize(using = LocalDateTimeDeserializer.class)
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime firstOrderDate;

        @JsonSerialize(using = LocalDateTimeSerializer.class)
        @JsonDeserialize(using = LocalDateTimeDeserializer.class)
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime lastOrderDate;

        public OrderStats() {}

        // Getters and Setters
        public int getTotalOrders() { return totalOrders; }
        public void setTotalOrders(int totalOrders) { this.totalOrders = totalOrders; }

        public int getCompletedOrders() { return completedOrders; }
        public void setCompletedOrders(int completedOrders) { this.completedOrders = completedOrders; }

        public int getCancelledOrders() { return cancelledOrders; }
        public void setCancelledOrders(int cancelledOrders) { this.cancelledOrders = cancelledOrders; }

        public double getTotalSpent() { return totalSpent; }
        public void setTotalSpent(double totalSpent) { this.totalSpent = totalSpent; }

        public double getAverageOrderValue() { return averageOrderValue; }
        public void setAverageOrderValue(double averageOrderValue) { this.averageOrderValue = averageOrderValue; }

        public String getFavoriteOrderType() { return favoriteOrderType; }
        public void setFavoriteOrderType(String favoriteOrderType) { this.favoriteOrderType = favoriteOrderType; }

        public LocalDateTime getFirstOrderDate() { return firstOrderDate; }
        public void setFirstOrderDate(LocalDateTime firstOrderDate) { this.firstOrderDate = firstOrderDate; }

        public LocalDateTime getLastOrderDate() { return lastOrderDate; }
        public void setLastOrderDate(LocalDateTime lastOrderDate) { this.lastOrderDate = lastOrderDate; }
    }

    public static class CustomerNote {
        private String id = java.util.UUID.randomUUID().toString();
        private String note;
        private String addedBy; // staff/manager name or ID

        @JsonSerialize(using = LocalDateTimeSerializer.class)
        @JsonDeserialize(using = LocalDateTimeDeserializer.class)
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime createdAt = LocalDateTime.now();
        private String category; // GENERAL, COMPLAINT, PREFERENCE, OTHER

        public CustomerNote() {}

        public CustomerNote(String note, String addedBy, String category) {
            this.note = note;
            this.addedBy = addedBy;
            this.category = category;
        }

        // Getters and Setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }

        public String getAddedBy() { return addedBy; }
        public void setAddedBy(String addedBy) { this.addedBy = addedBy; }

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
    }

    // Main Entity Constructors
    public Customer() {}

    public Customer(String userId, String name, String email, String phone) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.phone = phone;
    }

    public Customer(String userId, String name, String email, String phone, String storeId) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.storeId = storeId;
    }

    // Main Entity Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    @Deprecated // Use getStoreIds() instead
    public String getStoreId() { return storeId; }
    @Deprecated // Use addStoreId() instead
    public void setStoreId(String storeId) {
        this.storeId = storeId;
        // Also add to storeIds for backward compatibility
        if (storeId != null && !storeId.isEmpty()) {
            this.storeIds.add(storeId);
        }
    }

    public Set<String> getStoreIds() { return storeIds; }
    public void setStoreIds(Set<String> storeIds) { this.storeIds = storeIds; }

    /**
     * Add a store to the customer's store list (for multi-store support)
     */
    public void addStoreId(String storeId) {
        if (storeId != null && !storeId.isEmpty()) {
            this.storeIds.add(storeId);
            // Keep legacy field in sync with first store
            if (this.storeId == null || this.storeId.isEmpty()) {
                this.storeId = storeId;
            }
        }
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public List<CustomerAddress> getAddresses() { return addresses; }
    public void setAddresses(List<CustomerAddress> addresses) { this.addresses = addresses; }

    public String getDefaultAddressId() { return defaultAddressId; }
    public void setDefaultAddressId(String defaultAddressId) { this.defaultAddressId = defaultAddressId; }

    public LoyaltyInfo getLoyaltyInfo() { return loyaltyInfo; }
    public void setLoyaltyInfo(LoyaltyInfo loyaltyInfo) { this.loyaltyInfo = loyaltyInfo; }

    public CustomerPreferences getPreferences() { return preferences; }
    public void setPreferences(CustomerPreferences preferences) { this.preferences = preferences; }

    public OrderStats getOrderStats() { return orderStats; }
    public void setOrderStats(OrderStats orderStats) { this.orderStats = orderStats; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }

    public boolean isPhoneVerified() { return phoneVerified; }
    public void setPhoneVerified(boolean phoneVerified) { this.phoneVerified = phoneVerified; }

    public boolean isMarketingOptIn() { return marketingOptIn; }
    public void setMarketingOptIn(boolean marketingOptIn) { this.marketingOptIn = marketingOptIn; }

    public boolean isSmsOptIn() { return smsOptIn; }
    public void setSmsOptIn(boolean smsOptIn) { this.smsOptIn = smsOptIn; }

    // GDPR Consent Tracking Getters/Setters
    public LocalDateTime getMarketingConsentDate() { return marketingConsentDate; }
    public void setMarketingConsentDate(LocalDateTime marketingConsentDate) { this.marketingConsentDate = marketingConsentDate; }

    public String getMarketingConsentVersion() { return marketingConsentVersion; }
    public void setMarketingConsentVersion(String marketingConsentVersion) { this.marketingConsentVersion = marketingConsentVersion; }

    public String getMarketingConsentMethod() { return marketingConsentMethod; }
    public void setMarketingConsentMethod(String marketingConsentMethod) { this.marketingConsentMethod = marketingConsentMethod; }

    public LocalDateTime getSmsConsentDate() { return smsConsentDate; }
    public void setSmsConsentDate(LocalDateTime smsConsentDate) { this.smsConsentDate = smsConsentDate; }

    public String getSmsConsentVersion() { return smsConsentVersion; }
    public void setSmsConsentVersion(String smsConsentVersion) { this.smsConsentVersion = smsConsentVersion; }

    public String getSmsConsentMethod() { return smsConsentMethod; }
    public void setSmsConsentMethod(String smsConsentMethod) { this.smsConsentMethod = smsConsentMethod; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }

    public String getDeletionReason() { return deletionReason; }
    public void setDeletionReason(String deletionReason) { this.deletionReason = deletionReason; }

    public Set<String> getTags() { return tags; }
    public void setTags(Set<String> tags) { this.tags = tags; }

    public List<CustomerNote> getNotes() { return notes; }
    public void setNotes(List<CustomerNote> notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getLastOrderDate() { return lastOrderDate; }
    public void setLastOrderDate(LocalDateTime lastOrderDate) { this.lastOrderDate = lastOrderDate; }

    public LocalDateTime getLastLoginDate() { return lastLoginDate; }
    public void setLastLoginDate(LocalDateTime lastLoginDate) { this.lastLoginDate = lastLoginDate; }
}
