package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.config.EuVatConfiguration;
import com.MaSoVa.commerce.order.entity.OrderItem;
import com.MaSoVa.shared.model.VatBreakdown;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class EuVatEngineTest {

    private EuVatEngine engine;

    @BeforeEach
    void setUp() {
        EuVatConfiguration config = new EuVatConfiguration();

        EuVatConfiguration.CountryVatProfile de = new EuVatConfiguration.CountryVatProfile();
        de.setDefaultRate(19.0);
        de.setContextRates(Map.of(
            "DINE_IN",  Map.of("FOOD", 19.0, "ALCOHOL", 19.0),
            "TAKEAWAY", Map.of("FOOD", 7.0,  "ALCOHOL", 19.0),
            "DELIVERY", Map.of("FOOD", 7.0,  "ALCOHOL", 19.0)
        ));
        config.setCountries(Map.of("DE", de));

        engine = new EuVatEngine(config);
    }

    @Test
    void calculate_single_food_item_DE_DINE_IN_at_19_percent() {
        OrderItem item = foodItem("item-1", "Schnitzel", 10.0, 1);
        VatBreakdown result = engine.calculate("DE", "DINE_IN", List.of(item));

        assertThat(result.getVatCountryCode()).isEqualTo("DE");
        assertThat(result.getOrderContext()).isEqualTo("DINE_IN");
        assertThat(result.getTotalNetAmount().doubleValue()).isCloseTo(10.0, within(0.01));
        assertThat(result.getTotalVatAmount().doubleValue()).isCloseTo(1.90, within(0.01));
        assertThat(result.getTotalGrossAmount().doubleValue()).isCloseTo(11.90, within(0.01));
        assertThat(result.getLines()).hasSize(1);
    }

    @Test
    void calculate_two_items_different_quantities() {
        // 2 × €10 food = net 20, vat 19% = 3.80
        OrderItem item = foodItem("item-1", "Burger", 10.0, 2);
        VatBreakdown result = engine.calculate("DE", "DINE_IN", List.of(item));
        assertThat(result.getTotalNetAmount().doubleValue()).isCloseTo(20.0, within(0.01));
        assertThat(result.getTotalVatAmount().doubleValue()).isCloseTo(3.80, within(0.01));
    }

    @Test
    void calculate_DE_TAKEAWAY_applies_7_percent_for_food() {
        OrderItem item = foodItem("item-1", "Wrap", 10.0, 1);
        VatBreakdown result = engine.calculate("DE", "TAKEAWAY", List.of(item));
        assertThat(result.getTotalVatAmount().doubleValue()).isCloseTo(0.70, within(0.01));
    }

    @Test
    void null_category_defaults_to_FOOD_rate() {
        OrderItem item = new OrderItem();
        item.setMenuItemId("item-1");
        item.setName("Special");
        item.setPrice(10.0);
        item.setQuantity(1);
        item.setCategory(null);

        VatBreakdown result = engine.calculate("DE", "DINE_IN", List.of(item));
        assertThat(result.getTotalVatAmount().doubleValue()).isCloseTo(1.90, within(0.01));
    }

    @Test
    void two_items_line_items_populated_correctly() {
        OrderItem steak = foodItem("item-1", "Steak", 20.0, 1);
        OrderItem beer = alcoholItem("item-2", "Beer", 5.0, 2);

        VatBreakdown result = engine.calculate("DE", "DINE_IN", List.of(steak, beer));
        assertThat(result.getLines()).hasSize(2);
        // steak net=20 vat=3.80, beer net=10 vat=1.90 → total net=30, total vat=5.70
        assertThat(result.getTotalNetAmount().doubleValue()).isCloseTo(30.0, within(0.01));
        assertThat(result.getTotalVatAmount().doubleValue()).isCloseTo(5.70, within(0.01));
    }

    private OrderItem foodItem(String id, String name, double price, int qty) {
        OrderItem item = new OrderItem();
        item.setMenuItemId(id);
        item.setName(name);
        item.setPrice(price);
        item.setQuantity(qty);
        item.setCategory("FOOD");
        return item;
    }

    private OrderItem alcoholItem(String id, String name, double price, int qty) {
        OrderItem item = new OrderItem();
        item.setMenuItemId(id);
        item.setName(name);
        item.setPrice(price);
        item.setQuantity(qty);
        item.setCategory("ALCOHOL");
        return item;
    }
}
