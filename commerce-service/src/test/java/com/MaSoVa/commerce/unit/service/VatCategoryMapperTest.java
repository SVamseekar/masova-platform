package com.MaSoVa.commerce.unit.service;

import com.MaSoVa.commerce.order.service.VatCategoryMapper;
import com.MaSoVa.shared.entity.MenuItem;
import com.MaSoVa.shared.enums.Cuisine;
import com.MaSoVa.shared.enums.MenuCategory;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class VatCategoryMapperTest {

    @Test
    void null_item_defaults_to_FOOD() {
        assertThat(VatCategoryMapper.fromMenuItem(null)).isEqualTo("FOOD");
    }

    @Test
    void pizza_category_maps_to_FOOD() {
        MenuItem item = new MenuItem("Margherita", Cuisine.ITALIAN, MenuCategory.PIZZA, 1000L);
        assertThat(VatCategoryMapper.fromMenuItem(item)).isEqualTo("FOOD");
    }

    @Test
    void cold_drinks_category_maps_to_BEVERAGE() {
        MenuItem item = new MenuItem("Cola", Cuisine.BEVERAGES, MenuCategory.COLD_DRINKS, 500L);
        assertThat(VatCategoryMapper.fromMenuItem(item)).isEqualTo("BEVERAGE");
    }

    @Test
    void alcohol_tag_maps_to_ALCOHOL() {
        MenuItem item = new MenuItem("House Lager", Cuisine.BEVERAGES, MenuCategory.COLD_DRINKS, 800L);
        item.setTags(List.of("alcohol", "popular"));
        assertThat(VatCategoryMapper.fromMenuItem(item)).isEqualTo("ALCOHOL");
    }

    @Test
    void wine_in_name_maps_to_ALCOHOL() {
        MenuItem item = new MenuItem("Red Wine Glass", Cuisine.BEVERAGES, MenuCategory.COLD_DRINKS, 1200L);
        assertThat(VatCategoryMapper.fromMenuItem(item)).isEqualTo("ALCOHOL");
    }
}