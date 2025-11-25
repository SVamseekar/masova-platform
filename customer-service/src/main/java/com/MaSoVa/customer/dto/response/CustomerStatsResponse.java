package com.MaSoVa.customer.dto.response;

import java.util.Map;

public class CustomerStatsResponse {
    private long totalCustomers;
    private long activeCustomers;
    private long inactiveCustomers;
    private long verifiedEmails;
    private long verifiedPhones;
    private Map<String, Long> customersByTier;
    private long highValueCustomers;
    private double averageLifetimeValue;

    public CustomerStatsResponse() {}

    // Getters and Setters
    public long getTotalCustomers() { return totalCustomers; }
    public void setTotalCustomers(long totalCustomers) { this.totalCustomers = totalCustomers; }

    public long getActiveCustomers() { return activeCustomers; }
    public void setActiveCustomers(long activeCustomers) { this.activeCustomers = activeCustomers; }

    public long getInactiveCustomers() { return inactiveCustomers; }
    public void setInactiveCustomers(long inactiveCustomers) { this.inactiveCustomers = inactiveCustomers; }

    public long getVerifiedEmails() { return verifiedEmails; }
    public void setVerifiedEmails(long verifiedEmails) { this.verifiedEmails = verifiedEmails; }

    public long getVerifiedPhones() { return verifiedPhones; }
    public void setVerifiedPhones(long verifiedPhones) { this.verifiedPhones = verifiedPhones; }

    public Map<String, Long> getCustomersByTier() { return customersByTier; }
    public void setCustomersByTier(Map<String, Long> customersByTier) { this.customersByTier = customersByTier; }

    public long getHighValueCustomers() { return highValueCustomers; }
    public void setHighValueCustomers(long highValueCustomers) { this.highValueCustomers = highValueCustomers; }

    public double getAverageLifetimeValue() { return averageLifetimeValue; }
    public void setAverageLifetimeValue(double averageLifetimeValue) { this.averageLifetimeValue = averageLifetimeValue; }
}
