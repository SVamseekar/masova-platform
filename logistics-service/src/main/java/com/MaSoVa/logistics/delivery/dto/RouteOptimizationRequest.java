package com.MaSoVa.logistics.delivery.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RouteOptimizationRequest {

    private AddressDTO origin; // Driver's current location
    private AddressDTO destination; // Customer's delivery address
    private String travelMode; // DRIVING (default), WALKING, BICYCLING
    private Boolean avoidTolls;
    private Boolean avoidHighways;

    public RouteOptimizationRequest() {
    }

    public AddressDTO getOrigin() {
        return origin;
    }

    public void setOrigin(AddressDTO origin) {
        this.origin = origin;
    }

    public AddressDTO getDestination() {
        return destination;
    }

    public void setDestination(AddressDTO destination) {
        this.destination = destination;
    }

    public String getTravelMode() {
        return travelMode;
    }

    public void setTravelMode(String travelMode) {
        this.travelMode = travelMode;
    }

    public Boolean getAvoidTolls() {
        return avoidTolls;
    }

    public void setAvoidTolls(Boolean avoidTolls) {
        this.avoidTolls = avoidTolls;
    }

    public Boolean getAvoidHighways() {
        return avoidHighways;
    }

    public void setAvoidHighways(Boolean avoidHighways) {
        this.avoidHighways = avoidHighways;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private AddressDTO origin;
        private AddressDTO destination;
        private String travelMode;
        private Boolean avoidTolls;
        private Boolean avoidHighways;

        public Builder origin(AddressDTO origin) {
            this.origin = origin;
            return this;
        }

        public Builder destination(AddressDTO destination) {
            this.destination = destination;
            return this;
        }

        public Builder travelMode(String travelMode) {
            this.travelMode = travelMode;
            return this;
        }

        public Builder avoidTolls(Boolean avoidTolls) {
            this.avoidTolls = avoidTolls;
            return this;
        }

        public Builder avoidHighways(Boolean avoidHighways) {
            this.avoidHighways = avoidHighways;
            return this;
        }

        public RouteOptimizationRequest build() {
            RouteOptimizationRequest request = new RouteOptimizationRequest();
            request.origin = this.origin;
            request.destination = this.destination;
            request.travelMode = this.travelMode;
            request.avoidTolls = this.avoidTolls;
            request.avoidHighways = this.avoidHighways;
            return request;
        }
    }
}
