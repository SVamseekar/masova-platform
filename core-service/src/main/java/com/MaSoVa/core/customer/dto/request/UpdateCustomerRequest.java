package com.MaSoVa.core.customer.dto.request;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public class UpdateCustomerRequest {

    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @Email(message = "Invalid email format")
    private String email;

    @Pattern(regexp = "^\\+?[1-9]\\d{6,14}$", message = "Invalid phone number")
    private String phone;

    private LocalDate dateOfBirth;

    private String gender;

    private Boolean marketingOptIn;

    private Boolean smsOptIn;

    private UpdatePreferencesRequest preferences;

    private Boolean emailVerified;

    private Boolean phoneVerified;

    private AddCustomerNoteRequest note;

    private UpdateOrderStatsRequest orderStats;

    public UpdateCustomerRequest() {}

    // Getters and Setters
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

    public Boolean getMarketingOptIn() { return marketingOptIn; }
    public void setMarketingOptIn(Boolean marketingOptIn) { this.marketingOptIn = marketingOptIn; }

    public Boolean getSmsOptIn() { return smsOptIn; }
    public void setSmsOptIn(Boolean smsOptIn) { this.smsOptIn = smsOptIn; }

    public UpdatePreferencesRequest getPreferences() { return preferences; }
    public void setPreferences(UpdatePreferencesRequest preferences) { this.preferences = preferences; }

    public Boolean getEmailVerified() { return emailVerified; }
    public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }

    public Boolean getPhoneVerified() { return phoneVerified; }
    public void setPhoneVerified(Boolean phoneVerified) { this.phoneVerified = phoneVerified; }

    public AddCustomerNoteRequest getNote() { return note; }
    public void setNote(AddCustomerNoteRequest note) { this.note = note; }

    public UpdateOrderStatsRequest getOrderStats() { return orderStats; }
    public void setOrderStats(UpdateOrderStatsRequest orderStats) { this.orderStats = orderStats; }
}
