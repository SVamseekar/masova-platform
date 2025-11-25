package com.MaSoVa.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReconciliationReportResponse {

    private LocalDate reportDate;
    private String storeId;
    private Integer totalTransactions;
    private Integer successfulTransactions;
    private Integer failedTransactions;
    private Integer refundedTransactions;
    private BigDecimal totalAmount;
    private BigDecimal successfulAmount;
    private BigDecimal refundedAmount;
    private BigDecimal netAmount; // successful - refunded
    private Map<String, BigDecimal> paymentMethodBreakdown;
    private Integer unreconciledCount;
}
