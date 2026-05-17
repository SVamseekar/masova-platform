package com.MaSoVa.logistics.unit.service;

import com.MaSoVa.logistics.inventory.entity.InventoryItem;
import com.MaSoVa.logistics.inventory.entity.PurchaseOrder;
import com.MaSoVa.logistics.inventory.entity.Supplier;
import com.MaSoVa.logistics.inventory.repository.PurchaseOrderRepository;
import com.MaSoVa.logistics.inventory.service.InventoryService;
import com.MaSoVa.logistics.inventory.service.PurchaseOrderService;
import com.MaSoVa.logistics.inventory.service.SupplierService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PurchaseOrderService Unit Tests")
class PurchaseOrderServiceTest {

    @Mock private PurchaseOrderRepository purchaseOrderRepository;
    @Mock private InventoryService inventoryService;
    @Mock private SupplierService supplierService;

    @InjectMocks private PurchaseOrderService purchaseOrderService;

    private Supplier buildSupplier(String id) {
        Supplier s = new Supplier();
        s.setId(id);
        s.setSupplierName("Fresh Farms");
        s.setSupplierCode("FRE-001");
        s.setAverageLeadTimeDays(3);
        s.setTotalOrders(5);
        s.setCompletedOrders(4);
        s.setCancelledOrders(1);
        s.setOnTimeDeliveryRate(90.0);
        s.setTotalPurchaseValue(BigDecimal.ZERO);
        return s;
    }

    private PurchaseOrder buildPO(String id, String status) {
        PurchaseOrder po = new PurchaseOrder();
        po.setId(id);
        po.setStoreId("store-1");
        po.setSupplierId("sup-1");
        po.setStatus(status);
        po.setOrderNumber("PO-20260517-001");
        po.setItems(List.of());
        po.setTotalAmount(BigDecimal.ZERO);
        return po;
    }

    @Nested
    @DisplayName("createPurchaseOrder")
    class CreatePurchaseOrder {

        @Test
        @DisplayName("creates PO and generates order number")
        void createsPO() {
            PurchaseOrder po = buildPO(null, "DRAFT");
            po.setOrderNumber(null);

            when(supplierService.getSupplierById("sup-1")).thenReturn(buildSupplier("sup-1"));
            when(supplierService.updateSupplier(any())).thenReturn(buildSupplier("sup-1"));
            when(purchaseOrderRepository.save(any())).thenAnswer(inv -> {
                PurchaseOrder saved = inv.getArgument(0);
                saved.setId("po-new");
                return saved;
            });

            PurchaseOrder result = purchaseOrderService.createPurchaseOrder(po);

            assertThat(result.getId()).isEqualTo("po-new");
            assertThat(result.getOrderNumber()).isNotNull();
            assertThat(result.getSupplierName()).isEqualTo("Fresh Farms");
        }

