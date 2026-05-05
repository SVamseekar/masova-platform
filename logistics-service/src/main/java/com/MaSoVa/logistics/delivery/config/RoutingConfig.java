package com.MaSoVa.logistics.delivery.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for free routing services (OSRM, Nominatim)
 */
@Configuration
@ConfigurationProperties(prefix = "routing")
public class RoutingConfig {

    private Osrm osrm = new Osrm();
    private Nominatim nominatim = new Nominatim();
    private Eta eta = new Eta();

    public static class Osrm {
        private String baseUrl = "https://router.project-osrm.org";

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }
    }

    public static class Nominatim {
        private String baseUrl = "https://nominatim.openstreetmap.org";
        private long rateLimitMs = 1000; // 1 request per second

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public long getRateLimitMs() {
            return rateLimitMs;
        }

        public void setRateLimitMs(long rateLimitMs) {
            this.rateLimitMs = rateLimitMs;
        }
    }

    public static class Eta {
        private int pickupBufferMinutes = 5;
        private int trafficBufferPercent = 15;
        private RushHours rushHours = new RushHours();

        public static class RushHours {
            private int morningStart = 8;
            private int morningEnd = 10;
            private int eveningStart = 17;
            private int eveningEnd = 20;

            public int getMorningStart() {
                return morningStart;
            }

            public void setMorningStart(int morningStart) {
                this.morningStart = morningStart;
            }

            public int getMorningEnd() {
                return morningEnd;
            }

            public void setMorningEnd(int morningEnd) {
                this.morningEnd = morningEnd;
            }

            public int getEveningStart() {
                return eveningStart;
            }

            public void setEveningStart(int eveningStart) {
                this.eveningStart = eveningStart;
            }

            public int getEveningEnd() {
                return eveningEnd;
            }

            public void setEveningEnd(int eveningEnd) {
                this.eveningEnd = eveningEnd;
            }
        }

        public int getPickupBufferMinutes() {
            return pickupBufferMinutes;
        }

        public void setPickupBufferMinutes(int pickupBufferMinutes) {
            this.pickupBufferMinutes = pickupBufferMinutes;
        }

        public int getTrafficBufferPercent() {
            return trafficBufferPercent;
        }

        public void setTrafficBufferPercent(int trafficBufferPercent) {
            this.trafficBufferPercent = trafficBufferPercent;
        }

        public RushHours getRushHours() {
            return rushHours;
        }

        public void setRushHours(RushHours rushHours) {
            this.rushHours = rushHours;
        }
    }

    public Osrm getOsrm() {
        return osrm;
    }

    public void setOsrm(Osrm osrm) {
        this.osrm = osrm;
    }

    public Nominatim getNominatim() {
        return nominatim;
    }

    public void setNominatim(Nominatim nominatim) {
        this.nominatim = nominatim;
    }

    public Eta getEta() {
        return eta;
    }

    public void setEta(Eta eta) {
        this.eta = eta;
    }
}
