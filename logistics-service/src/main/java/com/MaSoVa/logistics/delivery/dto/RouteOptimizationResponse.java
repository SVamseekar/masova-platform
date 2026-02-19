package com.MaSoVa.logistics.delivery.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO for optimized route
 */
public class RouteOptimizationResponse {

    private BigDecimal distanceKm;
    private Integer durationMinutes;
    private String polyline; // Encoded polyline for map display
    private List<Step> steps; // Turn-by-turn directions
    private AddressDTO startLocation;
    private AddressDTO endLocation;

    public RouteOptimizationResponse() {
    }

    public BigDecimal getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(BigDecimal distanceKm) {
        this.distanceKm = distanceKm;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public String getPolyline() {
        return polyline;
    }

    public void setPolyline(String polyline) {
        this.polyline = polyline;
    }

    public List<Step> getSteps() {
        return steps;
    }

    public void setSteps(List<Step> steps) {
        this.steps = steps;
    }

    public AddressDTO getStartLocation() {
        return startLocation;
    }

    public void setStartLocation(AddressDTO startLocation) {
        this.startLocation = startLocation;
    }

    public AddressDTO getEndLocation() {
        return endLocation;
    }

    public void setEndLocation(AddressDTO endLocation) {
        this.endLocation = endLocation;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private BigDecimal distanceKm;
        private Integer durationMinutes;
        private String polyline;
        private List<Step> steps;
        private AddressDTO startLocation;
        private AddressDTO endLocation;

        public Builder distanceKm(BigDecimal distanceKm) {
            this.distanceKm = distanceKm;
            return this;
        }

        public Builder durationMinutes(Integer durationMinutes) {
            this.durationMinutes = durationMinutes;
            return this;
        }

        public Builder polyline(String polyline) {
            this.polyline = polyline;
            return this;
        }

        public Builder steps(List<Step> steps) {
            this.steps = steps;
            return this;
        }

        public Builder startLocation(AddressDTO startLocation) {
            this.startLocation = startLocation;
            return this;
        }

        public Builder endLocation(AddressDTO endLocation) {
            this.endLocation = endLocation;
            return this;
        }

        public RouteOptimizationResponse build() {
            RouteOptimizationResponse response = new RouteOptimizationResponse();
            response.distanceKm = this.distanceKm;
            response.durationMinutes = this.durationMinutes;
            response.polyline = this.polyline;
            response.steps = this.steps;
            response.startLocation = this.startLocation;
            response.endLocation = this.endLocation;
            return response;
        }
    }

    public static class Step {
        private String instruction; // "Turn left on Main St"
        private BigDecimal distanceMeters;
        private Integer durationSeconds;
        private String maneuver; // "turn-left", "turn-right", etc.

        public Step() {
        }

        public String getInstruction() {
            return instruction;
        }

        public void setInstruction(String instruction) {
            this.instruction = instruction;
        }

        public BigDecimal getDistanceMeters() {
            return distanceMeters;
        }

        public void setDistanceMeters(BigDecimal distanceMeters) {
            this.distanceMeters = distanceMeters;
        }

        public Integer getDurationSeconds() {
            return durationSeconds;
        }

        public void setDurationSeconds(Integer durationSeconds) {
            this.durationSeconds = durationSeconds;
        }

        public String getManeuver() {
            return maneuver;
        }

        public void setManeuver(String maneuver) {
            this.maneuver = maneuver;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private String instruction;
            private BigDecimal distanceMeters;
            private Integer durationSeconds;
            private String maneuver;

            public Builder instruction(String instruction) {
                this.instruction = instruction;
                return this;
            }

            public Builder distanceMeters(BigDecimal distanceMeters) {
                this.distanceMeters = distanceMeters;
                return this;
            }

            public Builder durationSeconds(Integer durationSeconds) {
                this.durationSeconds = durationSeconds;
                return this;
            }

            public Builder maneuver(String maneuver) {
                this.maneuver = maneuver;
                return this;
            }

            public Step build() {
                Step step = new Step();
                step.instruction = this.instruction;
                step.distanceMeters = this.distanceMeters;
                step.durationSeconds = this.durationSeconds;
                step.maneuver = this.maneuver;
                return step;
            }
        }
    }
}
