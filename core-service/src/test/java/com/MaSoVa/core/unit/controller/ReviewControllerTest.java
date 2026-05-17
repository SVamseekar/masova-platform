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

    @Test
    @DisplayName("POST /api/reviews creates review and returns 201")
    void createReview_returns201() throws Exception {
        when(reviewService.createReview(any(), anyString(), anyString())).thenReturn(buildReview("rev-1"));

        mockMvc.perform(post("/api/reviews")
                .header("X-User-ID", "cust-1")
                .header("X-User-Name", "Test Customer")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"orderId\":\"ord-1\",\"overallRating\":4,\"comment\":\"Great!\"}"))
            .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("GET /api/reviews/stats returns 200 with overall stats")
    void getStats_returns200() throws Exception {
        when(analyticsService.getOverallStats()).thenReturn(new com.MaSoVa.core.review.dto.response.ReviewStatsResponse());

        mockMvc.perform(get("/api/reviews/stats"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/reviews/{reviewId} deletes review and returns 200")
    void deleteReview_returns200() throws Exception {
        org.mockito.Mockito.doNothing().when(reviewService).deleteReview(anyString());

        mockMvc.perform(delete("/api/reviews/rev-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/reviews/response-templates returns 200 with templates")
    void getResponseTemplates_returns200() throws Exception {
        when(responseService.getAllTemplates()).thenReturn(java.util.Map.of());

        mockMvc.perform(get("/api/reviews/response-templates"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/reviews with CUSTOMER entityType filter returns 200")
    void getReviews_withCustomerFilter_returns200() throws Exception {
        when(reviewService.getReviewsByCustomerId(anyString(), any()))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 20), 0));

        mockMvc.perform(get("/api/reviews")
                .param("entityType", "CUSTOMER")
                .param("entityId", "cust-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/reviews with ORDER entityType filter returns 200")
    void getReviews_withOrderFilter_returns200() throws Exception {
        when(reviewService.getReviewsByOrderId("ord-1")).thenReturn(List.of());

        mockMvc.perform(get("/api/reviews")
                .param("entityType", "ORDER")
                .param("entityId", "ord-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/reviews/public/submit with valid token returns 201")
    void submitPublicRating_returns201() throws Exception {
        Review review = buildReview("rev-pub");
        review.setId("rev-pub");
        when(reviewService.createPublicReview(any(), anyString())).thenReturn(review);

        mockMvc.perform(post("/api/reviews/public/submit")
                .param("token", "valid-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"orderId\":\"ord-1\",\"overallRating\":5,\"comment\":\"Awesome!\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("POST /api/reviews/public/submit with invalid token returns 400")
    void submitPublicRating_invalidToken_returns400() throws Exception {
        when(reviewService.createPublicReview(any(), anyString()))
                .thenThrow(new IllegalArgumentException("Token expired"));

        mockMvc.perform(post("/api/reviews/public/submit")
                .param("token", "bad-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"orderId\":\"ord-1\",\"overallRating\":5,\"comment\":\"Awesome!\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PATCH /api/reviews/{reviewId} with status=APPROVED returns 200")
    void updateReview_approve_returns200() throws Exception {
        when(moderationService.approveReview(anyString(), anyString())).thenReturn(buildReview("rev-1"));

        mockMvc.perform(patch("/api/reviews/rev-1")
                .header("X-User-ID", "mgr-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"APPROVED\"}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PATCH /api/reviews/{reviewId} with status=REJECTED returns 200")
    void updateReview_reject_returns200() throws Exception {
        when(moderationService.rejectReview(anyString(), anyString(), any())).thenReturn(buildReview("rev-1"));

        mockMvc.perform(patch("/api/reviews/rev-1")
                .header("X-User-ID", "mgr-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"REJECTED\",\"reason\":\"Spam\"}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PATCH /api/reviews/{reviewId} with status=FLAGGED returns 200")
    void updateReview_flag_returns200() throws Exception {
        when(reviewService.flagReview(anyString(), any(), anyString())).thenReturn(buildReview("rev-1"));

        mockMvc.perform(patch("/api/reviews/rev-1")
                .header("X-User-ID", "mgr-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"FLAGGED\",\"flagReason\":\"Offensive\"}"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/reviews/stats with DRIVER entityType returns 200")
    void getStats_driver_returns200() throws Exception {
        when(analyticsService.getDriverRating("drv-1"))
                .thenReturn(new com.MaSoVa.core.review.dto.response.DriverRatingResponse());

        mockMvc.perform(get("/api/reviews/stats")
                .param("entityType", "DRIVER")
                .param("entityId", "drv-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/reviews/stats with MENU_ITEM entityType returns 200")
    void getStats_menuItem_returns200() throws Exception {
        when(analyticsService.getItemRating("item-1"))
                .thenReturn(new com.MaSoVa.core.review.dto.response.ItemRatingResponse());

        mockMvc.perform(get("/api/reviews/stats")
                .param("entityType", "MENU_ITEM")
                .param("entityId", "item-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/reviews/{reviewId}/response creates new response when none exists")
    void addOrUpdateResponse_creates_returns201() throws Exception {
        com.MaSoVa.core.review.entity.ReviewResponse created = new com.MaSoVa.core.review.entity.ReviewResponse();
        created.setId("resp-1");
        when(responseService.getResponseByReviewId("rev-1")).thenReturn(java.util.Optional.empty());
        when(responseService.createResponse(anyString(), any(), anyString(), anyString())).thenReturn(created);

        mockMvc.perform(post("/api/reviews/rev-1/response")
                .header("X-User-ID", "mgr-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"responseText\":\"Thank you for your feedback!\"}"))
            .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("GET /api/reviews with flagged=true returns flagged reviews")
    void getReviews_flagged_returns200() throws Exception {
        when(moderationService.getFlaggedReviews(any()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of()));

        mockMvc.perform(get("/api/reviews").param("flagged", "true"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/reviews with status=PENDING returns pending reviews")
    void getReviews_pendingStatus_returns200() throws Exception {
        when(moderationService.getPendingReviews(any()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of()));

        mockMvc.perform(get("/api/reviews").param("status", "PENDING"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/reviews with status=APPROVED returns reviews by status")
    void getReviews_approvedStatus_returns200() throws Exception {
        when(reviewService.getReviewsByStatus(any(), any()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of()));

        mockMvc.perform(get("/api/reviews").param("status", "APPROVED"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/reviews with DRIVER entityType returns driver reviews")
    void getReviews_driverFilter_returns200() throws Exception {
        when(reviewService.getReviewsByDriverId(anyString(), any()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of()));

        mockMvc.perform(get("/api/reviews")
                .param("entityType", "DRIVER")
                .param("entityId", "drv-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/reviews with STAFF entityType returns staff reviews")
    void getReviews_staffFilter_returns200() throws Exception {
        when(reviewService.getReviewsByStaffId(anyString(), any()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of()));

        mockMvc.perform(get("/api/reviews")
                .param("entityType", "STAFF")
                .param("entityId", "staff-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/reviews with MENU_ITEM entityType returns menu item reviews")
    void getReviews_menuItemFilter_returns200() throws Exception {
        when(reviewService.getReviewsByMenuItemId(anyString(), any()))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of()));

        mockMvc.perform(get("/api/reviews")
                .param("entityType", "MENU_ITEM")
                .param("entityId", "item-1"))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PATCH /api/reviews/{reviewId} returns 400 when no action specified")
    void updateReview_noAction_returns400() throws Exception {
        mockMvc.perform(patch("/api/reviews/rev-1")
                .header("X-User-ID", "mgr-1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/reviews/public/submit with IllegalState returns 400")
    void submitPublicRating_illegalState_returns400() throws Exception {
        when(reviewService.createPublicReview(any(), anyString()))
                .thenThrow(new IllegalStateException("Already submitted"));

        mockMvc.perform(post("/api/reviews/public/submit")
                .param("token", "valid-token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"orderId\":\"ord-1\",\"overallRating\":5,\"comment\":\"Good!\"}"))
            .andExpect(status().isBadRequest());
    }
}
