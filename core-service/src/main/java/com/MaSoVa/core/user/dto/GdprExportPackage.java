package com.MaSoVa.core.user.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Comprehensive GDPR data export package containing all customer data across services.
 * GDPR-004: Complete GDPR data export
 * Complies with GDPR Article 15 (Right of Access) and Article 20 (Right to Data Portability)
 */
public class GdprExportPackage {

    // Metadata
    private String exportId;
    private String userId;
    private LocalDateTime exportedAt;
    private String format;
    private String version;
    private String standardCompliance;

    // User Service Data
    private Map<String, Object> userProfile;
    private List<Map<String, Object>> consentHistory;
    private List<Map<String, Object>> auditHistory;

    // Customer Service Data
    private Map<String, Object> customerProfile;
    private List<Map<String, Object>> savedAddresses;
    private Map<String, Object> loyaltyInfo;
    private Map<String, Object> communicationPreferences;

    // Order Service Data
    private List<Map<String, Object>> orderHistory;
    private int totalOrders;

    // Payment Service Data
    private List<Map<String, Object>> paymentTransactions;
    private List<Map<String, Object>> savedPaymentMethods;

    // Delivery Service Data
    private List<Map<String, Object>> deliveryHistory;

    // Export status
    private boolean complete;
    private List<String> errors;

    public GdprExportPackage() {
        this.exportedAt = LocalDateTime.now();
        this.format = "JSON";
        this.version = "1.0";
        this.standardCompliance = "GDPR Articles 15, 20";
    }

    public GdprExportPackage(String userId) {
        this();
        this.userId = userId;
        this.exportId = "GDPR-EXPORT-" + userId + "-" + System.currentTimeMillis();
    }

    // Getters and Setters
    public String getExportId() { return exportId; }
    public void setExportId(String exportId) { this.exportId = exportId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public LocalDateTime getExportedAt() { return exportedAt; }
    public void setExportedAt(LocalDateTime exportedAt) { this.exportedAt = exportedAt; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getStandardCompliance() { return standardCompliance; }
    public void setStandardCompliance(String standardCompliance) { this.standardCompliance = standardCompliance; }

    public Map<String, Object> getUserProfile() { return userProfile; }
    public void setUserProfile(Map<String, Object> userProfile) { this.userProfile = userProfile; }

    public List<Map<String, Object>> getConsentHistory() { return consentHistory; }
    public void setConsentHistory(List<Map<String, Object>> consentHistory) { this.consentHistory = consentHistory; }

    public List<Map<String, Object>> getAuditHistory() { return auditHistory; }
    public void setAuditHistory(List<Map<String, Object>> auditHistory) { this.auditHistory = auditHistory; }

    public Map<String, Object> getCustomerProfile() { return customerProfile; }
    public void setCustomerProfile(Map<String, Object> customerProfile) { this.customerProfile = customerProfile; }

    public List<Map<String, Object>> getSavedAddresses() { return savedAddresses; }
    public void setSavedAddresses(List<Map<String, Object>> savedAddresses) { this.savedAddresses = savedAddresses; }

    public Map<String, Object> getLoyaltyInfo() { return loyaltyInfo; }
    public void setLoyaltyInfo(Map<String, Object> loyaltyInfo) { this.loyaltyInfo = loyaltyInfo; }

    public Map<String, Object> getCommunicationPreferences() { return communicationPreferences; }
    public void setCommunicationPreferences(Map<String, Object> communicationPreferences) { this.communicationPreferences = communicationPreferences; }

    public List<Map<String, Object>> getOrderHistory() { return orderHistory; }
    public void setOrderHistory(List<Map<String, Object>> orderHistory) { this.orderHistory = orderHistory; }

    public int getTotalOrders() { return totalOrders; }
    public void setTotalOrders(int totalOrders) { this.totalOrders = totalOrders; }

    public List<Map<String, Object>> getPaymentTransactions() { return paymentTransactions; }
    public void setPaymentTransactions(List<Map<String, Object>> paymentTransactions) { this.paymentTransactions = paymentTransactions; }

    public List<Map<String, Object>> getSavedPaymentMethods() { return savedPaymentMethods; }
    public void setSavedPaymentMethods(List<Map<String, Object>> savedPaymentMethods) { this.savedPaymentMethods = savedPaymentMethods; }

    public List<Map<String, Object>> getDeliveryHistory() { return deliveryHistory; }
    public void setDeliveryHistory(List<Map<String, Object>> deliveryHistory) { this.deliveryHistory = deliveryHistory; }

    public boolean isComplete() { return complete; }
    public void setComplete(boolean complete) { this.complete = complete; }

    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }
}
