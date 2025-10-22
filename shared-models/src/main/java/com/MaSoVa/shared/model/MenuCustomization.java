package com.MaSoVa.shared.model;

/**
 * Represents customization options for menu items (e.g., extra toppings)
 */
public class MenuCustomization {
    private String name;              // e.g., "Extra Cheese", "Add Mushrooms"
    private Long price;               // Price in paise (₹)
    private Boolean isAvailable;      // Customization availability
    private String category;          // e.g., "Topping", "Add-on", "Extra"
    private Integer maxQuantity;      // Maximum quantity allowed

    public MenuCustomization() {}

    public MenuCustomization(String name, Long price, String category) {
        this.name = name;
        this.price = price;
        this.category = category;
        this.isAvailable = true;
        this.maxQuantity = 5;
    }

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Long getPrice() { return price; }
    public void setPrice(Long price) { this.price = price; }

    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getMaxQuantity() { return maxQuantity; }
    public void setMaxQuantity(Integer maxQuantity) { this.maxQuantity = maxQuantity; }
}
