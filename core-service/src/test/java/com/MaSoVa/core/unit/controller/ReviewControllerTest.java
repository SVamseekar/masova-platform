package com.MaSoVa.core.unit.controller;

import com.MaSoVa.core.review.controller.ReviewController;
import com.MaSoVa.core.review.entity.Review;
import com.MaSoVa.core.review.service.AnalyticsService;
import com.MaSoVa.core.review.service.ModerationService;
import com.MaSoVa.core.review.service.ReviewResponseService;
import com.MaSoVa.core.review.service.ReviewService;
import com.MaSoVa.shared.test.BaseServiceTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.ArrayList;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReviewController Unit Tests")
class ReviewControllerTest extends BaseServiceTest {

    @Mock private ReviewService reviewService;
    @Mock private AnalyticsService analyticsService;
    @Mock private ModerationService moderationService;
    @Mock private ReviewResponseService responseService;

    @InjectMocks private ReviewController reviewController;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(reviewController)
            .setMessageConverters(new MappingJackson2HttpMessageConverter())
            .build();
    }

    private Review buildReview(String id) {
        Review r = new Review();
        r.setId(id);
        r.setCustomerId("cust-1");
        return r;
    }

    @Test
    @DisplayName("GET /api/reviews returns 200 with recent reviews")
    void getReviews_returns200() throws Exception {
        when(reviewService.getRecentReviews(any())).thenReturn(new PageImpl<>(new ArrayList<>(List.of(buildReview("rev-1"))), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/reviews"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/reviews/{reviewId} returns 200 when review exists")
    void getReview_returns200() throws Exception {
        when(reviewService.getReviewById("rev-1")).thenReturn(buildReview("rev-1"));

        mockMvc.perform(get("/api/reviews/rev-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/reviews/{reviewId} returns 404 when not found")
    void getReview_returns404() throws Exception {
        when(reviewService.getReviewById("bad-id")).thenThrow(new IllegalArgumentException("Review not found"));

        mockMvc.perform(get("/api/reviews/bad-id"))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/reviews/public/token/{token} returns 200 for valid token")
    void getTokenDetails_returns200ForValidToken() throws Exception {
        when(reviewService.getTokenDetails("valid-token")).thenReturn(java.util.Map.of("orderId", "order-1"));

        mockMvc.perform(get("/api/reviews/public/token/valid-token"))
            .andExpect(status().isOk());
    }
}
