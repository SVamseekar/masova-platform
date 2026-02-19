package com.MaSoVa.shared.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.MaSoVa.shared.enums.UserType;
import com.MaSoVa.shared.model.Address;
import com.MaSoVa.shared.model.WorkSchedule;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Document(collection = "users")
// Note: store_pin_unique index removed - was causing issues with null PINs for CUSTOMER/KIOSK users
// PIN uniqueness is enforced at application level in UserService
@CompoundIndexes({
    @CompoundIndex(def = "{'employeeDetails.storeId': 1, 'employeeDetails.status': 1}"),
    @CompoundIndex(def = "{'type': 1, 'isActive': 1}")
})
public class User {

    @Id
    private String id;

    @NotNull
    @Field("type")
    @Indexed
    private UserType type;
    
    @NotNull
    @Field("personalInfo")
    private PersonalInfo personalInfo;
    
    @Field("preferences")
    private CustomerPreferences preferences;
    
    @Field("employeeDetails")
    private EmployeeDetails employeeDetails;
    
    @Field("createdAt")
    @Indexed
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Field("lastLogin")
    private LocalDateTime lastLogin;
    
    @Field("isActive")
    private boolean isActive = true;

    @Field("authProviders")
    private List<AuthProvider> authProviders = new ArrayList<>();
    
    // Constructors
    public User() {}
    
    public User(UserType type, PersonalInfo personalInfo) {
        this.type = type;
        this.personalInfo = personalInfo;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public UserType getType() { return type; }
    public void setType(UserType type) { this.type = type; }
    
    public PersonalInfo getPersonalInfo() { return personalInfo; }
    public void setPersonalInfo(PersonalInfo personalInfo) { this.personalInfo = personalInfo; }
    
    public CustomerPreferences getPreferences() { return preferences; }
    public void setPreferences(CustomerPreferences preferences) { this.preferences = preferences; }
    
    public EmployeeDetails getEmployeeDetails() { return employeeDetails; }
    public void setEmployeeDetails(EmployeeDetails employeeDetails) { this.employeeDetails = employeeDetails; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public List<AuthProvider> getAuthProviders() { return authProviders; }
    public void setAuthProviders(List<AuthProvider> authProviders) { this.authProviders = authProviders; }
    
    // Helper methods
    public boolean isEmployee() {
        return type == UserType.STAFF || type == UserType.DRIVER ||
               type == UserType.MANAGER || type == UserType.ASSISTANT_MANAGER ||
               type == UserType.KIOSK;
    }

    public boolean canTakeOrders() {
        return type == UserType.MANAGER || type == UserType.ASSISTANT_MANAGER ||
               type == UserType.KIOSK;
    }

    public boolean isKiosk() {
        return type == UserType.KIOSK;
    }
    
    // Nested classes
    public static class PersonalInfo {
        @NotNull
        private String name;
        
        @NotNull
        @Email
        @Indexed(unique = true)
        private String email;
        
        @NotNull
        @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid Indian phone number")
        @Indexed(unique = true)
        private String phone;
        
        private Address address;
        
        @JsonIgnore
        private String passwordHash;
        
        // Constructors, getters and setters
        public PersonalInfo() {}
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        
        public Address getAddress() { return address; }
        public void setAddress(Address address) { this.address = address; }
        
        public String getPasswordHash() { return passwordHash; }
        public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    }
    
    public static class CustomerPreferences {
        private List<String> favoriteOrders;
        private List<String> paymentMethods;
        private Map<String, Object> dietaryRestrictions;
        
        // Constructors, getters and setters
        public CustomerPreferences() {}
        
        public List<String> getFavoriteOrders() { return favoriteOrders; }
        public void setFavoriteOrders(List<String> favoriteOrders) { this.favoriteOrders = favoriteOrders; }
        
        public List<String> getPaymentMethods() { return paymentMethods; }
        public void setPaymentMethods(List<String> paymentMethods) { this.paymentMethods = paymentMethods; }
        
        public Map<String, Object> getDietaryRestrictions() { return dietaryRestrictions; }
        public void setDietaryRestrictions(Map<String, Object> dietaryRestrictions) { this.dietaryRestrictions = dietaryRestrictions; }
    }
    
    public static class AuthProvider {
        private String provider;  // e.g., "GOOGLE"
        private String providerId; // Google sub/uid
        private String email;

        public AuthProvider() {}

        public AuthProvider(String provider, String providerId, String email) {
            this.provider = provider;
            this.providerId = providerId;
            this.email = email;
        }

        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }

        public String getProviderId() { return providerId; }
        public void setProviderId(String providerId) { this.providerId = providerId; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public static class EmployeeDetails {
        @Indexed
        private String storeId;
        private String role;
        private List<String> permissions;
        private WorkSchedule schedule;
        private String status; // AVAILABLE, ON_DUTY, OFF_DUTY, BUSY
        private Double rating;
        private Integer activeDeliveryCount;

        // Driver-specific fields
        private String vehicleType;     // e.g., Bike, Car, Scooter
        private String licenseNumber;   // Driver's license number

        @JsonIgnore
        private String employeePINHash; // BCrypt hashed 5-digit PIN for clock-in (store-unique)

        @Indexed // For fast PIN lookup optimization
        private String pinSuffix; // Last 2 digits of PIN (plaintext) for indexed queries

        // Kiosk-specific fields
        private boolean isKioskAccount = false;  // Flag to identify kiosk accounts
        private String terminalId;                // Unique terminal identifier (e.g., "POS-01", "POS-02")
        private LocalDateTime lastKioskAccess;    // Track last kiosk access for security

        // Constructors, getters and setters
        public EmployeeDetails() {}

        public String getStoreId() { return storeId; }
        public void setStoreId(String storeId) { this.storeId = storeId; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public List<String> getPermissions() { return permissions; }
        public void setPermissions(List<String> permissions) { this.permissions = permissions; }

        public WorkSchedule getSchedule() { return schedule; }
        public void setSchedule(WorkSchedule schedule) { this.schedule = schedule; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public Double getRating() { return rating; }
        public void setRating(Double rating) { this.rating = rating; }

        public Integer getActiveDeliveryCount() { return activeDeliveryCount; }
        public void setActiveDeliveryCount(Integer activeDeliveryCount) { this.activeDeliveryCount = activeDeliveryCount; }

        public String getVehicleType() { return vehicleType; }
        public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

        public String getLicenseNumber() { return licenseNumber; }
        public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

        public String getEmployeePINHash() { return employeePINHash; }
        public void setEmployeePINHash(String employeePINHash) { this.employeePINHash = employeePINHash; }

        public String getPinSuffix() { return pinSuffix; }
        public void setPinSuffix(String pinSuffix) { this.pinSuffix = pinSuffix; }

        public boolean getIsKioskAccount() { return isKioskAccount; }
        public void setIsKioskAccount(boolean isKioskAccount) { this.isKioskAccount = isKioskAccount; }

        public String getTerminalId() { return terminalId; }
        public void setTerminalId(String terminalId) { this.terminalId = terminalId; }

        public LocalDateTime getLastKioskAccess() { return lastKioskAccess; }
        public void setLastKioskAccess(LocalDateTime lastKioskAccess) { this.lastKioskAccess = lastKioskAccess; }
    }
}