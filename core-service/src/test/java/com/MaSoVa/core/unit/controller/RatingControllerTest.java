package com.MaSoVa.core.unit.controller;

import com.MaSoVa.core.notification.controller.RatingController;
import com.MaSoVa.core.notification.service.RatingRequestService;
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

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RatingController Unit Tests")
class RatingControllerTest extends BaseServiceTest {

    @Mock private RatingRequestService ratingRequestService;
    @InjectMocks private RatingController ratingController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(ratingController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    @Test
    @DisplayName("POST /api/notifications/rating/send returns 200 on success")
    void sendRatingRequest_returns200() throws Exception {
        doNothing().when(ratingRequestService).sendRatingRequest(anyString(), anyString(), anyString(), anyString(), anyString());

        mockMvc.perform(post("/api/notifications/rating/send")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"orderId\":\"order-1\",\"orderNumber\":\"ORD-001\",\"customerPhone\":\"9876543210\",\"customerEmail\":\"cust@test.com\",\"ratingToken\":\"tok-123\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value("true"));
    }

    @Test
    @DisplayName("POST /api/notifications/rating/send returns 400 when orderId is missing")
    void sendRatingRequest_returns400WhenOrderIdMissing() throws Exception {
        mockMvc.perform(post("/api/notifications/rating/send")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"orderNumber\":\"ORD-001\",\"ratingToken\":\"tok-123\"}"))
            .andExpect(status().isBadRequest());
    }
}