        @Test
        @DisplayName("sets expected delivery date from supplier lead time when not provided")
        void setsExpectedDeliveryDateFromLeadTime() {
            PurchaseOrder po = buildPO(null, "DRAFT");
            po.setExpectedDeliveryDate(null);

            when(supplierService.getSupplierById("sup-1")).thenReturn(buildSupplier("sup-1"));
            when(supplierService.updateSupplier(any())).thenReturn(buildSupplier("sup-1"));
            when(purchaseOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            PurchaseOrder result = purchaseOrderService.createPurchaseOrder(po);

            assertThat(result.getExpectedDeliveryDate()).isEqualTo(LocalDate.now().plusDays(3));
        }

        @Test
        @DisplayName("does not override expected delivery date if already set")
        void keepsExistingExpectedDate() {
            PurchaseOrder po = buildPO(null, "DRAFT");
            LocalDate customDate = LocalDate.now().plusDays(7);
            po.setExpectedDeliveryDate(customDate);

            when(supplierService.getSupplierById("sup-1")).thenReturn(buildSupplier("sup-1"));
            when(supplierService.updateSupplier(any())).thenReturn(buildSupplier("sup-1"));
            when(purchaseOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            PurchaseOrder result = purchaseOrderService.createPurchaseOrder(po);

            assertThat(result.getExpectedDeliveryDate()).isEqualTo(customDate);
        }
    }

    @Nested
    @DisplayName("getPurchaseOrderById")
    class GetPurchaseOrderById {

        @Test
        @DisplayName("returns PO when found")
        void returnsWhenFound() {
            when(purchaseOrderRepository.findById("po-1"))
                .thenReturn(Optional.of(buildPO("po-1", "DRAFT")));

            PurchaseOrder result = purchaseOrderService.getPurchaseOrderById("po-1");

            assertThat(result.getId()).isEqualTo("po-1");
        }

        @Test
        @DisplayName("throws when not found")
        void throwsWhenNotFound() {
            when(purchaseOrderRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> purchaseOrderService.getPurchaseOrderById("missing"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
        }
    }

    @Nested
    @DisplayName("getPurchaseOrderByNumber")
    class GetPurchaseOrderByNumber {

        @Test
        @DisplayName("returns PO when found by order number")
        void returnsWhenFound() {
            when(purchaseOrderRepository.findByOrderNumber("PO-20260517-001"))
                .thenReturn(Optional.of(buildPO("po-1", "DRAFT")));

            PurchaseOrder result = purchaseOrderService.getPurchaseOrderByNumber("PO-20260517-001");

            assertThat(result.getOrderNumber()).isEqualTo("PO-20260517-001");
        }

        @Test
        @DisplayName("throws when not found")
        void throwsWhenNotFound() {
            when(purchaseOrderRepository.findByOrderNumber("MISSING")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> purchaseOrderService.getPurchaseOrderByNumber("MISSING"))
                .isInstanceOf(RuntimeException.class);
        }
    }

    @Nested
    @DisplayName("updatePurchaseOrder")
    class UpdatePurchaseOrder {

        @Test
        @DisplayName("updates PO when not received")
        void updatesPO() {
            PurchaseOrder existing = buildPO("po-1", "APPROVED");
            PurchaseOrder updated = buildPO("po-1", "APPROVED");
            updated.setNotes("Updated notes");

            when(purchaseOrderRepository.findById("po-1")).thenReturn(Optional.of(existing));
            when(purchaseOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            PurchaseOrder result = purchaseOrderService.updatePurchaseOrder(updated);

            assertThat(result.getNotes()).isEqualTo("Updated notes");
        }

        @Test
        @DisplayName("throws when PO is already RECEIVED")
        void throwsWhenReceived() {
            when(purchaseOrderRepository.findById("po-1"))
                .thenReturn(Optional.of(buildPO("po-1", "RECEIVED")));

            assertThatThrownBy(() -> purchaseOrderService.updatePurchaseOrder(buildPO("po-1", "RECEIVED")))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cannot update a received");
        }

        @Test
        @DisplayName("preserves order number from existing when update has blank number")
        void preservesOrderNumber() {
            PurchaseOrder existing = buildPO("po-1", "APPROVED");
            PurchaseOrder updated = buildPO("po-1", "APPROVED");
            updated.setOrderNumber("");

            when(purchaseOrderRepository.findById("po-1")).thenReturn(Optional.of(existing));
            when(purchaseOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            PurchaseOrder result = purchaseOrderService.updatePurchaseOrder(updated);

            assertThat(result.getOrderNumber()).isEqualTo("PO-20260517-001");
        }
    }

    @Nested
    @DisplayName("approvePurchaseOrder")
    class ApprovePurchaseOrder {

        @Test
        @DisplayName("approves PO in PENDING_APPROVAL status")
        void approvesPendingApproval() {
            when(purchaseOrderRepository.findById("po-1"))
                .thenReturn(Optional.of(buildPO("po-1", "PENDING_APPROVAL")));
            when(purchaseOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            PurchaseOrder result = purchaseOrderService.approvePurchaseOrder("po-1", "manager-1", "store-1");

            assertThat(result.getStatus()).isEqualTo("APPROVED");
            assertThat(result.getApprovedBy()).isEqualTo("manager-1");
            assertThat(result.getApprovedAt()).isNotNull();
        }

        @Test
        @DisplayName("approves PO in DRAFT status")
        void approvesDraft() {
            when(purchaseOrderRepository.findById("po-1"))
                .thenReturn(Optional.of(buildPO("po-1", "DRAFT")));
            when(purchaseOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            PurchaseOrder result = purchaseOrderService.approvePurchaseOrder("po-1", "manager-1", "store-1");

            assertThat(result.getStatus()).isEqualTo("APPROVED");
        }

        @Test
        @DisplayName("throws when PO is not in approvable state")
        void throwsWhenNotApprovable() {
            when(purchaseOrderRepository.findById("po-1"))
                .thenReturn(Optional.of(buildPO("po-1", "RECEIVED")));

            assertThatThrownBy(() -> purchaseOrderService.approvePurchaseOrder("po-1", "manager-1", "store-1"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not in a state that can be approved");
        }
    }

    @Nested
    @DisplayName("rejectPurchaseOrder")
    class RejectPurchaseOrder {

        @Test
        @DisplayName("rejects PO and updates supplier cancelled orders")
        void rejectsPO() {
            PurchaseOrder po = buildPO("po-1", "PENDING_APPROVAL");
            when(purchaseOrderRepository.findById("po-1")).thenReturn(Optional.of(po));
            when(supplierService.getSupplierById("sup-1")).thenReturn(buildSupplier("sup-1"));
            when(supplierService.updateSupplier(any())).thenReturn(buildSupplier("sup-1"));
            when(purchaseOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            PurchaseOrder result = purchaseOrderService.rejectPurchaseOrder("po-1", "Over budget", "store-1");

            assertThat(result.getStatus()).isEqualTo("CANCELLED");
            assertThat(result.getRejectionReason()).isEqualTo("Over budget");
        }
    }

    @Nested
    @DisplayName("markAsSent")
    class MarkAsSent {

        @Test
        @DisplayName("marks APPROVED PO as SENT")
        void marksAsSent() {
            when(purchaseOrderRepository.findById("po-1"))
                .thenReturn(Optional.of(buildPO("po-1", "APPROVED")));
            when(purchaseOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            PurchaseOrder result = purchaseOrderService.markAsSent("po-1", "store-1");

            assertThat(result.getStatus()).isEqualTo("SENT");
        }

        @Test
        @DisplayName("throws when PO is not APPROVED")
        void throwsWhenNotApproved() {
            when(purchaseOrderRepository.findById("po-1"))
                .thenReturn(Optional.of(buildPO("po-1", "DRAFT")));

            assertThatThrownBy(() -> purchaseOrderService.markAsSent("po-1", "store-1"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Only approved orders");
        }
    }

    @Nested
    @DisplayName("cancelPurchaseOrder")
    class CancelPurchaseOrder {

        @Test
        @DisplayName("cancels PO in DRAFT status")
        void cancelsDraft() {
            PurchaseOrder po = buildPO("po-1", "DRAFT");
            when(purchaseOrderRepository.findById("po-1")).thenReturn(Optional.of(po));
            when(supplierService.getSupplierById("sup-1")).thenReturn(buildSupplier("sup-1"));
            when(supplierService.updateSupplier(any())).thenReturn(buildSupplier("sup-1"));
            when(purchaseOrderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            PurchaseOrder result = purchaseOrderService.cancelPurchaseOrder("po-1", "No longer needed", "store-1");

            assertThat(result.getStatus()).isEqualTo("CANCELLED");
        }

        @Test
        @DisplayName("throws when PO is already RECEIVED")
        void throwsWhenReceived() {
            when(purchaseOrderRepository.findById("po-1"))
                .thenReturn(Optional.of(buildPO("po-1", "RECEIVED")));

            assertThatThrownBy(() -> purchaseOrderService.cancelPurchaseOrder("po-1", "reason", "store-1"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cannot cancel a received");
        }
    }

    @Nested
    @DisplayName("deletePurchaseOrder")
    class DeletePurchaseOrder {

        @Test
        @DisplayName("deletes PO in DRAFT status")
        void deletesDraft() {
            when(purchaseOrderRepository.findById("po-1"))
                .thenReturn(Optional.of(buildPO("po-1", "DRAFT")));
            doNothing().when(purchaseOrderRepository).deleteById("po-1");

            purchaseOrderService.deletePurchaseOrder("po-1", "store-1");

            verify(purchaseOrderRepository).deleteById("po-1");
        }

        @Test
        @DisplayName("deletes PO in CANCELLED status")
        void deletesCancelled() {
            when(purchaseOrderRepository.findById("po-1"))
                .thenReturn(Optional.of(buildPO("po-1", "CANCELLED")));
            doNothing().when(purchaseOrderRepository).deleteById("po-1");

            purchaseOrderService.deletePurchaseOrder("po-1", "store-1");

            verify(purchaseOrderRepository).deleteById("po-1");
        }

        @Test
        @DisplayName("throws when PO is not in draft or cancelled state")
        void throwsWhenNotDeletable() {
            when(purchaseOrderRepository.findById("po-1"))
                .thenReturn(Optional.of(buildPO("po-1", "APPROVED")));

            assertThatThrownBy(() -> purchaseOrderService.deletePurchaseOrder("po-1", "store-1"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("draft or cancelled");
        }
    }

    @Nested
    @DisplayName("getPendingApprovalOrders")
    class GetPendingApprovalOrders {

        @Test
        @DisplayName("returns DRAFT and PENDING_APPROVAL orders")
        void returnsPendingApproval() {
            when(purchaseOrderRepository.findByStoreIdAndStatusIn(
                    anyString(), any()))
                .thenReturn(List.of(buildPO("po-1", "PENDING_APPROVAL")));

            List<PurchaseOrder> result = purchaseOrderService.getPendingApprovalOrders("store-1");

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getOverdueOrders")
    class GetOverdueOrders {

        @Test
        @DisplayName("returns overdue orders for store")
        void returnsOverdueOrders() {
            when(purchaseOrderRepository.findOverdueOrders(anyString(), any()))
                .thenReturn(List.of(buildPO("po-1", "SENT")));

            List<PurchaseOrder> result = purchaseOrderService.getOverdueOrders("store-1");

            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("autoGeneratePurchaseOrders")
    class AutoGeneratePurchaseOrders {

        @Test
        @DisplayName("skips when no stores in inventory")
        void skipsWhenNoStores() {
            when(inventoryService.getAllStoreIds()).thenReturn(List.of());

            purchaseOrderService.autoGeneratePurchaseOrders();

            // verify no PO creation attempted
            verify(purchaseOrderRepository, org.mockito.Mockito.never()).save(any());
        }

        @Test
        @DisplayName("skips store when no low stock items")
        void skipsWhenNoLowStock() {
            when(inventoryService.getAllStoreIds()).thenReturn(List.of("store-1"));
            when(inventoryService.getItemsNeedingReorder("store-1")).thenReturn(List.of());

            purchaseOrderService.autoGeneratePurchaseOrders();

            verify(purchaseOrderRepository, org.mockito.Mockito.never()).save(any());
        }

        @Test
        @DisplayName("creates PO for items with autoReorder=true and primary supplier set")
        void createsPOForLowStockWithAutoReorder() {
            InventoryItem item = new InventoryItem();
            item.setId("item-1");
            item.setStoreId("store-1");
            item.setItemName("Flour");
            item.setAutoReorder(true);
            item.setPrimarySupplierId("sup-1");
            item.setReorderQuantity(50.0);
            item.setUnit("KG");
            item.setLastPurchaseCost(java.math.BigDecimal.valueOf(25.0));

            when(inventoryService.getAllStoreIds()).thenReturn(List.of("store-1"));
            when(inventoryService.getItemsNeedingReorder("store-1")).thenReturn(List.of(item));
            when(supplierService.getSupplierById("sup-1")).thenReturn(buildSupplier("sup-1"));
            when(supplierService.updateSupplier(any())).thenReturn(buildSupplier("sup-1"));
            when(purchaseOrderRepository.save(any())).thenAnswer(inv -> {
                PurchaseOrder po = inv.getArgument(0);
                po.setId("po-auto-1");
                return po;
            });

            purchaseOrderService.autoGeneratePurchaseOrders();

            verify(purchaseOrderRepository, org.mockito.Mockito.atLeastOnce()).save(any());
        }
    }
}
