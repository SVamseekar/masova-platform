package com.MaSoVa.shared.entity;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class StoreVatFieldsTest {

    @Test
    void new_store_has_null_countryCode_by_default() {
        Store store = new Store("Test Store", "DOM001", null, "9876543210");
        assertThat(store.getCountryCode()).isNull();
    }

    @Test
    void countryCode_can_be_set_and_retrieved() {
        Store store = new Store("DE Store", "DOM002", null, "9876543210");
        store.setCountryCode("DE");
        assertThat(store.getCountryCode()).isEqualTo("DE");
    }

    @Test
    void vatNumber_can_be_set_and_retrieved() {
        Store store = new Store("DE Store", "DOM002", null, "9876543210");
        store.setVatNumber("DE123456789");
        assertThat(store.getVatNumber()).isEqualTo("DE123456789");
    }

    @Test
    void currency_can_be_set_and_retrieved() {
        Store store = new Store("DE Store", "DOM002", null, "9876543210");
        store.setCurrency("EUR");
        assertThat(store.getCurrency()).isEqualTo("EUR");
    }

    @Test
    void locale_can_be_set_and_retrieved() {
        Store store = new Store("DE Store", "DOM002", null, "9876543210");
        store.setLocale("de-DE");
        assertThat(store.getLocale()).isEqualTo("de-DE");
    }

    @Test
    void india_store_with_null_countryCode_is_valid() {
        Store store = new Store("Mumbai Store", "DOM003", null, "9876543210");
        assertThat(store.getCountryCode()).isNull();
        assertThat(store.getCurrency()).isNull();
    }
}
