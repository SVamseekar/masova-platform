package com.MaSoVa.order.entity;

public class DeliveryAddress {

    private String street;
    private String city;
    private String state;
    private String pincode;
    private Double latitude;
    private Double longitude;
    private String landmark;

    public DeliveryAddress() {}

    public DeliveryAddress(String street, String city, String state, String pincode, Double latitude, Double longitude, String landmark) {
        this.street = street;
        this.city = city;
        this.state = state;
        this.pincode = pincode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.landmark = landmark;
    }

    // Getters and Setters
    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getLandmark() { return landmark; }
    public void setLandmark(String landmark) { this.landmark = landmark; }

    // Builder pattern
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String street;
        private String city;
        private String state;
        private String pincode;
        private Double latitude;
        private Double longitude;
        private String landmark;

        public Builder street(String street) { this.street = street; return this; }
        public Builder city(String city) { this.city = city; return this; }
        public Builder state(String state) { this.state = state; return this; }
        public Builder pincode(String pincode) { this.pincode = pincode; return this; }
        public Builder latitude(Double latitude) { this.latitude = latitude; return this; }
        public Builder longitude(Double longitude) { this.longitude = longitude; return this; }
        public Builder landmark(String landmark) { this.landmark = landmark; return this; }

        public DeliveryAddress build() {
            return new DeliveryAddress(street, city, state, pincode, latitude, longitude, landmark);
        }
    }
}
