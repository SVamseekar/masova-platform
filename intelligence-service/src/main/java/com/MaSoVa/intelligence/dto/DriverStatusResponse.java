package com.MaSoVa.intelligence.dto;

import java.io.Serializable;

public class DriverStatusResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer totalDrivers;
    private Integer availableDrivers;
    private Integer busyDrivers;
    private Integer activeDeliveries;
    private Integer completedTodayDeliveries;

    public DriverStatusResponse() {
    }

    public DriverStatusResponse(Integer totalDrivers, Integer availableDrivers, Integer busyDrivers,
                                Integer activeDeliveries, Integer completedTodayDeliveries) {
        this.totalDrivers = totalDrivers;
        this.availableDrivers = availableDrivers;
        this.busyDrivers = busyDrivers;
        this.activeDeliveries = activeDeliveries;
        this.completedTodayDeliveries = completedTodayDeliveries;
    }

    public Integer getTotalDrivers() {
        return totalDrivers;
    }

    public void setTotalDrivers(Integer totalDrivers) {
        this.totalDrivers = totalDrivers;
    }

    public Integer getAvailableDrivers() {
        return availableDrivers;
    }

    public void setAvailableDrivers(Integer availableDrivers) {
        this.availableDrivers = availableDrivers;
    }

    public Integer getBusyDrivers() {
        return busyDrivers;
    }

    public void setBusyDrivers(Integer busyDrivers) {
        this.busyDrivers = busyDrivers;
    }

    public Integer getActiveDeliveries() {
        return activeDeliveries;
    }

    public void setActiveDeliveries(Integer activeDeliveries) {
        this.activeDeliveries = activeDeliveries;
    }

    public Integer getCompletedTodayDeliveries() {
        return completedTodayDeliveries;
    }

    public void setCompletedTodayDeliveries(Integer completedTodayDeliveries) {
        this.completedTodayDeliveries = completedTodayDeliveries;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Integer totalDrivers;
        private Integer availableDrivers;
        private Integer busyDrivers;
        private Integer activeDeliveries;
        private Integer completedTodayDeliveries;

        public Builder totalDrivers(Integer totalDrivers) {
            this.totalDrivers = totalDrivers;
            return this;
        }

        public Builder availableDrivers(Integer availableDrivers) {
            this.availableDrivers = availableDrivers;
            return this;
        }

        public Builder busyDrivers(Integer busyDrivers) {
            this.busyDrivers = busyDrivers;
            return this;
        }

        public Builder activeDeliveries(Integer activeDeliveries) {
            this.activeDeliveries = activeDeliveries;
            return this;
        }

        public Builder completedTodayDeliveries(Integer completedTodayDeliveries) {
            this.completedTodayDeliveries = completedTodayDeliveries;
            return this;
        }

        public DriverStatusResponse build() {
            return new DriverStatusResponse(totalDrivers, availableDrivers, busyDrivers,
                    activeDeliveries, completedTodayDeliveries);
        }
    }
}
