package com.MaSoVa.review.entity;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "review_responses")
public class ReviewResponse {

    @Id
    private String id;

    private String reviewId;
    private String managerId;
    private String managerName;
    private String responseText;

    private ResponseType responseType;
    private Boolean isTemplate; // If response was from template

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private Boolean isEdited;
    private Boolean isDeleted;

    public enum ResponseType {
        THANK_YOU,           // For positive reviews
        APOLOGY,             // For negative reviews
        CLARIFICATION,       // For misunderstandings
        RESOLUTION_OFFERED,  // Offering solution
        CUSTOM               // Custom response
    }

    public ReviewResponse() {
    }

    public ReviewResponse(String id, String reviewId, String managerId, String managerName, String responseText,
                          ResponseType responseType, Boolean isTemplate, LocalDateTime createdAt,
                          LocalDateTime updatedAt, Boolean isEdited, Boolean isDeleted) {
        this.id = id;
        this.reviewId = reviewId;
        this.managerId = managerId;
        this.managerName = managerName;
        this.responseText = responseText;
        this.responseType = responseType;
        this.isTemplate = isTemplate;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.isEdited = isEdited;
        this.isDeleted = isDeleted;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getReviewId() {
        return reviewId;
    }

    public void setReviewId(String reviewId) {
        this.reviewId = reviewId;
    }

    public String getManagerId() {
        return managerId;
    }

    public void setManagerId(String managerId) {
        this.managerId = managerId;
    }

    public String getManagerName() {
        return managerName;
    }

    public void setManagerName(String managerName) {
        this.managerName = managerName;
    }

    public String getResponseText() {
        return responseText;
    }

    public void setResponseText(String responseText) {
        this.responseText = responseText;
    }

    public ResponseType getResponseType() {
        return responseType;
    }

    public void setResponseType(ResponseType responseType) {
        this.responseType = responseType;
    }

    public Boolean getIsTemplate() {
        return isTemplate;
    }

    public void setIsTemplate(Boolean isTemplate) {
        this.isTemplate = isTemplate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Boolean getIsEdited() {
        return isEdited;
    }

    public void setIsEdited(Boolean isEdited) {
        this.isEdited = isEdited;
    }

    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String reviewId;
        private String managerId;
        private String managerName;
        private String responseText;
        private ResponseType responseType;
        private Boolean isTemplate;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Boolean isEdited;
        private Boolean isDeleted;

        public Builder id(String id) {
            this.id = id;
            return this;
        }

        public Builder reviewId(String reviewId) {
            this.reviewId = reviewId;
            return this;
        }

        public Builder managerId(String managerId) {
            this.managerId = managerId;
            return this;
        }

        public Builder managerName(String managerName) {
            this.managerName = managerName;
            return this;
        }

        public Builder responseText(String responseText) {
            this.responseText = responseText;
            return this;
        }

        public Builder responseType(ResponseType responseType) {
            this.responseType = responseType;
            return this;
        }

        public Builder isTemplate(Boolean isTemplate) {
            this.isTemplate = isTemplate;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public Builder isEdited(Boolean isEdited) {
            this.isEdited = isEdited;
            return this;
        }

        public Builder isDeleted(Boolean isDeleted) {
            this.isDeleted = isDeleted;
            return this;
        }

        public ReviewResponse build() {
            return new ReviewResponse(id, reviewId, managerId, managerName, responseText, responseType, isTemplate,
                    createdAt, updatedAt, isEdited, isDeleted);
        }
    }
}
