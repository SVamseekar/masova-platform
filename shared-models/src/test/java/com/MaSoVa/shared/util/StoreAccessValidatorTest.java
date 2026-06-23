package com.MaSoVa.shared.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("StoreAccessValidator")
class StoreAccessValidatorTest {

    @Test
    @DisplayName("manager with matching selected store is allowed")
    void managerMatchingStore() {
        assertThat(StoreAccessValidator.isSelectedStoreAllowed("MANAGER", "store-a", "store-a")).isTrue();
    }

    @Test
    @DisplayName("manager with mismatched selected store is denied")
    void managerMismatchedStore() {
        assertThat(StoreAccessValidator.isSelectedStoreAllowed("MANAGER", "store-a", "store-b")).isFalse();
    }

    @Test
    @DisplayName("staff without selected store header is allowed")
    void staffNoOverride() {
        assertThat(StoreAccessValidator.isSelectedStoreAllowed("STAFF", "store-a", null)).isTrue();
    }

    @Test
    @DisplayName("staff cross-store selection is denied")
    void staffCrossStore() {
        assertThat(StoreAccessValidator.isSelectedStoreAllowed("STAFF", "store-a", "store-b")).isFalse();
    }

    @Test
    @DisplayName("customer may select any store (not JWT-bound at this layer)")
    void customerAnyStore() {
        assertThat(StoreAccessValidator.isSelectedStoreAllowed("CUSTOMER", null, "store-b")).isTrue();
    }

    @Test
    @DisplayName("assertSelectedStoreAllowed throws StoreAccessDeniedException")
    void assertThrowsOnViolation() {
        assertThatThrownBy(() ->
                StoreAccessValidator.assertSelectedStoreAllowed("MANAGER", "store-a", "store-b"))
                .isInstanceOf(StoreAccessValidator.StoreAccessDeniedException.class);
    }

    @Test
    @DisplayName("assertSelectedStoreAllowed passes for valid selection")
    void assertPassesWhenAllowed() {
        assertThatCode(() ->
                StoreAccessValidator.assertSelectedStoreAllowed("MANAGER", "store-a", "store-a"))
                .doesNotThrowAnyException();
    }
}