package com.MaSoVa.shared.enums;

public enum DietaryType {
    VEGETARIAN("Vegetarian", "V"),
    VEGAN("Vegan", "VG"),
    NON_VEGETARIAN("Non-Vegetarian", "NV"),
    CONTAINS_EGGS("Contains Eggs", "E"),
    HALAL("Halal", "H"),
    JAIN("Jain", "J");

    private final String displayName;
    private final String symbol;

    DietaryType(String displayName, String symbol) {
        this.displayName = displayName;
        this.symbol = symbol;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getSymbol() {
        return symbol;
    }
}
