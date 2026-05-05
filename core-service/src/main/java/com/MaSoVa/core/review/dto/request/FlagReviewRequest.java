package com.MaSoVa.core.review.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

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

    public FlagReviewRequest() {
    }

    public FlagReviewRequest(String reason, FlagType flagType) {
        this.reason = reason;
        this.flagType = flagType;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public FlagType getFlagType() {
        return flagType;
    }

    public void setFlagType(FlagType flagType) {
        this.flagType = flagType;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String reason;
        private FlagType flagType;

        public Builder reason(String reason) {
            this.reason = reason;
            return this;
        }

        public Builder flagType(FlagType flagType) {
            this.flagType = flagType;
            return this;
        }

        public FlagReviewRequest build() {
            return new FlagReviewRequest(reason, flagType);
        }
    }
}
