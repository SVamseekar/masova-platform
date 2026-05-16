package com.MaSoVa.core.unit.service;

import com.MaSoVa.shared.entity.Store;
import com.MaSoVa.shared.enums.StoreStatus;
import com.MaSoVa.core.user.repository.StoreRepository;
import com.MaSoVa.core.user.service.StoreService;
import com.MaSoVa.core.store.service.CountryProfileService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("StoreService Unit Tests")
class StoreServiceTest {

    @Mock private StoreRepository storeRepository;
    @Mock private CountryProfileService countryProfileService;

    @InjectMocks private StoreService storeService;

    private Store buildStore(String id, String code, StoreStatus status) {
        Store s = new Store();
        s.setId(id);
        s.setCode(code);
        s.setName("Test Store");
        s.setStatus(status);
        return s;
    }

    @Nested
    @DisplayName("getStore")
    class GetStore {

        @Test
        @DisplayName("returns store when found")
        void returnsStore() {
            Store store = buildStore("s1", "DOM001", StoreStatus.ACTIVE);
            when(storeRepository.findById("s1")).thenReturn(Optional.of(store));

            assertThat(storeService.getStore("s1")).isNotNull();
        }

        @Test
        @DisplayName("throws when store not found")
        void throwsWhenNotFound() {
            when(storeRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> storeService.getStore("missing"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("not found");
        }
    }

    @Nested
    @DisplayName("getStoreByCode")
    class GetStoreByCode {

        @Test
        @DisplayName("returns store when found by code")
        void returnsByCode() {
            Store store = buildStore("s1", "DOM001", StoreStatus.ACTIVE);
            when(storeRepository.findByCode("DOM001")).thenReturn(Optional.of(store));

            assertThat(storeService.getStoreByCode("DOM001")).isNotNull();
        }

        @Test
        @DisplayName("throws when code not found")
        void throwsWhenNotFound() {
            when(storeRepository.findByCode("MISSING")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> storeService.getStoreByCode("MISSING"))
                    .isInstanceOf(RuntimeException.class);
        }
    }

    @Nested
    @DisplayName("getActiveStores")
    class GetActiveStores {

        @Test
        @DisplayName("returns active stores from repository")
        void returnsActiveStores() {
            Store store = buildStore("s1", "DOM001", StoreStatus.ACTIVE);
            when(storeRepository.findByStatus(StoreStatus.ACTIVE)).thenReturn(List.of(store));

            assertThat(storeService.getActiveStores()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getStoresByRegion")
    class GetStoresByRegion {

        @Test
        @DisplayName("returns stores for given region")
        void returnsStoresByRegion() {
            Store store = buildStore("s1", "DOM001", StoreStatus.ACTIVE);
            when(storeRepository.findByRegionId("region-1")).thenReturn(List.of(store));

            assertThat(storeService.getStoresByRegion("region-1")).hasSize(1);
        }
    }

    @Nested
    @DisplayName("saveStore")
    class SaveStore {

        @Test
        @DisplayName("saves store without country code without modifying currency")
        void savesWithoutCountryCode() {
            Store store = buildStore("s1", "DOM001", StoreStatus.ACTIVE);
            store.setCountryCode(null);
            when(storeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Store result = storeService.saveStore(store);

            assertThat(result).isNotNull();
            verify(countryProfileService, never()).resolveCurrency(any());
        }

        @Test
        @DisplayName("resolves currency and locale when country code is set")
        void resolvesCurrencyWithCountryCode() {
            Store store = buildStore("s1", "DOM001", StoreStatus.ACTIVE);
            store.setCountryCode("GB");
            when(countryProfileService.resolveCurrency("GB")).thenReturn("GBP");
            when(countryProfileService.resolveLocale("GB")).thenReturn("en-GB");
            when(storeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            Store result = storeService.saveStore(store);

            assertThat(result.getCurrency()).isEqualTo("GBP");
            assertThat(result.getLocale()).isEqualTo("en-GB");
        }
    }

    @Nested
    @DisplayName("checkDeliveryRadius")
    class CheckDeliveryRadius {

        @Test
        @DisplayName("returns radius check map with store details")
        void returnsRadiusMap() {
            Store store = buildStore("s1", "DOM001", StoreStatus.ACTIVE);
            when(storeRepository.findById("s1")).thenReturn(Optional.of(store));

            Map<String, Object> result = storeService.checkDeliveryRadius("s1", 12.9, 77.6);

            assertThat(result).containsKeys("withinRadius", "storeId", "deliveryRadiusKm", "latitude", "longitude");
            assertThat(result.get("storeId")).isEqualTo("s1");
        }
    }

    @Nested
    @DisplayName("getStoreMetrics")
    class GetStoreMetrics {

        @Test
        @DisplayName("returns metrics map with store info")
        void returnsMetrics() {
            Store store = buildStore("s1", "DOM001", StoreStatus.ACTIVE);
            when(storeRepository.findByCode("DOM001")).thenReturn(Optional.of(store));

            Map<String, Object> result = storeService.getStoreMetrics("DOM001");

            assertThat(result).containsKeys("storeId", "storeName", "isOperational", "status");
            assertThat(result.get("storeId")).isEqualTo("DOM001");
        }

        @Test
        @DisplayName("propagates exception when store not found")
        void throwsWhenNotFound() {
            when(storeRepository.findByCode("MISSING")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> storeService.getStoreMetrics("MISSING"))
                    .isInstanceOf(RuntimeException.class);
        }
    }
}
