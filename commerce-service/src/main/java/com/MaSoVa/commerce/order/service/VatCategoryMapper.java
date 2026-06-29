package com.MaSoVa.commerce.order.service;

import com.MaSoVa.shared.entity.MenuItem;
import com.MaSoVa.shared.enums.MenuCategory;

import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Maps menu items to VAT routing categories used by {@link EuVatEngine}.
 * Returns one of: FOOD, BEVERAGE, ALCOHOL.
 */
public final class VatCategoryMapper {

    private static final Set<MenuCategory> BEVERAGE_CATEGORIES = Set.of(
            MenuCategory.HOT_DRINKS,
            MenuCategory.COLD_DRINKS,
            MenuCategory.TEA_CHAI
    );

    private static final List<String> ALCOHOL_KEYWORDS = List.of(
            "alcohol", "alcoholic", "beer", "wine", "whisky", "whiskey",
            "vodka", "rum", "gin", "cocktail", "champagne", "cider", "lager", "ale"
    );

    private VatCategoryMapper() {
    }

    public static String fromMenuItem(MenuItem item) {
        if (item == null) {
            return "FOOD";
        }
        if (isAlcohol(item)) {
            return "ALCOHOL";
        }
        if (item.getCategory() != null && BEVERAGE_CATEGORIES.contains(item.getCategory())) {
            return "BEVERAGE";
        }
        return "FOOD";
    }

    private static boolean isAlcohol(MenuItem item) {
        if (containsAlcoholKeyword(item.getName())) {
            return true;
        }
        if (containsAlcoholKeyword(item.getSubCategory())) {
            return true;
        }
        if (containsAlcoholKeyword(item.getDescription())) {
            return true;
        }
        if (item.getTags() != null) {
            for (String tag : item.getTags()) {
                if (containsAlcoholKeyword(tag)) {
                    return true;
                }
            }
        }
        return false;
    }

    private static boolean containsAlcoholKeyword(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }
        String normalized = text.toLowerCase(Locale.ROOT);
        for (String keyword : ALCOHOL_KEYWORDS) {
            if (normalized.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}