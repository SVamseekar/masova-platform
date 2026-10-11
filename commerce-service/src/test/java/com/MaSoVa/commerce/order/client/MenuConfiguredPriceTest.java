package com.MaSoVa.commerce.order.client;

import com.MaSoVa.commerce.menu.service.MenuService;
import com.MaSoVa.shared.entity.MenuItem;
import com.MaSoVa.shared.entity.Store;
import com.MaSoVa.shared.model.MenuVariant;
import com.MaSoVa.shared.model.MenuCustomization;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class MenuConfiguredPriceTest {
    @Test
    void usesOwningStoreCurrencyAndRejectsCrossStoreItems() {
        var menu = mock(MenuService.class);
        var item = new MenuItem();
        item.setBasePrice(1200L);
        item.setIsAvailable(true);
        item.setStoreId("HU001");
        item.setVariants(List.of(new MenuVariant("Large", 400L)));
        when(menu.getMenuItemById("pizza")).thenReturn(Optional.of(item));
        var store = new Store();
        store.setCode("HU001");
        store.setCurrency("HUF");
        var client = new MenuServiceClient(menu);
        assertThat(client.validatePrice("pizza", 1600.0, "Large", List.of(), store)).isTrue();
        assertThat(client.validatePrice("pizza", 16.0, "Large", List.of(), store)).isFalse();
        store.setCode("HU002");
        assertThat(client.validatePrice("pizza", 1600.0, "Large", List.of(), store)).isFalse();
    }
    @Test
    void validatesCurrentVariantAndExtrasRatherThanBasePriceOnly() {
        MenuItem item = new MenuItem();
        item.setBasePrice(1200L);
        item.setIsAvailable(true);
        item.setVariants(List.of(new MenuVariant("Large", 400L)));
        item.setCustomizations(List.of(new MenuCustomization("Olives", 200L, "Topping")));
        MenuService menu = mock(MenuService.class);
        when(menu.getMenuItemById("pizza")).thenReturn(Optional.of(item));
        var client = new MenuServiceClient(menu);
        // Current order path validates only the bare price, rejecting this supported configuration.
        assertThat(client.validatePrice("pizza", 18.0, "Large", List.of("Olives"))).isTrue();
        assertThat(client.validatePrice("pizza", 12.0, "Large", List.of("Olives"))).isFalse();
        assertThat(client.validatePrice("pizza", 18.001, "Large", List.of("Olives"))).isFalse();
        item.getVariants().get(0).setIsAvailable(false);
        assertThat(client.validatePrice("pizza", 18.0, "Large", List.of("Olives"))).isFalse();
    }

    @Test
    void rejectsUnknownUnavailableAndExcessCustomisationsAndMissingItems() {
        MenuItem item = new MenuItem();
        item.setBasePrice(1200L);
        item.setIsAvailable(true);
        var extra = new MenuCustomization("Olives", 200L, "Topping");
        extra.setMaxQuantity(1);
        item.setCustomizations(List.of(extra));
        MenuService menu = mock(MenuService.class);
        when(menu.getMenuItemById("pizza")).thenReturn(Optional.of(item));
        var client = new MenuServiceClient(menu);
        assertThat(client.validatePrice("pizza", 14.0, null, List.of("Olives"))).isTrue();
        assertThat(client.validatePrice("pizza", 14.0, null, List.of("Unknown"))).isFalse();
        assertThat(client.validatePrice("pizza", 16.0, null, List.of("Olives", "Olives"))).isFalse();
        extra.setIsAvailable(false);
        assertThat(client.validatePrice("pizza", 14.0, null, List.of("Olives"))).isFalse();
        assertThat(client.validatePrice("missing", 12.0, null, List.of())).isFalse();
        assertThat(client.validatePrice("pizza", Double.NaN, null, List.of())).isFalse();
    }
}
