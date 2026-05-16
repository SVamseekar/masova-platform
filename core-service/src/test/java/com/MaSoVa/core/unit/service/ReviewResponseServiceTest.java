package com.MaSoVa.core.unit.service;

import com.MaSoVa.core.review.dto.request.CreateResponseRequest;
import com.MaSoVa.core.review.entity.ReviewResponse;
import com.MaSoVa.core.review.repository.ReviewResponseRepository;
import com.MaSoVa.core.review.service.ReviewResponseService;
import com.MaSoVa.core.review.service.ReviewService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ReviewResponseService Unit Tests")
class ReviewResponseServiceTest {

    @Mock private ReviewResponseRepository responseRepository;
    @Mock private ReviewService reviewService;

    @InjectMocks private ReviewResponseService reviewResponseService;

    private ReviewResponse buildResponse(String id, String reviewId, String managerId) {
        return ReviewResponse.builder()
                .reviewId(reviewId)
                .managerId(managerId)
                .managerName("Manager Name")
                .responseText("Thank you for your feedback!")
                .responseType(ReviewResponse.ResponseType.THANK_YOU)
                .isTemplate(false)
                .isEdited(false)
                .isDeleted(false)
                .build();
    }

    @Nested
    @DisplayName("createResponse")
    class CreateResponse {

        @Test
        @DisplayName("throws when review already has a response")
        void throwsWhenAlreadyHasResponse() {
            ReviewResponse existing = buildResponse("r1", "review-1", "mgr-1");
            when(responseRepository.findByReviewIdAndIsDeletedFalse("review-1"))
                    .thenReturn(Optional.of(existing));

            CreateResponseRequest request = new CreateResponseRequest("Thanks!", ReviewResponse.ResponseType.THANK_YOU, false);

            assertThatThrownBy(() -> reviewResponseService.createResponse("review-1", request, "mgr-1", "Manager"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("already has a response");
        }

        @Test
        @DisplayName("creates response and links to review when none exists")
        void createsResponseSuccessfully() {
            when(responseRepository.findByReviewIdAndIsDeletedFalse("review-1"))
                    .thenReturn(Optional.empty());
            ReviewResponse saved = buildResponse("resp-1", "review-1", "mgr-1");
            when(responseRepository.save(any())).thenReturn(saved);

            CreateResponseRequest request = new CreateResponseRequest("Thank you!", ReviewResponse.ResponseType.THANK_YOU, false);

            ReviewResponse result = reviewResponseService.createResponse("review-1", request, "mgr-1", "Manager");

            assertThat(result).isNotNull();
            verify(responseRepository).save(any());
            verify(reviewService).addResponseToReview(eq("review-1"), any());
        }

        @Test
        @DisplayName("defaults responseType to CUSTOM when null")
        void defaultsToCustomType() {
            when(responseRepository.findByReviewIdAndIsDeletedFalse("review-1"))
                    .thenReturn(Optional.empty());
            when(responseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            CreateResponseRequest request = new CreateResponseRequest("Custom text", null, null);

            reviewResponseService.createResponse("review-1", request, "mgr-1", "Manager");

            verify(responseRepository).save(argThat(r -> r.getResponseType() == ReviewResponse.ResponseType.CUSTOM));
        }
    }

    @Nested
    @DisplayName("getResponseById")
    class GetResponseById {

        @Test
        @DisplayName("throws when not found")
        void throwsWhenNotFound() {
            when(responseRepository.findById("missing")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reviewResponseService.getResponseById("missing"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("not found");
        }

        @Test
        @DisplayName("throws when response is soft-deleted")
        void throwsWhenDeleted() {
            ReviewResponse deleted = buildResponse("r1", "review-1", "mgr-1");
            deleted.setIsDeleted(true);
            when(responseRepository.findById("r1")).thenReturn(Optional.of(deleted));

            assertThatThrownBy(() -> reviewResponseService.getResponseById("r1"))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("returns response when found and not deleted")
        void returnsResponse() {
            ReviewResponse response = buildResponse("r1", "review-1", "mgr-1");
            when(responseRepository.findById("r1")).thenReturn(Optional.of(response));

            assertThat(reviewResponseService.getResponseById("r1")).isNotNull();
        }
    }

    @Nested
    @DisplayName("updateResponse")
    class UpdateResponse {

        @Test
        @DisplayName("throws when manager is not the owner")
        void throwsWhenNotOwner() {
            ReviewResponse response = buildResponse("r1", "review-1", "mgr-1");
            when(responseRepository.findById("r1")).thenReturn(Optional.of(response));

            assertThatThrownBy(() -> reviewResponseService.updateResponse("r1", "New text", "mgr-2"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("own responses");
        }

        @Test
        @DisplayName("updates text and marks as edited")
        void updatesResponse() {
            ReviewResponse response = buildResponse("r1", "review-1", "mgr-1");
            when(responseRepository.findById("r1")).thenReturn(Optional.of(response));
            when(responseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            ReviewResponse result = reviewResponseService.updateResponse("r1", "Updated text", "mgr-1");

            assertThat(result.getResponseText()).isEqualTo("Updated text");
            assertThat(result.getIsEdited()).isTrue();
            assertThat(result.getIsTemplate()).isFalse();
        }
    }

    @Nested
    @DisplayName("deleteResponse")
    class DeleteResponse {

        @Test
        @DisplayName("throws when manager is not the owner")
        void throwsWhenNotOwner() {
            ReviewResponse response = buildResponse("r1", "review-1", "mgr-1");
            when(responseRepository.findById("r1")).thenReturn(Optional.of(response));

            assertThatThrownBy(() -> reviewResponseService.deleteResponse("r1", "mgr-2"))
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("soft-deletes response by setting isDeleted to true")
        void softDeletesResponse() {
            ReviewResponse response = buildResponse("r1", "review-1", "mgr-1");
            when(responseRepository.findById("r1")).thenReturn(Optional.of(response));

            reviewResponseService.deleteResponse("r1", "mgr-1");

            verify(responseRepository).save(argThat(r -> r.getIsDeleted().equals(true)));
        }
    }

    @Nested
    @DisplayName("getTemplateText and getAllTemplates")
    class Templates {

        @Test
        @DisplayName("returns template text for THANK_YOU type")
        void returnsThankYouTemplate() {
            String text = reviewResponseService.getTemplateText(ReviewResponse.ResponseType.THANK_YOU);
            assertThat(text).isNotBlank();
        }

        @Test
        @DisplayName("returns default text for CUSTOM type")
        void returnsDefaultForCustom() {
            String text = reviewResponseService.getTemplateText(ReviewResponse.ResponseType.CUSTOM);
            assertThat(text).isNotBlank();
        }

        @Test
        @DisplayName("returns all templates map with at least THANK_YOU")
        void returnsAllTemplates() {
            Map<ReviewResponse.ResponseType, String> templates = reviewResponseService.getAllTemplates();
            assertThat(templates).containsKey(ReviewResponse.ResponseType.THANK_YOU);
        }
    }

    @Nested
    @DisplayName("countResponsesByManager")
    class CountByManager {

        @Test
        @DisplayName("delegates to repository")
        void delegatesToRepository() {
            when(responseRepository.countByManagerIdAndIsDeletedFalse("mgr-1")).thenReturn(5L);

            assertThat(reviewResponseService.countResponsesByManager("mgr-1")).isEqualTo(5L);
        }
    }
}
