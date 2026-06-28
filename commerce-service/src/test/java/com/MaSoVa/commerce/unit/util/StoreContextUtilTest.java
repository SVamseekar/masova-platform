package com.MaSoVa.commerce.unit.util;

import com.MaSoVa.shared.util.StoreAccessValidator;
import com.MaSoVa.shared.util.StoreContextUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StoreContextUtilTest {

    @Mock private HttpServletRequest request;

    private void setupHeaders(String userType, String selectedStore, String userStore, String userId) {
        when(request.getHeader("X-User-Type")).thenReturn(userType);
        when(request.getHeader("X-Selected-Store-Id")).thenReturn(selectedStore);
        when(request.getHeader("X-User-Store-Id")).thenReturn(userStore);
        when(request.getHeader("X-User-Id")).thenReturn(userId);
    }

    // MANAGER uses selected store

    @Test
    void manager_uses_selected_store_id_when_it_matches_jwt_store() {
        setupHeaders("MANAGER", "store-assigned", "store-assigned", "user-1");

        String result = StoreContextUtil.getStoreIdFromHeaders(request);

        assertThat(result).isEqualTo("store-assigned");
    }

    @Test
    void manager_falls_back_to_user_store_when_no_selected() {
        setupHeaders("MANAGER", null, "store-assigned", "user-1");

        String result = StoreContextUtil.getStoreIdFromHeaders(request);

        assertThat(result).isEqualTo("store-assigned");
    }

    @Test
    void assistant_manager_uses_selected_store_when_it_matches_jwt_store() {
        setupHeaders("ASSISTANT_MANAGER", "store-assigned", "store-assigned", "user-1");

        String result = StoreContextUtil.getStoreIdFromHeaders(request);

        assertThat(result).isEqualTo("store-assigned");
    }

    @Test
    void customer_uses_selected_store() {
        setupHeaders("CUSTOMER", "store-selected", null, "user-1");

        String result = StoreContextUtil.getStoreIdFromHeaders(request);

        assertThat(result).isEqualTo("store-selected");
    }

    // STAFF uses assigned store unless explicit selected

    @Test
    void staff_uses_user_store_by_default() {
        setupHeaders("STAFF", null, "store-assigned", "user-1");

        String result = StoreContextUtil.getStoreIdFromHeaders(request);

        assertThat(result).isEqualTo("store-assigned");
    }

    @Test
    void staff_matching_selected_store_is_allowed() {
        setupHeaders("STAFF", "store-assigned", "store-assigned", "user-1");

        String result = StoreContextUtil.getStoreIdFromHeaders(request);

        assertThat(result).isEqualTo("store-assigned");
    }

    @Test
    void staff_cross_store_selection_is_denied() {
        setupHeaders("STAFF", "store-kds", "store-assigned", "user-1");

        assertThatThrownBy(() -> StoreContextUtil.getStoreIdFromHeaders(request))
                .isInstanceOf(StoreAccessValidator.StoreAccessDeniedException.class);
    }

    @Test
    void manager_cross_store_selection_is_denied() {
        setupHeaders("MANAGER", "store-b", "store-a", "user-1");

        assertThatThrownBy(() -> StoreContextUtil.getStoreIdFromHeaders(request))
                .isInstanceOf(StoreAccessValidator.StoreAccessDeniedException.class);
    }

    @Test
    void driver_uses_user_store() {
        setupHeaders("DRIVER", null, "store-assigned", "user-1");

        String result = StoreContextUtil.getStoreIdFromHeaders(request);

        assertThat(result).isEqualTo("store-assigned");
    }

    @Test
    void kitchen_staff_uses_user_store() {
        setupHeaders("KITCHEN_STAFF", null, "store-kitchen", "user-1");

        String result = StoreContextUtil.getStoreIdFromHeaders(request);

        assertThat(result).isEqualTo("store-kitchen");
    }

    // No user type

    @Test
    void no_user_type_uses_selected_store() {
        setupHeaders(null, "store-selected", "store-assigned", "user-1");

        String result = StoreContextUtil.getStoreIdFromHeaders(request);

        assertThat(result).isEqualTo("store-selected");
    }

    @Test
    void no_user_type_no_selected_falls_back_to_user_store() {
        setupHeaders(null, null, "store-assigned", "user-1");

        String result = StoreContextUtil.getStoreIdFromHeaders(request);

        assertThat(result).isEqualTo("store-assigned");
    }

    @Test
    void empty_user_type_uses_selected_store() {
        setupHeaders("", "store-selected", "store-assigned", "user-1");

        String result = StoreContextUtil.getStoreIdFromHeaders(request);

        assertThat(result).isEqualTo("store-selected");
    }

    // getUserIdFromHeaders

    @Test
    void getUserIdFromHeaders_returns_user_id() {
        when(request.getHeader("X-User-Id")).thenReturn("user-123");

        assertThat(StoreContextUtil.getUserIdFromHeaders(request)).isEqualTo("user-123");
    }

    @Test
    void getUserIdFromHeaders_returns_null_when_missing() {
        when(request.getHeader("X-User-Id")).thenReturn(null);

        assertThat(StoreContextUtil.getUserIdFromHeaders(request)).isNull();
    }

    // getUserTypeFromHeaders

    @Test
    void getUserTypeFromHeaders_returns_type() {
        when(request.getHeader("X-User-Type")).thenReturn("MANAGER");

        assertThat(StoreContextUtil.getUserTypeFromHeaders(request)).isEqualTo("MANAGER");
    }

    // validateStoreIdPresent

    @Test
    void validateStoreIdPresent_passes_when_store_found() {
        setupHeaders("MANAGER", "store-1", "store-1", "user-1");

        // Should not throw
        StoreContextUtil.validateStoreIdPresent(request);
    }

    @Test
    void validateStoreIdPresent_throws_when_no_store() {
        setupHeaders("MANAGER", null, null, "user-1");

        assertThatThrownBy(() -> StoreContextUtil.validateStoreIdPresent(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Store ID is required");
    }

    @Test
    void validateStoreIdPresent_throws_when_empty_store() {
        setupHeaders("MANAGER", "", "", "user-1");

        assertThatThrownBy(() -> StoreContextUtil.validateStoreIdPresent(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Store ID is required");
    }
}
