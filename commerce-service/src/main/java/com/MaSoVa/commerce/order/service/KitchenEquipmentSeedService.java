package com.MaSoVa.commerce.order.service;

import com.MaSoVa.commerce.order.entity.KitchenEquipment;
import com.MaSoVa.commerce.order.repository.KitchenEquipmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Dev/demo seed for manager Equipment tab.
 * Active only when spring profiles include {@code dev} or {@code demo}.
 */
@Service
public class KitchenEquipmentSeedService {

    private static final Logger log = LoggerFactory.getLogger(KitchenEquipmentSeedService.class);

    private final KitchenEquipmentRepository equipmentRepository;
    private final Environment environment;

    public KitchenEquipmentSeedService(KitchenEquipmentRepository equipmentRepository, Environment environment) {
        this.equipmentRepository = equipmentRepository;
        this.environment = environment;
    }

    public boolean isSeedAllowed() {
        return environment.acceptsProfiles(Profiles.of("dev", "demo"));
    }

    /**
     * Seed 3–5 kitchen equipment rows for a store. Idempotent by equipmentName + storeId.
     */
    public Map<String, Object> seedDemo(String storeId) {
        if (!isSeedAllowed()) {
            throw new IllegalStateException("Equipment seed is only available under dev/demo profiles");
        }
        if (storeId == null || storeId.isBlank()) {
            throw new IllegalArgumentException("storeId is required");
        }

        List<KitchenEquipment> existing = equipmentRepository.findByStoreId(storeId);
        List<String> createdIds = new ArrayList<>();

        List<SeedSpec> specs = List.of(
                new SeedSpec("Main Deck Oven", KitchenEquipment.EquipmentType.OVEN, KitchenEquipment.EquipmentStatus.OPERATIONAL, 250, true),
                new SeedSpec("Pizza Prep Fridge", KitchenEquipment.EquipmentType.REFRIGERATOR, KitchenEquipment.EquipmentStatus.AVAILABLE, 4, true),
                new SeedSpec("Deep Fryer 1", KitchenEquipment.EquipmentType.FRYER, KitchenEquipment.EquipmentStatus.AVAILABLE, 180, false),
                new SeedSpec("Walk-in Freezer", KitchenEquipment.EquipmentType.FREEZER, KitchenEquipment.EquipmentStatus.OPERATIONAL, -18, true),
                new SeedSpec("Dishwasher", KitchenEquipment.EquipmentType.DISHWASHER, KitchenEquipment.EquipmentStatus.MAINTENANCE, 60, false)
        );

        LocalDateTime now = LocalDateTime.now();
        for (SeedSpec spec : specs) {
            boolean already = existing.stream()
                    .anyMatch(e -> spec.name().equalsIgnoreCase(e.getEquipmentName()));
            if (already) {
                continue;
            }
            KitchenEquipment eq = KitchenEquipment.builder()
                    .storeId(storeId)
                    .equipmentName(spec.name())
                    .type(spec.type())
                    .status(spec.status())
                    .temperature(spec.temp())
                    .isOn(spec.on())
                    .usageCount(0)
                    .lastMaintenanceDate(now.minusDays(14))
                    .nextMaintenanceDate(now.plusDays(30))
                    .maintenanceNotes("Seeded demo equipment")
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
            KitchenEquipment saved = equipmentRepository.save(eq);
            createdIds.add(saved.getId());
        }

        int total = equipmentRepository.findByStoreId(storeId).size();
        log.info("Equipment seed-demo storeId={} created={} total={}", storeId, createdIds.size(), total);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("storeId", storeId);
        result.put("createdIds", createdIds);
        result.put("createdCount", createdIds.size());
        result.put("totalForStore", total);
        return result;
    }

    private record SeedSpec(
            String name,
            KitchenEquipment.EquipmentType type,
            KitchenEquipment.EquipmentStatus status,
            int temp,
            boolean on) {}
}
