package com.MaSoVa.commerce.order.client;

import com.MaSoVa.commerce.menu.service.MenuService;
import com.MaSoVa.commerce.order.service.VatCategoryMapper;
import com.MaSoVa.shared.entity.MenuItem;
import com.MaSoVa.shared.entity.Store;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.List;
import java.util.HashMap;
import java.util.Set;
import java.util.Objects;
import java.math.BigDecimal;
import com.MaSoVa.shared.model.MenuVariant;
import com.MaSoVa.shared.model.MenuCustomization;

/**
 * Internal MenuServiceClient for commerce-service.
 *
 * In commerce-service, menu and order domains are co-located, so this client
 * delegates directly to MenuService as an in-process call instead of HTTP.
 * No circuit breaker is needed — the call cannot fail due to network.
 */
@Component
public class MenuServiceClient {
    // Existing platform storage convention: these currencies store face values directly.
    private static final Set<String> FACE_VALUE_CURRENCIES = Set.of(
            "HUF", "JPY", "KRW", "TWD", "BIF", "CLP", "GNF", "ISK", "MGA", "PYG",
            "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF");

    private static final Logger log = LoggerFactory.getLogger(MenuServiceClient.class);

    private final MenuService menuService;

    public MenuServiceClient(MenuService menuService) {
        this.menuService = menuService;
    }

    /**
     * Check if menu item is available.
     * Fails-open: returns true if item not found.
     */
    public boolean isMenuItemAvailable(String menuItemId) {
        try {
            Optional<MenuItem> item = menuService.getMenuItemById(menuItemId);
            return item.map(i -> Boolean.TRUE.equals(i.getIsAvailable())).orElse(true);
        } catch (Exception e) {
            log.warn("Failed to check menu item availability for {}: {} — failing open", menuItemId, e.getMessage());
            return true;
        }
    }

    /**
     * Validate menu item price (base price is in paise, expectedPrice is in rupees).
     * Fails-open: returns true if item not found.
     */
    public boolean validatePrice(String menuItemId, Double expectedPrice) {
        try {
            Optional<MenuItem> item = menuService.getMenuItemById(menuItemId);
            if (item.isEmpty()) return true;
            Long basePrice = item.get().getBasePrice();
            if (basePrice == null) return true;
            double actualPrice = basePrice / 100.0;
            return Math.abs(actualPrice - expectedPrice) < 0.01;
        } catch (Exception e) {
            log.warn("Failed to validate price for {}: {} — failing open", menuItemId, e.getMessage());
            return true;
        }
    }

    /** Validate the selected configuration against current server menu values in minor units. */
    public boolean validatePrice(String menuItemId, Double expectedPrice,
                                 String variantName, List<String> customizationNames) {
        return validatePrice(menuItemId, expectedPrice, variantName, customizationNames, null);
    }

    public boolean validatePrice(String menuItemId, Double expectedPrice,
                                 String variantName, List<String> customizationNames, Store store) {
        if (expectedPrice == null || !Double.isFinite(expectedPrice) || expectedPrice < 0) return false;
        Optional<MenuItem> found = menuService.getMenuItemById(menuItemId);
        if (found.isEmpty()) return false;
        MenuItem item = found.get();
        if (store != null && item.getStoreId() != null && !item.getStoreId().isBlank()
                && !Objects.equals(item.getStoreId(), store.getCode())
                && !Objects.equals(item.getStoreId(), store.getId())) return false;
        if (!Boolean.TRUE.equals(item.getIsAvailable()) || item.getBasePrice() == null) return false;
        long total = item.getBasePrice();
        if (variantName != null && !variantName.isBlank()) {
            MenuVariant variant = item.getVariants() == null ? null : item.getVariants().stream()
                    .filter(value -> variantName.equals(value.getName())).findFirst().orElse(null);
            if (variant == null || Boolean.FALSE.equals(variant.getIsAvailable())) return false;
            total = Math.addExact(total, variant.getPriceModifier() == null ? 0L : variant.getPriceModifier());
        }
        Map<String, Integer> counts = new HashMap<>();
        for (String name : customizationNames == null ? List.<String>of() : customizationNames) {
            MenuCustomization option = item.getCustomizations() == null ? null : item.getCustomizations().stream()
                    .filter(value -> name != null && name.equals(value.getName())).findFirst().orElse(null);
            if (option == null || Boolean.FALSE.equals(option.getIsAvailable())) return false;
            int count = counts.merge(name, 1, Integer::sum);
            int max = option.getMaxQuantity() == null ? 1 : option.getMaxQuantity();
            if (count > max) return false;
            total = Math.addExact(total, option.getPrice() == null ? 0L : option.getPrice());
        }
        String currency = store == null || store.getCurrency() == null ? "INR" : store.getCurrency();
        int scale = FACE_VALUE_CURRENCIES.contains(currency) ? 0 : 2;
        return total >= 0 && BigDecimal.valueOf(expectedPrice).movePointRight(scale)
                .compareTo(BigDecimal.valueOf(total)) == 0;
    }

    /**
     * Resolve VAT routing category (FOOD, BEVERAGE, ALCOHOL) from menu metadata.
     * Fails-open: returns FOOD if item not found.
     */
    public String resolveVatCategory(String menuItemId) {
        try {
            Optional<MenuItem> item = menuService.getMenuItemById(menuItemId);
            return item.map(VatCategoryMapper::fromMenuItem).orElse("FOOD");
        } catch (Exception e) {
            log.warn("Failed to resolve VAT category for {}: {} — defaulting to FOOD",
                    menuItemId, e.getMessage());
            return "FOOD";
        }
    }

    /**
     * Get menu item details as a map (kept for API compatibility with OrderService).
     */
    public Map<String, Object> getMenuItem(String menuItemId) {
        try {
            Optional<MenuItem> item = menuService.getMenuItemById(menuItemId);
            if (item.isEmpty()) return null;
            MenuItem m = item.get();
            return Map.of(
                    "id", m.getId(),
                    "name", m.getName(),
                    "basePrice", m.getBasePrice() != null ? m.getBasePrice() : 0L,
                    "isAvailable", Boolean.TRUE.equals(m.getIsAvailable())
            );
        } catch (Exception e) {
            log.warn("Failed to get menu item {}: {}", menuItemId, e.getMessage());
            return null;
        }
    }
}
