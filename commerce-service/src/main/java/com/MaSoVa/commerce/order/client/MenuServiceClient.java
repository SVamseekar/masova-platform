package com.MaSoVa.commerce.order.client;

import com.MaSoVa.commerce.menu.service.MenuService;
import com.MaSoVa.shared.entity.MenuItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

/**
 * Internal MenuServiceClient for commerce-service.
 *
 * In commerce-service, menu and order domains are co-located, so this client
 * delegates directly to MenuService as an in-process call instead of HTTP.
 * No circuit breaker is needed — the call cannot fail due to network.
 */
@Component
public class MenuServiceClient {

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
