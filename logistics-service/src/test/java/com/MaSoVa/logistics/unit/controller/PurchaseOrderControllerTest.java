package com.MaSoVa.logistics.unit.controller;

import com.MaSoVa.logistics.inventory.controller.PurchaseOrderController;
import com.MaSoVa.logistics.inventory.entity.PurchaseOrder;
import com.MaSoVa.logistics.inventory.service.PurchaseOrderService;
import com.MaSoVa.shared.test.BaseServiceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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

    private PurchaseOrder buildPO(String id) {
        PurchaseOrder po = new PurchaseOrder();
        po.setId(id);
        po.setStoreId("store-1");
        return po;
    }

    @Test
    @DisplayName("GET /api/purchase-orders returns 200 with list")
    void getPurchaseOrders_returns200() throws Exception {
        when(purchaseOrderService.getAllPurchaseOrders(any()))
            .thenReturn(List.of(buildPO("po-1")));

        mockMvc.perform(get("/api/purchase-orders").header("X-User-Store-Id", "store-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/purchase-orders returns 201 with created PO")
    void createPO_returns201() throws Exception {
        when(purchaseOrderService.createPurchaseOrder(any())).thenReturn(buildPO("po-new"));

        mockMvc.perform(post("/api/purchase-orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"supplierId\":\"sup-1\",\"storeId\":\"store-1\",\"items\":[]}"))
            .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("GET /api/purchase-orders/{id} returns 200")
    void getPOById_returns200() throws Exception {
        when(purchaseOrderService.getPurchaseOrderById("po-1")).thenReturn(buildPO("po-1"));

        mockMvc.perform(get("/api/purchase-orders/po-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/purchase-orders/{id} returns 200 with existing PO")
    void getPOById_returns200() throws Exception {
        when(purchaseOrderService.getPurchaseOrderById("po-1")).thenReturn(buildPO("po-1"));

        mockMvc.perform(get("/api/purchase-orders/po-1"))
            .andExpect(status().isOk());
    }
}
