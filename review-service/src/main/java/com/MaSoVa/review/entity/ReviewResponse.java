package com.MaSoVa.review.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
}
