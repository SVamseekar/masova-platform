package com.MaSoVa.shared.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.Indexed;
import com.MaSoVa.shared.model.Address;
import com.MaSoVa.shared.enums.StoreStatus;
import com.MaSoVa.shared.model.TimeSlot;
import com.MaSoVa.shared.model.SpecialHours;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDateTime;
import java.time.DayOfWeek;
import java.util.Map;
import java.util.List;

@Document(collection = "stores")
public class Store {

    @Id
    private String id;

    @Version
    private Long version;
    
    @NotNull
    @Field("name")
    private String name;
    
    @NotNull
    @Field("code")
    @Indexed(unique = true)
    @Pattern(regexp = "^DOM\\d{3}$", message = "Store code must be format DOM001")
    @JsonProperty("storeCode")
    @JsonAlias({"code", "storeCode"})
    private String code;
    
    @NotNull
    @Field("address")
    private Address address;
    
    @NotNull
    @Field("phoneNumber")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid Indian phone number")
    private String phoneNumber;
    
    @Field("regionId")
    @Indexed
    private String regionId;
    
    @Field("areaManagerId")
    @Indexed
    private String areaManagerId;
    
    @Field("status")
    @Indexed
    private StoreStatus status = StoreStatus.ACTIVE;
    
    @Field("operatingHours")
    private OperatingHours operatingHours;
    
    @Field("configuration")
    private StoreConfiguration configuration;
    
    @Field("openingDate")
    private LocalDateTime openingDate;
    
    @Field("createdAt")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Field("lastModified")
    @JsonProperty("lastModified")
    @JsonAlias({"lastModified", "updatedAt"})
    private LocalDateTime lastModified = LocalDateTime.now();

    /** ISO 3166-1 alpha-2 country code, e.g. "DE", "FR". Null for India stores (legacy). */
    @Field("countryCode")
    @Indexed
    private String countryCode;

    /** VAT registration number for EU/UK/CH stores. Null for India stores. */
    @Field("vatNumber")
    private String vatNumber;

    /** ISO 4217 currency code, e.g. "EUR", "GBP". Null = legacy India (INR assumed). */
    @Field("currency")
    private String currency;

    /** BCP 47 locale tag, e.g. "de-DE", "fr-FR". Null = legacy India (en-IN assumed). */
    @Field("locale")
    private String locale;

    // Constructors
    public Store() {}
    
    public Store(String name, String code, Address address, String phoneNumber) {
        this.name = name;
        this.code = code;
        this.address = address;
        this.phoneNumber = phoneNumber;
        this.configuration = new StoreConfiguration();
        this.operatingHours = new OperatingHours();
    }
    
    // Business Logic Methods
    public boolean isOperational(LocalDateTime dateTime) {
        if (status != StoreStatus.ACTIVE) {
            return false;
        }
        
        if (operatingHours == null) {
            return true;
        }
        
        return operatingHours.isOpenAt(dateTime);
    }
    
    public boolean isWithinDeliveryRadius(double latitude, double longitude) {
        if (configuration == null || address == null) {
            return false;
        }
        
        double distance = calculateDistance(
            address.getLatitude(), address.getLongitude(),
            latitude, longitude
        );
        
        return distance <= configuration.getDeliveryRadiusKm();
    }
    
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    // Getters and Setters (add all standard getters/setters)
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    
    public Address getAddress() { return address; }
    public void setAddress(Address address) { this.address = address; }
    
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    
    public String getRegionId() { return regionId; }
    public void setRegionId(String regionId) { this.regionId = regionId; }
    
    public String getAreaManagerId() { return areaManagerId; }
    public void setAreaManagerId(String areaManagerId) { this.areaManagerId = areaManagerId; }
    
    public StoreStatus getStatus() { return status; }
    public void setStatus(StoreStatus status) { this.status = status; }

    @JsonIgnore
    public OperatingHours getOperatingHours() { return operatingHours; }
    public void setOperatingHours(OperatingHours operatingHours) { this.operatingHours = operatingHours; }

    @JsonIgnore
    public StoreConfiguration getConfiguration() { return configuration; }
    public void setConfiguration(StoreConfiguration configuration) { this.configuration = configuration; }
    
