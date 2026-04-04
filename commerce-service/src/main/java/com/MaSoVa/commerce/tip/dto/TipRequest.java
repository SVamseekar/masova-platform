package com.MaSoVa.commerce.tip.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class TipRequest {

    @NotNull(message = "Tip amount is required")
    @DecimalMin(value = "1.00", message = "Minimum tip is ₹1")
    private BigDecimal amountInr;

    /** Optional — if null, tip goes to pool */
    private String recipientStaffId;

    public BigDecimal getAmountInr() { return amountInr; }
    public void setAmountInr(BigDecimal amountInr) { this.amountInr = amountInr; }

    public String getRecipientStaffId() { return recipientStaffId; }
    public void setRecipientStaffId(String recipientStaffId) { this.recipientStaffId = recipientStaffId; }
}
