package com.MaSoVa.shared.enums;

public enum MenuCategory {
    // South Indian
    DOSA("Dosa"),
    IDLY_VADA("Idly & Vada"),
    SOUTH_INDIAN_MEALS("South Indian Meals"),

    // North Indian
    CURRY_GRAVY("Curries & Gravies"),
    DAL_DISHES("Dal Dishes"),
    NORTH_INDIAN_MEALS("North Indian Meals"),

    // Indo-Chinese
    FRIED_RICE("Fried Rice"),
    NOODLES("Noodles"),
    MANCHURIAN("Manchurian & Gravy"),

    // Rice & Breads
    RICE_VARIETIES("Rice Varieties"),
    CHAPATI_ROTI("Chapati & Roti"),
    NAAN_KULCHA("Naan & Kulcha"),

    // Western
    PIZZA("Pizza"),
    BURGER("Burgers"),
    SIDES("Sides"),

    // Beverages
    HOT_DRINKS("Hot Drinks"),
    COLD_DRINKS("Cold Drinks"),
    TEA_CHAI("Tea & Chai"),

    // Desserts
    COOKIES_BROWNIES("Cookies & Brownies"),
    ICE_CREAM("Ice Cream"),
    DESSERT_SPECIALS("Dessert Specials");

    private final String displayName;

    MenuCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
