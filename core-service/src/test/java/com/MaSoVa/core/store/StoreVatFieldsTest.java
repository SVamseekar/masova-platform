package com.MaSoVa.core.store;

import com.MaSoVa.shared.entity.Store;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that the Store entity exposes VAT-related fields correctly.
 * These fields are persisted via Spring Data MongoDB auto-mapping — no extra service
 * code is needed since the StoreController uses Store as both request and response body.
 */
class StoreVatFieldsTest {

    @Test
    void store_vat_fields_default_to_null() {
        Store store = new Store();
        assertThat(store.getCountryCode()).isNull();
        assertThat(store.getVatNumber()).isNull();
        assertThat(store.getCurrency()).isNull();
        assertThat(store.getLocale()).isNull();
    }

    @Test
    void store_vat_fields_round_trip() {
        Store store = new Store();
        store.setCountryCode("DE");
        store.setVatNumber("DE123456789");
        store.setCurrency("EUR");
        store.setLocale("de-DE");

        assertThat(store.getCountryCode()).isEqualTo("DE");
        assertThat(store.getVatNumber()).isEqualTo("DE123456789");
        assertThat(store.getCurrency()).isEqualTo("EUR");
        assertThat(store.getLocale()).isEqualTo("de-DE");
    }

    @Test
    void india_store_has_null_countryCode() {
        // India stores keep countryCode null — this is the routing gate in OrderService
        Store indiaStore = new Store();
        indiaStore.setName("Mumbai Branch");
        indiaStore.setStoreCode("MUM001");

        assertThat(indiaStore.getCountryCode()).isNull();
    }

    @Test
    void eu_store_countryCode_identifies_vat_regime() {
        Store euStore = new Store();
        euStore.setCountryCode("FR");
        euStore.setVatNumber("FR12345678901");
        euStore.setCurrency("EUR");
        euStore.setLocale("fr-FR");

        // Routing check: non-null countryCode → EU VAT path
        assertThat(euStore.getCountryCode()).isNotNull().isNotBlank();
    }
}
