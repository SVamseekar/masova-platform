package com.MaSoVa.logistics.unit.controller;

import com.MaSoVa.logistics.inventory.controller.PurchaseOrderController;
import com.MaSoVa.logistics.inventory.entity.PurchaseOrder;
import com.MaSoVa.logistics.inventory.service.PurchaseOrderService;
import com.MaSoVa.shared.test.BaseServiceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PurchaseOrderController Unit Tests")
class PurchaseOrderControllerTest extends BaseServiceTest {

    @Mock private PurchaseOrderService purchaseOrderService;
    @InjectMocks private PurchaseOrderController purchaseOrderController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(purchaseOrderController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    private PurchaseOrder buildPO(String id, String status) {
        PurchaseOrder po = new PurchaseOrder();
        po.setId(id);
        po.setStoreId("store-1");
        po.setSupplierId("sup-1");
        po.setStatus(status != null ? status : "DRAFT");
        po.setOrderNumber("PO-20260517-001");
        return po;
    }

    @Nested
    @DisplayName("GET /api/purchase-orders")
    class GetPurchaseOrders {

        @Test
        @DisplayName("returns all purchase orders by default")
        void returnsAll() throws Exception {
            when(purchaseOrderService.getAllPurchaseOrders(any()))
                .thenReturn(List.of(buildPO("po-1", null)));

            mockMvc.perform(get("/api/purchase-orders").header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns by status when status param given")
        void returnsByStatus() throws Exception {
            when(purchaseOrderService.getPurchaseOrdersByStatus(any(), eq("APPROVED")))
                .thenReturn(List.of(buildPO("po-1", "APPROVED")));

            mockMvc.perform(get("/api/purchase-orders")
                    .header("X-User-Store-Id", "store-1")
                    .param("status", "APPROVED"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns pending approval when pending=true")
        void returnsPending() throws Exception {
            when(purchaseOrderService.getPendingApprovalOrders(any()))
                .thenReturn(List.of(buildPO("po-1", "PENDING_APPROVAL")));

            mockMvc.perform(get("/api/purchase-orders")
                    .header("X-User-Store-Id", "store-1")
                    .param("pending", "true"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns overdue orders when overdue=true")
        void returnsOverdue() throws Exception {
            when(purchaseOrderService.getOverdueOrders(any()))
                .thenReturn(List.of(buildPO("po-1", "SENT")));

            mockMvc.perform(get("/api/purchase-orders")
                    .header("X-User-Store-Id", "store-1")
                    .param("overdue", "true"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns PO by number when number param given")
        void returnsByNumber() throws Exception {
            when(purchaseOrderService.getPurchaseOrderByNumber("PO-20260517-001"))
                .thenReturn(buildPO("po-1", null));

            mockMvc.perform(get("/api/purchase-orders")
                    .header("X-User-Store-Id", "store-1")
                    .param("number", "PO-20260517-001"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns by date range when startDate and endDate given")
        void returnsByDateRange() throws Exception {
            when(purchaseOrderService.getPurchaseOrdersByDateRange(any(), any(), any()))
                .thenReturn(List.of(buildPO("po-1", null)));

            mockMvc.perform(get("/api/purchase-orders")
                    .header("X-User-Store-Id", "store-1")
                    .param("startDate", "2026-05-01")
                    .param("endDate", "2026-05-17"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("POST /api/purchase-orders")
    class CreatePO {

        @Test
        @DisplayName("returns 201 with created PO")
        void returns201() throws Exception {
            when(purchaseOrderService.createPurchaseOrder(any())).thenReturn(buildPO("po-new", "DRAFT"));

            mockMvc.perform(post("/api/purchase-orders")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"supplierId\":\"sup-1\",\"storeId\":\"store-1\",\"items\":[]}"))
                .andExpect(status().isCreated());
        }
    }

    @Nested
    @DisplayName("GET /api/purchase-orders/{id}")
    class GetPOById {

        @Test
        @DisplayName("returns 200 with PO")
        void returns200() throws Exception {
            when(purchaseOrderService.getPurchaseOrderById("po-1")).thenReturn(buildPO("po-1", null));

            mockMvc.perform(get("/api/purchase-orders/po-1"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("PATCH /api/purchase-orders/{id}")
    class UpdatePO {

        @Test
        @DisplayName("APPROVE action approves PO")
        void approveAction() throws Exception {
            when(purchaseOrderService.approvePurchaseOrder(eq("po-1"), eq("manager-1"), anyString()))
                .thenReturn(buildPO("po-1", "APPROVED"));

            mockMvc.perform(patch("/api/purchase-orders/po-1")
                    .header("X-User-Store-Id", "store-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"action\":\"APPROVE\",\"approverId\":\"manager-1\"}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("REJECT action rejects PO")
        void rejectAction() throws Exception {
            when(purchaseOrderService.rejectPurchaseOrder(eq("po-1"), eq("Out of budget"), anyString()))
                .thenReturn(buildPO("po-1", "CANCELLED"));

            mockMvc.perform(patch("/api/purchase-orders/po-1")
                    .header("X-User-Store-Id", "store-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"action\":\"REJECT\",\"reason\":\"Out of budget\"}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("SEND action marks PO as sent")
        void sendAction() throws Exception {
            when(purchaseOrderService.markAsSent(eq("po-1"), anyString()))
                .thenReturn(buildPO("po-1", "SENT"));

            mockMvc.perform(patch("/api/purchase-orders/po-1")
                    .header("X-User-Store-Id", "store-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"action\":\"SEND\"}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("RECEIVE action receives PO")
        void receiveAction() throws Exception {
            when(purchaseOrderService.receivePurchaseOrder(eq("po-1"), eq("user-1"), eq("All good")))
                .thenReturn(buildPO("po-1", "RECEIVED"));

            mockMvc.perform(patch("/api/purchase-orders/po-1")
                    .header("X-User-Store-Id", "store-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"action\":\"RECEIVE\",\"receivedBy\":\"user-1\",\"notes\":\"All good\"}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("CANCEL action cancels PO")
        void cancelAction() throws Exception {
            when(purchaseOrderService.cancelPurchaseOrder(eq("po-1"), eq("No longer needed"), anyString()))
                .thenReturn(buildPO("po-1", "CANCELLED"));

            mockMvc.perform(patch("/api/purchase-orders/po-1")
                    .header("X-User-Store-Id", "store-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"action\":\"CANCEL\",\"reason\":\"No longer needed\"}"))
                .andExpect(status().isOk());
        }

        @Test
        @DisplayName("returns 400 for unknown action")
        void returns400ForUnknownAction() throws Exception {
            mockMvc.perform(patch("/api/purchase-orders/po-1")
                    .header("X-User-Store-Id", "store-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"action\":\"MAGIC\"}"))
                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("plain field update (no action key)")
        void plainFieldUpdate() throws Exception {
            PurchaseOrder existing = buildPO("po-1", "DRAFT");
            when(purchaseOrderService.getPurchaseOrderById("po-1")).thenReturn(existing);
            when(purchaseOrderService.updatePurchaseOrder(any())).thenReturn(buildPO("po-1", "DRAFT"));

            mockMvc.perform(patch("/api/purchase-orders/po-1")
                    .header("X-User-Store-Id", "store-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"notes\":\"Updated notes\",\"paymentStatus\":\"PENDING\"}"))
                .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("DELETE /api/purchase-orders/{id}")
    class DeletePO {

        @Test
        @DisplayName("returns 200 with success message")
        void returns200() throws Exception {
            doNothing().when(purchaseOrderService).deletePurchaseOrder(anyString(), anyString());

            mockMvc.perform(delete("/api/purchase-orders/po-1")
                    .header("X-User-Store-Id", "store-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Purchase order deleted successfully"));
        }
    }

    @Nested
    @DisplayName("POST /api/purchase-orders/auto-generate")
    class AutoGenerate {

        @Test
        @DisplayName("returns 200 when auto-generation triggered")
        void returns200() throws Exception {
            doNothing().when(purchaseOrderService).autoGeneratePurchaseOrders();

            mockMvc.perform(post("/api/purchase-orders/auto-generate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Auto-generation completed"));
        }
    }
}
