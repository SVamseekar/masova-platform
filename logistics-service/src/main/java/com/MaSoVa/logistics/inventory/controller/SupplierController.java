package com.MaSoVa.logistics.inventory.controller;

import com.MaSoVa.logistics.inventory.dto.response.MessageResponse;
import com.MaSoVa.logistics.inventory.entity.Supplier;
import com.MaSoVa.logistics.inventory.service.SupplierService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Suppliers — 6 canonical endpoints at /api/suppliers.
 * Path moved from /api/inventory/suppliers (matches gateway route /api/suppliers/**).
 * Replaces: /active, /preferred, /reliable, /category/{cat}, /search,
 *           /city/{city}, /code/{code}, /compare/category/{cat}, PUT /{id},
 *           separate PATCH /{id}/status and /{id}/preferred and /{id}/performance
 */
@RestController
@RequestMapping("/api/suppliers")
@Tag(name = "Suppliers", description = "Supplier management")
@SecurityRequirement(name = "bearerAuth")
public class SupplierController {

    private static final Logger log = LoggerFactory.getLogger(SupplierController.class);

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    /**
     * GET /api/suppliers?status=&preferred=true&reliable=true&category=&search=&city=&code=
     * Replaces: /active, /preferred, /reliable, /category/{cat}, /search, /city/{city}, /code/{code},
     *           /compare/category/{cat}
     */
    @GetMapping
    @Operation(summary = "List suppliers (query: status, preferred, reliable, category, search, city, code)")
    public ResponseEntity<List<Supplier>> getSuppliers(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean preferred,
            @RequestParam(required = false) Boolean reliable,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String code) {
        if (code != null) return ResponseEntity.ok(List.of(supplierService.getSupplierByCode(code)));
        if (Boolean.TRUE.equals(preferred)) return ResponseEntity.ok(supplierService.getPreferredSuppliers());
        if (Boolean.TRUE.equals(reliable)) return ResponseEntity.ok(supplierService.getReliableSuppliers());
        if (search != null) return ResponseEntity.ok(supplierService.searchSuppliers(search));
        if (city != null) return ResponseEntity.ok(supplierService.getSuppliersByCity(city));
        if (category != null) return ResponseEntity.ok(supplierService.getSuppliersByCategory(category));
        if ("ACTIVE".equalsIgnoreCase(status)) return ResponseEntity.ok(supplierService.getActiveSuppliers());
        return ResponseEntity.ok(supplierService.getAllSuppliers());
    }

    @PostMapping
    @Operation(summary = "Create supplier")
    public ResponseEntity<Supplier> createSupplier(@RequestBody Supplier supplier) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierService.createSupplier(supplier));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get supplier by ID")
    public ResponseEntity<Supplier> getSupplier(@PathVariable String id) {
        return ResponseEntity.ok(supplierService.getSupplierById(id));
    }

    /**
     * PATCH /api/suppliers/{id}
     * Body can contain: status, isPreferred, completedOrders, cancelledOrders,
     *                   onTimeDeliveryRate, qualityRating, or any other supplier field.
     * Replaces: PUT /{id}, PATCH /{id}/status, PATCH /{id}/preferred, PATCH /{id}/performance
     */
    @PatchMapping("/{id}")
    @Operation(summary = "Update supplier (status, preferred flag, performance metrics, or full update)")
    public ResponseEntity<Supplier> updateSupplier(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {

        if (body.containsKey("status") && body.size() == 1) {
            return ResponseEntity.ok(supplierService.updateSupplierStatus(id, (String) body.get("status")));
        }
        if (body.containsKey("isPreferred") && body.size() == 1) {
            return ResponseEntity.ok(supplierService.markAsPreferred(id, (Boolean) body.get("isPreferred")));
        }
        if (body.containsKey("onTimeDeliveryRate") || body.containsKey("qualityRating")) {
            return ResponseEntity.ok(supplierService.updatePerformanceMetrics(
                    id,
                    body.containsKey("completedOrders") ? (Integer) body.get("completedOrders") : null,
                    body.containsKey("cancelledOrders") ? (Integer) body.get("cancelledOrders") : null,
                    body.containsKey("onTimeDeliveryRate") ? ((Number) body.get("onTimeDeliveryRate")).doubleValue() : null,
                    body.containsKey("qualityRating") ? ((Number) body.get("qualityRating")).doubleValue() : null));
        }
        // Full update
        Supplier supplier = supplierService.getSupplierById(id);
        if (body.containsKey("supplierName")) supplier.setSupplierName((String) body.get("supplierName"));
        if (body.containsKey("status")) supplier.setStatus((String) body.get("status"));
        supplier.setId(id);
        return ResponseEntity.ok(supplierService.updateSupplier(supplier));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete supplier")
    public ResponseEntity<MessageResponse> deleteSupplier(@PathVariable String id) {
        supplierService.deleteSupplier(id);
        return ResponseEntity.ok(new MessageResponse("Supplier deleted successfully"));
    }

    // ── REORDER SUGGESTIONS ───────────────────────────────────────────────────────

    /**
     * GET /api/suppliers/compare?category= — compare by category
     * Replaces: /compare/category/{category}
     */
    @GetMapping("/compare")
    @Operation(summary = "Compare suppliers by category (query: category)")
    public ResponseEntity<List<Supplier>> compare(@RequestParam String category) {
        return ResponseEntity.ok(supplierService.compareSuppliersByCategory(category));
    }
}
