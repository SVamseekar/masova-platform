package com.MaSoVa.commerce.order.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

/**
 * Tax configuration for different states and order types.
 * HARD-002: Configurable tax rates per state/store
 *
 * Tax rates are configurable via application.yml:
 * tax:
 *   default-gst-percent: 5.0
 *   state-rates:
 *     Maharashtra: 5.0
 *     Karnataka: 5.0
 *     Delhi: 5.0
 *   category-rates:
 *     FOOD: 5.0
 *     BEVERAGE: 12.0
 *     PACKAGED: 18.0
 */
@Configuration
@ConfigurationProperties(prefix = "tax")
public class TaxConfiguration {

    // Default GST rate (5% for restaurant food in India)
    private double defaultGstPercent = 5.0;

    // State-specific tax rates (if different from default)
    private Map<String, Double> stateRates = new HashMap<>();

    // Category-specific tax rates (e.g., packaged items have higher GST)
    private Map<String, Double> categoryRates = new HashMap<>();

    // Restaurant GST rates based on AC/Non-AC (Indian tax law)
    private double acRestaurantGstPercent = 5.0;   // Restaurant with AC
    private double nonAcRestaurantGstPercent = 5.0; // Restaurant without AC

    // Delivery-specific tax (if applicable)
    private double deliveryServiceTaxPercent = 0.0;

    // Packaging charges tax
    private double packagingTaxPercent = 18.0;

    public TaxConfiguration() {
        // Initialize default state rates (India GST for food services)
        stateRates.put("Maharashtra", 5.0);
        stateRates.put("Karnataka", 5.0);
        stateRates.put("Delhi", 5.0);
        stateRates.put("Tamil Nadu", 5.0);
        stateRates.put("Gujarat", 5.0);
        stateRates.put("Rajasthan", 5.0);
        stateRates.put("Uttar Pradesh", 5.0);
        stateRates.put("West Bengal", 5.0);
        stateRates.put("Telangana", 5.0);
        stateRates.put("Andhra Pradesh", 5.0);
        stateRates.put("Kerala", 5.0);
        stateRates.put("Punjab", 5.0);

        // Initialize category-specific rates
        categoryRates.put("FOOD", 5.0);
        categoryRates.put("BEVERAGE", 12.0);      // Aerated drinks
        categoryRates.put("ALCOHOL", 28.0);       // Alcoholic beverages (if applicable)
        categoryRates.put("PACKAGED", 18.0);      // Packaged food items
        categoryRates.put("ICE_CREAM", 18.0);     // Ice cream and similar
    }

    /**
     * Get tax rate for a given state.
     * Falls back to default if state not configured.
     */
    public double getTaxRateForState(String state) {
        if (state == null || state.isEmpty()) {
            return defaultGstPercent;
        }
        return stateRates.getOrDefault(state, defaultGstPercent);
    }

    /**
     * Get tax rate for a specific item category.
     * Falls back to FOOD rate if category not found.
     */
    public double getTaxRateForCategory(String category) {
        if (category == null || category.isEmpty()) {
            return categoryRates.getOrDefault("FOOD", defaultGstPercent);
        }
        return categoryRates.getOrDefault(category.toUpperCase(), defaultGstPercent);
    }

    /**
     * Calculate tax amount for an order.
     *
     * @param subtotal Order subtotal (before tax)
     * @param state Delivery state
     * @param hasAc Whether the restaurant has AC (affects tax rate in India)
     * @return Tax amount
     */
    public double calculateTax(double subtotal, String state, boolean hasAc) {
        double rate = getTaxRateForState(state);
        return subtotal * (rate / 100.0);
    }

    /**
     * Calculate tax breakdown for an order.
     *
     * @param subtotal Order subtotal
     * @param state State for tax calculation
     * @return TaxBreakdown with CGST, SGST, and total
     */
    public TaxBreakdown calculateTaxBreakdown(double subtotal, String state) {
        double totalRate = getTaxRateForState(state);
        // GST is split equally between CGST (Central) and SGST (State)
        double halfRate = totalRate / 2.0;

        double cgst = subtotal * (halfRate / 100.0);
        double sgst = subtotal * (halfRate / 100.0);
        double total = cgst + sgst;

        return new TaxBreakdown(cgst, sgst, halfRate, halfRate, total, totalRate);
    }

    // Getters and Setters
    public double getDefaultGstPercent() { return defaultGstPercent; }
    public void setDefaultGstPercent(double defaultGstPercent) { this.defaultGstPercent = defaultGstPercent; }

    public Map<String, Double> getStateRates() { return stateRates; }
    public void setStateRates(Map<String, Double> stateRates) { this.stateRates = stateRates; }

    public Map<String, Double> getCategoryRates() { return categoryRates; }
    public void setCategoryRates(Map<String, Double> categoryRates) { this.categoryRates = categoryRates; }

    public double getAcRestaurantGstPercent() { return acRestaurantGstPercent; }
    public void setAcRestaurantGstPercent(double acRestaurantGstPercent) { this.acRestaurantGstPercent = acRestaurantGstPercent; }

    public double getNonAcRestaurantGstPercent() { return nonAcRestaurantGstPercent; }
    public void setNonAcRestaurantGstPercent(double nonAcRestaurantGstPercent) { this.nonAcRestaurantGstPercent = nonAcRestaurantGstPercent; }

    public double getDeliveryServiceTaxPercent() { return deliveryServiceTaxPercent; }
    public void setDeliveryServiceTaxPercent(double deliveryServiceTaxPercent) { this.deliveryServiceTaxPercent = deliveryServiceTaxPercent; }

    public double getPackagingTaxPercent() { return packagingTaxPercent; }
    public void setPackagingTaxPercent(double packagingTaxPercent) { this.packagingTaxPercent = packagingTaxPercent; }

    /**
     * Tax breakdown with CGST and SGST components
     */
    public static class TaxBreakdown {
        private final double cgst;           // Central GST
        private final double sgst;           // State GST
        private final double cgstPercent;
        private final double sgstPercent;
        private final double totalTax;
        private final double totalPercent;

        public TaxBreakdown(double cgst, double sgst, double cgstPercent, double sgstPercent,
                           double totalTax, double totalPercent) {
            this.cgst = cgst;
            this.sgst = sgst;
            this.cgstPercent = cgstPercent;
            this.sgstPercent = sgstPercent;
            this.totalTax = totalTax;
            this.totalPercent = totalPercent;
        }

        public double getCgst() { return cgst; }
        public double getSgst() { return sgst; }
        public double getCgstPercent() { return cgstPercent; }
        public double getSgstPercent() { return sgstPercent; }
        public double getTotalTax() { return totalTax; }
        public double getTotalPercent() { return totalPercent; }
    }
}
