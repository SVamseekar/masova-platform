package com.MaSoVa.review.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlagReviewRequest {

    @NotBlank(message = "Flag reason is required")
    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    private String reason;

    private FlagType flagType;

    public enum FlagType {
        SPAM,
        INAPPROPRIATE_LANGUAGE,
        FAKE_REVIEW,
        OFFENSIVE_CONTENT,
        MISLEADING,
        OTHER
    }
}
