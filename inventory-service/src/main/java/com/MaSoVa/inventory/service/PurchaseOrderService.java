package com.MaSoVa.inventory.service;

import com.MaSoVa.inventory.entity.InventoryItem;
import com.MaSoVa.inventory.entity.PurchaseOrder;
import com.MaSoVa.inventory.entity.Supplier;
import com.MaSoVa.inventory.repository.PurchaseOrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for managing purchase orders
 */
@Service
public class PurchaseOrderService {

    private static final Logger logger = LoggerFactory.getLogger(PurchaseOrderService.class);

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final InventoryService inventoryService;
    private final SupplierService supplierService;

    public PurchaseOrderService(PurchaseOrderRepository purchaseOrderRepository,
                                InventoryService inventoryService,
                                SupplierService supplierService) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.inventoryService = inventoryService;
        this.supplierService = supplierService;
    }

    /**
     * Create a new purchase order
     */
    @CacheEvict(value = "purchaseOrders", key = "#purchaseOrder.storeId")
    public PurchaseOrder createPurchaseOrder(PurchaseOrder purchaseOrder) {
        logger.info("Creating purchase order for store: {} with supplier: {}",
            purchaseOrder.getStoreId(), purchaseOrder.getSupplierId());

        // Generate order number
        purchaseOrder.setOrderNumber(generateOrderNumber());

        // Get supplier information
        Supplier supplier = supplierService.getSupplierById(purchaseOrder.getSupplierId());
        purchaseOrder.setSupplierName(supplier.getSupplierName());

        // Set expected delivery date based on supplier lead time
        if (purchaseOrder.getExpectedDeliveryDate() == null && supplier.getAverageLeadTimeDays() != null) {
            purchaseOrder.setExpectedDeliveryDate(
                LocalDate.now().plusDays(supplier.getAverageLeadTimeDays())
            );
        }

        // Calculate totals
        purchaseOrder.calculateTotals();

        // Update supplier metrics
        supplier.setTotalOrders(supplier.getTotalOrders() + 1);
        supplier.setLastOrderDate(LocalDateTime.now());
        supplierService.updateSupplier(supplier);

        return purchaseOrderRepository.save(purchaseOrder);
    }

    /**
     * Get purchase order by ID
     */
    public PurchaseOrder getPurchaseOrderById(String id) {
        return purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase order not found: " + id));
    }

    /**
     * Get purchase order by order number
     */
    public PurchaseOrder getPurchaseOrderByNumber(String orderNumber) {
        return purchaseOrderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new RuntimeException("Purchase order not found: " + orderNumber));
    }

    /**
     * Get all purchase orders for a store
     */
    @Cacheable(value = "purchaseOrders", key = "#storeId")
    public List<PurchaseOrder> getAllPurchaseOrders(String storeId) {
        return purchaseOrderRepository.findByStoreId(storeId);
    }

    /**
     * Get purchase orders by status
     */
    public List<PurchaseOrder> getPurchaseOrdersByStatus(String storeId, String status) {
        return purchaseOrderRepository.findByStoreIdAndStatus(storeId, status);
    }

    /**
     * Get pending approval purchase orders
     */
    public List<PurchaseOrder> getPendingApprovalOrders(String storeId) {
        List<String> statuses = List.of("DRAFT", "PENDING_APPROVAL");
        return purchaseOrderRepository.findByStoreIdAndStatusIn(storeId, statuses);
    }

    /**
     * Get overdue purchase orders
     */
    public List<PurchaseOrder> getOverdueOrders(String storeId) {
        return purchaseOrderRepository.findOverdueOrders(storeId, LocalDate.now());
    }

    /**
     * Update purchase order
     */
    @CacheEvict(value = "purchaseOrders", key = "#purchaseOrder.storeId")
    public PurchaseOrder updatePurchaseOrder(PurchaseOrder purchaseOrder) {
        logger.info("Updating purchase order: {}", purchaseOrder.getId());

        // Verify PO exists
        PurchaseOrder existing = getPurchaseOrderById(purchaseOrder.getId());

        // Can only update if not yet received
        if (existing.getStatus().equals("RECEIVED")) {
            throw new RuntimeException("Cannot update a received purchase order");
        }

        // Recalculate totals
        purchaseOrder.calculateTotals();

        return purchaseOrderRepository.save(purchaseOrder);
    }

    /**
     * Approve purchase order
     */
    @Transactional
    @CacheEvict(value = "purchaseOrders", key = "#storeId")
    public PurchaseOrder approvePurchaseOrder(String orderId, String approverId, String storeId) {
        logger.info("Approving purchase order: {} by user: {}", orderId, approverId);

        PurchaseOrder order = getPurchaseOrderById(orderId);

        if (!order.getStatus().equals("PENDING_APPROVAL") && !order.getStatus().equals("DRAFT")) {
            throw new RuntimeException("Purchase order is not in a state that can be approved");
        }

        order.setStatus("APPROVED");
        order.setApprovedBy(approverId);
        order.setApprovedAt(LocalDateTime.now());

        return purchaseOrderRepository.save(order);
    }

    /**
     * Reject purchase order
     */
    @Transactional
    @CacheEvict(value = "purchaseOrders", key = "#storeId")
    public PurchaseOrder rejectPurchaseOrder(String orderId, String rejectionReason, String storeId) {
        logger.info("Rejecting purchase order: {}. Reason: {}", orderId, rejectionReason);

        PurchaseOrder order = getPurchaseOrderById(orderId);

        order.setStatus("CANCELLED");
        order.setRejectionReason(rejectionReason);

        // Update supplier metrics
        Supplier supplier = supplierService.getSupplierById(order.getSupplierId());
        supplier.setCancelledOrders(supplier.getCancelledOrders() + 1);
        supplierService.updateSupplier(supplier);

        return purchaseOrderRepository.save(order);
    }

    /**
     * Mark purchase order as sent to supplier
     */
    @CacheEvict(value = "purchaseOrders", key = "#storeId")
    public PurchaseOrder markAsSent(String orderId, String storeId) {
        logger.info("Marking purchase order as sent: {}", orderId);

        PurchaseOrder order = getPurchaseOrderById(orderId);

        if (!order.getStatus().equals("APPROVED")) {
            throw new RuntimeException("Only approved orders can be sent");
        }

        order.setStatus("SENT");

        return purchaseOrderRepository.save(order);
    }

    /**
     * Receive purchase order (full or partial)
     */
    @Transactional
    @CacheEvict(value = {"purchaseOrders", "inventoryItems"}, allEntries = true)
    public PurchaseOrder receivePurchaseOrder(String orderId, String receivedBy, String notes) {
        logger.info("Receiving purchase order: {} by user: {}", orderId, receivedBy);

        PurchaseOrder order = getPurchaseOrderById(orderId);

        if (!order.getStatus().equals("SENT") && !order.getStatus().equals("PARTIALLY_RECEIVED")) {
            throw new RuntimeException("Purchase order is not in a state that can be received");
        }

        // Update stock for each item
        List<InventoryService.StockAdjustment> adjustments = new ArrayList<>();

        for (PurchaseOrder.PurchaseOrderItem item : order.getItems()) {
            Double receivedQty = item.getReceivedQuantity();
            if (receivedQty != null && receivedQty > 0) {
                adjustments.add(new InventoryService.StockAdjustment(
                    item.getInventoryItemId(),
                    order.getStoreId(),
                    receivedQty,
                    item.getUnitPrice(),
                    "Received from PO: " + order.getOrderNumber()
                ));
            }
        }

        // Batch update inventory
        inventoryService.batchUpdateStock(adjustments, receivedBy);

        // Update order status
        order.setReceivedBy(receivedBy);
        order.setReceivingNotes(notes);
        order.setActualDeliveryDate(LocalDate.now());
        order.setReceivedAt(LocalDateTime.now());

        if (order.isFullyReceived()) {
            order.setStatus("RECEIVED");

            // Update supplier metrics
            Supplier supplier = supplierService.getSupplierById(order.getSupplierId());
            supplier.setCompletedOrders(supplier.getCompletedOrders() + 1);
            supplier.setTotalPurchaseValue(
                supplier.getTotalPurchaseValue().add(order.getTotalAmount())
            );

            // Calculate on-time delivery
            if (order.getExpectedDeliveryDate() != null) {
                boolean onTime = !order.getActualDeliveryDate().isAfter(order.getExpectedDeliveryDate());
                // Update running average (simplified)
                if (onTime) {
                    supplier.setOnTimeDeliveryRate(
                        Math.min(100.0, supplier.getOnTimeDeliveryRate() + 1.0)
                    );
                } else {
                    supplier.setOnTimeDeliveryRate(
                        Math.max(0.0, supplier.getOnTimeDeliveryRate() - 2.0)
                    );
                }
            }

            supplierService.updateSupplier(supplier);
        } else if (order.isPartiallyReceived()) {
            order.setStatus("PARTIALLY_RECEIVED");
        }

        return purchaseOrderRepository.save(order);
    }

    /**
     * Cancel purchase order
     */
    @Transactional
    @CacheEvict(value = "purchaseOrders", key = "#storeId")
    public PurchaseOrder cancelPurchaseOrder(String orderId, String reason, String storeId) {
        logger.info("Cancelling purchase order: {}. Reason: {}", orderId, reason);

        PurchaseOrder order = getPurchaseOrderById(orderId);

        if (order.getStatus().equals("RECEIVED")) {
            throw new RuntimeException("Cannot cancel a received purchase order");
        }

        order.setStatus("CANCELLED");
        order.setRejectionReason(reason);

        // Update supplier metrics
        Supplier supplier = supplierService.getSupplierById(order.getSupplierId());
        supplier.setCancelledOrders(supplier.getCancelledOrders() + 1);
        supplierService.updateSupplier(supplier);

        return purchaseOrderRepository.save(order);
    }

    /**
     * Auto-generate purchase orders for low stock items
     * Runs daily via scheduled task
     */
    @Scheduled(cron = "0 0 2 * * *") // Run at 2 AM every day
    @Transactional
    public void autoGeneratePurchaseOrders() {
        logger.info("Running auto-generation of purchase orders for low stock items");

        // This would need store information - placeholder implementation
        // In a real system, you'd iterate through all stores
        List<String> storeIds = List.of("STORE001"); // Placeholder

        for (String storeId : storeIds) {
            List<InventoryItem> lowStockItems = inventoryService.getItemsNeedingReorder(storeId);

            if (lowStockItems.isEmpty()) {
                continue;
            }

            // Group items by primary supplier
            lowStockItems.stream()
                    .filter(item -> item.getAutoReorder() && item.getPrimarySupplierId() != null)
                    .collect(java.util.stream.Collectors.groupingBy(InventoryItem::getPrimarySupplierId))
                    .forEach((supplierId, items) -> {
                        try {
                            createAutoPurchaseOrder(storeId, supplierId, items);
                        } catch (Exception e) {
                            logger.error("Failed to create auto PO for supplier: {}", supplierId, e);
                        }
                    });
        }
    }

    /**
     * Create automatic purchase order
     */
    private PurchaseOrder createAutoPurchaseOrder(String storeId, String supplierId, List<InventoryItem> items) {
        logger.info("Creating automatic purchase order for {} items from supplier: {}", items.size(), supplierId);

        PurchaseOrder order = new PurchaseOrder();
        order.setStoreId(storeId);
        order.setSupplierId(supplierId);
        order.setAutoGenerated(true);
        order.setStatus("PENDING_APPROVAL");
        order.setRequestedBy("SYSTEM");

        List<PurchaseOrder.PurchaseOrderItem> orderItems = new ArrayList<>();

        for (InventoryItem item : items) {
            PurchaseOrder.PurchaseOrderItem orderItem = new PurchaseOrder.PurchaseOrderItem();
            orderItem.setInventoryItemId(item.getId());
            orderItem.setItemName(item.getItemName());
            orderItem.setItemCode(item.getItemCode());
            orderItem.setQuantity(item.getReorderQuantity());
            orderItem.setUnit(item.getUnit());
            orderItem.setUnitPrice(item.getLastPurchaseCost());
            orderItem.calculateTotalPrice();

            orderItems.add(orderItem);
        }

        order.setItems(orderItems);

        return createPurchaseOrder(order);
    }

    /**
     * Generate unique order number
     * Format: PO-YYYYMMDD-XXXX
     */
    private String generateOrderNumber() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String uniqueId = String.valueOf(System.currentTimeMillis()).substring(9);
        return "PO-" + dateStr + "-" + uniqueId;
    }

    /**
     * Get purchase orders by date range
     */
    public List<PurchaseOrder> getPurchaseOrdersByDateRange(String storeId, LocalDate startDate, LocalDate endDate) {
        return purchaseOrderRepository.findByDateRange(storeId, startDate, endDate);
    }

    /**
     * Delete purchase order (only if not sent)
     */
    @CacheEvict(value = "purchaseOrders", key = "#storeId")
    public void deletePurchaseOrder(String orderId, String storeId) {
        logger.info("Deleting purchase order: {}", orderId);

        PurchaseOrder order = getPurchaseOrderById(orderId);

        if (!order.getStatus().equals("DRAFT") && !order.getStatus().equals("CANCELLED")) {
            throw new RuntimeException("Can only delete draft or cancelled purchase orders");
        }

        purchaseOrderRepository.deleteById(orderId);
    }
}
