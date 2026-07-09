package com.MaSoVa.commerce.menu.controller;

import com.MaSoVa.shared.entity.MenuItem;
import com.MaSoVa.shared.enums.Cuisine;
import com.MaSoVa.shared.enums.MenuCategory;
import com.MaSoVa.shared.enums.DietaryType;
import com.MaSoVa.commerce.menu.dto.AllergenDeclarationRequest;
import com.MaSoVa.commerce.menu.dto.MenuItemRequest;
import com.MaSoVa.commerce.menu.service.MenuService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.beans.BeanUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

/**
 * Menu — 8 canonical endpoints at /api/menu.
 * Replaces: /public, /public/{id}, /public/cuisine/{c}, /public/category/{cat},
 *           /public/dietary/{d}, /public/recommended, /public/search, /public/tag/{t},
 *           /items, /items/{id}, /items/bulk, /items/{id}/availability,
 *           /items/{id}/availability/{status}, /stats, /copy-menu, v1 duplicates.
 */
@RestController
@RequestMapping("/api/menu")
@Tag(name = "Menu", description = "Public menu browsing and admin CRUD")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    private String getStoreIdFromHeaders(HttpServletRequest request) {
        String userType = request.getHeader("X-User-Type");
        String selectedStoreId = request.getHeader("X-Selected-Store-Id");
        String userStoreId = request.getHeader("X-User-Store-Id");
        if ("MANAGER".equals(userType) || "CUSTOMER".equals(userType)) {
            return selectedStoreId != null ? selectedStoreId : userStoreId;
        }
        return userStoreId;
    }

    // ── PUBLIC LIST ───────────────────────────────────────────────────────────────

    /**
     * GET /api/menu?storeId=&category=&cuisine=&dietary=&search=&recommended=&tag=
     * Public (no auth). Prefer {@code storeId} query for anonymous customer browsing;
     * falls back to X-Selected-Store-Id / X-User-Store-Id headers for staff/customer apps.
     * Replaces: /public, /public/cuisine/{c}, /public/category/{cat},
     *           /public/dietary/{d}, /public/recommended, /public/search, /public/tag/{t}
     */
    @GetMapping
    @Operation(summary = "Browse menu (query: storeId, category, cuisine, dietary, search, recommended, tag)")
    public ResponseEntity<List<MenuItem>> getMenu(
            @RequestParam(required = false) String storeId,
            @RequestParam(required = false) MenuCategory category,
            @RequestParam(required = false) Cuisine cuisine,
            @RequestParam(required = false) DietaryType dietary,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean recommended,
            @RequestParam(required = false) String tag,
            HttpServletRequest request) {
        String resolvedStoreId = (storeId != null && !storeId.isBlank())
                ? storeId.trim()
                : getStoreIdFromHeaders(request);
        if (Boolean.TRUE.equals(recommended)) {
            return ResponseEntity.ok(menuService.getRecommendedItemsByStore(resolvedStoreId));
        }
        if (search != null) {
            return ResponseEntity.ok(menuService.searchMenuItemsByStore(resolvedStoreId, search));
        }
        if (tag != null) {
            return ResponseEntity.ok(menuService.getMenuItemsByStoreAndTag(resolvedStoreId, tag));
        }
        if (cuisine != null) {
            return ResponseEntity.ok(menuService.getMenuItemsByStoreAndCuisine(resolvedStoreId, cuisine));
        }
        if (category != null) {
            return ResponseEntity.ok(menuService.getMenuItemsByStoreAndCategory(resolvedStoreId, category));
        }
        if (dietary != null) {
            return ResponseEntity.ok(menuService.getMenuItemsByStoreAndDietaryType(resolvedStoreId, dietary));
        }
        return ResponseEntity.ok(menuService.getMenuItemsByStore(resolvedStoreId));
    }

    // ── SINGLE ITEM ───────────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    @Operation(summary = "Get menu item by ID")
    public ResponseEntity<MenuItem> getMenuItem(@PathVariable String id) {
        return menuService.getMenuItemById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── ADMIN CRUD (auth required, gateway enforces) ──────────────────────────────

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Create menu item", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<MenuItem> createMenuItem(@Valid @RequestBody MenuItemRequest request) {
        MenuItem menuItem = new MenuItem();
        BeanUtils.copyProperties(request, menuItem);
        return ResponseEntity.status(HttpStatus.CREATED).body(menuService.createMenuItem(menuItem));
    }

    /**
     * POST /api/menu/bulk — batch create
     * Replaces: /items/bulk
     */
    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Bulk create menu items", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<List<MenuItem>> createMenuItems(@RequestBody List<MenuItemRequest> requests) {
        List<MenuItem> items = requests.stream().map(r -> {
            MenuItem m = new MenuItem();
            BeanUtils.copyProperties(r, m);
            return m;
        }).toList();
        return ResponseEntity.status(HttpStatus.CREATED).body(menuService.createMenuItems(items));
    }

    /**
     * PATCH /api/menu/{id} — update fields (replaces PUT) and toggle availability
     * Body: any MenuItem fields; body.available toggles on/off.
     * Replaces: PUT /items/{id}, PATCH /items/{id}/availability, PATCH /items/{id}/availability/{status}
     */
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Update menu item (fields or availability)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<MenuItem> updateMenuItem(
            @PathVariable String id,
            @Valid @RequestBody MenuItemRequest request) {
        MenuItem menuItem = new MenuItem();
        BeanUtils.copyProperties(request, menuItem);
        return ResponseEntity.ok(menuService.updateMenuItem(id, menuItem));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Delete menu item", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> deleteMenuItem(@PathVariable String id) {
        menuService.deleteMenuItem(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/menu/copy — copy all items from one store to another
     * Replaces: POST /copy-menu (renamed to match canonical spec)
     */
    @PostMapping("/copy")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Copy menu between stores", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> copyMenu(
            @RequestParam String fromStoreId,
            @RequestParam String toStoreId) {
        List<MenuItem> copied = menuService.copyMenuBetweenStores(fromStoreId, toStoreId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "copiedItemsCount", copied.size(),
                "fromStoreId", fromStoreId,
                "toStoreId", toStoreId));
    }

    /**
     * PATCH /api/menu/items/{id}/allergens — declare allergens for a menu item (EU Regulation 1169/2011)
     */
    @PatchMapping("/items/{id}/allergens")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Declare allergens for a menu item", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<MenuItem> declareAllergens(
            @PathVariable String id,
            @RequestBody AllergenDeclarationRequest request) {
        MenuItem updated = menuService.declareAllergens(id, request.getAllergens(), request.isAllergenFree());
        return ResponseEntity.ok(updated);
    }

    /**
     * GET /api/menu/stats — menu statistics for a store
     * Replaces: GET /stats
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Menu statistics", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Map<String, Object>> getMenuStats(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        return ResponseEntity.ok(Map.of(
                "totalItems", menuService.getTotalItemsCountByStore(storeId),
                "availableItems", menuService.getAvailableItemsCountByStore(storeId)));
    }
}
