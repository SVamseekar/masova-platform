package com.MaSoVa.order.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Preparation time configuration for orders.
 * HARD-003: Configurable preparation times instead of hardcoded values
 *
 * Configuration in application.yml:
 * preparation:
 *   base-time-minutes: 15
 *   per-item-minutes: 5
 *   rush-hour-multiplier: 1.5
 *   max-time-minutes: 120
 */
@Configuration
@ConfigurationProperties(prefix = "preparation")
public class PreparationTimeConfiguration {

    // Base preparation time for any order (minutes)
    private int baseTimeMinutes = 15;

    // Additional time per item (minutes)
    private int perItemMinutes = 5;

    // Multiplier during rush hours (1.0 = normal, 1.5 = 50% longer, etc.)
    private double rushHourMultiplier = 1.0;

    // Maximum preparation time cap (minutes)
    private int maxTimeMinutes = 120;

    // Minimum preparation time (minutes)
    private int minTimeMinutes = 10;

    // Peak hours when rush hour multiplier applies (24-hour format)
    private int rushHourStartHour = 12;  // 12 PM
    private int rushHourEndHour = 14;    // 2 PM
    private int eveningRushStartHour = 19; // 7 PM
    private int eveningRushEndHour = 21;   // 9 PM

    /**
     * Calculate preparation time based on item count
     *
     * @param itemCount Number of items in the order
     * @return Estimated preparation time in minutes
     */
    public int calculatePreparationTime(int itemCount) {
        int baseTime = baseTimeMinutes + (itemCount * perItemMinutes);

        // Apply rush hour multiplier if applicable
        if (isRushHour()) {
            baseTime = (int) Math.ceil(baseTime * rushHourMultiplier);
        }

        // Ensure within min/max bounds
        return Math.max(minTimeMinutes, Math.min(baseTime, maxTimeMinutes));
    }

    /**
     * Calculate preparation time with custom complexity factor
     *
     * @param itemCount Number of items
     * @param complexityFactor Additional factor for complex items (1.0 = normal, 2.0 = double time)
     * @return Estimated preparation time in minutes
     */
    public int calculatePreparationTime(int itemCount, double complexityFactor) {
        int baseTime = (int) Math.ceil((baseTimeMinutes + (itemCount * perItemMinutes)) * complexityFactor);

        // Apply rush hour multiplier if applicable
        if (isRushHour()) {
            baseTime = (int) Math.ceil(baseTime * rushHourMultiplier);
        }

        // Ensure within min/max bounds
        return Math.max(minTimeMinutes, Math.min(baseTime, maxTimeMinutes));
    }

    /**
     * Check if current time is during rush hours
     *
     * @return true if it's rush hour
     */
    public boolean isRushHour() {
        int currentHour = java.time.LocalDateTime.now().getHour();

        boolean lunchRush = (currentHour >= rushHourStartHour && currentHour < rushHourEndHour);
        boolean dinnerRush = (currentHour >= eveningRushStartHour && currentHour < eveningRushEndHour);

        return lunchRush || dinnerRush;
    }

    // Getters and Setters
    public int getBaseTimeMinutes() { return baseTimeMinutes; }
    public void setBaseTimeMinutes(int baseTimeMinutes) { this.baseTimeMinutes = baseTimeMinutes; }

    public int getPerItemMinutes() { return perItemMinutes; }
    public void setPerItemMinutes(int perItemMinutes) { this.perItemMinutes = perItemMinutes; }

    public double getRushHourMultiplier() { return rushHourMultiplier; }
    public void setRushHourMultiplier(double rushHourMultiplier) { this.rushHourMultiplier = rushHourMultiplier; }

    public int getMaxTimeMinutes() { return maxTimeMinutes; }
    public void setMaxTimeMinutes(int maxTimeMinutes) { this.maxTimeMinutes = maxTimeMinutes; }

    public int getMinTimeMinutes() { return minTimeMinutes; }
    public void setMinTimeMinutes(int minTimeMinutes) { this.minTimeMinutes = minTimeMinutes; }

    public int getRushHourStartHour() { return rushHourStartHour; }
    public void setRushHourStartHour(int rushHourStartHour) { this.rushHourStartHour = rushHourStartHour; }

    public int getRushHourEndHour() { return rushHourEndHour; }
    public void setRushHourEndHour(int rushHourEndHour) { this.rushHourEndHour = rushHourEndHour; }

    public int getEveningRushStartHour() { return eveningRushStartHour; }
    public void setEveningRushStartHour(int eveningRushStartHour) { this.eveningRushStartHour = eveningRushStartHour; }

    public int getEveningRushEndHour() { return eveningRushEndHour; }
    public void setEveningRushEndHour(int eveningRushEndHour) { this.eveningRushEndHour = eveningRushEndHour; }
}
