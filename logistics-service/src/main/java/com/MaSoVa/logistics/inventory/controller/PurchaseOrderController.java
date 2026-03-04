package com.MaSoVa.logistics.inventory.controller;

import com.MaSoVa.logistics.inventory.dto.response.MessageResponse;
import com.MaSoVa.logistics.inventory.entity.PurchaseOrder;
import com.MaSoVa.logistics.inventory.service.PurchaseOrderService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Purchase Orders — 6 canonical endpoints at /api/purchase-orders.
 * Path moved from /api/inventory/purchase-orders (matches gateway /api/purchase-orders/**).
 * Replaces: /status/{status}, /pending-approval, /overdue, /date-range, /number/{num},
 *           /auto-generate, PUT /{id},
 *           PATCH /{id}/approve, /{id}/reject, /{id}/send, /{id}/receive, /{id}/cancel
 */
@RestController
@RequestMapping("/api/purchase-orders")
@Tag(name = "Purchase Orders", description = "Purchase order lifecycle management")
@SecurityRequirement(name = "bearerAuth")
public class PurchaseOrderController {

    private static final Logger log = LoggerFactory.getLogger(PurchaseOrderController.class);

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    private String getStoreIdFromHeaders(HttpServletRequest request) {
        String userType = request.getHeader("X-User-Type");
        String selectedStoreId = request.getHeader("X-Selected-Store-Id");
        String userStoreId = request.getHeader("X-User-Store-Id");
        if ("MANAGER".equals(userType) || "CUSTOMER".equals(userType)) {
            return selectedStoreId != null ? selectedStoreId : userStoreId;
        }
        return userStoreId;
    }

    // ── LIST ──────────────────────────────────────────────────────────────────────

    /**
     * GET /api/purchase-orders?status=&pending=true&overdue=true&number=&startDate=&endDate=
     * Replaces: /, /status/{status}, /pending-approval, /overdue, /number/{num}, /date-range
     */
    @GetMapping
    @Operation(summary = "List purchase orders (query: status, pending, overdue, number, startDate, endDate)")
    public ResponseEntity<List<PurchaseOrder>> getPurchaseOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean pending,
            @RequestParam(required = false) Boolean overdue,
            @RequestParam(required = false) String number,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        if (number != null) return ResponseEntity.ok(List.of(purchaseOrderService.getPurchaseOrderByNumber(number)));
        if (Boolean.TRUE.equals(pending)) return ResponseEntity.ok(purchaseOrderService.getPendingApprovalOrders(storeId));
        if (Boolean.TRUE.equals(overdue)) return ResponseEntity.ok(purchaseOrderService.getOverdueOrders(storeId));
        if (startDate != null && endDate != null) {
            return ResponseEntity.ok(purchaseOrderService.getPurchaseOrdersByDateRange(storeId, startDate, endDate));
        }
        if (status != null) return ResponseEntity.ok(purchaseOrderService.getPurchaseOrdersByStatus(storeId, status));
        return ResponseEntity.ok(purchaseOrderService.getAllPurchaseOrders(storeId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Create purchase order")
    public ResponseEntity<PurchaseOrder> create(@RequestBody PurchaseOrder purchaseOrder) {
        return ResponseEntity.status(HttpStatus.CREATED).body(purchaseOrderService.createPurchaseOrder(purchaseOrder));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get purchase order by ID")
    public ResponseEntity<PurchaseOrder> getById(@PathVariable String id) {
        return ResponseEntity.ok(purchaseOrderService.getPurchaseOrderById(id));
    }

    /**
     * PATCH /api/purchase-orders/{id}
     * Body: { action: "APPROVE"|"REJECT"|"SEND"|"RECEIVE"|"CANCEL", approverId?, reason?, receivedBy?, notes?, storeId? }
     * — OR — plain field update (no action key).
     * Replaces: PUT /{id}, PATCH /{id}/approve, /{id}/reject, /{id}/send, /{id}/receive, /{id}/cancel
     */
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Update or action a purchase order (body: action=APPROVE|REJECT|SEND|RECEIVE|CANCEL)")
    public ResponseEntity<PurchaseOrder> update(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        String storeId = (String) body.getOrDefault("storeId", getStoreIdFromHeaders(request));
        String action = body.containsKey("action") ? ((String) body.get("action")).toUpperCase() : null;
        if (action != null) {
            return switch (action) {
                case "APPROVE" -> ResponseEntity.ok(purchaseOrderService.approvePurchaseOrder(
                        id, (String) body.get("approverId"), storeId));
                case "REJECT" -> ResponseEntity.ok(purchaseOrderService.rejectPurchaseOrder(
                        id, (String) body.get("reason"), storeId));
                case "SEND" -> ResponseEntity.ok(purchaseOrderService.markAsSent(id, storeId));
                case "RECEIVE" -> ResponseEntity.ok(purchaseOrderService.receivePurchaseOrder(
                        id, (String) body.get("receivedBy"), (String) body.get("notes")));
                case "CANCEL" -> ResponseEntity.ok(purchaseOrderService.cancelPurchaseOrder(
                        id, (String) body.get("reason"), storeId));
                default -> ResponseEntity.badRequest().build();
            };
        }
        // Plain field update — apply body fields to the fetched record
        PurchaseOrder po = purchaseOrderService.getPurchaseOrderById(id);
        if (body.containsKey("supplierName")) po.setSupplierName((String) body.get("supplierName"));
        if (body.containsKey("notes")) po.setNotes((String) body.get("notes"));
        if (body.containsKey("paymentStatus")) po.setPaymentStatus((String) body.get("paymentStatus"));
        if (body.containsKey("expectedDeliveryDate")) {
            po.setExpectedDeliveryDate(java.time.LocalDate.parse((String) body.get("expectedDeliveryDate")));
        }
        po.setId(id);
        return ResponseEntity.ok(purchaseOrderService.updatePurchaseOrder(po));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ASSISTANT_MANAGER')")
    @Operation(summary = "Delete purchase order")
    public ResponseEntity<MessageResponse> delete(@PathVariable String id, HttpServletRequest request) {
        purchaseOrderService.deletePurchaseOrder(id, getStoreIdFromHeaders(request));
        return ResponseEntity.ok(new MessageResponse("Purchase order deleted successfully"));
    }

    /**
     * POST /api/purchase-orders/auto-generate — manually trigger auto-generation
     */
    @PostMapping("/auto-generate")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Manually trigger purchase order auto-generation")
    public ResponseEntity<MessageResponse> autoGenerate() {
        purchaseOrderService.autoGeneratePurchaseOrders();
        return ResponseEntity.ok(new MessageResponse("Auto-generation completed"));
    }
}
