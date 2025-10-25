package com.MaSoVa.payment.dto;

import com.MaSoVa.payment.entity.Refund;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundRequest {

    @NotBlank(message = "Transaction ID is required")
    private String transactionId;

    @NotNull(message = "Refund amount is required")
    @Positive(message = "Refund amount must be positive")
    private BigDecimal amount;

    @NotNull(message = "Refund type is required")
    private Refund.RefundType type;

    @NotBlank(message = "Reason is required")
    private String reason;

    @NotBlank(message = "Initiated by user ID is required")
    private String initiatedBy;

    private String notes;

    private String speed; // "normal" or "optimum"
}
