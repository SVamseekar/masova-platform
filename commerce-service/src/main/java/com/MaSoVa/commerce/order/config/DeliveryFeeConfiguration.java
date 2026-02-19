package com.MaSoVa.commerce.order.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for delivery fees
 * Week 3 Fix: Externalize hardcoded delivery fees
 */
@Configuration
@ConfigurationProperties(prefix = "masova.delivery")
public class DeliveryFeeConfiguration {

    private double baseFee = 50.0;  // Default base delivery fee in INR
    private double freeDeliveryThreshold = 500.0;  // Free delivery above this amount
    private double perKmCharge = 5.0;  // Charge per km beyond base distance
    private double baseDistanceKm = 3.0;  // Base distance included in base fee

    public double calculateDeliveryFee(double orderValue, double distanceKm) {
        // Free delivery for orders above threshold
        if (orderValue >= freeDeliveryThreshold) {
            return 0.0;
        }

        // Base fee
        double fee = baseFee;

        // Add per-km charge if distance exceeds base distance
        if (distanceKm > baseDistanceKm) {
            double extraDistance = distanceKm - baseDistanceKm;
            fee += extraDistance * perKmCharge;
        }

        return fee;
    }

    public double getBaseFee() {
        return baseFee;
    }

    public void setBaseFee(double baseFee) {
        this.baseFee = baseFee;
    }

    public double getFreeDeliveryThreshold() {
        return freeDeliveryThreshold;
    }

    public void setFreeDeliveryThreshold(double freeDeliveryThreshold) {
        this.freeDeliveryThreshold = freeDeliveryThreshold;
    }

    public double getPerKmCharge() {
        return perKmCharge;
    }

    public void setPerKmCharge(double perKmCharge) {
        this.perKmCharge = perKmCharge;
    }

    public double getBaseDistanceKm() {
        return baseDistanceKm;
    }

    public void setBaseDistanceKm(double baseDistanceKm) {
        this.baseDistanceKm = baseDistanceKm;
    }
}
