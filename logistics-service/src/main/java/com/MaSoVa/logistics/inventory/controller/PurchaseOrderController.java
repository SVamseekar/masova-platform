package com.MaSoVa.logistics.inventory.controller;

import com.MaSoVa.logistics.inventory.dto.request.ApprovalRequest;
import com.MaSoVa.logistics.inventory.dto.request.CancellationRequest;
import com.MaSoVa.logistics.inventory.dto.request.ReceiveRequest;
import com.MaSoVa.logistics.inventory.dto.request.RejectionRequest;
import com.MaSoVa.logistics.inventory.dto.request.StoreIdRequest;
import com.MaSoVa.logistics.inventory.dto.response.MessageResponse;
import com.MaSoVa.logistics.inventory.entity.PurchaseOrder;
import com.MaSoVa.logistics.inventory.service.PurchaseOrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.util.List;

/**
 * REST Controller for Purchase Order Management
 */
@RestController
@Tag(name = "PurchaseOrderController", description = "Purchase order management")
@SecurityRequirement(name = "bearerAuth")
@RequestMapping("/api/inventory/purchase-orders")
public class PurchaseOrderController {

    private static final Logger logger = LoggerFactory.getLogger(PurchaseOrderController.class);

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    /**
     * Extract storeId from HTTP headers
     */
    private String getStoreIdFromHeaders(HttpServletRequest request) {
        String userType = request.getHeader("X-User-Type");
        String selectedStoreId = request.getHeader("X-Selected-Store-Id");
        String userStoreId = request.getHeader("X-User-Store-Id");

        // Managers/Customers use selected store
        if ("MANAGER".equals(userType) || "CUSTOMER".equals(userType)) {
            return selectedStoreId != null ? selectedStoreId : userStoreId;
        }

        // Staff/Driver use assigned store
        return userStoreId;
    }

