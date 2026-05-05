package com.MaSoVa.commerce.order.entity;

import java.util.List;

public class OrderItem {

    private String menuItemId;
    private String name;
    private Integer quantity;
    private Double price;
    private String variant;
    private List<String> customizations;
    private String category;  // MenuCategory name e.g. "FOOD", "BEVERAGE", "ALCOHOL" — for VAT routing

    public OrderItem() {}

    public OrderItem(String menuItemId, String name, Integer quantity, Double price, String variant, List<String> customizations) {
        this.menuItemId = menuItemId;
        this.name = name;
        this.quantity = quantity;
        this.price = price;
        this.variant = variant;
        this.customizations = customizations;
    }

    // Getters and Setters
    public String getMenuItemId() { return menuItemId; }
    public void setMenuItemId(String menuItemId) { this.menuItemId = menuItemId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public String getVariant() { return variant; }
    public void setVariant(String variant) { this.variant = variant; }

    public List<String> getCustomizations() { return customizations; }
    public void setCustomizations(List<String> customizations) { this.customizations = customizations; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Double getItemTotal() {
        return price * quantity;
    }

    // Builder pattern
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String menuItemId;
        private String name;
        private Integer quantity;
        private Double price;
        private String variant;
        private List<String> customizations;

        public Builder menuItemId(String menuItemId) { this.menuItemId = menuItemId; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder quantity(Integer quantity) { this.quantity = quantity; return this; }
        public Builder price(Double price) { this.price = price; return this; }
        public Builder variant(String variant) { this.variant = variant; return this; }
        public Builder customizations(List<String> customizations) { this.customizations = customizations; return this; }

        public OrderItem build() {
            return new OrderItem(menuItemId, name, quantity, price, variant, customizations);
        }
    }
}
