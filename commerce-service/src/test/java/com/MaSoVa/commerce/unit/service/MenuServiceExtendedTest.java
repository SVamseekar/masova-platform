package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.menu.repository.MenuItemRepository;
import com.MaSoVa.commerce.menu.service.MenuService;
import com.MaSoVa.shared.entity.MenuItem;
import com.MaSoVa.shared.enums.AllergenType;
import com.MaSoVa.shared.enums.Cuisine;
import com.MaSoVa.shared.enums.MenuCategory;
import com.MaSoVa.shared.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MenuServiceExtendedTest {

    @Mock private MenuItemRepository menuItemRepository;
    @InjectMocks private MenuService menuService;

    private MenuItem buildItem(String id, boolean available, boolean allergensDeclared) {
        MenuItem item = new MenuItem("Test Pizza", Cuisine.ITALIAN, MenuCategory.PIZZA, 25000L);
        item.setId(id);
        item.setStoreId("store-1");
        item.setIsAvailable(available);
        item.setAllergensDeclared(allergensDeclared);
        item.setAllergens(new HashSet<>());
        item.setVariants(new ArrayList<>());
        item.setCustomizations(new ArrayList<>());
        item.setDietaryInfo(new ArrayList<>());
        item.setIngredients(new ArrayList<>());
        item.setPreparationInstructions(new ArrayList<>());
        item.setTags(new ArrayList<>());
        return item;
    }

    // Allergen gate

    @Test
    void createMenuItem_available_without_allergens_declared_throws() {
        MenuItem item = buildItem("m1", true, false);

        assertThatThrownBy(() -> menuService.createMenuItem(item))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("allergens must be declared");
    }

    @Test
    void createMenuItem_unavailable_without_allergens_declared_succeeds() {
        MenuItem item = buildItem("m1", false, false);
        when(menuItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MenuItem result = menuService.createMenuItem(item);

        assertThat(result).isNotNull();
        verify(menuItemRepository).save(item);
    }

    @Test
    void createMenuItem_available_with_allergens_declared_succeeds() {
        MenuItem item = buildItem("m1", true, true);
        when(menuItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MenuItem result = menuService.createMenuItem(item);

        assertThat(result).isNotNull();
    }

    @Test
    void setAvailability_available_without_allergens_throws() {
        MenuItem item = buildItem("m1", false, false);
        when(menuItemRepository.findById("m1")).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> menuService.setAvailability("m1", true))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("allergens must be declared");
    }

    @Test
    void setAvailability_to_false_always_succeeds() {
        MenuItem item = buildItem("m1", true, true);
        when(menuItemRepository.findById("m1")).thenReturn(Optional.of(item));
        when(menuItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MenuItem result = menuService.setAvailability("m1", false);

        assertThat(result.getIsAvailable()).isFalse();
    }

    @Test
    void toggleAvailability_flips_availability() {
        MenuItem item = buildItem("m1", true, true);
        when(menuItemRepository.findById("m1")).thenReturn(Optional.of(item));
        when(menuItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MenuItem result = menuService.toggleAvailability("m1");

        assertThat(result.getIsAvailable()).isFalse();
    }

    @Test
    void toggleAvailability_not_found_throws() {
        when(menuItemRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> menuService.toggleAvailability("missing"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Menu item not found");
    }

    // Allergen declaration

    @Test
    void declareAllergens_sets_allergens_and_declared_flag() {
        MenuItem item = buildItem("m1", false, false);
        when(menuItemRepository.findById("m1")).thenReturn(Optional.of(item));
        when(menuItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Set<AllergenType> allergens = Set.of(AllergenType.CEREALS_GLUTEN, AllergenType.MILK);
        MenuItem result = menuService.declareAllergens("m1", allergens, false);

        assertThat(result.isAllergensDeclared()).isTrue();
        assertThat(result.getAllergens()).containsExactlyInAnyOrder(AllergenType.CEREALS_GLUTEN, AllergenType.MILK);
    }

    @Test
    void declareAllergens_allergenFree_clears_allergens() {
        MenuItem item = buildItem("m1", false, false);
        item.setAllergens(new HashSet<>(Set.of(AllergenType.CEREALS_GLUTEN)));
        when(menuItemRepository.findById("m1")).thenReturn(Optional.of(item));
        when(menuItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MenuItem result = menuService.declareAllergens("m1", null, true);

        assertThat(result.isAllergensDeclared()).isTrue();
        assertThat(result.getAllergens()).isEmpty();
    }

    @Test
    void declareAllergens_not_found_throws() {
        when(menuItemRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> menuService.declareAllergens("missing", Set.of(), false))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Menu item not found");
    }

    // Copy menu

    @Test
    void copyMenuBetweenStores_copies_all_items_to_target_store() {
        MenuItem source = buildItem("m1", true, true);
        source.setName("Margherita");
        when(menuItemRepository.findByStoreId("store-source")).thenReturn(List.of(source));
        when(menuItemRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        menuService.copyMenuBetweenStores("store-source", "store-target");

        verify(menuItemRepository).saveAll(argThat((List<MenuItem> items) ->
                items.size() == 1 && "store-target".equals(items.get(0).getStoreId())
        ));
    }

    @Test
    void copyMenuBetweenStores_requires_allergen_redeclaration() {
        MenuItem source = buildItem("m1", true, true);
        when(menuItemRepository.findByStoreId("store-source")).thenReturn(List.of(source));
        when(menuItemRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        menuService.copyMenuBetweenStores("store-source", "store-target");

        verify(menuItemRepository).saveAll(argThat((List<MenuItem> items) ->
                !items.get(0).isAllergensDeclared()
        ));
    }

    @Test
    void copyMenuBetweenStores_empty_source_throws() {
        when(menuItemRepository.findByStoreId("store-empty")).thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> menuService.copyMenuBetweenStores("store-empty", "store-target"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("No menu items found");
    }

    // Statistics

    @Test
    void getTotalItemsCount_delegates_to_repository() {
        when(menuItemRepository.count()).thenReturn(42L);

        assertThat(menuService.getTotalItemsCount()).isEqualTo(42L);
    }

    @Test
    void getTotalItemsCountByStore_delegates_to_repository() {
        when(menuItemRepository.countByStoreId("store-1")).thenReturn(10L);

        assertThat(menuService.getTotalItemsCountByStore("store-1")).isEqualTo(10L);
    }

    @Test
    void getAvailableItemsCount_counts_available_items() {
        MenuItem item = buildItem("m1", true, true);
        when(menuItemRepository.findByIsAvailableTrue()).thenReturn(List.of(item));

        assertThat(menuService.getAvailableItemsCount()).isEqualTo(1L);
    }

    @Test
    void getAvailableItemsCountByStore_delegates_to_repository() {
        when(menuItemRepository.countByStoreIdAndIsAvailableTrue("store-1")).thenReturn(5L);

        assertThat(menuService.getAvailableItemsCountByStore("store-1")).isEqualTo(5L);
    }

    // Delete

    @Test
    void deleteMenuItem_delegates_to_repository() {
        menuService.deleteMenuItem("m1");

        verify(menuItemRepository).deleteById("m1");
    }

    @Test
    void deleteAllMenuItems_delegates_to_repository() {
        menuService.deleteAllMenuItems();

        verify(menuItemRepository).deleteAll();
    }

    // getMenuItemsByStore with null/empty

    @Test
    void getMenuItemsByStore_null_storeId_returns_all_available() {
        MenuItem item = buildItem("m1", true, true);
        when(menuItemRepository.findByIsAvailableTrue()).thenReturn(List.of(item));

        List<MenuItem> result = menuService.getMenuItemsByStore(null);

        assertThat(result).hasSize(1);
        verify(menuItemRepository).findByIsAvailableTrue();
    }

    @Test
    void getMenuItemsByStore_empty_storeId_returns_all_available() {
        MenuItem item = buildItem("m1", true, true);
        when(menuItemRepository.findByIsAvailableTrue()).thenReturn(List.of(item));

        List<MenuItem> result = menuService.getMenuItemsByStore("");

        assertThat(result).hasSize(1);
    }

    // updateMenuItem

    @Test
    void updateMenuItem_not_found_throws() {
        when(menuItemRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> menuService.updateMenuItem("missing", new MenuItem()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Menu item not found");
    }

    @Test
    void updateMenuItem_applies_all_fields() {
        MenuItem existing = buildItem("m1", false, false);
        when(menuItemRepository.findById("m1")).thenReturn(Optional.of(existing));
        when(menuItemRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        MenuItem updated = buildItem("m1", false, false);
        updated.setName("Pepperoni Pizza");
        updated.setBasePrice(35000L);

        MenuItem result = menuService.updateMenuItem("m1", updated);

        assertThat(result.getName()).isEqualTo("Pepperoni Pizza");
        assertThat(result.getBasePrice()).isEqualTo(35000L);
    }

    // createMenuItems bulk

    @Test
    void createMenuItems_saves_all_items() {
        MenuItem i1 = buildItem("m1", false, false);
        MenuItem i2 = buildItem("m2", false, false);
        when(menuItemRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        menuService.createMenuItems(List.of(i1, i2));

        verify(menuItemRepository).saveAll(anyList());
    }
}
