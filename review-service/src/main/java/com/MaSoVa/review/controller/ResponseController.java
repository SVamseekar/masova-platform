package com.MaSoVa.review.controller;

import com.MaSoVa.review.dto.request.CreateResponseRequest;
import com.MaSoVa.review.entity.ReviewResponse;
import com.MaSoVa.review.service.ReviewResponseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/responses")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class ResponseController {

    private static final Logger log = LoggerFactory.getLogger(ResponseController.class);

    private final ReviewResponseService responseService;

    public ResponseController(ReviewResponseService responseService) {
        this.responseService = responseService;
    }

    @PostMapping("/review/{reviewId}")
    public ResponseEntity<?> createResponse(
            @PathVariable String reviewId,
            @Valid @RequestBody CreateResponseRequest request,
            @RequestHeader("X-User-ID") String managerId,
            @RequestHeader("X-User-Name") String managerName
    ) {
        try {
            ReviewResponse response = responseService.createResponse(reviewId, request, managerId, managerName);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating response", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create response"));
        }
    }

    @GetMapping("/{responseId}")
    public ResponseEntity<?> getResponseById(@PathVariable String responseId) {
        try {
            ReviewResponse response = responseService.getResponseById(responseId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/review/{reviewId}")
    public ResponseEntity<?> getResponseByReviewId(@PathVariable String reviewId) {
        Optional<ReviewResponse> response = responseService.getResponseByReviewId(reviewId);
        return response.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<Page<ReviewResponse>> getResponsesByManagerId(
            @PathVariable String managerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ReviewResponse> responses = responseService.getResponsesByManagerId(managerId, pageable);
        return ResponseEntity.ok(responses);
    }

    @GetMapping
    public ResponseEntity<Page<ReviewResponse>> getAllResponses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ReviewResponse> responses = responseService.getAllResponses(pageable);
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{responseId}")
    public ResponseEntity<?> updateResponse(
            @PathVariable String responseId,
            @RequestBody Map<String, String> payload,
            @RequestHeader("X-User-ID") String managerId
    ) {
        try {
            String newResponseText = payload.get("responseText");
            if (newResponseText == null || newResponseText.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Response text is required"));
            }

            ReviewResponse response = responseService.updateResponse(responseId, newResponseText, managerId);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error updating response", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update response"));
        }
    }

    @DeleteMapping("/{responseId}")
    public ResponseEntity<?> deleteResponse(
            @PathVariable String responseId,
            @RequestHeader("X-User-ID") String managerId
    ) {
        try {
            responseService.deleteResponse(responseId, managerId);
            return ResponseEntity.ok(Map.of("message", "Response deleted successfully"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error deleting response", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete response"));
        }
    }

    @GetMapping("/templates")
    public ResponseEntity<Map<ReviewResponse.ResponseType, String>> getTemplates() {
        Map<ReviewResponse.ResponseType, String> templates = responseService.getAllTemplates();
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/templates/{responseType}")
    public ResponseEntity<?> getTemplate(@PathVariable ReviewResponse.ResponseType responseType) {
        String template = responseService.getTemplateText(responseType);
        return ResponseEntity.ok(Map.of("template", template, "responseType", responseType));
    }
}
