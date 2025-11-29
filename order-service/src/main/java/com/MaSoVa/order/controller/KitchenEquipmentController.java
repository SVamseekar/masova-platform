package com.MaSoVa.order.controller;

import com.MaSoVa.order.entity.KitchenEquipment;
import com.MaSoVa.order.service.KitchenEquipmentService;
import com.MaSoVa.shared.util.StoreContextUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kitchen-equipment")
public class KitchenEquipmentController {

    private static final Logger log = LoggerFactory.getLogger(KitchenEquipmentController.class);

    private final KitchenEquipmentService equipmentService;

    public KitchenEquipmentController(KitchenEquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    /**
     * Create new equipment
     */
    @PostMapping
    public ResponseEntity<KitchenEquipment> createEquipment(@RequestBody KitchenEquipment equipment) {
        log.info("POST /api/kitchen-equipment - Creating equipment: {}", equipment.getEquipmentName());
        KitchenEquipment created = equipmentService.createEquipment(equipment);
        return ResponseEntity.ok(created);
    }

    /**
     * Get all equipment for a store
     */
    @GetMapping("/store")
    public ResponseEntity<List<KitchenEquipment>> getEquipmentByStore(HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        log.info("GET /api/kitchen-equipment/store - Fetching equipment for store: {}", storeId);
        List<KitchenEquipment> equipment = equipmentService.getEquipmentByStore(storeId);
        return ResponseEntity.ok(equipment);
    }

    /**
     * Get equipment by ID
     */
    @GetMapping("/{equipmentId}")
    public ResponseEntity<KitchenEquipment> getEquipmentById(@PathVariable String equipmentId) {
        log.info("GET /api/kitchen-equipment/{}", equipmentId);
        KitchenEquipment equipment = equipmentService.getEquipmentById(equipmentId);
        return ResponseEntity.ok(equipment);
    }

    /**
     * Update equipment status
     */
    @PatchMapping("/{equipmentId}/status")
    public ResponseEntity<KitchenEquipment> updateEquipmentStatus(
            @PathVariable String equipmentId,
            @RequestBody Map<String, String> request) {

        log.info("PATCH /api/kitchen-equipment/{}/status", equipmentId);

        KitchenEquipment.EquipmentStatus status = KitchenEquipment.EquipmentStatus.valueOf(request.get("status"));
        String staffId = request.get("staffId");
        String notes = request.get("notes");

        KitchenEquipment updated = equipmentService.updateEquipmentStatus(equipmentId, status, staffId, notes);
        return ResponseEntity.ok(updated);
    }

    /**
     * Toggle equipment power on/off
     */
    @PatchMapping("/{equipmentId}/power")
    public ResponseEntity<KitchenEquipment> togglePower(
            @PathVariable String equipmentId,
            @RequestBody Map<String, Object> request) {

        log.info("PATCH /api/kitchen-equipment/{}/power", equipmentId);

        Boolean isOn = (Boolean) request.get("isOn");
        String staffId = (String) request.get("staffId");

        KitchenEquipment updated = equipmentService.toggleEquipmentPower(equipmentId, isOn, staffId);
        return ResponseEntity.ok(updated);
    }

    /**
     * Update equipment temperature
     */
    @PatchMapping("/{equipmentId}/temperature")
    public ResponseEntity<KitchenEquipment> updateTemperature(
            @PathVariable String equipmentId,
            @RequestBody Map<String, Integer> request) {

        log.info("PATCH /api/kitchen-equipment/{}/temperature", equipmentId);

        Integer temperature = request.get("temperature");
        KitchenEquipment updated = equipmentService.updateTemperature(equipmentId, temperature);
        return ResponseEntity.ok(updated);
    }

    /**
     * Record maintenance
     */
    @PostMapping("/{equipmentId}/maintenance")
    public ResponseEntity<KitchenEquipment> recordMaintenance(
            @PathVariable String equipmentId,
            @RequestBody Map<String, String> request) {

        log.info("POST /api/kitchen-equipment/{}/maintenance", equipmentId);

        LocalDateTime nextMaintenanceDate = LocalDateTime.parse(request.get("nextMaintenanceDate"));
        String notes = request.get("notes");

        KitchenEquipment updated = equipmentService.recordMaintenance(equipmentId, nextMaintenanceDate, notes);
        return ResponseEntity.ok(updated);
    }

    /**
     * Get equipment by status
     */
    @GetMapping("/store/status/{status}")
    public ResponseEntity<List<KitchenEquipment>> getEquipmentByStatus(
            HttpServletRequest request,
            @PathVariable String status) {

        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        log.info("GET /api/kitchen-equipment/store/status/{} - Fetching equipment with status for store: {}", status, storeId);

        KitchenEquipment.EquipmentStatus equipmentStatus = KitchenEquipment.EquipmentStatus.valueOf(status);
        List<KitchenEquipment> equipment = equipmentService.getEquipmentByStatus(storeId, equipmentStatus);
        return ResponseEntity.ok(equipment);
    }

    /**
     * Get equipment needing maintenance
     */
    @GetMapping("/store/maintenance-needed")
    public ResponseEntity<List<KitchenEquipment>> getEquipmentNeedingMaintenance(HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        log.info("GET /api/kitchen-equipment/store/maintenance-needed - Fetching equipment needing maintenance for store: {}", storeId);
        List<KitchenEquipment> equipment = equipmentService.getEquipmentNeedingMaintenance(storeId);
        return ResponseEntity.ok(equipment);
    }

    /**
     * Delete equipment
     */
    @DeleteMapping("/{equipmentId}")
    public ResponseEntity<Void> deleteEquipment(@PathVariable String equipmentId) {
        log.info("DELETE /api/kitchen-equipment/{}", equipmentId);
        equipmentService.deleteEquipment(equipmentId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Reset daily usage counts
     */
    @PostMapping("/store/reset-usage")
    public ResponseEntity<Void> resetUsageCounts(HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        log.info("POST /api/kitchen-equipment/store/reset-usage - Resetting usage counts for store: {}", storeId);
        equipmentService.resetDailyUsageCounts(storeId);
        return ResponseEntity.ok().build();
    }
}
