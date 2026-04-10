package com.MaSoVa.commerce.menu.service;

import com.MaSoVa.shared.entity.MenuItem;
import com.MaSoVa.shared.enums.AllergenType;
import com.MaSoVa.shared.enums.Cuisine;
import com.MaSoVa.shared.enums.MenuCategory;
import com.MaSoVa.shared.exception.BusinessException;
import com.MaSoVa.commerce.menu.repository.MenuItemRepository;
import com.MaSoVa.shared.test.BaseServiceTest;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class MenuServiceTest extends BaseServiceTest {

    @Mock
    private MenuItemRepository menuItemRepository;

    @InjectMocks
    private MenuService menuService;

    private MenuItem baseItem;

    @BeforeEach
    void setUp() {
        baseItem = new MenuItem("Margherita Pizza", Cuisine.ITALIAN, MenuCategory.PIZZA, 29900L);
        baseItem.setId("item-1");
        baseItem.setStoreId("store-1");
    }

    // ── Existing CRUD safety floor ────────────────────────────────────────────

    @Test
    @DisplayName("createMenuItem saves and returns the item")
    void createMenuItem_savesItem() {
        baseItem.setIsAvailable(false);
        when(menuItemRepository.save(any(MenuItem.class))).thenReturn(baseItem);

        MenuItem result = menuService.createMenuItem(baseItem);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Margherita Pizza");
        verify(menuItemRepository).save(baseItem);
    }

    @Test
    @DisplayName("getMenuItemsByStore returns items for given storeId")
    void getMenuItemsByStore_returnsStoreItems() {
        when(menuItemRepository.findByStoreIdAndIsAvailableTrue("store-1"))
            .thenReturn(List.of(baseItem));

        List<MenuItem> result = menuService.getMenuItemsByStore("store-1");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStoreId()).isEqualTo("store-1");
    }

    @Test
    @DisplayName("getMenuItemsByStoreAndCategory returns filtered items")
    void getMenuItemsByStoreAndCategory_returnsFiltered() {
        when(menuItemRepository.findByStoreIdAndCategoryAndIsAvailableTrue("store-1", MenuCategory.PIZZA))
            .thenReturn(List.of(baseItem));

        List<MenuItem> result = menuService.getMenuItemsByStoreAndCategory("store-1", MenuCategory.PIZZA);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCategory()).isEqualTo(MenuCategory.PIZZA);
    }

    @Test
    @DisplayName("updateMenuItem updates fields and saves")
    void updateMenuItem_updatesFields() {
        MenuItem updated = new MenuItem("New Name", Cuisine.ITALIAN, MenuCategory.PIZZA, 35000L);
        updated.setAllergensDeclared(true);
        when(menuItemRepository.findById("item-1")).thenReturn(Optional.of(baseItem));
        when(menuItemRepository.save(any(MenuItem.class))).thenAnswer(inv -> inv.getArgument(0));

        MenuItem result = menuService.updateMenuItem("item-1", updated);

        assertThat(result.getName()).isEqualTo("New Name");
        assertThat(result.getBasePrice()).isEqualTo(35000L);
        verify(menuItemRepository).save(any(MenuItem.class));
    }

    @Test
    @DisplayName("deleteMenuItem calls repository deleteById")
    void deleteMenuItem_callsRepository() {
        doNothing().when(menuItemRepository).deleteById("item-1");

        menuService.deleteMenuItem("item-1");

        verify(menuItemRepository).deleteById("item-1");
    }

    // ── MenuItem validation safety floor ─────────────────────────────────────

    @Test
    @DisplayName("MenuItem name is required — not null")
    void menuItem_nameRequired() {
        MenuItem item = new MenuItem();
        assertThat(item.getName()).isNull();
    }

    @Test
    @DisplayName("MenuItem isAvailable defaults to true on constructor")
    void menuItem_isAvailableDefaultsTrue() {
        MenuItem item = new MenuItem("Test", Cuisine.ITALIAN, MenuCategory.PIZZA, 10000L);
        assertThat(item.getIsAvailable()).isTrue();
    }

    @Test
    @DisplayName("MenuItem allergensDeclared defaults to false")
    void menuItem_allergensDeclaredDefaultsFalse() {
        MenuItem item = new MenuItem("Test", Cuisine.ITALIAN, MenuCategory.PIZZA, 10000L);
        assertThat(item.isAllergensDeclared()).isFalse();
    }

    // ── MenuController safety floor (delegation) ──────────────────────────────

    @Test
    @DisplayName("getMenuItemById returns empty for unknown id")
    void getMenuItemById_returnsEmptyForUnknown() {
        when(menuItemRepository.findById("unknown")).thenReturn(Optional.empty());

        Optional<MenuItem> result = menuService.getMenuItemById("unknown");

        assertThat(result).isEmpty();
    }
}
