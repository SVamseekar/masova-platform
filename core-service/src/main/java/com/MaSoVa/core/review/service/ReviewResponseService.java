package com.MaSoVa.core.review.service;

import com.MaSoVa.core.review.dto.request.CreateResponseRequest;
import com.MaSoVa.core.review.entity.ReviewResponse;
import com.MaSoVa.core.review.repository.ReviewResponseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class ReviewResponseService {

    private static final Logger log = LoggerFactory.getLogger(ReviewResponseService.class);

    private final ReviewResponseRepository responseRepository;
    private final ReviewService reviewService;

    public ReviewResponseService(ReviewResponseRepository responseRepository, ReviewService reviewService) {
        this.responseRepository = responseRepository;
        this.reviewService = reviewService;
    }

    // Response templates
    private static final Map<ReviewResponse.ResponseType, String> RESPONSE_TEMPLATES = new HashMap<>();

    static {
        RESPONSE_TEMPLATES.put(ReviewResponse.ResponseType.THANK_YOU,
                "Thank you so much for your wonderful feedback! We're thrilled to hear that you enjoyed your experience with us. We look forward to serving you again soon!");

        RESPONSE_TEMPLATES.put(ReviewResponse.ResponseType.APOLOGY,
                "We sincerely apologize for your experience. Your feedback is very important to us and we're taking immediate steps to address these issues. Please contact us directly so we can make this right.");

        RESPONSE_TEMPLATES.put(ReviewResponse.ResponseType.CLARIFICATION,
                "Thank you for your feedback. We'd like to clarify and better understand your concerns. Please reach out to us so we can discuss this further.");

        RESPONSE_TEMPLATES.put(ReviewResponse.ResponseType.RESOLUTION_OFFERED,
                "We're sorry to hear about your experience. We'd like to make this right. Please contact our customer service team and we'll arrange a resolution for you.");
    }

    @Transactional
    public ReviewResponse createResponse(String reviewId, CreateResponseRequest request, String managerId, String managerName) {
        log.info("Creating response for review: {} by manager: {}", reviewId, managerId);

        // Check if review already has a response
        Optional<ReviewResponse> existingResponse = responseRepository.findByReviewIdAndIsDeletedFalse(reviewId);
        if (existingResponse.isPresent()) {
            throw new IllegalStateException("Review already has a response");
        }

        // Create response
        ReviewResponse response = ReviewResponse.builder()
                .reviewId(reviewId)
                .managerId(managerId)
                .managerName(managerName)
                .responseText(request.getResponseText())
                .responseType(request.getResponseType() != null ? request.getResponseType() : ReviewResponse.ResponseType.CUSTOM)
                .isTemplate(request.getIsTemplate() != null ? request.getIsTemplate() : false)
                .isEdited(false)
                .isDeleted(false)
                .build();

        response = responseRepository.save(response);

        // Link response to review
        reviewService.addResponseToReview(reviewId, response.getId());

        log.info("Response created successfully with ID: {}", response.getId());
        return response;
    }

    public ReviewResponse getResponseById(String responseId) {
        return responseRepository.findById(responseId)
                .filter(response -> !response.getIsDeleted())
                .orElseThrow(() -> new IllegalArgumentException("Response not found with ID: " + responseId));
    }

    public Optional<ReviewResponse> getResponseByReviewId(String reviewId) {
        return responseRepository.findByReviewIdAndIsDeletedFalse(reviewId);
    }

    public Page<ReviewResponse> getResponsesByManagerId(String managerId, Pageable pageable) {
        return responseRepository.findByManagerIdAndIsDeletedFalse(managerId, pageable);
    }

    public Page<ReviewResponse> getAllResponses(Pageable pageable) {
        return responseRepository.findByIsDeletedFalseOrderByCreatedAtDesc(pageable);
    }

    @Transactional
    public ReviewResponse updateResponse(String responseId, String newResponseText, String managerId) {
        ReviewResponse response = getResponseById(responseId);

        if (!response.getManagerId().equals(managerId)) {
            throw new IllegalStateException("You can only edit your own responses");
        }

        response.setResponseText(newResponseText);
        response.setIsEdited(true);
        response.setIsTemplate(false); // No longer a template if edited

        log.info("Response {} updated by manager {}", responseId, managerId);
        return responseRepository.save(response);
    }

    @Transactional
    public void deleteResponse(String responseId, String managerId) {
        ReviewResponse response = getResponseById(responseId);

        if (!response.getManagerId().equals(managerId)) {
            throw new IllegalStateException("You can only delete your own responses");
        }

        response.setIsDeleted(true);
        responseRepository.save(response);

        log.info("Response {} deleted by manager {}", responseId, managerId);
    }

    public String getTemplateText(ReviewResponse.ResponseType responseType) {
        return RESPONSE_TEMPLATES.getOrDefault(responseType,
                "Thank you for your feedback. We appreciate you taking the time to share your experience with us.");
    }

    public Map<ReviewResponse.ResponseType, String> getAllTemplates() {
        return new HashMap<>(RESPONSE_TEMPLATES);
    }

    public Long countResponsesByManager(String managerId) {
        return responseRepository.countByManagerIdAndIsDeletedFalse(managerId);
    }
}
