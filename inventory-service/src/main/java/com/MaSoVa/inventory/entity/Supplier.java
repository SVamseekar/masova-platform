package com.MaSoVa.inventory.entity;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Supplier Entity
 *
 * Manages supplier information, contact details, and performance metrics
 */
@Document(collection = "suppliers")
public class Supplier {

    @Id
    private String id;

    @Indexed(unique = true)
    private String supplierCode; // Unique code for the supplier

    @Indexed
    private String supplierName;

    private String contactPerson;
    private String phoneNumber;
    private String email;
    private String alternatePhone;

    // Address
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String pincode;
    private String country;

    // Business Details
    private String gstNumber;
    private String panNumber;
    private String businessType; // WHOLESALER, MANUFACTURER, DISTRIBUTOR, etc.

    // Payment Terms
    private String paymentTerms; // COD, NET_15, NET_30, NET_60, etc.
    private Integer creditDays;
    private BigDecimal creditLimit; // Maximum credit limit in INR

    // Banking Details
    private String bankName;
    private String accountNumber;
    private String ifscCode;
    private String bankBranch;

    // Categories supplied
    private List<String> categoriesSupplied = new ArrayList<>(); // Categories of items they supply

    // Performance Metrics
    private Integer totalOrders; // Total purchase orders placed
    private Integer completedOrders;
    private Integer cancelledOrders;
    private Double onTimeDeliveryRate; // Percentage (0-100)
    private Double qualityRating; // Rating (0-5)
    private BigDecimal totalPurchaseValue; // Total value of all purchases (INR)

    // Lead Time
    private Integer averageLeadTimeDays; // Average delivery time in days
    private Integer minimumOrderQuantity; // MOQ if applicable

    // Status
    @Indexed
    private String status; // ACTIVE, INACTIVE, BLOCKED

    private Boolean isPreferred; // Preferred supplier flag

    // Metadata
    private String notes;
    private String website;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private String createdBy;
    private String lastUpdatedBy;

    // Last order date
    private LocalDateTime lastOrderDate;

    // Constructors
    public Supplier() {
        this.status = "ACTIVE";
        this.isPreferred = false;
        this.totalOrders = 0;
        this.completedOrders = 0;
        this.cancelledOrders = 0;
        this.onTimeDeliveryRate = 100.0;
        this.qualityRating = 5.0;
        this.totalPurchaseValue = BigDecimal.ZERO;
        this.categoriesSupplied = new ArrayList<>();
    }

    // Business logic methods

    /**
     * Calculate delivery performance percentage
     */
    public Double getDeliveryPerformance() {
        if (totalOrders == 0) {
            return 100.0;
        }
        return (completedOrders * 100.0) / totalOrders;
    }

    /**
     * Check if supplier is reliable (based on metrics)
     */
    public Boolean isReliable() {
        return onTimeDeliveryRate >= 80.0 && qualityRating >= 3.5;
    }

    /**
     * Check if supplier has reached credit limit
     */
    public Boolean hasCreditAvailable(BigDecimal pendingAmount) {
        if (creditLimit == null || pendingAmount == null) {
            return true;
        }
        return pendingAmount.compareTo(creditLimit) < 0;
    }

    // Getters and Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSupplierCode() {
        return supplierCode;
    }

    public void setSupplierCode(String supplierCode) {
        this.supplierCode = supplierCode;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public String getContactPerson() {
        return contactPerson;
    }

    public void setContactPerson(String contactPerson) {
        this.contactPerson = contactPerson;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAlternatePhone() {
        return alternatePhone;
    }

    public void setAlternatePhone(String alternatePhone) {
        this.alternatePhone = alternatePhone;
    }

    public String getAddressLine1() {
        return addressLine1;
    }

    public void setAddressLine1(String addressLine1) {
        this.addressLine1 = addressLine1;
    }

    public String getAddressLine2() {
        return addressLine2;
    }

    public void setAddressLine2(String addressLine2) {
        this.addressLine2 = addressLine2;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getGstNumber() {
        return gstNumber;
    }

    public void setGstNumber(String gstNumber) {
        this.gstNumber = gstNumber;
    }

    public String getPanNumber() {
        return panNumber;
    }

    public void setPanNumber(String panNumber) {
        this.panNumber = panNumber;
    }

    public String getBusinessType() {
        return businessType;
    }

    public void setBusinessType(String businessType) {
        this.businessType = businessType;
    }

    public String getPaymentTerms() {
        return paymentTerms;
    }

    public void setPaymentTerms(String paymentTerms) {
        this.paymentTerms = paymentTerms;
    }

    public Integer getCreditDays() {
        return creditDays;
    }

    public void setCreditDays(Integer creditDays) {
        this.creditDays = creditDays;
    }

    public BigDecimal getCreditLimit() {
        return creditLimit;
    }

    public void setCreditLimit(BigDecimal creditLimit) {
        this.creditLimit = creditLimit;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public String getIfscCode() {
        return ifscCode;
    }

    public void setIfscCode(String ifscCode) {
        this.ifscCode = ifscCode;
    }

    public String getBankBranch() {
        return bankBranch;
    }

    public void setBankBranch(String bankBranch) {
        this.bankBranch = bankBranch;
    }

    public List<String> getCategoriesSupplied() {
        return categoriesSupplied;
    }

    public void setCategoriesSupplied(List<String> categoriesSupplied) {
        this.categoriesSupplied = categoriesSupplied;
    }

    public Integer getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(Integer totalOrders) {
        this.totalOrders = totalOrders;
    }

    public Integer getCompletedOrders() {
        return completedOrders;
    }

    public void setCompletedOrders(Integer completedOrders) {
        this.completedOrders = completedOrders;
    }

    public Integer getCancelledOrders() {
        return cancelledOrders;
    }

    public void setCancelledOrders(Integer cancelledOrders) {
        this.cancelledOrders = cancelledOrders;
    }

    public Double getOnTimeDeliveryRate() {
        return onTimeDeliveryRate;
    }

    public void setOnTimeDeliveryRate(Double onTimeDeliveryRate) {
        this.onTimeDeliveryRate = onTimeDeliveryRate;
    }

    public Double getQualityRating() {
        return qualityRating;
    }

    public void setQualityRating(Double qualityRating) {
        this.qualityRating = qualityRating;
    }

    public BigDecimal getTotalPurchaseValue() {
        return totalPurchaseValue;
    }

    public void setTotalPurchaseValue(BigDecimal totalPurchaseValue) {
        this.totalPurchaseValue = totalPurchaseValue;
    }

    public Integer getAverageLeadTimeDays() {
        return averageLeadTimeDays;
    }

    public void setAverageLeadTimeDays(Integer averageLeadTimeDays) {
        this.averageLeadTimeDays = averageLeadTimeDays;
    }

    public Integer getMinimumOrderQuantity() {
        return minimumOrderQuantity;
    }

    public void setMinimumOrderQuantity(Integer minimumOrderQuantity) {
        this.minimumOrderQuantity = minimumOrderQuantity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getIsPreferred() {
        return isPreferred;
    }

    public void setIsPreferred(Boolean isPreferred) {
        this.isPreferred = isPreferred;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
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

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getLastUpdatedBy() {
        return lastUpdatedBy;
    }

    public void setLastUpdatedBy(String lastUpdatedBy) {
        this.lastUpdatedBy = lastUpdatedBy;
    }

    public LocalDateTime getLastOrderDate() {
        return lastOrderDate;
    }

    public void setLastOrderDate(LocalDateTime lastOrderDate) {
        this.lastOrderDate = lastOrderDate;
    }
}
