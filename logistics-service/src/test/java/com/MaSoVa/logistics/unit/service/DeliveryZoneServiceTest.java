package com.MaSoVa.logistics.unit.service;

import com.MaSoVa.logistics.delivery.dto.DeliveryFeeResponse;
import com.MaSoVa.logistics.delivery.service.DeliveryZoneService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("DeliveryZoneService Unit Tests")
class DeliveryZoneServiceTest {

    @Mock
    private RestTemplate restTemplate;

    private DeliveryZoneService deliveryZoneService;

    // Store location: Mumbai city centre at 19.0760, 72.8777
    private static final String STORE_ID = "store-1";
    private static final double STORE_LAT = 19.0760;
    private static final double STORE_LNG = 72.8777;

    @BeforeEach
    void setUp() {
        deliveryZoneService = new DeliveryZoneService(restTemplate);
        // inject the @Value field via reflection
        try {
            var field = DeliveryZoneService.class.getDeclaredField("userServiceUrl");
            field.setAccessible(true);
            field.set(deliveryZoneService, "http://core-service:8085");
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private Map<String, Object> buildStoreData(double storeLat, double storeLng, double radiusKm) {
        return Map.of(
            "id", STORE_ID,
            "address", Map.of(
                "latitude", storeLat,
                "longitude", storeLng
            ),
            "configuration", Map.of(
                "deliveryRadiusKm", radiusKm
            )
        );
    }

    @Nested
    @DisplayName("isWithinDeliveryZone")
    class IsWithinDeliveryZone {

        @Test
        @DisplayName("returns true for address within radius")
        void returnsTrueWhenWithin() {
            when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(buildStoreData(STORE_LAT, STORE_LNG, 10.0));

            // Address ~2km from store
            boolean result = deliveryZoneService.isWithinDeliveryZone(STORE_ID, 19.076, 72.855);

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("returns false for address outside radius")
        void returnsFalseWhenOutside() {
            when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(buildStoreData(STORE_LAT, STORE_LNG, 5.0));

            // Address ~25km away (Pune direction)
            boolean result = deliveryZoneService.isWithinDeliveryZone(STORE_ID, 18.520, 73.856);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("returns false when store not found")
        void returnsFalseWhenStoreNull() {
            when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(null);

            boolean result = deliveryZoneService.isWithinDeliveryZone(STORE_ID, 19.076, 72.855);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("returns false when store data has no address")
        void returnsFalseWhenNoAddress() {
            when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(Map.of("id", STORE_ID));

            boolean result = deliveryZoneService.isWithinDeliveryZone(STORE_ID, 19.076, 72.855);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("returns false when RestTemplate throws")
        void returnsFalseOnException() {
            when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenThrow(new RuntimeException("Connection refused"));

            boolean result = deliveryZoneService.isWithinDeliveryZone(STORE_ID, 19.076, 72.855);

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("uses default radius of 10km when no config key")
        void usesDefaultRadiusWhenNoConfig() {
            when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(Map.of(
                    "id", STORE_ID,
                    "address", Map.of("latitude", STORE_LAT, "longitude", STORE_LNG)
                ));

            // Address ~2km away — should be within default 10km radius
            boolean result = deliveryZoneService.isWithinDeliveryZone(STORE_ID, 19.076, 72.855);

            assertThat(result).isTrue();
        }
    }

    @Nested
    @DisplayName("calculateDeliveryFee")
    class CalculateDeliveryFee {

        @Test
        @DisplayName("returns Zone A fee for distance <= 3km")
        void returnsZoneAFee() {
            when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(buildStoreData(STORE_LAT, STORE_LNG, 10.0));

            // Very close — same lat/lng = 0km
            DeliveryFeeResponse result = deliveryZoneService.calculateDeliveryFee(STORE_ID, STORE_LAT, STORE_LNG);

            assertThat(result.isSuccess()).isTrue();
            assertThat(result.getZoneName()).isEqualTo("A");
            assertThat(result.getDeliveryFeeINR()).isEqualTo(30.0);
            assertThat(result.getEstimatedDeliveryMinutes()).isEqualTo(15);
        }

        @Test
        @DisplayName("returns Zone B fee for distance 3-6km")
        void returnsZoneBFee() {
            // Store at Mumbai, deliver ~4km south
            when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(buildStoreData(STORE_LAT, STORE_LNG, 10.0));

            // ~4km south: 19.0400, 72.877
            DeliveryFeeResponse result = deliveryZoneService.calculateDeliveryFee(STORE_ID, 19.0400, 72.8777);

            assertThat(result.isSuccess()).isTrue();
            assertThat(result.getZoneName()).isEqualTo("B");
            assertThat(result.getDeliveryFeeINR()).isEqualTo(50.0);
            assertThat(result.getEstimatedDeliveryMinutes()).isEqualTo(25);
        }

        @Test
        @DisplayName("returns Zone C fee for distance 6-10km")
        void returnsZoneCFee() {
            when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(buildStoreData(STORE_LAT, STORE_LNG, 10.0));

            // ~8km south: 18.9970, 72.877
            DeliveryFeeResponse result = deliveryZoneService.calculateDeliveryFee(STORE_ID, 18.9970, 72.8777);

            assertThat(result.isSuccess()).isTrue();
            assertThat(result.getZoneName()).isEqualTo("C");
            assertThat(result.getDeliveryFeeINR()).isEqualTo(80.0);
            assertThat(result.getEstimatedDeliveryMinutes()).isEqualTo(35);
        }

        @Test
        @DisplayName("returns error when address outside delivery area")
        void returnsErrorWhenOutside() {
            when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(buildStoreData(STORE_LAT, STORE_LNG, 5.0));

            // Pune — ~140km away
            DeliveryFeeResponse result = deliveryZoneService.calculateDeliveryFee(STORE_ID, 18.5204, 73.8567);

            assertThat(result.isSuccess()).isFalse();
            assertThat(result.getError()).contains("outside delivery area");
        }

        @Test
        @DisplayName("returns error when store not found")
        void returnsErrorWhenStoreNull() {
            when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(null);

            DeliveryFeeResponse result = deliveryZoneService.calculateDeliveryFee(STORE_ID, 19.076, 72.855);

            assertThat(result.isSuccess()).isFalse();
            assertThat(result.getError()).contains("Store not found");
        }

        @Test
        @DisplayName("returns error when store has no address")
        void returnsErrorWhenNoAddress() {
            when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(Map.of("id", STORE_ID));

            DeliveryFeeResponse result = deliveryZoneService.calculateDeliveryFee(STORE_ID, 19.076, 72.855);

            assertThat(result.isSuccess()).isFalse();
            assertThat(result.getError()).contains("not configured");
        }

        @Test
        @DisplayName("uses custom zone fee when store config has zones")
        void usesCustomZoneFee() {
            Map<String, Object> storeDataWithCustomZones = Map.of(
                "id", STORE_ID,
                "address", Map.of("latitude", STORE_LAT, "longitude", STORE_LNG),
                "configuration", Map.of(
                    "deliveryRadiusKm", 10.0,
                    "serviceArea", Map.of(
                        "zones", List.of(
                            Map.of("zoneName", "CUSTOM_A", "minDistanceKm", 0.0, "maxDistanceKm", 5.0,
                                   "deliveryFeeINR", 25.0, "estimatedDeliveryMinutes", 20, "active", true)
                        )
                    )
                )
            );
            when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(storeDataWithCustomZones);

            DeliveryFeeResponse result = deliveryZoneService.calculateDeliveryFee(STORE_ID, STORE_LAT, STORE_LNG);

            assertThat(result.isSuccess()).isTrue();
            assertThat(result.getZoneName()).isEqualTo("CUSTOM_A");
            assertThat(result.getDeliveryFeeINR()).isEqualTo(25.0);
        }

        @Test
        @DisplayName("skips inactive custom zones")
        void skipsInactiveCustomZones() {
            Map<String, Object> storeDataWithInactiveZone = Map.of(
                "id", STORE_ID,
                "address", Map.of("latitude", STORE_LAT, "longitude", STORE_LNG),
                "configuration", Map.of(
                    "deliveryRadiusKm", 10.0,
                    "serviceArea", Map.of(
                        "zones", List.of(
                            Map.of("zoneName", "INACTIVE_ZONE", "minDistanceKm", 0.0, "maxDistanceKm", 5.0,
                                   "deliveryFeeINR", 10.0, "estimatedDeliveryMinutes", 10, "active", false)
                        )
                    )
                )
            );
            when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(storeDataWithInactiveZone);

            // Falls through to default zone pricing
            DeliveryFeeResponse result = deliveryZoneService.calculateDeliveryFee(STORE_ID, STORE_LAT, STORE_LNG);

            assertThat(result.isSuccess()).isTrue();
            assertThat(result.getZoneName()).isEqualTo("A"); // default zone
        }
    }

    @Nested
    @DisplayName("getDeliveryZones")
    class GetDeliveryZones {

        @Test
        @DisplayName("returns default zones when store has no config")
        void returnsDefaultZones() {
            when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(Map.of("id", STORE_ID));

            List<Map<String, Object>> result = deliveryZoneService.getDeliveryZones(STORE_ID);

            assertThat(result).hasSize(3);
            assertThat(result.get(0).get("zoneName")).isEqualTo("A");
            assertThat(result.get(1).get("zoneName")).isEqualTo("B");
            assertThat(result.get(2).get("zoneName")).isEqualTo("C");
        }

        @Test
        @DisplayName("returns custom zones when store config has zones")
        void returnsCustomZones() {
            Map<String, Object> storeData = Map.of(
                "id", STORE_ID,
                "configuration", Map.of(
                    "serviceArea", Map.of(
                        "zones", List.of(
                            Map.of("zoneName", "CUSTOM", "minDistanceKm", 0.0, "maxDistanceKm", 8.0,
                                   "deliveryFeeINR", 40.0, "estimatedDeliveryMinutes", 22)
                        )
                    )
                )
            );
            when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(storeData);

            List<Map<String, Object>> result = deliveryZoneService.getDeliveryZones(STORE_ID);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).get("zoneName")).isEqualTo("CUSTOM");
        }

        @Test
        @DisplayName("returns null when store not found")
        void returnsNullWhenStoreNull() {
            when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(null);

            List<Map<String, Object>> result = deliveryZoneService.getDeliveryZones(STORE_ID);

            assertThat(result).isNull();
        }

        @Test
        @DisplayName("returns null when restTemplate throws (getStoreDetails catches and returns null)")
        void returnsNullOnException() {
            when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenThrow(new RuntimeException("Network error"));

            // getStoreDetails catches the exception and returns null
            // getDeliveryZones sees null storeData and returns null
            List<Map<String, Object>> result = deliveryZoneService.getDeliveryZones(STORE_ID);

            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("validateDeliveryAddress")
    class ValidateDeliveryAddress {

        @Test
        @DisplayName("returns valid=true for address within zone and no pincode restriction")
        void returnsValidWhenWithinZone() {
            when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(buildStoreData(STORE_LAT, STORE_LNG, 10.0));

            DeliveryZoneService.ValidationResult result =
                deliveryZoneService.validateDeliveryAddress(STORE_ID, STORE_LAT, STORE_LNG, null);

            assertThat(result.isValid()).isTrue();
            assertThat(result.getZoneName()).isEqualTo("A");
            assertThat(result.getDeliveryFee()).isEqualTo(30.0);
        }

        @Test
        @DisplayName("returns valid=false when address outside zone")
        void returnsInvalidWhenOutside() {
            when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(buildStoreData(STORE_LAT, STORE_LNG, 2.0));

            // 8km away — outside 2km radius
            DeliveryZoneService.ValidationResult result =
                deliveryZoneService.validateDeliveryAddress(STORE_ID, 18.9970, 72.8777, null);

            assertThat(result.isValid()).isFalse();
            assertThat(result.getError()).contains("outside");
        }

        @Test
        @DisplayName("returns valid=false when pincode is restricted")
        void returnsInvalidWhenPincodeRestricted() {
            // Store within zone but pincode restricted
            Map<String, Object> storeWithRestrictedPincode = Map.of(
                "id", STORE_ID,
                "address", Map.of("latitude", STORE_LAT, "longitude", STORE_LNG),
                "configuration", Map.of(
                    "deliveryRadiusKm", 10.0,
                    "serviceArea", Map.of(
                        "restrictedPincodes", List.of("400001")
                    )
                )
            );
            when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(storeWithRestrictedPincode);

            DeliveryZoneService.ValidationResult result =
                deliveryZoneService.validateDeliveryAddress(STORE_ID, STORE_LAT, STORE_LNG, "400001");

            assertThat(result.isValid()).isFalse();
            assertThat(result.getError()).contains("pincode");
        }
    }

    @Nested
    @DisplayName("isPincodeRestricted")
    class IsPincodeRestricted {

        @Test
        @DisplayName("returns false when store has no restricted pincodes")
        void returnsFalseWithNoRestrictions() {
            when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(buildStoreData(STORE_LAT, STORE_LNG, 10.0));

            boolean result = deliveryZoneService.isPincodeRestricted(STORE_ID, "400001");

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("returns false when store is null")
        void returnsFalseWhenStoreNull() {
            when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(null);

            boolean result = deliveryZoneService.isPincodeRestricted(STORE_ID, "400001");

            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("returns true when pincode is in restricted list")
        void returnsTrueWhenRestricted() {
            Map<String, Object> storeWithRestrictedPincode = Map.of(
                "id", STORE_ID,
                "configuration", Map.of(
                    "serviceArea", Map.of(
                        "restrictedPincodes", List.of("400001", "400002")
                    )
                )
            );
            when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(storeWithRestrictedPincode);

            boolean result = deliveryZoneService.isPincodeRestricted(STORE_ID, "400001");

            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("returns false when restricted pincodes list is empty")
        void returnsFalseWhenEmptyList() {
            Map<String, Object> storeData = Map.of(
                "id", STORE_ID,
                "configuration", Map.of(
                    "serviceArea", Map.of(
                        "restrictedPincodes", List.of()
                    )
                )
            );
            when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(storeData);

            boolean result = deliveryZoneService.isPincodeRestricted(STORE_ID, "400001");

            assertThat(result).isFalse();
        }
    }
}
