package com.MaSoVa.customer.dto.request;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public class UpdateCustomerRequest {

    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @Email(message = "Invalid email format")
    private String email;

    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid Indian phone number")
    private String phone;

    private LocalDate dateOfBirth;

    private String gender;

    private Boolean marketingOptIn;

    private Boolean smsOptIn;

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
}
