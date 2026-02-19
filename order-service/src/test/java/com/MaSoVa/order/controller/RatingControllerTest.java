package com.MaSoVa.order.controller;

import com.MaSoVa.order.config.TestSecurityConfig;
import com.MaSoVa.order.entity.RatingToken;
import com.MaSoVa.order.service.RatingTokenService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RatingController.class)
@Import(TestSecurityConfig.class)
@WithMockUser
@DisplayName("RatingController Unit Tests")
class RatingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RatingTokenService ratingTokenService;

    // ======================================================================
    // GET /api/orders/rating/token/{token}
    // ======================================================================

    @Nested
    @DisplayName("GET /api/orders/rating/token/{token}")
    class ValidateToken {

        @Test
        @DisplayName("Given valid token, should return token details with valid=true")
        void shouldReturnValidTokenDetails() throws Exception {
            RatingToken token = new RatingToken();
            token.setToken("valid-uuid");
            token.setOrderId("order-1");
            token.setCustomerId("cust-1");
            token.setDriverId("driver-1");
            token.setDriverName("John Doe");
            token.setUsed(false);
            token.setExpiresAt(LocalDateTime.now().plusDays(10));

            when(ratingTokenService.validateToken("valid-uuid")).thenReturn(token);

            mockMvc.perform(get("/api/orders/rating/token/valid-uuid"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.valid", is(true)))
                    .andExpect(jsonPath("$.orderId", is("order-1")))
                    .andExpect(jsonPath("$.customerId", is("cust-1")))
                    .andExpect(jsonPath("$.driverId", is("driver-1")));
        }

        @Test
        @DisplayName("Given invalid token, should return 400 with valid=false")
        void shouldReturn400ForInvalidToken() throws Exception {
            when(ratingTokenService.validateToken("bad-token"))
                    .thenThrow(new IllegalArgumentException("Invalid rating token"));

            mockMvc.perform(get("/api/orders/rating/token/bad-token"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.valid", is(false)))
                    .andExpect(jsonPath("$.error", is("Invalid rating token")));
        }

        @Test
        @DisplayName("Given expired token, should return 400 with error message")
        void shouldReturn400ForExpiredToken() throws Exception {
            when(ratingTokenService.validateToken("expired-token"))
                    .thenThrow(new IllegalStateException("Rating token is expired or already used"));

            mockMvc.perform(get("/api/orders/rating/token/expired-token"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.valid", is(false)))
                    .andExpect(jsonPath("$.error", is("Rating token is expired or already used")));
        }

        @Test
        @DisplayName("Given unexpected server error, should return 500")
        void shouldReturn500ForServerError() throws Exception {
            when(ratingTokenService.validateToken("error-token"))
                    .thenThrow(new RuntimeException("Database error"));

            mockMvc.perform(get("/api/orders/rating/token/error-token"))
                    .andExpect(status().isInternalServerError())
                    .andExpect(jsonPath("$.valid", is(false)))
                    .andExpect(jsonPath("$.error", is("Failed to validate token")));
        }
    }

    // ======================================================================
    // POST /api/orders/rating/token/{token}/mark-used
    // ======================================================================

    @Nested
    @DisplayName("POST /api/orders/rating/token/{token}/mark-used")
    class MarkTokenAsUsed {

        @Test
        @DisplayName("Given valid token, should mark as used and return success")
        void shouldMarkTokenAsUsed() throws Exception {
            doNothing().when(ratingTokenService).markTokenAsUsed("valid-uuid");

            mockMvc.perform(post("/api/orders/rating/token/valid-uuid/mark-used")
                            .with(csrf()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)));

            verify(ratingTokenService).markTokenAsUsed("valid-uuid");
        }

        @Test
        @DisplayName("Given service error, should return 500 with failure")
        void shouldReturn500OnError() throws Exception {
            doThrow(new RuntimeException("Database error")).when(ratingTokenService).markTokenAsUsed("bad-uuid");

            mockMvc.perform(post("/api/orders/rating/token/bad-uuid/mark-used")
                            .with(csrf()))
                    .andExpect(status().isInternalServerError())
                    .andExpect(jsonPath("$.success", is(false)));
        }
    }
}
