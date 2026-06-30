package com.MaSoVa.commerce.unit.controller;

import com.MaSoVa.commerce.order.controller.RatingTokenController;
import com.MaSoVa.commerce.order.service.RatingTokenService;
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

import java.util.Map;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("RatingTokenController Unit Tests")
class RatingTokenControllerTest extends BaseServiceTest {

    @Mock private RatingTokenService ratingTokenService;
    @InjectMocks private RatingTokenController ratingTokenController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(ratingTokenController)
                .setMessageConverters(new MappingJackson2HttpMessageConverter())
                .build();
    }

    @Test
    @DisplayName("GET /api/orders/rating-token/{token} returns token details")
    void getTokenDetails_returns200() throws Exception {
        when(ratingTokenService.getTokenDetails("valid-token")).thenReturn(Map.of(
                "valid", true,
                "orderId", "order-1",
                "customerName", "Alice",
                "message", "Please rate your recent order"));

        mockMvc.perform(get("/api/orders/rating-token/valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true))
                .andExpect(jsonPath("$.orderId").value("order-1"))
                .andExpect(jsonPath("$.customerName").value("Alice"));
    }

    @Test
    @DisplayName("GET /api/orders/rating-token/{token} returns 400 for invalid token")
    void getTokenDetails_returns400ForInvalidToken() throws Exception {
        when(ratingTokenService.getTokenDetails("bad-token"))
                .thenThrow(new IllegalArgumentException("Invalid rating token"));

        mockMvc.perform(get("/api/orders/rating-token/bad-token"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.valid").value(false));
    }

    @Test
    @DisplayName("POST /api/orders/rating-token/{token}/mark-used requires internal header")
    void markTokenAsUsed_requiresInternalHeader() throws Exception {
        mockMvc.perform(post("/api/orders/rating-token/valid-token/mark-used")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/orders/rating-token/{token}/mark-used succeeds for internal caller")
    void markTokenAsUsed_returns200() throws Exception {
        doNothing().when(ratingTokenService).markTokenAsUsed("valid-token");

        mockMvc.perform(post("/api/orders/rating-token/valid-token/mark-used")
                        .header("X-Internal-Service", "core-service"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(ratingTokenService).markTokenAsUsed("valid-token");
    }
}