    public LocalDateTime getOpeningDate() { return openingDate; }
    public void setOpeningDate(LocalDateTime openingDate) { this.openingDate = openingDate; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getLastModified() { return lastModified; }
    public void setLastModified(LocalDateTime lastModified) { this.lastModified = lastModified; }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public String getVatNumber() { return vatNumber; }
    public void setVatNumber(String vatNumber) { this.vatNumber = vatNumber; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }

    // Custom setter to handle frontend's combined "operatingConfig"
    @JsonProperty("operatingConfig")
    public void setOperatingConfig(Map<String, Object> operatingConfig) {
        if (operatingConfig == null) {
            return;
        }

        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules(); // Register JavaTimeModule for LocalTime support

        try {
            // Extract weeklySchedule and specialHours for OperatingHours
            if (operatingConfig.containsKey("weeklySchedule") || operatingConfig.containsKey("specialHours")) {
                OperatingHours hours = new OperatingHours();

                if (operatingConfig.get("weeklySchedule") != null) {
                    // Convert the weeklySchedule map properly
                    Map<DayOfWeek, TimeSlot> weeklySchedule = mapper.convertValue(
                        operatingConfig.get("weeklySchedule"),
                        new TypeReference<Map<DayOfWeek, TimeSlot>>() {}
                    );
                    hours.setWeeklySchedule(weeklySchedule);
                }

                if (operatingConfig.get("specialHours") != null) {
                    List<SpecialHours> specialHours = mapper.convertValue(
                        operatingConfig.get("specialHours"),
                        new TypeReference<List<SpecialHours>>() {}
                    );
                    hours.setSpecialHours(specialHours);
                }

                this.operatingHours = hours;
            }

            // Extract delivery/operational settings for StoreConfiguration
            StoreConfiguration config = this.configuration != null ? this.configuration : new StoreConfiguration();

            if (operatingConfig.containsKey("deliveryRadiusKm")) {
                config.setDeliveryRadiusKm(((Number) operatingConfig.get("deliveryRadiusKm")).doubleValue());
            }
            if (operatingConfig.containsKey("maxConcurrentOrders")) {
                config.setMaxConcurrentOrders(((Number) operatingConfig.get("maxConcurrentOrders")).intValue());
            }
            if (operatingConfig.containsKey("estimatedPrepTimeMinutes")) {
                config.setEstimatedPrepTimeMinutes(((Number) operatingConfig.get("estimatedPrepTimeMinutes")).intValue());
            }
            if (operatingConfig.containsKey("acceptsOnlineOrders")) {
                config.setAcceptsOnlineOrders((Boolean) operatingConfig.get("acceptsOnlineOrders"));
            }
            if (operatingConfig.containsKey("minimumOrderValueINR")) {
                config.setMinimumOrderValueINR(((Number) operatingConfig.get("minimumOrderValueINR")).doubleValue());
            }
            if (operatingConfig.containsKey("acceptsCashPayments")) {
                config.setAcceptsCashPayments((Boolean) operatingConfig.get("acceptsCashPayments"));
            }
            if (operatingConfig.containsKey("maxDeliveryTimeMinutes")) {
                config.setMaxDeliveryTimeMinutes(((Number) operatingConfig.get("maxDeliveryTimeMinutes")).intValue());
            }

            this.configuration = config;
        } catch (Exception e) {
            throw new RuntimeException("Failed to deserialize operatingConfig", e);
        }
    }

    // Custom getter to return combined operatingConfig for frontend
    @JsonProperty("operatingConfig")
    @JsonIgnore(false)
    public Map<String, Object> getOperatingConfig() {
        Map<String, Object> combined = new java.util.HashMap<>();

        if (this.operatingHours != null) {
            if (this.operatingHours.getWeeklySchedule() != null) {
                combined.put("weeklySchedule", this.operatingHours.getWeeklySchedule());
            }
            if (this.operatingHours.getSpecialHours() != null) {
                combined.put("specialHours", this.operatingHours.getSpecialHours());
            }
        }

        if (this.configuration != null) {
            combined.put("deliveryRadiusKm", this.configuration.getDeliveryRadiusKm());
            combined.put("maxConcurrentOrders", this.configuration.getMaxConcurrentOrders());
            combined.put("estimatedPrepTimeMinutes", this.configuration.getEstimatedPrepTimeMinutes());
            combined.put("acceptsOnlineOrders", this.configuration.isAcceptsOnlineOrders());
            combined.put("minimumOrderValueINR", this.configuration.getMinimumOrderValueINR());
            combined.put("acceptsCashPayments", this.configuration.isAcceptsCashPayments());
            combined.put("maxDeliveryTimeMinutes", this.configuration.getMaxDeliveryTimeMinutes());
        }

        return combined;
    }

    // Nested Classes
    public static class OperatingHours {
        private Map<DayOfWeek, TimeSlot> weeklySchedule;
        private List<SpecialHours> specialHours;
        
        public boolean isOpenAt(LocalDateTime dateTime) {
            DayOfWeek day = dateTime.getDayOfWeek();
            
            if (specialHours != null) {
                for (SpecialHours special : specialHours) {
                    if (special.appliesTo(dateTime.toLocalDate())) {
                        return special.isOpenAt(dateTime.toLocalTime());
                    }
                }
            }
            
            if (weeklySchedule != null && weeklySchedule.containsKey(day)) {
                TimeSlot timeSlot = weeklySchedule.get(day);
                return timeSlot.isWithin(dateTime.toLocalTime());
            }
            
            return false;
        }
        
        public Map<DayOfWeek, TimeSlot> getWeeklySchedule() { return weeklySchedule; }
        public void setWeeklySchedule(Map<DayOfWeek, TimeSlot> weeklySchedule) { this.weeklySchedule = weeklySchedule; }
        
        public List<SpecialHours> getSpecialHours() { return specialHours; }
        public void setSpecialHours(List<SpecialHours> specialHours) { this.specialHours = specialHours; }
    }
    
    public static class StoreConfiguration {
        private double deliveryRadiusKm = 5.0;
        private int maxConcurrentOrders = 50;
        private int estimatedPrepTimeMinutes = 25;
        private boolean acceptsOnlineOrders = true;
        private boolean acceptsCashPayments = true;
        private int maxDeliveryTimeMinutes = 30;
        private double minimumOrderValueINR = 99.0;

        // Service Area Configuration (DELIV-005)
        private ServiceArea serviceArea;

        public double getDeliveryRadiusKm() { return deliveryRadiusKm; }
        public void setDeliveryRadiusKm(double deliveryRadiusKm) { this.deliveryRadiusKm = deliveryRadiusKm; }

        public int getMaxConcurrentOrders() { return maxConcurrentOrders; }
        public void setMaxConcurrentOrders(int maxConcurrentOrders) { this.maxConcurrentOrders = maxConcurrentOrders; }

        public int getEstimatedPrepTimeMinutes() { return estimatedPrepTimeMinutes; }
        public void setEstimatedPrepTimeMinutes(int estimatedPrepTimeMinutes) { this.estimatedPrepTimeMinutes = estimatedPrepTimeMinutes; }

        public boolean isAcceptsOnlineOrders() { return acceptsOnlineOrders; }
        public void setAcceptsOnlineOrders(boolean acceptsOnlineOrders) { this.acceptsOnlineOrders = acceptsOnlineOrders; }

        public boolean isAcceptsCashPayments() { return acceptsCashPayments; }
        public void setAcceptsCashPayments(boolean acceptsCashPayments) { this.acceptsCashPayments = acceptsCashPayments; }

        public int getMaxDeliveryTimeMinutes() { return maxDeliveryTimeMinutes; }
        public void setMaxDeliveryTimeMinutes(int maxDeliveryTimeMinutes) { this.maxDeliveryTimeMinutes = maxDeliveryTimeMinutes; }

        public double getMinimumOrderValueINR() { return minimumOrderValueINR; }
        public void setMinimumOrderValueINR(double minimumOrderValueINR) { this.minimumOrderValueINR = minimumOrderValueINR; }

        public ServiceArea getServiceArea() { return serviceArea; }
        public void setServiceArea(ServiceArea serviceArea) { this.serviceArea = serviceArea; }
    }

    /**
     * Service Area definition for zone-based delivery pricing (DELIV-005)
     */
    public static class ServiceArea {
        // Center point of service area
        private double centerLatitude;
        private double centerLongitude;

        // Simple radius-based zones (in km)
        private List<DeliveryZone> zones;

        // For complex polygon-based areas (optional)
        private List<double[]> polygonCoordinates;
        private boolean usesPolygon = false;

        // Restrictions
        private boolean acceptsDelivery = true;
        private List<String> restrictedPincodes;
        private List<String> restrictedAreas;

        public ServiceArea() {
            this.zones = List.of(
                new DeliveryZone("A", 0.0, 3.0, 30.0, 15),
                new DeliveryZone("B", 3.0, 6.0, 50.0, 25),
                new DeliveryZone("C", 6.0, 10.0, 80.0, 35)
            );
        }

        public double getCenterLatitude() { return centerLatitude; }
        public void setCenterLatitude(double centerLatitude) { this.centerLatitude = centerLatitude; }

        public double getCenterLongitude() { return centerLongitude; }
        public void setCenterLongitude(double centerLongitude) { this.centerLongitude = centerLongitude; }

        public List<DeliveryZone> getZones() { return zones; }
        public void setZones(List<DeliveryZone> zones) { this.zones = zones; }

        public List<double[]> getPolygonCoordinates() { return polygonCoordinates; }
        public void setPolygonCoordinates(List<double[]> polygonCoordinates) { this.polygonCoordinates = polygonCoordinates; }

        public boolean isUsesPolygon() { return usesPolygon; }
        public void setUsesPolygon(boolean usesPolygon) { this.usesPolygon = usesPolygon; }

        public boolean isAcceptsDelivery() { return acceptsDelivery; }
        public void setAcceptsDelivery(boolean acceptsDelivery) { this.acceptsDelivery = acceptsDelivery; }

        public List<String> getRestrictedPincodes() { return restrictedPincodes; }
        public void setRestrictedPincodes(List<String> restrictedPincodes) { this.restrictedPincodes = restrictedPincodes; }

        public List<String> getRestrictedAreas() { return restrictedAreas; }
        public void setRestrictedAreas(List<String> restrictedAreas) { this.restrictedAreas = restrictedAreas; }
    }

    /**
     * Delivery zone definition with distance-based pricing
     */
    public static class DeliveryZone {
        private String zoneName;         // e.g., "A", "B", "C"
        private double minDistanceKm;
        private double maxDistanceKm;
        private double deliveryFeeINR;
        private int estimatedDeliveryMinutes;
        private double minimumOrderValueINR;  // Zone-specific minimum
        private boolean active = true;

        public DeliveryZone() {}

        public DeliveryZone(String zoneName, double minDistanceKm, double maxDistanceKm,
                           double deliveryFeeINR, int estimatedDeliveryMinutes) {
            this.zoneName = zoneName;
            this.minDistanceKm = minDistanceKm;
            this.maxDistanceKm = maxDistanceKm;
            this.deliveryFeeINR = deliveryFeeINR;
            this.estimatedDeliveryMinutes = estimatedDeliveryMinutes;
        }

        public boolean containsDistance(double distanceKm) {
            return distanceKm >= minDistanceKm && distanceKm < maxDistanceKm;
        }

        public String getZoneName() { return zoneName; }
        public void setZoneName(String zoneName) { this.zoneName = zoneName; }

        public double getMinDistanceKm() { return minDistanceKm; }
        public void setMinDistanceKm(double minDistanceKm) { this.minDistanceKm = minDistanceKm; }

        public double getMaxDistanceKm() { return maxDistanceKm; }
        public void setMaxDistanceKm(double maxDistanceKm) { this.maxDistanceKm = maxDistanceKm; }

        public double getDeliveryFeeINR() { return deliveryFeeINR; }
        public void setDeliveryFeeINR(double deliveryFeeINR) { this.deliveryFeeINR = deliveryFeeINR; }

        public int getEstimatedDeliveryMinutes() { return estimatedDeliveryMinutes; }
        public void setEstimatedDeliveryMinutes(int estimatedDeliveryMinutes) { this.estimatedDeliveryMinutes = estimatedDeliveryMinutes; }

        public double getMinimumOrderValueINR() { return minimumOrderValueINR; }
        public void setMinimumOrderValueINR(double minimumOrderValueINR) { this.minimumOrderValueINR = minimumOrderValueINR; }

        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }
    }
}