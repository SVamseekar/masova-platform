package com.MaSoVa.delivery.dto;

/**
 * Address DTO with coordinates
 */
public class AddressDTO {

    private String street;
    private String city;
    private String state;
    private String zipCode;
    private Double latitude;
    private Double longitude;

    public AddressDTO() {
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(String street) {
        this.street = street;
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

    public String getZipCode() {
        return zipCode;
    }

    public void setZipCode(String zipCode) {
        this.zipCode = zipCode;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getFullAddress() {
        return String.format("%s, %s, %s %s", street, city, state, zipCode);
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String street;
        private String city;
        private String state;
        private String zipCode;
        private Double latitude;
        private Double longitude;

        public Builder street(String street) {
            this.street = street;
            return this;
        }

        public Builder city(String city) {
            this.city = city;
            return this;
        }

        public Builder state(String state) {
            this.state = state;
            return this;
        }

        public Builder zipCode(String zipCode) {
            this.zipCode = zipCode;
            return this;
        }

        public Builder latitude(Double latitude) {
            this.latitude = latitude;
            return this;
        }

        public Builder longitude(Double longitude) {
            this.longitude = longitude;
            return this;
        }

        public AddressDTO build() {
            AddressDTO dto = new AddressDTO();
            dto.street = this.street;
            dto.city = this.city;
            dto.state = this.state;
            dto.zipCode = this.zipCode;
            dto.latitude = this.latitude;
            dto.longitude = this.longitude;
            return dto;
        }
    }
}