    /**
     * Create a new purchase order
     * POST /api/inventory/purchase-orders
     */
    @PostMapping
    public ResponseEntity<PurchaseOrder> createPurchaseOrder(@RequestBody PurchaseOrder purchaseOrder) {
        logger.info("Creating purchase order for store: {}", purchaseOrder.getStoreId());
        PurchaseOrder created = purchaseOrderService.createPurchaseOrder(purchaseOrder);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Get all purchase orders for a store
     * GET /api/inventory/purchase-orders
     */
    @GetMapping
    public ResponseEntity<List<PurchaseOrder>> getAllPurchaseOrders(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting all purchase orders for store: {}", storeId);
        List<PurchaseOrder> orders = purchaseOrderService.getAllPurchaseOrders(storeId);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get purchase order by ID
     * GET /api/inventory/purchase-orders/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrder> getPurchaseOrderById(@PathVariable String id) {
        logger.info("Getting purchase order: {}", id);
        PurchaseOrder order = purchaseOrderService.getPurchaseOrderById(id);
        return ResponseEntity.ok(order);
    }

    /**
     * Get purchase order by order number
     * GET /api/inventory/purchase-orders/number/{orderNumber}
     */
    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<PurchaseOrder> getPurchaseOrderByNumber(@PathVariable String orderNumber) {
        logger.info("Getting purchase order by number: {}", orderNumber);
        PurchaseOrder order = purchaseOrderService.getPurchaseOrderByNumber(orderNumber);
        return ResponseEntity.ok(order);
    }

    /**
     * Get purchase orders by status
     * GET /api/inventory/purchase-orders/status/{status}
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<PurchaseOrder>> getPurchaseOrdersByStatus(
            @PathVariable String status,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting purchase orders with status: {} for store: {}", status, storeId);
        List<PurchaseOrder> orders = purchaseOrderService.getPurchaseOrdersByStatus(storeId, status);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get pending approval purchase orders
     * GET /api/inventory/purchase-orders/pending-approval
     */
    @GetMapping("/pending-approval")
    public ResponseEntity<List<PurchaseOrder>> getPendingApprovalOrders(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting pending approval purchase orders for store: {}", storeId);
        List<PurchaseOrder> orders = purchaseOrderService.getPendingApprovalOrders(storeId);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get overdue purchase orders
     * GET /api/inventory/purchase-orders/overdue
     */
    @GetMapping("/overdue")
    public ResponseEntity<List<PurchaseOrder>> getOverdueOrders(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting overdue purchase orders for store: {}", storeId);
        List<PurchaseOrder> orders = purchaseOrderService.getOverdueOrders(storeId);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get purchase orders by date range
     * GET /api/inventory/purchase-orders/date-range?startDate=2024-01-01&endDate=2024-01-31
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<PurchaseOrder>> getPurchaseOrdersByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Getting purchase orders from {} to {} for store: {}", startDate, endDate, storeId);
        List<PurchaseOrder> orders = purchaseOrderService.getPurchaseOrdersByDateRange(storeId, startDate, endDate);
        return ResponseEntity.ok(orders);
    }

    /**
     * Update purchase order
     * PUT /api/inventory/purchase-orders/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<PurchaseOrder> updatePurchaseOrder(
            @PathVariable String id,
            @RequestBody PurchaseOrder purchaseOrder) {
        logger.info("Updating purchase order: {}", id);
        purchaseOrder.setId(id);
        PurchaseOrder updated = purchaseOrderService.updatePurchaseOrder(purchaseOrder);
        return ResponseEntity.ok(updated);
    }

    /**
     * Approve purchase order
     * PATCH /api/inventory/purchase-orders/{id}/approve
     * Body: { "approverId": "userId", "storeId": "xxx" }
     */
    @PatchMapping("/{id}/approve")
    public ResponseEntity<PurchaseOrder> approvePurchaseOrder(
            @PathVariable String id,
            @RequestBody ApprovalRequest request) {
        logger.info("Approving purchase order: {}", id);
        PurchaseOrder approved = purchaseOrderService.approvePurchaseOrder(
            id,
            request.getApproverId(),
            request.getStoreId()
        );
        return ResponseEntity.ok(approved);
    }

    /**
     * Reject purchase order
     * PATCH /api/inventory/purchase-orders/{id}/reject
     * Body: { "rejectionReason": "Out of budget", "storeId": "xxx" }
     */
    @PatchMapping("/{id}/reject")
    public ResponseEntity<PurchaseOrder> rejectPurchaseOrder(
            @PathVariable String id,
            @RequestBody RejectionRequest request) {
        logger.info("Rejecting purchase order: {}", id);
        PurchaseOrder rejected = purchaseOrderService.rejectPurchaseOrder(
            id,
            request.getRejectionReason(),
            request.getStoreId()
        );
        return ResponseEntity.ok(rejected);
    }

    /**
     * Mark purchase order as sent
     * PATCH /api/inventory/purchase-orders/{id}/send
     * Body: { "storeId": "xxx" }
     */
    @PatchMapping("/{id}/send")
    public ResponseEntity<PurchaseOrder> markAsSent(
            @PathVariable String id,
            @RequestBody StoreIdRequest request) {
        logger.info("Marking purchase order as sent: {}", id);
        PurchaseOrder sent = purchaseOrderService.markAsSent(id, request.getStoreId());
        return ResponseEntity.ok(sent);
    }

    /**
     * Receive purchase order
     * PATCH /api/inventory/purchase-orders/{id}/receive
     * Body: { "receivedBy": "userId", "notes": "All items received in good condition" }
     */
    @PatchMapping("/{id}/receive")
    public ResponseEntity<PurchaseOrder> receivePurchaseOrder(
            @PathVariable String id,
            @RequestBody ReceiveRequest request) {
        logger.info("Receiving purchase order: {}", id);
        PurchaseOrder received = purchaseOrderService.receivePurchaseOrder(
            id,
            request.getReceivedBy(),
            request.getNotes()
        );
        return ResponseEntity.ok(received);
    }

    /**
     * Cancel purchase order
     * PATCH /api/inventory/purchase-orders/{id}/cancel
     * Body: { "reason": "Supplier unavailable", "storeId": "xxx" }
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<PurchaseOrder> cancelPurchaseOrder(
            @PathVariable String id,
            @RequestBody CancellationRequest request) {
        logger.info("Cancelling purchase order: {}", id);
        PurchaseOrder cancelled = purchaseOrderService.cancelPurchaseOrder(
            id,
            request.getReason(),
            request.getStoreId()
        );
        return ResponseEntity.ok(cancelled);
    }

    /**
     * Manually trigger auto-generation of purchase orders
     * POST /api/inventory/purchase-orders/auto-generate
     */
    @PostMapping("/auto-generate")
    public ResponseEntity<MessageResponse> autoGeneratePurchaseOrders() {
        logger.info("Manually triggering auto-generation of purchase orders");
        purchaseOrderService.autoGeneratePurchaseOrders();

        return ResponseEntity.ok(new MessageResponse("Auto-generation completed"));
    }

    /**
     * Delete purchase order
     * DELETE /api/inventory/purchase-orders/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deletePurchaseOrder(
            @PathVariable String id,
            HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        logger.info("Deleting purchase order: {}", id);
        purchaseOrderService.deletePurchaseOrder(id, storeId);

        return ResponseEntity.ok(new MessageResponse("Purchase order deleted successfully"));
    }
}
