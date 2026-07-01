package com.MaSoVa.shared.enums;

public enum Cuisine {
    SOUTH_INDIAN("South Indian"),
    NORTH_INDIAN("North Indian"),
    INDO_CHINESE("Indo-Chinese"),
    ITALIAN("Italian"),
    AMERICAN("American"),
    CONTINENTAL("Continental"),
    BEVERAGES("Beverages"),
    DESSERTS("Desserts");

    private final String displayName;

    Cuisine(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
