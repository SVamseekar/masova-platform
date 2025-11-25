package com.MaSoVa.review.dto.request;

import com.MaSoVa.review.entity.ReviewResponse;
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
public class CreateResponseRequest {

    @NotBlank(message = "Response text is required")
    @Size(max = 2000, message = "Response text cannot exceed 2000 characters")
    private String responseText;

    private ReviewResponse.ResponseType responseType;
    private Boolean isTemplate;
}
