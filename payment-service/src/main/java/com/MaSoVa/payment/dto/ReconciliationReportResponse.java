package com.MaSoVa.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

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

    public ReconciliationReportResponse() {
    }

    public LocalDate getReportDate() {
        return reportDate;
    }

    public void setReportDate(LocalDate reportDate) {
        this.reportDate = reportDate;
    }

    public String getStoreId() {
        return storeId;
    }

    public void setStoreId(String storeId) {
        this.storeId = storeId;
    }

    public Integer getTotalTransactions() {
        return totalTransactions;
    }

    public void setTotalTransactions(Integer totalTransactions) {
        this.totalTransactions = totalTransactions;
    }

    public Integer getSuccessfulTransactions() {
        return successfulTransactions;
    }

    public void setSuccessfulTransactions(Integer successfulTransactions) {
        this.successfulTransactions = successfulTransactions;
    }

    public Integer getFailedTransactions() {
        return failedTransactions;
    }

    public void setFailedTransactions(Integer failedTransactions) {
        this.failedTransactions = failedTransactions;
    }

    public Integer getRefundedTransactions() {
        return refundedTransactions;
    }

    public void setRefundedTransactions(Integer refundedTransactions) {
        this.refundedTransactions = refundedTransactions;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getSuccessfulAmount() {
        return successfulAmount;
    }

    public void setSuccessfulAmount(BigDecimal successfulAmount) {
        this.successfulAmount = successfulAmount;
    }

    public BigDecimal getRefundedAmount() {
        return refundedAmount;
    }

    public void setRefundedAmount(BigDecimal refundedAmount) {
        this.refundedAmount = refundedAmount;
    }

    public BigDecimal getNetAmount() {
        return netAmount;
    }

    public void setNetAmount(BigDecimal netAmount) {
        this.netAmount = netAmount;
    }

    public Map<String, BigDecimal> getPaymentMethodBreakdown() {
        return paymentMethodBreakdown;
    }

    public void setPaymentMethodBreakdown(Map<String, BigDecimal> paymentMethodBreakdown) {
        this.paymentMethodBreakdown = paymentMethodBreakdown;
    }

    public Integer getUnreconciledCount() {
        return unreconciledCount;
    }

    public void setUnreconciledCount(Integer unreconciledCount) {
        this.unreconciledCount = unreconciledCount;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private LocalDate reportDate;
        private String storeId;
        private Integer totalTransactions;
        private Integer successfulTransactions;
        private Integer failedTransactions;
        private Integer refundedTransactions;
        private BigDecimal totalAmount;
        private BigDecimal successfulAmount;
        private BigDecimal refundedAmount;
        private BigDecimal netAmount;
        private Map<String, BigDecimal> paymentMethodBreakdown;
        private Integer unreconciledCount;

        public Builder reportDate(LocalDate reportDate) {
            this.reportDate = reportDate;
            return this;
        }

        public Builder storeId(String storeId) {
            this.storeId = storeId;
            return this;
        }

        public Builder totalTransactions(Integer totalTransactions) {
            this.totalTransactions = totalTransactions;
            return this;
        }

        public Builder successfulTransactions(Integer successfulTransactions) {
            this.successfulTransactions = successfulTransactions;
            return this;
        }

        public Builder failedTransactions(Integer failedTransactions) {
            this.failedTransactions = failedTransactions;
            return this;
        }

        public Builder refundedTransactions(Integer refundedTransactions) {
            this.refundedTransactions = refundedTransactions;
            return this;
        }

        public Builder totalAmount(BigDecimal totalAmount) {
            this.totalAmount = totalAmount;
            return this;
        }

        public Builder successfulAmount(BigDecimal successfulAmount) {
            this.successfulAmount = successfulAmount;
            return this;
        }

        public Builder refundedAmount(BigDecimal refundedAmount) {
            this.refundedAmount = refundedAmount;
            return this;
        }

        public Builder netAmount(BigDecimal netAmount) {
            this.netAmount = netAmount;
            return this;
        }

        public Builder paymentMethodBreakdown(Map<String, BigDecimal> paymentMethodBreakdown) {
            this.paymentMethodBreakdown = paymentMethodBreakdown;
            return this;
        }

        public Builder unreconciledCount(Integer unreconciledCount) {
            this.unreconciledCount = unreconciledCount;
            return this;
        }

        public ReconciliationReportResponse build() {
            ReconciliationReportResponse response = new ReconciliationReportResponse();
            response.reportDate = this.reportDate;
            response.storeId = this.storeId;
            response.totalTransactions = this.totalTransactions;
            response.successfulTransactions = this.successfulTransactions;
            response.failedTransactions = this.failedTransactions;
            response.refundedTransactions = this.refundedTransactions;
            response.totalAmount = this.totalAmount;
            response.successfulAmount = this.successfulAmount;
            response.refundedAmount = this.refundedAmount;
            response.netAmount = this.netAmount;
            response.paymentMethodBreakdown = this.paymentMethodBreakdown;
            response.unreconciledCount = this.unreconciledCount;
            return response;
        }
    }
}
