package com.MaSoVa.core.customer.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.AssertTrue;

/** A complete address edit, or the existing default-address selection command. */
public class UpdateAddressRequest {
    private String label;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private Double latitude;
    private Double longitude;
    private String landmark;
    @JsonProperty("isDefault")
    @JsonAlias("default")
    private Boolean isDefault;

    @JsonIgnore
    public boolean isDefaultOnly() {
        return Boolean.TRUE.equals(isDefault) && label == null && addressLine1 == null
                && addressLine2 == null && city == null && state == null && postalCode == null
                && country == null && latitude == null && longitude == null && landmark == null;
    }

    @AssertTrue(message = "Provide a complete address or isDefault=true alone")
    @JsonIgnore
    public boolean isValidUpdate() {
        return isDefaultOnly() || nonBlank(label) && nonBlank(addressLine1) && nonBlank(city)
                && nonBlank(state) && nonBlank(postalCode);
    }

    private boolean nonBlank(String value) { return value != null && !value.isBlank(); }

    public AddAddressRequest toAddressRequest() {
        AddAddressRequest request = new AddAddressRequest();
        request.setLabel(label); request.setAddressLine1(addressLine1); request.setAddressLine2(addressLine2);
        request.setCity(city); request.setState(state); request.setPostalCode(postalCode);
        if (country != null) request.setCountry(country);
        request.setLatitude(latitude); request.setLongitude(longitude); request.setLandmark(landmark);
        if (isDefault != null) request.setDefault(isDefault);
        return request;
    }

    public String getLabel() { return label; }
    public void setLabel(String value) { label = value; }
    public String getAddressLine1() { return addressLine1; }
    public void setAddressLine1(String value) { addressLine1 = value; }
    public String getAddressLine2() { return addressLine2; }
    public void setAddressLine2(String value) { addressLine2 = value; }
    public String getCity() { return city; }
    public void setCity(String value) { city = value; }
    public String getState() { return state; }
    public void setState(String value) { state = value; }
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String value) { postalCode = value; }
    public String getCountry() { return country; }
    public void setCountry(String value) { country = value; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double value) { latitude = value; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double value) { longitude = value; }
    public String getLandmark() { return landmark; }
    public void setLandmark(String value) { landmark = value; }
    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean value) { isDefault = value; }
}
