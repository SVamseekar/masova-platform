package com.MaSoVa.commerce.menu.controller;

import com.MaSoVa.shared.entity.MenuItem;
import com.MaSoVa.shared.enums.Cuisine;
import com.MaSoVa.shared.enums.MenuCategory;
import com.MaSoVa.shared.enums.DietaryType;
import com.MaSoVa.commerce.menu.dto.MenuItemRequest;
import com.MaSoVa.commerce.menu.service.MenuService;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/menu")
public class MenuController {

    @Autowired
    private MenuService menuService;

    /**
     * Extract storeId from HTTP headers
     */
    private String getStoreIdFromHeaders(HttpServletRequest request) {
        String userType = request.getHeader("X-User-Type");
        String selectedStoreId = request.getHeader("X-Selected-Store-Id");
        String userStoreId = request.getHeader("X-User-Store-Id");

        // Managers/Customers use selected store
        if ("MANAGER".equals(userType) || "CUSTOMER".equals(userType)) {
            return selectedStoreId != null ? selectedStoreId : userStoreId;
        }

        // Staff/Driver use assigned store
        return userStoreId;
    }

    // ========== PUBLIC ENDPOINTS (Customer Access - No Auth) ==========

    @GetMapping("/public")
    public ResponseEntity<List<MenuItem>> getAvailableMenu(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        return ResponseEntity.ok(menuService.getMenuItemsByStore(storeId));
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<MenuItem> getMenuItem(@PathVariable String id) {
        return menuService.getMenuItemById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/public/cuisine/{cuisine}")
    public ResponseEntity<List<MenuItem>> getMenuByCuisine(
            @PathVariable Cuisine cuisine,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        return ResponseEntity.ok(menuService.getMenuItemsByStoreAndCuisine(storeId, cuisine));
    }

    @GetMapping("/public/category/{category}")
    public ResponseEntity<List<MenuItem>> getMenuByCategory(
            @PathVariable MenuCategory category,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        return ResponseEntity.ok(menuService.getMenuItemsByStoreAndCategory(storeId, category));
    }

    @GetMapping("/public/dietary/{dietaryType}")
    public ResponseEntity<List<MenuItem>> getMenuByDietaryType(
            @PathVariable DietaryType dietaryType,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        return ResponseEntity.ok(menuService.getMenuItemsByStoreAndDietaryType(storeId, dietaryType));
    }

    @GetMapping("/public/recommended")
    public ResponseEntity<List<MenuItem>> getRecommendedItems(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        return ResponseEntity.ok(menuService.getRecommendedItemsByStore(storeId));
    }

    @GetMapping("/public/search")
    public ResponseEntity<List<MenuItem>> searchMenu(
            @RequestParam String q,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        return ResponseEntity.ok(menuService.searchMenuItemsByStore(storeId, q));
    }

    @GetMapping("/public/tag/{tag}")
    public ResponseEntity<List<MenuItem>> getMenuByTag(
            @PathVariable String tag,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        return ResponseEntity.ok(menuService.getMenuItemsByStoreAndTag(storeId, tag));
    }

    // ========== MANAGER ENDPOINTS (Full CRUD - Auth handled by API Gateway) ==========

    @GetMapping("/items")
    public ResponseEntity<List<MenuItem>> getAllMenuItems(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        return ResponseEntity.ok(menuService.getMenuItemsByStore(storeId));
    }

    @PostMapping("/items")
    public ResponseEntity<MenuItem> createMenuItem(@Valid @RequestBody MenuItemRequest request) {
        MenuItem menuItem = new MenuItem();
        BeanUtils.copyProperties(request, menuItem);
        MenuItem created = menuService.createMenuItem(menuItem);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/items/bulk")
    public ResponseEntity<List<MenuItem>> createMultipleMenuItems(@RequestBody List<MenuItemRequest> requests) {
        List<MenuItem> menuItems = requests.stream().map(request -> {
            MenuItem menuItem = new MenuItem();
            BeanUtils.copyProperties(request, menuItem);
            return menuItem;
        }).toList();

        List<MenuItem> created = menuService.createMenuItems(menuItems);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<MenuItem> updateMenuItem(
            @PathVariable String id,
            @Valid @RequestBody MenuItemRequest request) {
        MenuItem menuItem = new MenuItem();
        BeanUtils.copyProperties(request, menuItem);
        MenuItem updated = menuService.updateMenuItem(id, menuItem);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/items/{id}/availability")
    public ResponseEntity<MenuItem> toggleAvailability(@PathVariable String id) {
        MenuItem updated = menuService.toggleAvailability(id);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/items/{id}/availability/{status}")
    public ResponseEntity<MenuItem> setAvailability(
            @PathVariable String id,
            @PathVariable boolean status) {
        MenuItem updated = menuService.setAvailability(id, status);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable String id) {
        menuService.deleteMenuItem(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/items")
    public ResponseEntity<Void> deleteAllMenuItems() {
        menuService.deleteAllMenuItems();
        return ResponseEntity.noContent().build();
    }

    // ========== MENU COPY ENDPOINT ==========

    /**
     * Copy all menu items from source store to target store
     * Usage: POST /api/menu/copy-menu?sourceStoreId=xxx&targetStoreId=yyy
     */
    @PostMapping("/copy-menu")
    public ResponseEntity<Map<String, Object>> copyMenuBetweenStores(
            @RequestParam String sourceStoreId,
            @RequestParam String targetStoreId) {
        try {
            List<MenuItem> copiedItems = menuService.copyMenuBetweenStores(sourceStoreId, targetStoreId);

            Map<String, Object> response = Map.of(
                "success", true,
                "message", String.format("Successfully copied %d menu items from store %s to store %s",
                                        copiedItems.size(), sourceStoreId, targetStoreId),
                "copiedItemsCount", copiedItems.size(),
                "sourceStoreId", sourceStoreId,
                "targetStoreId", targetStoreId
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "Failed to copy menu: " + e.getMessage(),
                "error", e.getClass().getSimpleName()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ========== STATISTICS ENDPOINTS ==========

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getMenuStatistics(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        Map<String, Object> stats = Map.of(
            "totalItems", menuService.getTotalItemsCountByStore(storeId),
            "availableItems", menuService.getAvailableItemsCountByStore(storeId),
            "southIndianCount", menuService.getItemsCountByStoreAndCuisine(storeId, Cuisine.SOUTH_INDIAN),
            "northIndianCount", menuService.getItemsCountByStoreAndCuisine(storeId, Cuisine.NORTH_INDIAN),
            "indoChineseCount", menuService.getItemsCountByStoreAndCuisine(storeId, Cuisine.INDO_CHINESE),
            "italianCount", menuService.getItemsCountByStoreAndCuisine(storeId, Cuisine.ITALIAN),
            "pizzaCount", menuService.getItemsCountByStoreAndCategory(storeId, MenuCategory.PIZZA),
            "burgerCount", menuService.getItemsCountByStoreAndCategory(storeId, MenuCategory.BURGER)
        );
        return ResponseEntity.ok(stats);
    }
}
