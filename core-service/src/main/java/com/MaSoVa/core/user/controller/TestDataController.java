package com.MaSoVa.core.user.controller;

import com.MaSoVa.shared.entity.Store;
import com.MaSoVa.shared.enums.StoreStatus;
import com.MaSoVa.shared.model.Address;
import com.MaSoVa.core.user.service.PlatformSeedService;
import com.MaSoVa.core.user.service.StoreService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Dev/demo-only seed endpoints. Bean is not loaded outside {@code dev} / {@code demo} profiles.
 * Also gated at runtime by {@link PlatformSeedService#isSeedAllowed()}.
 */
@Profile({"dev", "demo"})
@RestController
@RequestMapping("/api/test-data")
@Tag(name = "Test Data", description = "Endpoints for creating test data (dev/demo profile only)")
public class TestDataController {
    
    @Autowired
    private StoreService storeService;

    @Autowired
    private PlatformSeedService platformSeedService;
    
    @PostMapping("/create-default-store")
    @Operation(summary = "Create default EU test store (Berlin DOM001)")
    public ResponseEntity<Map<String, Object>> createDefaultStore() {
        try {
            // Prefer full seed-demo; this remains a lightweight Berlin store bootstrap
            Store store = new Store();
            store.setName("MaSoVa Berlin Mitte");
            store.setCode("DOM001");
            store.setPhoneNumber("+493012345670");
            store.setRegionId("EU-DE");
            store.setStatus(StoreStatus.ACTIVE);
            store.setOpeningDate(LocalDateTime.now());
            store.setCountryCode("DE");
            store.setCurrency("EUR");
            store.setLocale("de-DE");

            Address address = new Address();
            address.setStreet("Demo Street 1");
            address.setCity("Berlin");
            address.setState("Berlin");
            address.setPincode("10115");
            address.setLatitude(52.5200);
            address.setLongitude(13.4050);
            store.setAddress(address);

            Store.StoreConfiguration config = new Store.StoreConfiguration();
            config.setDeliveryRadiusKm(5.0);
            config.setMaxConcurrentOrders(50);
            config.setEstimatedPrepTimeMinutes(25);
            config.setAcceptsOnlineOrders(true);
            config.setAcceptsCashPayments(true);
            config.setMaxDeliveryTimeMinutes(35);
            config.setMinimumOrderValueINR(9.0);
            store.setConfiguration(config);

            Store savedStore = storeService.saveStore(store);

            return ResponseEntity.ok(Map.of(
                "message", "Default Berlin store created successfully",
                "storeId", savedStore.getId(),
                "storeCode", savedStore.getCode(),
                "storeName", savedStore.getName(),
                "countryCode", "DE",
                "currency", "EUR"
            ));

        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "message", "Store might already exist: " + e.getMessage(),
                "storeCode", "DOM001"
            ));
        }
    }
    
    @PostMapping("/create-test-stores")
    @Operation(summary = "Create multiple Berlin test stores (DOM001–DOM003)")
    public ResponseEntity<Map<String, Object>> createTestStores() {
        try {
            createStoreIfNotExists("DOM001", "MaSoVa Berlin Mitte", "Berlin", "10115",
                    52.5200, 13.4050, "+493012345670");
            createStoreIfNotExists("DOM002", "MaSoVa Berlin Prenzlauer Berg", "Berlin", "10405",
                    52.5388, 13.4244, "+493012345671");
            createStoreIfNotExists("DOM003", "MaSoVa Berlin Kreuzberg", "Berlin", "10999",
                    52.4980, 13.4030, "+493012345672");

            return ResponseEntity.ok(Map.of(
                "message", "Berlin test stores created successfully",
                "stores", new String[]{"DOM001", "DOM002", "DOM003"},
                "countryCode", "DE",
                "currency", "EUR"
            ));

        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "message", "Test stores creation completed with some duplicates",
                "error", e.getMessage()
            ));
        }
    }
    
    private void createStoreIfNotExists(String code, String name, String city, String pincode,
                                      double latitude, double longitude, String phone) {
        try {
            Store store = new Store();
            store.setName(name);
            store.setCode(code);
            store.setPhoneNumber(phone);
            store.setRegionId("EU-DE");
            store.setStatus(StoreStatus.ACTIVE);
            store.setOpeningDate(LocalDateTime.now());
            store.setCountryCode("DE");
            store.setCurrency("EUR");
            store.setLocale("de-DE");

            Address address = new Address();
            address.setStreet("Demo Street 1");
            address.setCity(city);
            address.setState("Berlin");
            address.setPincode(pincode);
            address.setLatitude(latitude);
            address.setLongitude(longitude);
            store.setAddress(address);

            Store.StoreConfiguration config = new Store.StoreConfiguration();
            config.setDeliveryRadiusKm(5.0);
            config.setMaxConcurrentOrders(50);
            config.setAcceptsOnlineOrders(true);
            store.setConfiguration(config);

            storeService.saveStore(store);
        } catch (Exception e) {
            // Store might already exist, which is fine
        }
    }

    @Autowired
    private com.MaSoVa.core.user.repository.UserRepository userRepository;

    /**
     * POST /api/test-data/seed-demo — full core platform seed (stores, users, customers, campaigns).
     * Idempotent. Unauthenticated by design for cold-start reseed (controller only in dev/demo).
     */
    @PostMapping({"/seed-demo", "/seed-all"})
    @Operation(summary = "Seed Berlin demo platform data (stores, users, customers, campaigns)")
    public ResponseEntity<?> seedDemo(
            @RequestParam(defaultValue = "DOM001") String storeId) {
        if (!platformSeedService.isSeedAllowed()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Seed only available with spring profile dev or demo"));
        }
        try {
            return ResponseEntity.ok(platformSeedService.seedDemo(storeId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Seed failed",
                            "detail", e.getMessage() != null ? e.getMessage() : "unknown"));
        }
    }

    @PostMapping("/migrate-users-to-storecode")
    @Operation(summary = "Migrate all users from MongoDB store IDs to store codes")
    public ResponseEntity<Map<String, Object>> migrateUsersToStoreCode() {
        try {
            // Get all stores
            java.util.List<Store> stores = storeService.getActiveStores();
            java.util.Map<String, String> storeIdToCodeMap = new java.util.HashMap<>();

            // Build mapping: MongoDB ID -> storeCode
            for (Store store : stores) {
                storeIdToCodeMap.put(store.getId(), store.getCode());
            }

            // Get all users with employee details
            java.util.List<com.MaSoVa.shared.entity.User> allUsers = userRepository.findAll();
            int updatedCount = 0;

            for (com.MaSoVa.shared.entity.User user : allUsers) {
                if (user.getEmployeeDetails() != null && user.getEmployeeDetails().getStoreId() != null) {
                    String currentStoreId = user.getEmployeeDetails().getStoreId();
                    String storeCode = storeIdToCodeMap.get(currentStoreId);

                    if (storeCode != null && !storeCode.equals(currentStoreId)) {
                        // Update storeId to storeCode
                        user.getEmployeeDetails().setStoreId(storeCode);
                        userRepository.save(user);
                        updatedCount++;
                    }
                }
            }

            return ResponseEntity.ok(Map.of(
                "message", "User migration completed",
                "totalUsers", allUsers.size(),
                "updatedUsers", updatedCount,
                "storeMapping", storeIdToCodeMap
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Migration failed: " + e.getMessage()
            ));
        }
    }
}