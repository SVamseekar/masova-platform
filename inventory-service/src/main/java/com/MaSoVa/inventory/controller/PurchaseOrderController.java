package com.MaSoVa.inventory.controller;

import com.MaSoVa.inventory.entity.PurchaseOrder;
import com.MaSoVa.inventory.service.PurchaseOrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Purchase Order Management
 */
@RestController
@RequestMapping("/api/inventory/purchase-orders")
@CrossOrigin(origins = "*")
public class PurchaseOrderController {

    private static final Logger logger = LoggerFactory.getLogger(PurchaseOrderController.class);

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
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
     * GET /api/inventory/purchase-orders?storeId=xxx
     */
    @GetMapping
    public ResponseEntity<List<PurchaseOrder>> getAllPurchaseOrders(@RequestParam String storeId) {
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
     * GET /api/inventory/purchase-orders/status/{status}?storeId=xxx
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<PurchaseOrder>> getPurchaseOrdersByStatus(
            @PathVariable String status,
            @RequestParam String storeId) {
        logger.info("Getting purchase orders with status: {} for store: {}", status, storeId);
        List<PurchaseOrder> orders = purchaseOrderService.getPurchaseOrdersByStatus(storeId, status);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get pending approval purchase orders
     * GET /api/inventory/purchase-orders/pending-approval?storeId=xxx
     */
    @GetMapping("/pending-approval")
    public ResponseEntity<List<PurchaseOrder>> getPendingApprovalOrders(@RequestParam String storeId) {
        logger.info("Getting pending approval purchase orders for store: {}", storeId);
        List<PurchaseOrder> orders = purchaseOrderService.getPendingApprovalOrders(storeId);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get overdue purchase orders
     * GET /api/inventory/purchase-orders/overdue?storeId=xxx
     */
    @GetMapping("/overdue")
    public ResponseEntity<List<PurchaseOrder>> getOverdueOrders(@RequestParam String storeId) {
        logger.info("Getting overdue purchase orders for store: {}", storeId);
        List<PurchaseOrder> orders = purchaseOrderService.getOverdueOrders(storeId);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get purchase orders by date range
     * GET /api/inventory/purchase-orders/date-range?storeId=xxx&startDate=2024-01-01&endDate=2024-01-31
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<PurchaseOrder>> getPurchaseOrdersByDateRange(
            @RequestParam String storeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
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
    public ResponseEntity<Map<String, String>> autoGeneratePurchaseOrders() {
        logger.info("Manually triggering auto-generation of purchase orders");
        purchaseOrderService.autoGeneratePurchaseOrders();

        Map<String, String> response = new HashMap<>();
        response.put("message", "Auto-generation completed");
        return ResponseEntity.ok(response);
    }

    /**
     * Delete purchase order
     * DELETE /api/inventory/purchase-orders/{id}?storeId=xxx
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deletePurchaseOrder(
            @PathVariable String id,
            @RequestParam String storeId) {
        logger.info("Deleting purchase order: {}", id);
        purchaseOrderService.deletePurchaseOrder(id, storeId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Purchase order deleted successfully");
        return ResponseEntity.ok(response);
    }

    // DTOs for request bodies

    public static class ApprovalRequest {
        private String approverId;
        private String storeId;

        public String getApproverId() { return approverId; }
        public void setApproverId(String approverId) { this.approverId = approverId; }
        public String getStoreId() { return storeId; }
        public void setStoreId(String storeId) { this.storeId = storeId; }
    }

    public static class RejectionRequest {
        private String rejectionReason;
        private String storeId;

        public String getRejectionReason() { return rejectionReason; }
        public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
        public String getStoreId() { return storeId; }
        public void setStoreId(String storeId) { this.storeId = storeId; }
    }

    public static class ReceiveRequest {
        private String receivedBy;
        private String notes;

        public String getReceivedBy() { return receivedBy; }
        public void setReceivedBy(String receivedBy) { this.receivedBy = receivedBy; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class CancellationRequest {
        private String reason;
        private String storeId;

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public String getStoreId() { return storeId; }
        public void setStoreId(String storeId) { this.storeId = storeId; }
    }

    public static class StoreIdRequest {
        private String storeId;

        public String getStoreId() { return storeId; }
        public void setStoreId(String storeId) { this.storeId = storeId; }
    }
}
