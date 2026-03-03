package com.MaSoVa.commerce.order.controller;

import com.MaSoVa.commerce.order.entity.KitchenEquipment;
import com.MaSoVa.commerce.order.service.KitchenEquipmentService;
import com.MaSoVa.shared.util.StoreContextUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Kitchen Equipment — 6 canonical endpoints at /api/equipment.
 * Replaces: /api/kitchen-equipment (wrong path), /store, /store/status/{status},
 *           /store/maintenance-needed, /store/reset-usage (removed — internal scheduler only),
 *           /{id}/status, /{id}/power, /{id}/temperature (merged into PATCH /{id}).
 */
@RestController
@RequestMapping("/api/equipment")
@Tag(name = "Kitchen Equipment", description = "Kitchen equipment monitoring and maintenance")
@SecurityRequirement(name = "bearerAuth")
public class KitchenEquipmentController {

    private static final Logger log = LoggerFactory.getLogger(KitchenEquipmentController.class);

    private final KitchenEquipmentService equipmentService;

    public KitchenEquipmentController(KitchenEquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    /**
     * GET /api/equipment?status=&maintenanceNeeded=true
     * Replaces: /store, /store/status/{status}, /store/maintenance-needed
     */
    @GetMapping
    @Operation(summary = "List equipment (query: status, maintenanceNeeded)")
    public ResponseEntity<List<KitchenEquipment>> getEquipment(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean maintenanceNeeded,
            HttpServletRequest request) {
        String storeId = StoreContextUtil.getStoreIdFromHeaders(request);
        if (Boolean.TRUE.equals(maintenanceNeeded)) {
            return ResponseEntity.ok(equipmentService.getEquipmentNeedingMaintenance(storeId));
        }
        if (status != null) {
            return ResponseEntity.ok(equipmentService.getEquipmentByStatus(
                    storeId, KitchenEquipment.EquipmentStatus.valueOf(status)));
        }
        return ResponseEntity.ok(equipmentService.getEquipmentByStore(storeId));
    }

    @PostMapping
    @Operation(summary = "Register new equipment")
    public ResponseEntity<KitchenEquipment> createEquipment(@RequestBody KitchenEquipment equipment) {
        return ResponseEntity.ok(equipmentService.createEquipment(equipment));
    }

    @GetMapping("/{equipmentId}")
    @Operation(summary = "Get equipment by ID")
    public ResponseEntity<KitchenEquipment> getEquipmentById(@PathVariable String equipmentId) {
        return ResponseEntity.ok(equipmentService.getEquipmentById(equipmentId));
    }

    /**
     * PATCH /api/equipment/{id}
     * Body can contain: status+staffId+notes (status update),
     *                   isOn+staffId (power toggle),
     *                   temperature (temperature update).
     * Replaces: /{id}/status, /{id}/power, /{id}/temperature
     */
    @PatchMapping("/{equipmentId}")
    @Operation(summary = "Update equipment (status, power, or temperature)")
    public ResponseEntity<KitchenEquipment> updateEquipment(
            @PathVariable String equipmentId,
            @RequestBody Map<String, Object> body) {

        if (body.containsKey("status")) {
            KitchenEquipment.EquipmentStatus status = KitchenEquipment.EquipmentStatus.valueOf((String) body.get("status"));
            return ResponseEntity.ok(equipmentService.updateEquipmentStatus(
                    equipmentId, status, (String) body.get("staffId"), (String) body.get("notes")));
        }
        if (body.containsKey("isOn")) {
            Boolean isOn = (Boolean) body.get("isOn");
            return ResponseEntity.ok(equipmentService.toggleEquipmentPower(
                    equipmentId, isOn, (String) body.get("staffId")));
        }
        if (body.containsKey("temperature")) {
            Integer temp = (Integer) body.get("temperature");
            return ResponseEntity.ok(equipmentService.updateTemperature(equipmentId, temp));
        }
        return ResponseEntity.badRequest().body(null);
    }

    @DeleteMapping("/{equipmentId}")
    @Operation(summary = "Delete equipment")
    public ResponseEntity<Void> deleteEquipment(@PathVariable String equipmentId) {
        equipmentService.deleteEquipment(equipmentId);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/equipment/{id}/maintenance — record maintenance and set next date
     */
    @PostMapping("/{equipmentId}/maintenance")
    @Operation(summary = "Record maintenance event")
    public ResponseEntity<KitchenEquipment> recordMaintenance(
            @PathVariable String equipmentId,
            @RequestBody Map<String, String> body) {
        LocalDateTime nextMaintenance = LocalDateTime.parse(body.get("nextMaintenanceDate"));
        return ResponseEntity.ok(equipmentService.recordMaintenance(equipmentId, nextMaintenance, body.get("notes")));
    }
}
