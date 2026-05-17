package com.MaSoVa.commerce.unit.controller;

import com.MaSoVa.commerce.tip.controller.TipController;
import com.MaSoVa.commerce.tip.dto.TipResponse;
import com.MaSoVa.commerce.tip.entity.OrderTipEntity;
import com.MaSoVa.commerce.tip.service.TipService;
import com.MaSoVa.shared.test.BaseServiceTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TipControllerTest extends BaseServiceTest {

    @Mock private TipService tipService;
    @InjectMocks private TipController tipController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(tipController)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(new ObjectMapper()))
                .build();
    }

    private TipResponse buildTipResponse() {
        OrderTipEntity entity = new OrderTipEntity();
        entity.setId(UUID.randomUUID());
        entity.setOrderId("order-1");
        entity.setOrderNumber("ORD-001");
        entity.setStoreId("store-1");
        entity.setAmountInr(BigDecimal.valueOf(50));
        entity.setTipType("POOL");
        entity.setDistributed(false);
        return new TipResponse(entity);
    }

    @Test
    void addTip_returns_200() throws Exception {
        when(tipService.addTipToOrder(eq("order-1"), any())).thenReturn(buildTipResponse());

        mockMvc.perform(post("/api/orders/order-1/tip")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amountInr\":50}"))
                .andExpect(status().isOk());
    }

    @Test
    void addTip_bad_order_returns_400() throws Exception {
        when(tipService.addTipToOrder(eq("bad-order"), any()))
                .thenThrow(new RuntimeException("Order not found"));

        mockMvc.perform(post("/api/orders/bad-order/tip")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amountInr\":50}"))
                .andExpect(status().isBadRequest());
    }
}
