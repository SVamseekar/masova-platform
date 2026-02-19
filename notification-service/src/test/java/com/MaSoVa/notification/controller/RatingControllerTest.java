package com.MaSoVa.notification.controller;

import com.MaSoVa.notification.service.RatingRequestService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RatingController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("RatingController")
class RatingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RatingRequestService ratingRequestService;

    @Nested
    @DisplayName("POST /api/notifications/rating/send")
    class SendRatingRequest {

        @Test
        @DisplayName("Given a valid rating request, when sending, then returns 200 with success message")
        void shouldReturnSuccessResponse() throws Exception {
            // Given
            Map<String, String> request = Map.of(
                    "orderId", "order-001",
                    "orderNumber", "ORD-001",
                    "customerPhone", "+1234567890",
                    "customerEmail", "customer@example.com",
                    "ratingToken", "token-abc-123"
            );

            // When / Then
            mockMvc.perform(post("/api/notifications/rating/send")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is("true")))
                    .andExpect(jsonPath("$.message", is("Rating request sent successfully")));

            verify(ratingRequestService).sendRatingRequest(
                    "order-001", "ORD-001", "+1234567890", "customer@example.com", "token-abc-123");
        }

        @Test
        @DisplayName("Given rating request with only phone, when sending, then sends with null email")
        void shouldAcceptRequestWithOnlyPhone() throws Exception {
            // Given
            Map<String, String> request = Map.of(
                    "orderId", "order-001",
                    "orderNumber", "ORD-001",
                    "customerPhone", "+1234567890",
                    "ratingToken", "token-abc-123"
            );

            // When / Then
            mockMvc.perform(post("/api/notifications/rating/send")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is("true")));

            verify(ratingRequestService).sendRatingRequest(
                    eq("order-001"), eq("ORD-001"), eq("+1234567890"), isNull(), eq("token-abc-123"));
        }

        @Test
        @DisplayName("Given rating service throws exception, when sending, then returns 500 with error")
        void shouldReturn500WhenServiceFails() throws Exception {
            // Given
            doThrow(new RuntimeException("Service error"))
                    .when(ratingRequestService).sendRatingRequest(
                            anyString(), anyString(), anyString(), anyString(), anyString());

            Map<String, String> request = Map.of(
                    "orderId", "order-001",
                    "orderNumber", "ORD-001",
                    "customerPhone", "+1234567890",
                    "customerEmail", "customer@example.com",
                    "ratingToken", "token-abc-123"
            );

            // When / Then
            mockMvc.perform(post("/api/notifications/rating/send")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isInternalServerError())
                    .andExpect(jsonPath("$.success", is("false")))
                    .andExpect(jsonPath("$.error", is("Failed to send rating request")));
        }
    }
}
