package com.MaSoVa.menu.controller;

import com.MaSoVa.shared.entity.MenuItem;
import com.MaSoVa.shared.enums.Cuisine;
import com.MaSoVa.shared.enums.MenuCategory;
import com.MaSoVa.shared.enums.DietaryType;
import com.MaSoVa.menu.dto.MenuItemRequest;
import com.MaSoVa.menu.service.MenuService;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/menu")
@CrossOrigin(origins = "*")
public class MenuController {

    @Autowired
    private MenuService menuService;

    // ========== PUBLIC ENDPOINTS (Customer Access - No Auth) ==========

    @GetMapping("/public")
    public ResponseEntity<List<MenuItem>> getAvailableMenu() {
        return ResponseEntity.ok(menuService.getAvailableMenuItems());
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<MenuItem> getMenuItem(@PathVariable String id) {
        return menuService.getMenuItemById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/public/cuisine/{cuisine}")
    public ResponseEntity<List<MenuItem>> getMenuByCuisine(@PathVariable Cuisine cuisine) {
        return ResponseEntity.ok(menuService.getMenuItemsByCuisine(cuisine));
    }

    @GetMapping("/public/category/{category}")
    public ResponseEntity<List<MenuItem>> getMenuByCategory(@PathVariable MenuCategory category) {
        return ResponseEntity.ok(menuService.getMenuItemsByCategory(category));
    }

    @GetMapping("/public/dietary/{dietaryType}")
    public ResponseEntity<List<MenuItem>> getMenuByDietaryType(@PathVariable DietaryType dietaryType) {
        return ResponseEntity.ok(menuService.getMenuItemsByDietaryType(dietaryType));
    }

    @GetMapping("/public/recommended")
    public ResponseEntity<List<MenuItem>> getRecommendedItems() {
        return ResponseEntity.ok(menuService.getRecommendedItems());
    }

    @GetMapping("/public/search")
    public ResponseEntity<List<MenuItem>> searchMenu(@RequestParam String q) {
        return ResponseEntity.ok(menuService.searchMenuItems(q));
    }

    @GetMapping("/public/tag/{tag}")
    public ResponseEntity<List<MenuItem>> getMenuByTag(@PathVariable String tag) {
        return ResponseEntity.ok(menuService.getMenuItemsByTag(tag));
    }

    // ========== MANAGER ENDPOINTS (Full CRUD - Auth handled by API Gateway) ==========

    @GetMapping("/items")
    public ResponseEntity<List<MenuItem>> getAllMenuItems() {
        return ResponseEntity.ok(menuService.getAllMenuItems());
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

    // ========== STATISTICS ENDPOINTS ==========

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getMenuStatistics() {
        Map<String, Object> stats = Map.of(
            "totalItems", menuService.getTotalItemsCount(),
            "availableItems", menuService.getAvailableItemsCount(),
            "southIndianCount", menuService.getItemsCountByCuisine(Cuisine.SOUTH_INDIAN),
            "northIndianCount", menuService.getItemsCountByCuisine(Cuisine.NORTH_INDIAN),
            "indoChineseCount", menuService.getItemsCountByCuisine(Cuisine.INDO_CHINESE),
            "italianCount", menuService.getItemsCountByCuisine(Cuisine.ITALIAN),
            "pizzaCount", menuService.getItemsCountByCategory(MenuCategory.PIZZA),
            "burgerCount", menuService.getItemsCountByCategory(MenuCategory.BURGER)
        );
        return ResponseEntity.ok(stats);
    }
}
