package com.MaSoVa.shared.model;

import java.io.Serializable;

/**
 * Represents a variant of a menu item (e.g., size, portion)
 */
public class MenuVariant implements Serializable {

    private static final long serialVersionUID = 1L;
    private String name;              // e.g., "Regular", "Large", "7 inch", "9 inch"
    private Long priceModifier;       // Additional price in paise (₹)
    private Boolean isAvailable;      // Variant availability
    private String description;       // Optional description

    public MenuVariant() {}

    public MenuVariant(String name, Long priceModifier) {
        this.name = name;
        this.priceModifier = priceModifier;
        this.isAvailable = true;
    }

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Long getPriceModifier() { return priceModifier; }
    public void setPriceModifier(Long priceModifier) { this.priceModifier = priceModifier; }

    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
