package com.MaSoVa.order.service;

import com.MaSoVa.order.entity.KitchenEquipment;
import com.MaSoVa.order.repository.KitchenEquipmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class KitchenEquipmentService {

    private static final Logger log = LoggerFactory.getLogger(KitchenEquipmentService.class);

    private final KitchenEquipmentRepository equipmentRepository;

    public KitchenEquipmentService(KitchenEquipmentRepository equipmentRepository) {
        this.equipmentRepository = equipmentRepository;
    }

    /**
     * Create new equipment
     */
    public KitchenEquipment createEquipment(KitchenEquipment equipment) {
        equipment.setCreatedAt(LocalDateTime.now());
        equipment.setUpdatedAt(LocalDateTime.now());
        equipment.setUsageCount(0);
        if (equipment.getStatus() == null) {
            equipment.setStatus(KitchenEquipment.EquipmentStatus.AVAILABLE);
        }
        if (equipment.getIsOn() == null) {
            equipment.setIsOn(false);
        }

        log.info("Creating equipment: {} for store: {}", equipment.getEquipmentName(), equipment.getStoreId());
        return equipmentRepository.save(equipment);
    }

    /**
     * Get all equipment for a store
     */
    public List<KitchenEquipment> getEquipmentByStore(String storeId) {
        return equipmentRepository.findByStoreId(storeId);
    }

    /**
     * Get equipment by ID
     */
    public KitchenEquipment getEquipmentById(@NonNull String equipmentId) {
        return equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new RuntimeException("Equipment not found with ID: " + equipmentId));
    }

    /**
     * Update equipment status
     */
    @Transactional
    public KitchenEquipment updateEquipmentStatus(@NonNull String equipmentId, KitchenEquipment.EquipmentStatus status,
                                                   String staffId, String notes) {
        KitchenEquipment equipment = getEquipmentById(equipmentId);

        equipment.setStatus(status);
        equipment.setStatusChangedBy(staffId);
        equipment.setStatusNotes(notes);
        equipment.setLastStatusChange(LocalDateTime.now());
        equipment.setUpdatedAt(LocalDateTime.now());

        // Automatically turn off equipment if it's broken or under maintenance
        if (status == KitchenEquipment.EquipmentStatus.BROKEN ||
            status == KitchenEquipment.EquipmentStatus.MAINTENANCE) {
            equipment.setIsOn(false);
        }

        log.info("Updated equipment {} status to {}", equipmentId, status);
        return equipmentRepository.save(equipment);
    }

    /**
     * Toggle equipment on/off
     */
    @Transactional
    public KitchenEquipment toggleEquipmentPower(@NonNull String equipmentId, Boolean isOn, String staffId) {
        KitchenEquipment equipment = getEquipmentById(equipmentId);

        // Can only turn on if status is AVAILABLE or IN_USE
        if (isOn && equipment.getStatus() != KitchenEquipment.EquipmentStatus.AVAILABLE
            && equipment.getStatus() != KitchenEquipment.EquipmentStatus.IN_USE) {
            throw new RuntimeException("Cannot turn on equipment. Current status: " + equipment.getStatus());
        }

        equipment.setIsOn(isOn);
        equipment.setUpdatedAt(LocalDateTime.now());

        // If turning on, set status to IN_USE
        if (isOn && equipment.getStatus() == KitchenEquipment.EquipmentStatus.AVAILABLE) {
            equipment.setStatus(KitchenEquipment.EquipmentStatus.IN_USE);
            equipment.setUsageCount(equipment.getUsageCount() + 1);
        }
        // If turning off and in use, set to AVAILABLE
        else if (!isOn && equipment.getStatus() == KitchenEquipment.EquipmentStatus.IN_USE) {
            equipment.setStatus(KitchenEquipment.EquipmentStatus.AVAILABLE);
        }

        log.info("Toggled equipment {} power to {} by staff {}", equipmentId, isOn, staffId);
        return equipmentRepository.save(equipment);
    }

    /**
     * Update equipment temperature (for ovens, grills, etc.)
     */
    @Transactional
    public KitchenEquipment updateTemperature(@NonNull String equipmentId, Integer temperature) {
        KitchenEquipment equipment = getEquipmentById(equipmentId);

        if (equipment.getType() != KitchenEquipment.EquipmentType.OVEN &&
            equipment.getType() != KitchenEquipment.EquipmentType.GRILL &&
            equipment.getType() != KitchenEquipment.EquipmentType.FRYER) {
            throw new RuntimeException("Temperature tracking not supported for equipment type: " + equipment.getType());
        }

        equipment.setTemperature(temperature);
        equipment.setUpdatedAt(LocalDateTime.now());

        log.info("Updated equipment {} temperature to {}°C", equipmentId, temperature);
        return equipmentRepository.save(equipment);
    }

    /**
     * Record maintenance
     */
    @Transactional
    public KitchenEquipment recordMaintenance(@NonNull String equipmentId, LocalDateTime nextMaintenanceDate, String notes) {
        KitchenEquipment equipment = getEquipmentById(equipmentId);

        equipment.setLastMaintenanceDate(LocalDateTime.now());
        equipment.setNextMaintenanceDate(nextMaintenanceDate);
        equipment.setMaintenanceNotes(notes);
        equipment.setStatus(KitchenEquipment.EquipmentStatus.AVAILABLE);
        equipment.setUpdatedAt(LocalDateTime.now());

        log.info("Recorded maintenance for equipment {}", equipmentId);
        return equipmentRepository.save(equipment);
    }

    /**
     * Get equipment by status
     */
    public List<KitchenEquipment> getEquipmentByStatus(String storeId, KitchenEquipment.EquipmentStatus status) {
        return equipmentRepository.findByStoreIdAndStatus(storeId, status);
    }

    /**
     * Get equipment that needs maintenance
     */
    public List<KitchenEquipment> getEquipmentNeedingMaintenance(String storeId) {
        List<KitchenEquipment> allEquipment = equipmentRepository.findByStoreId(storeId);
        LocalDateTime now = LocalDateTime.now();

        return allEquipment.stream()
                .filter(eq -> eq.getNextMaintenanceDate() != null && eq.getNextMaintenanceDate().isBefore(now))
                .toList();
    }

    /**
     * Delete equipment
     */
    public void deleteEquipment(@NonNull String equipmentId) {
        log.info("Deleting equipment {}", equipmentId);
        equipmentRepository.deleteById(equipmentId);
    }

    /**
     * Reset usage counts (typically called at start of day)
     */
    @Transactional
    public void resetDailyUsageCounts(String storeId) {
        List<KitchenEquipment> equipment = equipmentRepository.findByStoreId(storeId);

        equipment.forEach(eq -> {
            eq.setUsageCount(0);
            eq.setUpdatedAt(LocalDateTime.now());
        });

        equipmentRepository.saveAll(equipment);
        log.info("Reset usage counts for store {}", storeId);
    }
}
