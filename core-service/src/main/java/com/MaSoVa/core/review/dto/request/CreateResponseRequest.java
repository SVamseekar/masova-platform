package com.MaSoVa.core.review.dto.request;

import com.MaSoVa.core.review.entity.ReviewResponse;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateResponseRequest {

    @NotBlank(message = "Response text is required")
    @Size(max = 2000, message = "Response text cannot exceed 2000 characters")
    private String responseText;

    private ReviewResponse.ResponseType responseType;
    private Boolean isTemplate;

    public CreateResponseRequest() {
    }

    public CreateResponseRequest(String responseText, ReviewResponse.ResponseType responseType, Boolean isTemplate) {
        this.responseText = responseText;
        this.responseType = responseType;
        this.isTemplate = isTemplate;
    }

    public String getResponseText() {
        return responseText;
    }

    public void setResponseText(String responseText) {
        this.responseText = responseText;
    }

    public ReviewResponse.ResponseType getResponseType() {
        return responseType;
    }

    public void setResponseType(ReviewResponse.ResponseType responseType) {
        this.responseType = responseType;
    }

    public Boolean getIsTemplate() {
        return isTemplate;
    }

    public void setIsTemplate(Boolean isTemplate) {
        this.isTemplate = isTemplate;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String responseText;
        private ReviewResponse.ResponseType responseType;
        private Boolean isTemplate;

        public Builder responseText(String responseText) {
            this.responseText = responseText;
            return this;
        }

        public Builder responseType(ReviewResponse.ResponseType responseType) {
            this.responseType = responseType;
            return this;
        }

        public Builder isTemplate(Boolean isTemplate) {
            this.isTemplate = isTemplate;
            return this;
        }

        public CreateResponseRequest build() {
            return new CreateResponseRequest(responseText, responseType, isTemplate);
        }
    }
}
